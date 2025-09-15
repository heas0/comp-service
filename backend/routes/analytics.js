const express = require('express');
const pool = require('../db');

const router = express.Router();

// Middleware для проверки JWT (копируем из других роутеров)
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

// GET /api/analytics — агрегированные метрики
router.get('/', authMiddleware, async (req, res) => {
    try {
        // KPI: количество заказов по статусам
        const statusCounts = await pool.query(
            `SELECT status, COUNT(*)::int AS count
             FROM orders
             GROUP BY status`,
        );

        const countsMap = statusCounts.rows.reduce((acc, r) => {
            acc[r.status] = r.count;
            return acc;
        }, {});

        const ordersTotal = Object.values(countsMap).reduce((a, b) => a + b, 0);
        const completedCount = countsMap['выполнен'] || 0;

        // Общая выручка по выполненным заказам (сумма позиций услуг и комплектующих)
        const revenueTotalRes = await pool.query(
            `SELECT COALESCE(SUM(price * quantity), 0) AS revenue
                 FROM (
                     SELECT co.price, co.quantity
                     FROM components_orders co
                     JOIN orders o ON o.id = co.order_id
                     WHERE o.status = 'выполнен'
                     UNION ALL
                     SELECT so.price, so.quantity
                     FROM services_orders so
                     JOIN orders o ON o.id = so.order_id
                     WHERE o.status = 'выполнен'
                 ) t`,
        );
        const revenueTotal = Number(revenueTotalRes.rows[0].revenue) || 0;
        const avgTicket =
            completedCount > 0 ? revenueTotal / completedCount : 0;

        // Выручка по месяцам (по дате завершения)
        const revenueByMonthRes = await pool.query(
            `SELECT 
                     DATE_PART('year', o.completed_at)::int AS year,
                     DATE_PART('month', o.completed_at)::int AS month,
                     SUM(t.price * t.quantity) AS revenue
                 FROM (
                     SELECT order_id, price, quantity FROM components_orders
                     UNION ALL
                     SELECT order_id, price, quantity FROM services_orders
                 ) t
                 JOIN orders o ON o.id = t.order_id
                 WHERE o.status = 'выполнен' AND o.completed_at IS NOT NULL
                 GROUP BY year, month
                 ORDER BY year DESC, month DESC`,
        );

        // Топ услуг по выручке
        const topServicesRes = await pool.query(
            `SELECT 
                s.id,
                s.name,
                COALESCE(SUM(so.quantity), 0)::int AS count,
                SUM(so.price) AS revenue
             FROM services_orders so
             JOIN orders o ON o.id = so.order_id
             JOIN services s ON s.id = so.service_id
             WHERE o.status = 'выполнен'
             GROUP BY s.id, s.name
             ORDER BY revenue DESC NULLS LAST, count DESC
             LIMIT 10`,
        );

        // Топ комплектующих по выручке
        const topComponentsRes = await pool.query(
            `SELECT 
                c.id,
                c.name,
                COALESCE(SUM(co.quantity), 0)::int AS count,
                SUM(co.price) AS revenue
             FROM components_orders co
             JOIN orders o ON o.id = co.order_id
             JOIN components c ON c.id = co.component_id
             WHERE o.status = 'выполнен'
             GROUP BY c.id, c.name
             ORDER BY revenue DESC NULLS LAST, count DESC
             LIMIT 10`,
        );

        res.json({
            kpis: {
                orders_total: ordersTotal,
                orders_completed: completedCount,
                orders_in_progress: countsMap['в работе'] || 0,
                orders_received: countsMap['принят'] || 0,
                revenue_total: Number(revenueTotal.toFixed(2)),
                avg_ticket: Number(avgTicket.toFixed(2)),
            },
            revenue_by_month: revenueByMonthRes.rows.map(r => ({
                year: r.year,
                month: r.month,
                revenue: Number(Number(r.revenue || 0).toFixed(2)),
            })),
            orders_by_status: [
                { status: 'принят', count: countsMap['принят'] || 0 },
                { status: 'в работе', count: countsMap['в работе'] || 0 },
                { status: 'выполнен', count: countsMap['выполнен'] || 0 },
            ],
            top_services: topServicesRes.rows.map(r => ({
                id: r.id,
                name: r.name,
                count: r.count,
                revenue: Number(Number(r.revenue || 0).toFixed(2)),
            })),
            top_components: topComponentsRes.rows.map(r => ({
                id: r.id,
                name: r.name,
                count: r.count,
                revenue: Number(Number(r.revenue || 0).toFixed(2)),
            })),
        });
    } catch (err) {
        console.error('Ошибка при получении аналитики:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
