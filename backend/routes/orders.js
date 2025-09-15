const express = require('express');
const pool = require('../db');

const router = express.Router();

// Middleware для проверки JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Нет токена' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Неверный токен' });
    }
}

// Получить все заказы с полной информацией
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Сначала получаем основные данные заказов
        const ordersQuery = `
            SELECT 
                o.id,
                o.status,
                o.issue,
                o.package,
                o.created_at,
                o.completed_at,
                e.id as equipment_id,
                e.model as equipment_model,
                e.type as equipment_type,
                c.id as client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM orders o
            LEFT JOIN equipments e ON o.equipment_id = e.id
            LEFT JOIN clients c ON e.client_id = c.id
            ORDER BY o.id DESC
        `;

        const ordersResult = await pool.query(ordersQuery);

        // Получаем комплектующие для всех заказов
        const componentsQuery = `
            SELECT 
                co.order_id,
                comp.id,
                comp.name,
                comp.type,
                comp.unit,
                co.quantity,
                co.price AS unit_price,
                (co.price * co.quantity) AS order_price
            FROM components_orders co
            JOIN components comp ON co.component_id = comp.id
            ORDER BY co.order_id, comp.name
        `;

        const componentsResult = await pool.query(componentsQuery);

        // Получаем услуги для всех заказов
        const servicesQuery = `
            SELECT 
                so.order_id,
                s.id,
                s.name,
                s.type,
                so.quantity,
                so.price AS unit_price,
                (so.price * so.quantity) AS order_price
            FROM services_orders so
            JOIN services s ON so.service_id = s.id
            ORDER BY so.order_id, s.name
        `;

        const servicesResult = await pool.query(servicesQuery);

        // Группируем комплектующие по order_id
        const componentsByOrder = {};
        componentsResult.rows.forEach(comp => {
            if (!componentsByOrder[comp.order_id]) {
                componentsByOrder[comp.order_id] = [];
            }
            componentsByOrder[comp.order_id].push({
                id: comp.id,
                name: comp.name,
                type: comp.type,
                unit: comp.unit,
                component_price: comp.unit_price,
                quantity: comp.quantity,
                order_price: comp.order_price,
            });
        });

        // Группируем услуги по order_id
        const servicesByOrder = {};
        servicesResult.rows.forEach(service => {
            if (!servicesByOrder[service.order_id]) {
                servicesByOrder[service.order_id] = [];
            }
            servicesByOrder[service.order_id].push({
                id: service.id,
                name: service.name,
                type: service.type,
                service_price: service.unit_price,
                quantity: service.quantity,
                order_price: service.order_price,
            });
        });

        // Объединяем все данные
        const result = ordersResult.rows.map(order => ({
            ...order,
            components: componentsByOrder[order.id] || [],
            services: servicesByOrder[order.id] || [],
        }));

        res.json(result);
    } catch (err) {
        console.error('Ошибка при получении заказов:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
}); // Получить заказ по ID с полной информацией
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // Получаем основные данные заказа
        const orderQuery = `
            SELECT 
                o.id,
                o.status,
                o.issue,
                o.package,
                o.created_at,
                o.completed_at,
                e.id as equipment_id,
                e.model as equipment_model,
                e.type as equipment_type,
                c.id as client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM orders o
            LEFT JOIN equipments e ON o.equipment_id = e.id
            LEFT JOIN clients c ON e.client_id = c.id
            WHERE o.id = $1
        `;

        const orderResult = await pool.query(orderQuery, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }

        const order = orderResult.rows[0];

        // Получаем комплектующие заказа
        const componentsQuery = `
            SELECT 
                comp.id,
                comp.name,
                comp.type,
                comp.unit,
                co.quantity,
                co.price AS unit_price,
                (co.price * co.quantity) AS order_price
            FROM components_orders co
            JOIN components comp ON co.component_id = comp.id
            WHERE co.order_id = $1
            ORDER BY comp.name
        `;

        const componentsResult = await pool.query(componentsQuery, [id]);

        // Получаем услуги заказа
        const servicesQuery = `
            SELECT 
                s.id,
                s.name,
                s.type,
                so.quantity,
                so.price AS unit_price,
                (so.price * so.quantity) AS order_price
            FROM services_orders so
            JOIN services s ON so.service_id = s.id
            WHERE so.order_id = $1
            ORDER BY s.name
        `;

        const servicesResult = await pool.query(servicesQuery, [id]);

        // Объединяем данные
        const result = {
            ...order,
            components: componentsResult.rows,
            services: servicesResult.rows,
        };

        res.json(result);
    } catch (err) {
        console.error('Ошибка при получении заказа:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// Создать новый заказ
router.post('/', authMiddleware, async (req, res) => {
    const {
        equipment_id,
        status,
        issue,
        package: orderPackage,
        components = [],
        services = [],
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Создать заказ
        const orderResult = await client.query(
            'INSERT INTO orders (equipment_id, status, issue, package, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [equipment_id, status, issue, orderPackage],
        );

        const orderId = orderResult.rows[0].id;

        // Добавить комплектующие
        for (const component of components) {
            await client.query(
                'INSERT INTO components_orders (order_id, component_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [
                    orderId,
                    component.component_id,
                    component.quantity,
                    component.price,
                ],
            );
        }

        // Добавить услуги
        for (const service of services) {
            await client.query(
                'INSERT INTO services_orders (order_id, service_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, service.service_id, service.quantity, service.price],
            );
        }

        await client.query('COMMIT');

        // Получить созданный заказ с полной информацией
        const fullOrderQuery = `
            SELECT 
                o.id,
                o.status,
                o.issue,
                o.package,
                o.created_at,
                o.completed_at,
                e.id as equipment_id,
                e.model as equipment_model,
                e.type as equipment_type,
                c.id as client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM orders o
            LEFT JOIN equipments e ON o.equipment_id = e.id
            LEFT JOIN clients c ON e.client_id = c.id
            WHERE o.id = $1
        `;

        const fullOrderResult = await pool.query(fullOrderQuery, [orderId]);
        res.status(201).json(fullOrderResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Ошибка при создании заказа:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

// Обновить заказ
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const {
        equipment_id,
        status,
        issue,
        package: orderPackage,
        completed_at,
    } = req.body;

    try {
        const result = await pool.query(
            'UPDATE orders SET equipment_id = $1, status = $2, issue = $3, package = $4, completed_at = $5 WHERE id = $6 RETURNING *',
            [equipment_id, status, issue, orderPackage, completed_at, id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении заказа:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить заказ
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Удалить связи с комплектующими
        await client.query(
            'DELETE FROM components_orders WHERE order_id = $1',
            [id],
        );

        // Удалить связи с услугами
        await client.query('DELETE FROM services_orders WHERE order_id = $1', [
            id,
        ]);

        // Удалить заказ
        const result = await client.query(
            'DELETE FROM orders WHERE id = $1 RETURNING *',
            [id],
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Заказ не найден' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Заказ успешно удален' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Ошибка при удалении заказа:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

// Получить комплектующие заказа
router.get('/:id/components', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                c.id,
                c.name,
                c.type,
                c.unit,
                c.price as component_price,
                co.quantity,
                co.price as order_price
            FROM components_orders co
            JOIN components c ON co.component_id = c.id
            WHERE co.order_id = $1
            ORDER BY c.name
        `;

        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении комплектующих заказа:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить услуги заказа
router.get('/:id/services', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                s.id,
                s.name,
                s.type,
                s.price as service_price,
                so.quantity,
                so.price as order_price
            FROM services_orders so
            JOIN services s ON so.service_id = s.id
            WHERE so.order_id = $1
            ORDER BY s.name
        `;

        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении услуг заказа:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Добавить комплектующее к заказу
router.post('/:id/components', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { component_id, quantity, price } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO components_orders (order_id, component_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, component_id, quantity, price],
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при добавлении комплектующего к заказу:', err);
        if (err.code === '23505') {
            // unique_violation
            res.status(400).json({
                message: 'Комплектующее уже добавлено к заказу',
            });
        } else {
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
});

// Добавить услугу к заказу
router.post('/:id/services', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { service_id, quantity, price } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO services_orders (order_id, service_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, service_id, quantity, price],
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при добавлении услуги к заказу:', err);
        if (err.code === '23505') {
            // unique_violation
            res.status(400).json({ message: 'Услуга уже добавлена к заказу' });
        } else {
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
});

// Обновить комплектующее в заказе
router.put('/:id/components/:componentId', authMiddleware, async (req, res) => {
    const { id, componentId } = req.params;
    const { quantity, price } = req.body;

    try {
        const result = await pool.query(
            'UPDATE components_orders SET quantity = $1, price = $2 WHERE order_id = $3 AND component_id = $4 RETURNING *',
            [quantity, price, id, componentId],
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: 'Комплектующее в заказе не найдено' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении комплектующего в заказе:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновить услугу в заказе
router.put('/:id/services/:serviceId', authMiddleware, async (req, res) => {
    const { id, serviceId } = req.params;
    const { quantity, price } = req.body;

    try {
        const result = await pool.query(
            'UPDATE services_orders SET quantity = $1, price = $2 WHERE order_id = $3 AND service_id = $4 RETURNING *',
            [quantity, price, id, serviceId],
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: 'Услуга в заказе не найдена' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении услуги в заказе:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить комплектующее из заказа
router.delete(
    '/:id/components/:componentId',
    authMiddleware,
    async (req, res) => {
        const { id, componentId } = req.params;

        try {
            const result = await pool.query(
                'DELETE FROM components_orders WHERE order_id = $1 AND component_id = $2 RETURNING *',
                [id, componentId],
            );

            if (result.rows.length === 0) {
                return res
                    .status(404)
                    .json({ message: 'Комплектующее в заказе не найдено' });
            }

            res.json({ message: 'Комплектующее успешно удалено из заказа' });
        } catch (err) {
            console.error('Ошибка при удалении комплектующего из заказа:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    },
);

// Удалить услугу из заказа
router.delete('/:id/services/:serviceId', authMiddleware, async (req, res) => {
    const { id, serviceId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM services_orders WHERE order_id = $1 AND service_id = $2 RETURNING *',
            [id, serviceId],
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: 'Услуга в заказе не найдена' });
        }

        res.json({ message: 'Услуга успешно удалена из заказа' });
    } catch (err) {
        console.error('Ошибка при удалении услуги из заказа:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
