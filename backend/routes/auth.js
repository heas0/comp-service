const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username],
        );
        if (userExists.rows.length > 0) {
            return res
                .status(400)
                .json({ message: 'Пользователь уже существует' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword],
        );
        res.status(201).json({ message: 'Пользователь зарегистрирован' });
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Вход
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username],
        );
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Неверные учетные данные' });
        }
        const valid = await bcrypt.compare(password, user.rows[0].password);
        if (!valid) {
            return res.status(400).json({ message: 'Неверные учетные данные' });
        }
        const token = jwt.sign(
            { id: user.rows[0].id, username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
        );
        res.json({ token });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Middleware для проверки JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Нет токена' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Неверный токен' });
    }
}

// Получение текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await pool.query(
            'SELECT id, username FROM users WHERE id = $1',
            [req.user.id],
        );
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении пользователя:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Заглушка для logout (на JWT обычно не требуется)
router.post('/logout', (req, res) => {
    res.json({ message: 'Выход выполнен' });
});

module.exports = router;
