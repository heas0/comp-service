import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Snackbar,
    Typography,
    Paper,
    CircularProgress,
    Backdrop,
    MenuItem,
    Chip,
    IconButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import OrdersApi from '../../api/ordersApi.jsx';
import EquipmentsApi from '../../api/equipmentsApi.jsx';
import OrderComponents from './OrderComponents.jsx';
import OrderServices from './OrderServices.jsx';

const OrderList = () => {
    // Управление состоянием
    const [orders, setOrders] = useState([]);
    const [equipments, setEquipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [operationLoading, setOperationLoading] = useState(false);
    const [_error, setError] = useState(null);

    // Состояния диалогов
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit' | 'view'
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Состояние формы
    const [formData, setFormData] = useState({
        equipment_id: '',
        status: '',
        issue: '',
        package: '',
        completed_at: '',
        components: [],
        services: [],
    });
    const [formErrors, setFormErrors] = useState({});

    // Состояние уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // Константы для статусов
    const statusOptions = [
        { value: 'принят', label: 'Принят' },
        { value: 'в работе', label: 'В работе' },
        { value: 'выполнен', label: 'Выполнен' },
    ];

    // Функция для форматирования даты в формат YYYY-MM-DD без смещения часового пояса
    const formatDateForInput = date => {
        if (!date) return '';

        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';

        // Используем локальную дату без смещения часового пояса
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // Функция для получения сегодняшней даты в формате YYYY-MM-DD
    const getTodayFormatted = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // Функции для работы с API
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await OrdersApi.getAll();
            console.log('Полученные данные заказов:', data);
            console.log('Первый заказ:', data[0]);

            // Преобразуем строки дат в объекты Date для корректной работы с DataGrid
            const processedData = data.map(order => ({
                ...order,
                created_at: order.created_at
                    ? new Date(order.created_at)
                    : null,
                completed_at: order.completed_at
                    ? new Date(order.completed_at)
                    : null,
            }));

            setOrders(processedData);
            setError(null);
        } catch (err) {
            console.error('Ошибка при загрузке заказов:', err);
            setError(err.message);
            showSnackbar(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Функция для загрузки оборудования
    const fetchEquipments = useCallback(async () => {
        try {
            const data = await EquipmentsApi.getAll();
            setEquipments(data);
        } catch (err) {
            console.error('Ошибка при загрузке оборудования:', err);
            showSnackbar(err.message, 'error');
        }
    }, []);

    // Загрузка данных при монтировании
    useEffect(() => {
        fetchOrders();
        fetchEquipments();
    }, [fetchOrders, fetchEquipments]);

    // Функция для показа уведомлений
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // Функция для закрытия уведомлений
    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Обработчики форм
    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value,
            };

            // Управление датой завершения в зависимости от статуса
            // Проверяем при любом обновлении данных
            const currentStatus = field === 'status' ? value : newData.status;

            if (currentStatus !== 'выполнен') {
                // Если статус НЕ "выполнен", дата должна быть пустой
                newData.completed_at = '';
            } else if (currentStatus === 'выполнен') {
                // Если статус "выполнен", сохраняем существующую дату или устанавливаем сегодняшнюю
                if (!newData.completed_at) {
                    newData.completed_at = getTodayFormatted();
                }
                // Если дата уже есть, оставляем её как есть
            }

            return newData;
        });

        // Очистка ошибки при изменении поля
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: null,
            }));
        }
    };

    // Обработчики изменений комплектующих и услуг
    const handleComponentsChange = updatedComponents => {
        setFormData(prev => ({
            ...prev,
            components: updatedComponents,
        }));
    };

    const handleServicesChange = updatedServices => {
        setFormData(prev => ({
            ...prev,
            services: updatedServices,
        }));
    };

    // Валидация формы
    const validateForm = () => {
        const errors = {};

        if (!formData.equipment_id?.toString().trim()) {
            errors.equipment_id = 'Выберите технику';
        }

        // Статус требуется только при редактировании
        if (dialogMode === 'edit' && !formData.status?.trim()) {
            errors.status = 'Выберите статус';
        }

        if (!formData.issue?.trim()) {
            errors.issue = 'Опишите проблему';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Сброс формы
    const resetForm = () => {
        setFormData({
            equipment_id: '',
            status: '',
            issue: '',
            package: '',
            completed_at: '',
            components: [],
            services: [],
        });
        setFormErrors({});
    };

    // Открытие диалога
    const openDialog = (mode, order = null) => {
        setDialogMode(mode);
        setSelectedOrder(order);

        if ((mode === 'edit' || mode === 'view') && order) {
            // Приводим комплектующие/услуги к единому формату с *_id,
            // т.к. с бэкенда приходят объекты с полем id
            const normalizedComponents = (order.components || []).map(c => ({
                // идентификаторы
                component_id: c.component_id ?? c.id,
                // отображение
                name: c.name,
                type: c.type,
                unit: c.unit,
                component_price: c.component_price ?? c.price, // страхуемся
                // значения заказа
                quantity: c.quantity,
                order_price: c.order_price ?? c.price,
            }));

            const normalizedServices = (order.services || []).map(s => ({
                service_id: s.service_id ?? s.id,
                name: s.name,
                type: s.type,
                service_price: s.service_price ?? s.price,
                quantity: s.quantity,
                order_price: s.order_price ?? s.price,
            }));

            setFormData({
                equipment_id: order.equipment_id || '',
                status: order.status || '',
                issue: order.issue || '',
                package: order.package || '',
                completed_at: formatDateForInput(order.completed_at),
                components: normalizedComponents,
                services: normalizedServices,
            });
        } else {
            resetForm();
        }

        setDialogOpen(true);
    };

    // Закрытие диалога
    const closeDialog = () => {
        setDialogOpen(false);
        setSelectedOrder(null);
        resetForm();
    };

    // Создание заказа
    const handleCreate = async () => {
        if (!validateForm()) return;

        setOperationLoading(true);
        try {
            // Преобразуем комплектующие/услуги к формату бэкенда (price вместо order_price)
            const payload = {
                equipment_id: formData.equipment_id,
                status: 'принят',
                issue: formData.issue,
                package: formData.package,
                completed_at: formData.completed_at || null,
                components: (formData.components || []).map(c => ({
                    component_id: c.component_id,
                    quantity: Number(c.quantity) || 1,
                    price: Number(c.component_price) || 0, // цена за единицу
                })),
                services: (formData.services || []).map(s => ({
                    service_id: s.service_id,
                    quantity: Number(s.quantity) || 1,
                    price: Number(s.service_price) || 0, // цена за единицу
                })),
            };

            await OrdersApi.create(payload);

            await fetchOrders();
            closeDialog();
            showSnackbar('Заказ успешно создан');
        } catch (err) {
            showSnackbar(err.message, 'error');
        } finally {
            setOperationLoading(false);
        }
    };

    // Обновление заказа
    const handleUpdate = async () => {
        if (!validateForm()) return;

        setOperationLoading(true);
        try {
            const orderId = selectedOrder.id;

            // 1) Обновляем основную информацию заказа
            await OrdersApi.update(orderId, {
                equipment_id: formData.equipment_id,
                status: formData.status,
                issue: formData.issue,
                package: formData.package,
                completed_at: formData.completed_at || null,
            });

            // 2) Дифф комплектующих и услуг и сохранение на бэкенд
            const prevComponents = (selectedOrder.components || []).map(c => ({
                component_id: c.component_id ?? c.id,
                quantity: Number(c.quantity) || 1,
                unit_price: Number(c.component_price ?? c.unit_price ?? 0) || 0,
            }));
            const nextComponents = (formData.components || []).map(c => ({
                component_id: c.component_id,
                quantity: Number(c.quantity) || 1,
                unit_price: Number(c.component_price) || 0,
            }));

            const prevComponentsMap = new Map(
                prevComponents.map(c => [String(c.component_id), c]),
            );
            const nextComponentsMap = new Map(
                nextComponents.map(c => [String(c.component_id), c]),
            );

            // Добавить/обновить комплектующие
            for (const [id, next] of nextComponentsMap.entries()) {
                if (!prevComponentsMap.has(id)) {
                    // добавить
                    await OrdersApi.addComponent(orderId, {
                        component_id: Number(id),
                        quantity: next.quantity,
                        price: next.unit_price,
                    });
                } else {
                    const prev = prevComponentsMap.get(id);
                    if (
                        prev.quantity !== next.quantity ||
                        prev.unit_price !== next.unit_price
                    ) {
                        await OrdersApi.updateComponent(orderId, Number(id), {
                            quantity: next.quantity,
                            price: next.unit_price,
                        });
                    }
                }
            }

            // Удалить комплектующие
            for (const [id] of prevComponentsMap.entries()) {
                if (!nextComponentsMap.has(id)) {
                    await OrdersApi.removeComponent(orderId, Number(id));
                }
            }

            // Услуги
            const prevServices = (selectedOrder.services || []).map(s => ({
                service_id: s.service_id ?? s.id,
                quantity: Number(s.quantity) || 1,
                unit_price: Number(s.service_price ?? s.unit_price ?? 0) || 0,
            }));
            const nextServices = (formData.services || []).map(s => ({
                service_id: s.service_id,
                quantity: Number(s.quantity) || 1,
                unit_price: Number(s.service_price) || 0,
            }));

            const prevServicesMap = new Map(
                prevServices.map(s => [String(s.service_id), s]),
            );
            const nextServicesMap = new Map(
                nextServices.map(s => [String(s.service_id), s]),
            );

            // Добавить/обновить услуги
            for (const [id, next] of nextServicesMap.entries()) {
                if (!prevServicesMap.has(id)) {
                    await OrdersApi.addService(orderId, {
                        service_id: Number(id),
                        quantity: next.quantity,
                        price: next.unit_price,
                    });
                } else {
                    const prev = prevServicesMap.get(id);
                    if (
                        prev.quantity !== next.quantity ||
                        prev.unit_price !== next.unit_price
                    ) {
                        await OrdersApi.updateService(orderId, Number(id), {
                            quantity: next.quantity,
                            price: next.unit_price,
                        });
                    }
                }
            }

            // Удалить услуги
            for (const [id] of prevServicesMap.entries()) {
                if (!nextServicesMap.has(id)) {
                    await OrdersApi.removeService(orderId, Number(id));
                }
            }

            await fetchOrders();
            closeDialog();
            showSnackbar('Заказ успешно обновлен');
        } catch (err) {
            showSnackbar(err.message, 'error');
        } finally {
            setOperationLoading(false);
        }
    };

    // Удаление заказа
    const handleDelete = async orderId => {
        if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
            return;
        }

        setOperationLoading(true);
        try {
            await OrdersApi.delete(orderId);
            await fetchOrders();
            showSnackbar('Заказ успешно удален');
        } catch (err) {
            showSnackbar(err.message, 'error');
        } finally {
            setOperationLoading(false);
        }
    };

    // Получить цвет статуса
    const getStatusColor = status => {
        const statusColors = {
            принят: 'info',
            'в работе': 'warning',
            выполнен: 'success',
        };
        return statusColors[status] || 'default';
    };

    // Форматирование даты
    const formatDate = dateValue => {
        if (!dateValue) return '-';
        try {
            // Если это уже объект Date
            if (dateValue instanceof Date) {
                if (isNaN(dateValue.getTime())) return '-';
                return dateValue.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                });
            }
            // Если это строка, преобразуем в Date
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch (error) {
            console.error('Ошибка форматирования даты:', error);
            return '-';
        }
    };

    // Колонки для DataGrid
    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            width: 80,
            type: 'number',
        },
        {
            field: 'client_name',
            headerName: 'Клиент',
            width: 180,
            renderCell: params => params.value || 'Не указан',
        },
        {
            field: 'equipment_model',
            headerName: 'Техника',
            width: 180,
            renderCell: params => params.value || 'Не указано',
        },
        {
            field: 'status',
            headerName: 'Статус',
            width: 140,
            renderCell: params => (
                <Chip
                    label={params.value}
                    color={getStatusColor(params.value)}
                    size="small"
                />
            ),
        },
        {
            field: 'issue',
            headerName: 'Проблема',
            width: 220,
            renderCell: params => (
                <div
                    style={{
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        lineHeight: '1.2',
                        maxHeight: '50px',
                        overflow: 'hidden',
                    }}
                >
                    {params.value || 'Не указана'}
                </div>
            ),
        },
        {
            field: 'package',
            headerName: 'Комплект',
            width: 140,
            renderCell: params => params.value || 'Не указан',
        },
        {
            field: 'created_at',
            headerName: 'Создан',
            width: 110,
            renderCell: params => formatDate(params.value),
        },
        {
            field: 'completed_at',
            headerName: 'Завершен',
            width: 110,
            renderCell: params => formatDate(params.value),
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Действия',
            width: 180,
            getActions: params => [
                <GridActionsCellItem
                    key="view"
                    icon={<VisibilityIcon />}
                    label="Просмотр"
                    onClick={() => openDialog('view', params.row)}
                />,
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Редактировать"
                    onClick={() => openDialog('edit', params.row)}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label="Удалить"
                    onClick={() => handleDelete(params.row.id)}
                />,
            ],
        },
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* Заголовок */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h4" component="h1">
                    Заказы
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openDialog('create')}
                    disabled={loading || operationLoading}
                >
                    Добавить заказ
                </Button>
            </Box>

            {/* Таблица */}
            <Paper elevation={2}>
                <DataGrid
                    rows={orders || []}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    autoHeight={false}
                    scrollbarSize={17}
                    getRowId={row => row.id}
                    sx={{
                        height: 600,
                        '& .MuiDataGrid-main': {
                            overflow: 'visible',
                        },
                        '& .MuiDataGrid-virtualScroller': {
                            overflow: 'auto',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'grey.50',
                            borderBottom: 2,
                            borderColor: 'divider',
                        },
                        '& .MuiDataGrid-row': {
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        },
                        minWidth: '1200px', // Минимальная ширина для всех колонок
                    }}
                    slots={{
                        noRowsOverlay: () => (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography>
                                    {loading
                                        ? 'Загрузка...'
                                        : 'Заказы не найдены'}
                                </Typography>
                            </Box>
                        ),
                    }}
                />
            </Paper>

            {/* Диалог создания/редактирования/просмотра */}
            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="lg"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            minHeight: 'auto',
                            maxHeight: '90vh',
                        },
                    },
                }}
            >
                <DialogTitle>
                    {dialogMode === 'create' && 'Создать заказ'}
                    {dialogMode === 'edit' && 'Редактировать заказ'}
                    {dialogMode === 'view' && 'Просмотр заказа'}
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
                            label="Техника"
                            value={formData.equipment_id}
                            onChange={e =>
                                handleInputChange(
                                    'equipment_id',
                                    e.target.value,
                                )
                            }
                            error={!!formErrors.equipment_id}
                            helperText={formErrors.equipment_id}
                            disabled={dialogMode === 'view'}
                        >
                            {equipments.map(equipment => (
                                <MenuItem
                                    key={equipment.id}
                                    value={equipment.id}
                                >
                                    {equipment.type} {equipment.model} -{' '}
                                    {equipment.client_name}
                                </MenuItem>
                            ))}
                        </TextField>

                        {dialogMode !== 'create' && (
                            <TextField
                                fullWidth
                                select
                                label="Статус"
                                value={formData.status}
                                onChange={e =>
                                    handleInputChange('status', e.target.value)
                                }
                                error={!!formErrors.status}
                                helperText={formErrors.status}
                                disabled={dialogMode === 'view'}
                            >
                                {statusOptions.map(option => (
                                    <MenuItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}

                        <TextField
                            fullWidth
                            label="Описание проблемы"
                            value={formData.issue}
                            onChange={e =>
                                handleInputChange('issue', e.target.value)
                            }
                            error={!!formErrors.issue}
                            helperText={formErrors.issue}
                            multiline
                            rows={3}
                            disabled={dialogMode === 'view'}
                        />

                        <TextField
                            fullWidth
                            label="Комплект"
                            value={formData.package}
                            onChange={e =>
                                handleInputChange('package', e.target.value)
                            }
                            multiline
                            rows={2}
                            disabled={dialogMode === 'view'}
                        />

                        {/* Комплектующие и услуги в редактировании и просмотре */}
                        {dialogMode !== 'create' && (
                            <>
                                {/* Комплектующие заказа */}
                                <OrderComponents
                                    components={formData.components}
                                    onComponentsChange={handleComponentsChange}
                                    disabled={dialogMode !== 'edit'}
                                />

                                {/* Услуги заказа */}
                                <OrderServices
                                    services={formData.services}
                                    onServicesChange={handleServicesChange}
                                    disabled={dialogMode !== 'edit'}
                                />
                            </>
                        )}

                        {dialogMode !== 'create' && (
                            <TextField
                                fullWidth
                                label="Дата завершения"
                                type="date"
                                value={formData.completed_at}
                                onChange={e =>
                                    handleInputChange(
                                        'completed_at',
                                        e.target.value,
                                    )
                                }
                                onClick={e => {
                                    // Делаем весь input кликабельным для открытия календаря
                                    if (e.target.type === 'date') {
                                        e.target.showPicker &&
                                            e.target.showPicker();
                                    }
                                }}
                                disabled={
                                    dialogMode === 'view' ||
                                    formData.status !== 'выполнен'
                                }
                                helperText={
                                    formData.status !== 'выполнен'
                                        ? 'Дата завершения доступна только при статусе "Выполнен"'
                                        : 'Дата автоматически устанавливается при выборе статуса "Выполнен"'
                                }
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                inputProps={{
                                    style: { cursor: 'pointer' },
                                }}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    {dialogMode === 'view' ? (
                        <Button onClick={closeDialog} variant="contained">
                            Закрыть
                        </Button>
                    ) : (
                        <>
                            <Button onClick={closeDialog}>Отмена</Button>
                            <Button
                                onClick={
                                    dialogMode === 'create'
                                        ? handleCreate
                                        : handleUpdate
                                }
                                variant="contained"
                                disabled={operationLoading}
                            >
                                {dialogMode === 'create'
                                    ? 'Создать'
                                    : 'Сохранить'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Лоадер */}
            <Backdrop
                sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
                open={operationLoading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* Уведомления */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default OrderList;
