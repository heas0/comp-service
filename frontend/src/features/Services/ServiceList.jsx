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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import ServicesApi from '../../api/servicesApi.jsx';

const ServiceList = () => {
    // Управление состоянием
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [operationLoading, setOperationLoading] = useState(false);
    const [error, setError] = useState(null);

    // Состояния диалогов
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'
    const [selectedService, setSelectedService] = useState(null);

    // Состояние формы
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        price: '',
    });
    const [formErrors, setFormErrors] = useState({});

    // Состояние уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // Типы услуг для выбора
    const serviceTypes = [
        { value: 'Обслуживание', label: 'Обслуживание' },
        { value: 'Ремонт', label: 'Ремонт' },
    ];

    // Конфигурация колонок Data Grid
    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            width: 80,
            type: 'number',
        },
        {
            field: 'name',
            headerName: 'Название услуги',
            flex: 1,
            minWidth: 250,
        },
        {
            field: 'type',
            headerName: 'Тип услуги',
            width: 150,
        },
        {
            field: 'price',
            headerName: 'Цена',
            width: 120,
            type: 'number',
            valueFormatter: value => {
                if (value == null) return '';
                return `${parseFloat(value).toFixed(2)} ₽`;
            },
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Действия',
            width: 120,
            getActions: params => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Редактировать"
                    onClick={() => handleEdit(params.row)}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label="Удалить"
                    onClick={() => handleDelete(params.row)}
                />,
            ],
        },
    ];

    // Загрузка данных услуг
    const loadServices = useCallback(async () => {
        try {
            setLoading(true);
            const data = await ServicesApi.getAll();
            setServices(data);
            setError(null);
        } catch (err) {
            console.error('Ошибка при загрузке услуг:', err);
            setError(err.message);
            showNotification('Ошибка при загрузке услуг', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        loadServices();
    }, [loadServices]);

    // Показать уведомление
    const showNotification = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    // Валидация формы
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Название услуги обязательно для заполнения';
        }

        if (!formData.type) {
            errors.type = 'Тип услуги обязателен для заполнения';
        }

        if (!formData.price || isNaN(parseFloat(formData.price))) {
            errors.price = 'Цена должна быть числом';
        } else if (parseFloat(formData.price) < 0) {
            errors.price = 'Цена не может быть отрицательной';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Обработка создания новой услуги
    const handleCreate = () => {
        setDialogMode('create');
        setSelectedService(null);
        setFormData({
            name: '',
            type: '',
            price: '',
        });
        setFormErrors({});
        setDialogOpen(true);
    };

    // Обработка редактирования услуги
    const handleEdit = service => {
        setDialogMode('edit');
        setSelectedService(service);
        setFormData({
            name: service.name || '',
            type: service.type || '',
            price: service.price ? service.price.toString() : '',
        });
        setFormErrors({});
        setDialogOpen(true);
    };

    // Обработка удаления услуги
    const handleDelete = async service => {
        if (
            !window.confirm(
                `Вы уверены, что хотите удалить услугу "${service.name}"?`,
            )
        ) {
            return;
        }

        try {
            setOperationLoading(true);
            await ServicesApi.delete(service.id);
            await loadServices();
            showNotification('Услуга успешно удалена');
        } catch (err) {
            console.error('Ошибка при удалении услуги:', err);
            showNotification(err.message, 'error');
        } finally {
            setOperationLoading(false);
        }
    };

    // Обработка отправки формы
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setOperationLoading(true);

            const submitData = {
                ...formData,
                price: parseFloat(formData.price),
            };

            if (dialogMode === 'create') {
                await ServicesApi.create(submitData);
                showNotification('Услуга успешно создана');
            } else {
                await ServicesApi.update(selectedService.id, submitData);
                showNotification('Услуга успешно обновлена');
            }

            setDialogOpen(false);
            await loadServices();
        } catch (err) {
            console.error('Ошибка при сохранении услуги:', err);
            showNotification(err.message, 'error');
        } finally {
            setOperationLoading(false);
        }
    };

    // Обработка изменений в полях формы
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));

        // Очистка ошибки поля при начале ввода пользователем
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    // Закрытие уведомления
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
            ...prev,
            open: false,
        }));
    };

    // Закрытие диалога
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setFormErrors({});
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Заголовок */}
            <Box
                sx={{
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h4" component="h1">
                    Услуги
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    disabled={loading}
                >
                    Добавить услугу
                </Button>
            </Box>

            {/* Уведомление об ошибке */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Таблица данных */}
            <Paper elevation={2}>
                <DataGrid
                    rows={services}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[5, 10, 25, 50]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10 },
                        },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                        height: 600,
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #e0e0e0',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                            borderBottom: '2px solid #e0e0e0',
                        },
                    }}
                />
            </Paper>

            {/* Диалог создания/редактирования */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === 'create'
                        ? 'Добавить услугу'
                        : 'Редактировать услугу'}
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
                            label="Название услуги"
                            value={formData.name}
                            onChange={e =>
                                handleInputChange('name', e.target.value)
                            }
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Тип услуги"
                            select
                            value={formData.type}
                            onChange={e =>
                                handleInputChange('type', e.target.value)
                            }
                            error={!!formErrors.type}
                            helperText={formErrors.type}
                            fullWidth
                            required
                        >
                            {serviceTypes.map(option => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Цена (₽)"
                            type="number"
                            value={formData.price}
                            onChange={e =>
                                handleInputChange('price', e.target.value)
                            }
                            error={!!formErrors.price}
                            helperText={formErrors.price}
                            fullWidth
                            required
                            inputProps={{ min: 0, step: 100 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={operationLoading}
                    >
                        {dialogMode === 'create' ? 'Создать' : 'Сохранить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Фон загрузки */}
            <Backdrop
                sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
                open={operationLoading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* Снэкбар уведомлений */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ServiceList;
