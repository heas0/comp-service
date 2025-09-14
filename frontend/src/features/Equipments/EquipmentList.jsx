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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import EquipmentsApi from '../../api/equipmentsApi.jsx';
import ClientsApi from '../../api/clientsApi.jsx';

const EquipmentList = () => {
    // Управление состоянием
    const [equipments, setEquipments] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [operationLoading, setOperationLoading] = useState(false);
    const [error, setError] = useState(null);

    // Состояния диалогов
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'
    const [selectedEquipment, setSelectedEquipment] = useState(null);

    // Состояние формы
    const [formData, setFormData] = useState({
        model: '',
        type: '',
        client_id: '',
    });
    const [formErrors, setFormErrors] = useState({});

    // Состояние уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // Определение колонок для таблицы
    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            width: 70,
            type: 'number',
        },
        {
            field: 'model',
            headerName: 'Модель',
            flex: 1,
            minWidth: 150,
            editable: false,
        },
        {
            field: 'type',
            headerName: 'Тип',
            width: 120,
            editable: false,
        },
        {
            field: 'client_name',
            headerName: 'Клиент',
            flex: 1,
            minWidth: 140,
            editable: false,
        },
        {
            field: 'client_phone',
            headerName: 'Телефон',
            width: 130,
            editable: false,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Действия',
            width: 120,
            sortable: false,
            filterable: false,
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

    // Показать уведомление
    const showNotification = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    // Закрыть уведомление
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Загрузка техники
    const loadEquipments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await EquipmentsApi.getAll();
            setEquipments(data);
        } catch (err) {
            console.error('Ошибка при загрузке техники:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Загрузка клиентов
    const loadClients = useCallback(async () => {
        try {
            const data = await ClientsApi.getAll();
            setClients(data);
        } catch (err) {
            console.error('Ошибка при загрузке клиентов:', err);
        }
    }, []);

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        loadEquipments();
        loadClients();
    }, [loadEquipments, loadClients]);

    // Валидация формы
    const validateForm = () => {
        const errors = {};

        if (!formData.model.trim()) {
            errors.model = 'Модель обязательна для заполнения';
        }

        if (!formData.type.trim()) {
            errors.type = 'Тип обязателен для заполнения';
        }

        if (!formData.client_id) {
            errors.client_id = 'Клиент обязателен для выбора';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Обработка отправки формы
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setOperationLoading(true);

            if (dialogMode === 'create') {
                await EquipmentsApi.create(formData);
                showNotification('Техника успешно добавлена');
            } else {
                await EquipmentsApi.update(selectedEquipment.id, formData);
                showNotification('Техника успешно обновлена');
            }

            setDialogOpen(false);
            await loadEquipments();
        } catch (err) {
            console.error('Ошибка при сохранении техники:', err);
            showNotification(err.message, 'error');
        } finally {
            setOperationLoading(false);
        }
    };

    // Обработка создания новой техники
    const handleCreate = () => {
        setDialogMode('create');
        setSelectedEquipment(null);
        setFormData({
            model: '',
            type: '',
            client_id: '',
        });
        setFormErrors({});
        setDialogOpen(true);
    };

    // Обработка редактирования техники
    const handleEdit = equipment => {
        setDialogMode('edit');
        setSelectedEquipment(equipment);
        setFormData({
            model: equipment.model || '',
            type: equipment.type || '',
            client_id: equipment.client_id || '',
        });
        setFormErrors({});
        setDialogOpen(true);
    };

    // Обработка удаления техники
    const handleDelete = async equipment => {
        if (
            !window.confirm(
                `Вы уверены, что хотите удалить технику "${equipment.model}"?`,
            )
        ) {
            return;
        }

        try {
            setOperationLoading(true);
            await EquipmentsApi.delete(equipment.id);
            await loadEquipments();
            showNotification('Техника успешно удалена');
        } catch (err) {
            console.error('Ошибка при удалении техники:', err);
            showNotification(err.message, 'error');
        } finally {
            setOperationLoading(false);
        }
    };

    // Обработка изменения поля формы
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));

        // Удаляем ошибку поля при изменении
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: '',
            }));
        }
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
                    Техника клиентов
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    disabled={loading}
                >
                    Добавить технику
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
                    rows={equipments}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[5, 10, 25, 50]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10 },
                        },
                    }}
                    sx={{
                        minHeight: 400,
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* Диалог создания/редактирования */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === 'create'
                        ? 'Добавить технику'
                        : 'Редактировать технику'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Модель"
                            value={formData.model}
                            onChange={e =>
                                handleFieldChange('model', e.target.value)
                            }
                            error={!!formErrors.model}
                            helperText={formErrors.model}
                            margin="normal"
                            required
                        />

                        <TextField
                            fullWidth
                            label="Тип"
                            value={formData.type}
                            onChange={e =>
                                handleFieldChange('type', e.target.value)
                            }
                            error={!!formErrors.type}
                            helperText={formErrors.type}
                            margin="normal"
                            required
                        />

                        <FormControl
                            fullWidth
                            margin="normal"
                            error={!!formErrors.client_id}
                            required
                        >
                            <InputLabel>Клиент</InputLabel>
                            <Select
                                value={formData.client_id}
                                label="Клиент"
                                onChange={e =>
                                    handleFieldChange(
                                        'client_id',
                                        e.target.value,
                                    )
                                }
                            >
                                {clients.map(client => (
                                    <MenuItem key={client.id} value={client.id}>
                                        {client.full_name} ({client.phone})
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.client_id && (
                                <FormHelperText>
                                    {formErrors.client_id}
                                </FormHelperText>
                            )}
                        </FormControl>
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

            {/* Уведомления */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Бэкдроп для загрузки операций */}
            <Backdrop
                sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
                open={operationLoading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
};

export default EquipmentList;
