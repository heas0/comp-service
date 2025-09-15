import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import ServicesApi from '../../api/servicesApi.jsx';

const OrderServices = ({
    services = [],
    onServicesChange,
    disabled = false,
}) => {
    // Доступные услуги
    const [availableServices, setAvailableServices] = useState([]);

    // Диалог/форма
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        service_id: '',
        quantity: 1,
        price: '', // цена за единицу
    });

    // Загрузка услуг
    useEffect(() => {
        const loadServices = async () => {
            try {
                const data = await ServicesApi.getAll();
                setAvailableServices(data);
            } catch (error) {
                console.error('Ошибка при загрузке услуг:', error);
            }
        };
        loadServices();
    }, []);

    // Открыть диалог
    const openDialog = (service = null) => {
        if (service) {
            setEditingService(service);
            const qty = Number(service.quantity) || 1;
            const perUnit =
                service.order_price && qty
                    ? (Number(service.order_price) / qty).toFixed(2)
                    : (service.service_price ?? '');
            setServiceForm({
                service_id: service.service_id
                    ? String(service.service_id)
                    : '',
                quantity: qty,
                price: perUnit || '',
            });
        } else {
            setEditingService(null);
            setServiceForm({ service_id: '', quantity: 1, price: '' });
        }
        setDialogOpen(true);
    };

    // Закрыть диалог
    const closeDialog = () => {
        setDialogOpen(false);
        setEditingService(null);
        setServiceForm({ service_id: '', quantity: 1, price: '' });
    };

    // Добавить/сохранить услугу
    const handleSubmit = () => {
        const selectedService = availableServices.find(
            s => s.id === parseInt(serviceForm.service_id),
        );
        if (!selectedService) return;

        const qty = parseInt(serviceForm.quantity) || 1;
        const unitPrice = parseFloat(serviceForm.price);
        const effectiveUnit = !isNaN(unitPrice)
            ? unitPrice
            : Number(selectedService.price) || 0;
        const total = +(effectiveUnit * qty).toFixed(2);

        const newService = {
            service_id: selectedService.id,
            name: selectedService.name,
            type: selectedService.type,
            // показываем в таблице цену за ед. как service_price
            service_price: effectiveUnit,
            quantity: qty,
            // сохраняем в заказе итоговую стоимость
            order_price: total,
        };

        let updatedServices;
        if (editingService) {
            updatedServices = services.map(serv =>
                serv.service_id === editingService.service_id
                    ? newService
                    : serv,
            );
        } else {
            const exists = services.some(
                serv => serv.service_id === selectedService.id,
            );
            if (exists) {
                alert('Эта услуга уже добавлена в заказ');
                return;
            }
            updatedServices = [...services, newService];
        }

        onServicesChange(updatedServices);
        closeDialog();
    };

    const handleDelete = serviceId => {
        if (window.confirm('Удалить услугу из заказа?')) {
            const updatedServices = services.filter(
                serv => serv.service_id !== serviceId,
            );
            onServicesChange(updatedServices);
        }
    };

    // Итог по услугам
    const totalCost = services.reduce((sum, serv) => {
        const price = parseFloat(serv.order_price) || 0;
        return sum + price;
    }, 0);

    // Вспомогательное форматирование
    const formatCurrency = n =>
        typeof n === 'number' && !isNaN(n) ? `${n.toFixed(2)} ₽` : '-';

    return (
        <Box sx={{ mt: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Typography variant="h6">Услуги ({services.length})</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => openDialog()}
                    disabled={disabled}
                >
                    Добавить услугу
                </Button>
            </Box>

            {services.length > 0 ? (
                <>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Название</TableCell>
                                    <TableCell>Тип</TableCell>
                                    <TableCell align="right">
                                        Количество
                                    </TableCell>
                                    <TableCell align="right">
                                        Цена за ед.
                                    </TableCell>
                                    <TableCell align="right">
                                        Стоимость
                                    </TableCell>
                                    {!disabled && (
                                        <TableCell align="center">
                                            Действия
                                        </TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {services.map((service, index) => {
                                    const qty = Number(service.quantity) || 1;
                                    const perUnit =
                                        service.order_price && qty
                                            ? Number(service.order_price) / qty
                                            : Number(service.service_price);
                                    return (
                                        <TableRow key={`service-${index}`}>
                                            <TableCell>
                                                {service.name}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={service.type}
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {service.quantity}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(perUnit)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>
                                                    {service.order_price
                                                        ? formatCurrency(
                                                              Number(
                                                                  service.order_price,
                                                              ),
                                                          )
                                                        : '-'}
                                                </strong>
                                            </TableCell>
                                            {!disabled && (
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            openDialog(service)
                                                        }
                                                        disabled={disabled}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleDelete(
                                                                service.service_id,
                                                            )
                                                        }
                                                        disabled={disabled}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Итоговая стоимость */}
                    <Box sx={{ mt: 1, textAlign: 'right' }}>
                        <Typography variant="subtitle1">
                            <strong>
                                Стоимость услуг: {totalCost.toFixed(2)} ₽
                            </strong>
                        </Typography>
                    </Box>
                </>
            ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                        Услуги не добавлены
                    </Typography>
                </Paper>
            )}

            {/* Диалог добавления/редактирования услуги */}
            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingService
                        ? 'Редактировать услугу'
                        : 'Добавить услугу'}
                </DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            pt: 1,
                        }}
                    >
                        <TextField
                            fullWidth
                            select
                            label="Услуга"
                            value={serviceForm.service_id}
                            onChange={e => {
                                const selectedId = e.target.value;
                                const selected = availableServices.find(
                                    s => s.id === parseInt(selectedId),
                                );
                                setServiceForm(prev => ({
                                    ...prev,
                                    service_id: selectedId,
                                    price: selected
                                        ? selected.price
                                        : prev.price,
                                }));
                            }}
                            required
                        >
                            {availableServices.map(service => (
                                <MenuItem key={service.id} value={service.id}>
                                    {service.name} ({service.type}) -{' '}
                                    {service.price}₽
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            label="Количество"
                            type="number"
                            value={serviceForm.quantity}
                            onChange={e =>
                                setServiceForm(prev => ({
                                    ...prev,
                                    quantity: e.target.value,
                                }))
                            }
                            inputProps={{ min: 1 }}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Цена за ед."
                            type="number"
                            value={serviceForm.price}
                            onChange={e =>
                                setServiceForm(prev => ({
                                    ...prev,
                                    price: e.target.value,
                                }))
                            }
                            helperText="Цена за единицу"
                            inputProps={{ min: 0, step: 100 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Отмена</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={
                            !serviceForm.service_id || !serviceForm.quantity
                        }
                    >
                        {editingService ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OrderServices;
