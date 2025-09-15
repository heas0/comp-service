/* Создание пользователя-администратора из переменных окружения ADMIN_USERNAME/ADMIN_PASSWORD. */
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL не установлен в backend/.env');
        process.exit(1);
    }

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
        console.log(
            'ADMIN_USERNAME/ADMIN_PASSWORD не заданы — пропускаем создание пользователя.',
        );
        process.exit(0);
    }

    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();

    try {
        console.log(`Проверяем существование пользователя '${username}'...`);
        const exists = await client.query(
            'SELECT 1 FROM users WHERE username=$1',
            [username],
        );
        if (exists.rows.length > 0) {
            console.log('Пользователь уже существует — пропускаем.');
            return;
        }

        const hashed = await bcrypt.hash(password, 10);
        await client.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashed],
        );
        console.log('Пользователь успешно создан.');
    } catch (err) {
        console.error('Ошибка при создании пользователя:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
})();
