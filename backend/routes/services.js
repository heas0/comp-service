const express = require('express');
const pool = require('../db');

const router = express.Router();

// Middleware для проверки JWT (копируем из auth.js)
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

// Получить все услуги
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM services ORDER BY id ASC',
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении услуг:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить услугу по ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM services WHERE id = $1',
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Услуга не найдена' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении услуги:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать новую услугу
router.post('/', authMiddleware, async (req, res) => {
    const { name, type, price } = req.body;

    // Валидация
    if (!name || !type || price === undefined) {
        return res.status(400).json({
            message:
                'Поля "Название", "Тип" и "Цена" обязательны для заполнения',
        });
    }

    if (price < 0) {
        return res.status(400).json({
            message: 'Цена не может быть отрицательной',
        });
    }

    try {
        // Проверяем уникальность названия
        const nameCheck = await pool.query(
            'SELECT id FROM services WHERE name = $1',
            [name],
        );

        if (nameCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Услуга с таким названием уже существует',
            });
        }

        const result = await pool.query(
            'INSERT INTO services (name, type, price) VALUES ($1, $2, $3) RETURNING *',
            [name, type, price],
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при создании услуги:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновить услугу
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, type, price } = req.body;

    // Валидация
    if (!name || !type || price === undefined) {
        return res.status(400).json({
            message:
                'Поля "Название", "Тип" и "Цена" обязательны для заполнения',
        });
    }

    if (price < 0) {
        return res.status(400).json({
            message: 'Цена не может быть отрицательной',
        });
    }

    try {
        // Проверяем существование услуги
        const serviceCheck = await pool.query(
            'SELECT id FROM services WHERE id = $1',
            [id],
        );

        if (serviceCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Услуга не найдена' });
        }

        // Проверяем уникальность названия (исключая текущую услугу)
        const nameCheck = await pool.query(
            'SELECT id FROM services WHERE name = $1 AND id != $2',
            [name, id],
        );

        if (nameCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Услуга с таким названием уже существует',
            });
        }

        const result = await pool.query(
            'UPDATE services SET name = $1, type = $2, price = $3 WHERE id = $4 RETURNING *',
            [name, type, price, id],
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении услуги:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить услугу
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Проверяем существование услуги
        const serviceCheck = await pool.query(
            'SELECT id FROM services WHERE id = $1',
            [id],
        );

        if (serviceCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Услуга не найдена' });
        }

        // Проверяем, используется ли услуга в заказах
        const orderCheck = await pool.query(
            'SELECT service_id FROM services_orders WHERE service_id = $1',
            [id],
        );

        if (orderCheck.rows.length > 0) {
            return res.status(400).json({
                message:
                    'Невозможно удалить услугу: она используется в заказах',
            });
        }

        await pool.query('DELETE FROM services WHERE id = $1', [id]);

        res.json({ message: 'Услуга успешно удалена' });
    } catch (err) {
        console.error('Ошибка при удалении услуги:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
