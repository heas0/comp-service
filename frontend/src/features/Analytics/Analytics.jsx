import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
} from '@mui/material';
import AnalyticsApi from '../../api/analyticsApi.jsx';

const KpiCard = ({ title, value, color }) => (
    <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary">
            {title}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5, color }}>
            {value}
        </Typography>
    </Paper>
);

const Currency = ({ value }) => <>{Number(value).toFixed(2)} ₽</>;

const Analytics = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await AnalyticsApi.getAll();
                if (mounted) setData(res);
            } catch (e) {
                setError(e.message);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    if (!data) {
        return <Typography>Загрузка аналитики…</Typography>;
    }

    const { kpis, revenue_by_month, top_services, top_components } = data;

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Аналитика
            </Typography>

            {/* KPIs */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <KpiCard title="Всего заказов" value={kpis.orders_total} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KpiCard
                        title="Выполнено"
                        value={kpis.orders_completed}
                        color="success.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KpiCard
                        title="В работе"
                        value={kpis.orders_in_progress}
                        color="warning.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KpiCard
                        title="Принято"
                        value={kpis.orders_received}
                        color="info.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KpiCard
                        title="Выручка, всего"
                        value={<Currency value={kpis.revenue_total} />}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KpiCard
                        title="Средний чек (выполн.)"
                        value={<Currency value={kpis.avg_ticket} />}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Выручка по месяцам */}
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Выручка по месяцам
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Год</TableCell>
                                    <TableCell>Месяц</TableCell>
                                    <TableCell align="right">Выручка</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {revenue_by_month.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            Нет данных
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    revenue_by_month.map((r, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{r.year}</TableCell>
                                            <TableCell>{r.month}</TableCell>
                                            <TableCell align="right">
                                                <strong>
                                                    <Currency
                                                        value={r.revenue}
                                                    />
                                                </strong>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                {/* Топ услуг */}
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Топ услуг
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Название</TableCell>
                                    <TableCell align="right">Кол-во</TableCell>
                                    <TableCell align="right">Выручка</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {top_services.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            Нет данных
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    top_services.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell>{s.name}</TableCell>
                                            <TableCell align="right">
                                                {s.count}
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>
                                                    <Currency
                                                        value={s.revenue}
                                                    />
                                                </strong>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                {/* Топ комплектующих */}
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Топ комплектующих
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Название</TableCell>
                                    <TableCell align="right">Кол-во</TableCell>
                                    <TableCell align="right">Выручка</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {top_components.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            Нет данных
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    top_components.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell>{c.name}</TableCell>
                                            <TableCell align="right">
                                                {c.count}
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>
                                                    <Currency
                                                        value={c.revenue}
                                                    />
                                                </strong>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Analytics;
