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

// Получить всех клиентов
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM clients ORDER BY id ASC',
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении клиентов:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить клиента по ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM clients WHERE id = $1', [
            id,
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Клиент не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении клиента:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создать нового клиента
router.post('/', authMiddleware, async (req, res) => {
    const { full_name, phone, email } = req.body;

    // Валидация
    if (!full_name || !phone) {
        return res.status(400).json({
            message: 'Поля "Полное имя" и "Телефон" обязательны для заполнения',
        });
    }

    try {
        // Проверяем уникальность телефона
        const phoneCheck = await pool.query(
            'SELECT id FROM clients WHERE phone = $1',
            [phone],
        );

        if (phoneCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Клиент с таким телефоном уже существует',
            });
        }

        // Проверяем уникальность email, если он указан
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM clients WHERE email = $1',
                [email],
            );

            if (emailCheck.rows.length > 0) {
                return res.status(400).json({
                    message: 'Клиент с таким email уже существует',
                });
            }
        }

        const result = await pool.query(
            'INSERT INTO clients (full_name, phone, email) VALUES ($1, $2, $3) RETURNING *',
            [full_name, phone, email],
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при создании клиента:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновить клиента
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, email } = req.body;

    // Валидация
    if (!full_name || !phone) {
        return res.status(400).json({
            message: 'Поля "Полное имя" и "Телефон" обязательны для заполнения',
        });
    }

    try {
        // Проверяем существование клиента
        const clientCheck = await pool.query(
            'SELECT id FROM clients WHERE id = $1',
            [id],
        );

        if (clientCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Клиент не найден' });
        }

        // Проверяем уникальность телефона (исключая текущего клиента)
        const phoneCheck = await pool.query(
            'SELECT id FROM clients WHERE phone = $1 AND id != $2',
            [phone, id],
        );

        if (phoneCheck.rows.length > 0) {
            return res.status(400).json({
                message: 'Клиент с таким телефоном уже существует',
            });
        }

        // Проверяем уникальность email, если он указан (исключая текущего клиента)
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM clients WHERE email = $1 AND id != $2',
                [email, id],
            );

            if (emailCheck.rows.length > 0) {
                return res.status(400).json({
                    message: 'Клиент с таким email уже существует',
                });
            }
        }

        const result = await pool.query(
            'UPDATE clients SET full_name = $1, phone = $2, email = $3 WHERE id = $4 RETURNING *',
            [full_name, phone, email, id],
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при обновлении клиента:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удалить клиента
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Проверяем существование клиента
        const clientCheck = await pool.query(
            'SELECT id FROM clients WHERE id = $1',
            [id],
        );

        if (clientCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Клиент не найден' });
        }

        // Проверяем, есть ли у клиента техника
        const equipmentCheck = await pool.query(
            'SELECT id FROM equipments WHERE client_id = $1',
            [id],
        );

        if (equipmentCheck.rows.length > 0) {
            return res.status(400).json({
                message:
                    'Невозможно удалить клиента: у него есть зарегистрированная техника',
            });
        }

        await pool.query('DELETE FROM clients WHERE id = $1', [id]);

        res.json({ message: 'Клиент успешно удален' });
    } catch (err) {
        console.error('Ошибка при удалении клиента:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
