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

// Получить все комплектующие
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM components ORDER BY id ASC',
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении комплектующих:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить комплектующее по ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM components WHERE id = $1',
            [id],
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: 'Комплектующее не найдено' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении комплектующего:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать новое комплектующее
router.post('/', authMiddleware, async (req, res) => {
    const { name, type, unit, price } = req.body;

    // Валидация
    if (!name || !type || !unit || price === undefined) {
        return res.status(400).json({
            message:
                'Поля "Название", "Тип", "Единица измерения" и "Цена" обязательны для заполнения',
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
            'SELECT id FROM components WHERE name = $1',
            [name],
        );

        if (nameCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Комплектующее с таким названием уже существует',
            });
        }

        const result = await pool.query(
            'INSERT INTO components (name, type, unit, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, type, unit, price],
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при создании комплектующего:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновить комплектующее
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, type, unit, price } = req.body;

    // Валидация
    if (!name || !type || !unit || price === undefined) {
        return res.status(400).json({
            message:
                'Поля "Название", "Тип", "Единица измерения" и "Цена" обязательны для заполнения',
        });
    }

    if (price < 0) {
        return res.status(400).json({
            message: 'Цена не может быть отрицательной',
        });
    }

    try {
        // Проверяем существование компонента
        const componentCheck = await pool.query(
            'SELECT id FROM components WHERE id = $1',
            [id],
        );

        if (componentCheck.rows.length === 0) {
            return res
                .status(404)
                .json({ message: 'Комплектующее не найдено' });
        }

        // Проверяем уникальность названия (исключая текущий компонент)
        const nameCheck = await pool.query(
            'SELECT id FROM components WHERE name = $1 AND id != $2',
            [name, id],
        );

        if (nameCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Комплектующее с таким названием уже существует',
            });
        }

        const result = await pool.query(
            'UPDATE components SET name = $1, type = $2, unit = $3, price = $4 WHERE id = $5 RETURNING *',
            [name, type, unit, price, id],
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении комплектующего:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить комплектующее
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Проверяем существование компонента
        const componentCheck = await pool.query(
            'SELECT id FROM components WHERE id = $1',
            [id],
        );

        if (componentCheck.rows.length === 0) {
            return res
                .status(404)
                .json({ message: 'Комплектующее не найдено' });
        }

        // Проверяем, используется ли компонент в заказах
        const orderCheck = await pool.query(
            'SELECT component_id FROM components_orders WHERE component_id = $1',
            [id],
        );

        if (orderCheck.rows.length > 0) {
            return res.status(400).json({
                message:
                    'Невозможно удалить комплектующее: оно используется в заказах',
            });
        }

        await pool.query('DELETE FROM components WHERE id = $1', [id]);

        res.json({ message: 'Комплектующее успешно удалено' });
    } catch (err) {
        console.error('Ошибка при удалении комплектующего:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
