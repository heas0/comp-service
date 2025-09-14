/* Заполнение базы данных начальными данными */
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const seedData = async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL не установлен в backend/.env');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();

    try {
        console.log('Начинается заполнение базы данных...');

        // Очистка существующих данных (в обратном порядке из-за внешних ключей)
        await client.query('DELETE FROM services_orders');
        await client.query('DELETE FROM components_orders');
        await client.query('DELETE FROM orders');
        await client.query('DELETE FROM components');
        await client.query('DELETE FROM services');
        await client.query('DELETE FROM equipments');
        await client.query('DELETE FROM clients');

        // Сброс последовательностей
        await client.query('ALTER SEQUENCE clients_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE equipments_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE components_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE services_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');

        console.log(
            'Существующие данные очищены и последовательности сброшены',
        );

        // Вставка клиентов (R2)
        const clientsData = [
            [
                1,
                'Иванов Сергей Петрович',
                '79201112233',
                'ivanov.sergey@mail.ru',
            ],
            [
                2,
                'Смирнова Ольга Викторовна',
                '79202223344',
                'smirnova.olga@yandex.ru',
            ],
            [
                3,
                'Кузнецов Андрей Николаевич',
                '79203334455',
                'kuznetsov.andrey@gmail.com',
            ],
            [
                4,
                'Попова Елена Александровна',
                '79204445566',
                'popova.elena@rambler.ru',
            ],
        ];

        for (const [id, fullName, phone, email] of clientsData) {
            await client.query(
                'INSERT INTO clients (id, full_name, phone, email) VALUES ($1, $2, $3, $4)',
                [id, fullName, phone, email],
            );
        }
        console.log('Данные клиентов добавлены');

        // Вставка техники (R3)
        const equipmentsData = [
            [1, 1, 'iPhone 14 Pro', 'Смартфон'],
            [2, 1, 'HP Pavilion 15', 'Ноутбук'],
            [3, 2, 'Samsung Galaxy S23', 'Смартфон'],
            [4, 3, 'Lenovo IdeaPad 3', 'Ноутбук'],
            [5, 4, 'iPad Air', 'Планшет'],
        ];

        for (const [id, clientId, model, type] of equipmentsData) {
            await client.query(
                'INSERT INTO equipments (id, client_id, model, type) VALUES ($1, $2, $3, $4)',
                [id, clientId, model, type],
            );
        }
        console.log('Данные техники добавлены');

        // Вставка комплектующих (R7)
        const componentsData = [
            [1, 'Экран для iPhone 14 Pro', 'Запчасть', 'шт', 12500],
            [2, 'Аккумулятор Samsung S23', 'Запчасть', 'шт', 7800],
            [3, 'Блок питания HP 65W', 'Аксессуар', 'шт', 3500],
            [4, 'Зарядное устройство iPad', 'Аксессуар', 'шт', 3200],
            [5, 'Корпус для Lenovo IdeaPad', 'Запчасть', 'шт', 8200],
            [6, 'Адаптер питания для ноутбука Asus', 'Аксессуар', 'шт', 3500],
        ];

        for (const [id, name, type, unit, price] of componentsData) {
            await client.query(
                'INSERT INTO components (id, name, type, unit, price) VALUES ($1, $2, $3, $4, $5)',
                [id, name, type, unit, price],
            );
        }
        console.log('Данные комплектующих добавлены');

        // Вставка услуг (R10)
        const servicesData = [
            [1, 'Диагностика устройства', 'Обслуживание', 1000],
            [2, 'Замена экрана смартфона', 'Ремонт', 5000],
            [3, 'Замена аккумулятора', 'Ремонт', 3500],
            [4, 'Установка программного ПО', 'Обслуживание', 2000],
            [5, 'Чистка ноутбука от пыли', 'Ремонт', 2500],
            [6, 'Настройка Wi-Fi роутера', 'Обслуживание', 1500],
        ];

        for (const [id, name, type, price] of servicesData) {
            await client.query(
                'INSERT INTO services (id, name, type, price) VALUES ($1, $2, $3, $4)',
                [id, name, type, price],
            );
        }
        console.log('Данные услуг добавлены');

        // Вставка заказов (R5)
        const ordersData = [
            [
                1,
                1,
                'принят',
                'Разбит экран',
                'Смартфон + зарядка',
                '2025-09-10',
                null,
            ],
            [
                2,
                3,
                'выполнен',
                'Замена аккумулятора',
                'Смартфон + зарядка',
                '2025-08-01',
                '2025-08-05',
            ],
            [
                3,
                2,
                'выполнен',
                'Перегрев',
                'Ноутбук + блок питания',
                '2025-08-25',
                '2025-08-28',
            ],
            [
                4,
                3,
                'в работе',
                'Не включается',
                'Смартфон без аксессуаров',
                '2025-09-06',
                null,
            ],
            [
                5,
                4,
                'выполнен',
                'Трещины на корпусе',
                'Ноутбук + сумка',
                '2025-07-30',
                '2025-08-02',
            ],
            [
                6,
                5,
                'принят',
                'Не заряжается',
                'Планшет + кабель USB',
                '2025-09-13',
                null,
            ],
        ];

        for (const [
            id,
            equipmentId,
            status,
            issue,
            packageInfo,
            createdAt,
            completedAt,
        ] of ordersData) {
            await client.query(
                'INSERT INTO orders (id, equipment_id, status, issue, package, created_at, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [
                    id,
                    equipmentId,
                    status,
                    issue,
                    packageInfo,
                    createdAt,
                    completedAt,
                ],
            );
        }
        console.log('Данные заказов добавлены');

        // Вставка связей комплектующих с заказами (R8)
        const componentsOrdersData = [
            [1, 1, 1, 12500], // Заказ 1, Комплектующее 1 (Экран для iPhone 14 Pro), Количество 1, Цена 12500
            [2, 2, 1, 7800], // Заказ 2, Комплектующее 2 (Аккумулятор Samsung S23), Количество 1, Цена 7800
            [3, 3, 1, 3500], // Заказ 3, Комплектующее 3 (Блок питания HP 65W), Количество 1, Цена 3500
            [4, 2, 1, 7800], // Заказ 4, Комплектующее 2 (Аккумулятор Samsung S23), Количество 1, Цена 7800
            [6, 4, 1, 3200], // Заказ 6, Комплектующее 4 (Зарядное устройство iPad), Количество 1, Цена 3200
            [5, 5, 1, 8200], // Заказ 5, Комплектующее 5 (Корпус для Lenovo IdeaPad), Количество 1, Цена 8200
        ];

        for (const [
            orderId,
            componentId,
            quantity,
            price,
        ] of componentsOrdersData) {
            await client.query(
                'INSERT INTO components_orders (order_id, component_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, componentId, quantity, price],
            );
        }
        console.log('Данные связей комплектующих с заказами добавлены');

        // Вставка связей услуг с заказами (R11)
        const servicesOrdersData = [
            [1, 1, 1, 1000], // Заказ 1, Услуга 1 (Диагностика устройства), Количество 1, Цена 1000
            [1, 2, 1, 5000], // Заказ 1, Услуга 2 (Замена экрана смартфона), Количество 1, Цена 5000
            [2, 3, 1, 3500], // Заказ 2, Услуга 3 (Замена аккумулятора), Количество 1, Цена 3500
            [3, 1, 1, 1000], // Заказ 3, Услуга 1 (Диагностика устройства), Количество 1, Цена 1000
            [3, 4, 1, 2000], // Заказ 3, Услуга 4 (Установка программного ПО), Количество 1, Цена 2000
            [5, 5, 1, 2500], // Заказ 5, Услуга 5 (Чистка ноутбука от пыли), Количество 1, Цена 2500
        ];

        for (const [
            orderId,
            serviceId,
            quantity,
            price,
        ] of servicesOrdersData) {
            await client.query(
                'INSERT INTO services_orders (order_id, service_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, serviceId, quantity, price],
            );
        }
        console.log('Данные связей услуг с заказами добавлены');

        // Обновление последовательностей для продолжения с последнего вставленного ID
        await client.query(
            "SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients))",
        );
        await client.query(
            "SELECT setval('equipments_id_seq', (SELECT MAX(id) FROM equipments))",
        );
        await client.query(
            "SELECT setval('components_id_seq', (SELECT MAX(id) FROM components))",
        );
        await client.query(
            "SELECT setval('services_id_seq', (SELECT MAX(id) FROM services))",
        );
        await client.query(
            "SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders))",
        );

        console.log('Заполнение базы данных успешно завершено!');

        // Отображение сводки
        const summary = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM clients) as clients_count,
                (SELECT COUNT(*) FROM equipments) as equipments_count,
                (SELECT COUNT(*) FROM components) as components_count,
                (SELECT COUNT(*) FROM services) as services_count,
                (SELECT COUNT(*) FROM orders) as orders_count,
                (SELECT COUNT(*) FROM components_orders) as components_orders_count,
                (SELECT COUNT(*) FROM services_orders) as services_orders_count
        `);

        console.log('\nСводка данных:');
        console.log(`- Клиенты: ${summary.rows[0].clients_count}`);
        console.log(`- Техника: ${summary.rows[0].equipments_count}`);
        console.log(`- Комплектующие: ${summary.rows[0].components_count}`);
        console.log(`- Услуги: ${summary.rows[0].services_count}`);
        console.log(`- Заказы: ${summary.rows[0].orders_count}`);
        console.log(
            `- Связи Комплектующие-Заказы: ${summary.rows[0].components_orders_count}`,
        );
        console.log(
            `- Связи Услуги-Заказы: ${summary.rows[0].services_orders_count}`,
        );
    } catch (err) {
        console.error('Ошибка при заполнении базы данных:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

// Запуск заполнения
seedData();
