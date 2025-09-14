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

// Получить всю технику
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e.id,
                e.model,
                e.type,
                e.client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM equipments e
            LEFT JOIN clients c ON e.client_id = c.id
            ORDER BY e.id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении техники:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить технику по ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `
            SELECT 
                e.id,
                e.model,
                e.type,
                e.client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM equipments e
            LEFT JOIN clients c ON e.client_id = c.id
            WHERE e.id = $1
        `,
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Техника не найдена' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении техники:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить технику по клиенту
router.get('/client/:clientId', authMiddleware, async (req, res) => {
    const { clientId } = req.params;
    try {
        const result = await pool.query(
            `
            SELECT 
                e.id,
                e.model,
                e.type,
                e.client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM equipments e
            LEFT JOIN clients c ON e.client_id = c.id
            WHERE e.client_id = $1
            ORDER BY e.id ASC
        `,
            [clientId],
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении техники клиента:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать новую технику
router.post('/', authMiddleware, async (req, res) => {
    const { model, type, client_id } = req.body;

    // Валидация
    if (!model || !type || !client_id) {
        return res.status(400).json({
            message: 'Модель, тип и клиент обязательны для заполнения',
        });
    }

    try {
        // Проверяем, существует ли клиент
        const clientCheck = await pool.query(
            'SELECT id FROM clients WHERE id = $1',
            [client_id],
        );

        if (clientCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Клиент не найден' });
        }

        // Создаем технику
        const result = await pool.query(
            'INSERT INTO equipments (model, type, client_id) VALUES ($1, $2, $3) RETURNING *',
            [model, type, client_id],
        );

        // Получаем полную информацию о созданной технике
        const equipmentResult = await pool.query(
            `
            SELECT 
                e.id,
                e.model,
                e.type,
                e.client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM equipments e
            LEFT JOIN clients c ON e.client_id = c.id
            WHERE e.id = $1
        `,
            [result.rows[0].id],
        );

        res.status(201).json(equipmentResult.rows[0]);
    } catch (err) {
        console.error('Ошибка при создании техники:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновить технику
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { model, type, client_id } = req.body;

    // Валидация
    if (!model || !type || !client_id) {
        return res.status(400).json({
            message: 'Модель, тип и клиент обязательны для заполнения',
        });
    }

    try {
        // Проверяем, существует ли техника
        const equipmentCheck = await pool.query(
            'SELECT id FROM equipments WHERE id = $1',
            [id],
        );

        if (equipmentCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Техника не найдена' });
        }

        // Проверяем, существует ли клиент
        const clientCheck = await pool.query(
            'SELECT id FROM clients WHERE id = $1',
            [client_id],
        );

        if (clientCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Клиент не найден' });
        }

        // Обновляем технику
        await pool.query(
            'UPDATE equipments SET model = $1, type = $2, client_id = $3 WHERE id = $4',
            [model, type, client_id, id],
        );

        // Получаем обновленную информацию
        const result = await pool.query(
            `
            SELECT 
                e.id,
                e.model,
                e.type,
                e.client_id,
                c.full_name as client_name,
                c.phone as client_phone,
                c.email as client_email
            FROM equipments e
            LEFT JOIN clients c ON e.client_id = c.id
            WHERE e.id = $1
        `,
            [id],
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении техники:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить технику
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Проверяем, есть ли связанные заказы
        const ordersCheck = await pool.query(
            'SELECT id FROM orders WHERE equipment_id = $1',
            [id],
        );

        if (ordersCheck.rows.length > 0) {
            return res.status(400).json({
                message:
                    'Нельзя удалить технику, так как есть связанные заказы',
            });
        }

        // Удаляем технику
        const result = await pool.query(
            'DELETE FROM equipments WHERE id = $1 RETURNING *',
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Техника не найдена' });
        }

        res.json({ message: 'Техника успешно удалена' });
    } catch (err) {
        console.error('Ошибка при удалении техники:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
