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
import ComponentsApi from '../../api/componentsApi.jsx';
const OrderComponents = ({
    components = [],
    onComponentsChange,
    disabled = false,
}) => {
    // Состояния для доступных комплектующих
    const [availableComponents, setAvailableComponents] = useState([]);

    // Состояния диалога
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);

    // Состояние формы
    const [componentForm, setComponentForm] = useState({
        component_id: '',
        quantity: 1,
        price: '', // итоговая стоимость позиции
        autoPrice: true, // если true — автоматически рассчитывать из цены за ед. * количество
    });

    // Загрузка доступных комплектующих
    useEffect(() => {
        const loadComponents = async () => {
            try {
                const data = await ComponentsApi.getAll();
                setAvailableComponents(data);
            } catch (error) {
                console.error('Ошибка при загрузке комплектующих:', error);
            }
        };
        loadComponents();
    }, []);

    // Функции для работы с комплектующими
    const openDialog = (component = null) => {
        if (component) {
            setEditingComponent(component);
            const qty = component.quantity || 1;
            const unit = Number(component.component_price || 0);
            const total = Number(component.order_price || 0);
            const expected = +(unit * qty).toFixed(2);
            const isAuto = total ? +(+total).toFixed(2) === expected : true;
            setComponentForm({
                component_id: component.component_id
                    ? component.component_id.toString()
                    : '',
                quantity: qty,
                price: total || '',
                autoPrice: isAuto,
            });
        } else {
            setEditingComponent(null);
            setComponentForm({
                component_id: '',
                quantity: 1,
                price: '',
                autoPrice: true,
            });
        }
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingComponent(null);
        setComponentForm({
            component_id: '',
            quantity: 1,
            price: '',
            autoPrice: true,
        });
    };

    const handleSubmit = () => {
        const selectedComponent = availableComponents.find(
            c => c.id === parseInt(componentForm.component_id),
        );

        if (!selectedComponent) return;

        const newComponent = {
            component_id: selectedComponent.id,
            name: selectedComponent.name,
            type: selectedComponent.type,
            unit: selectedComponent.unit,
            component_price: selectedComponent.price,
            quantity: parseInt(componentForm.quantity),
            order_price:
                parseFloat(componentForm.price) ||
                selectedComponent.price * parseInt(componentForm.quantity),
        };

        let updatedComponents;
        if (editingComponent) {
            // Редактирование существующих комплектующих
            updatedComponents = components.map(comp =>
                comp.component_id === editingComponent.component_id
                    ? newComponent
                    : comp,
            );
        } else {
            // Добавление новых комплектующих
            // Проверяем, что такие комплектующие еще не добавлены
            const exists = components.find(
                comp => comp.component_id === selectedComponent.id,
            );
            if (exists) {
                alert('Эти комплектующие уже добавлены в заказ');
                return;
            }
            updatedComponents = [...components, newComponent];
        }

        onComponentsChange(updatedComponents);
        closeDialog();
    };

    const handleDelete = componentId => {
        if (window.confirm('Удалить комплектующее из заказа?')) {
            const updatedComponents = components.filter(
                comp => comp.component_id !== componentId,
            );
            onComponentsChange(updatedComponents);
        }
    };

    // Вычисление общей стоимости комплектующих
    const totalCost = components.reduce((sum, comp) => {
        const price = parseFloat(comp.order_price) || 0;
        return sum + price;
    }, 0);

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
                <Typography variant="h6">
                    Комплектующие ({components.length})
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => openDialog()}
                    disabled={disabled}
                >
                    Добавить комплектующее
                </Button>
            </Box>

            {components.length > 0 ? (
                <>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Название</TableCell>
                                    <TableCell>Тип</TableCell>
                                    <TableCell>Единица</TableCell>
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
                                {components.map((component, index) => (
                                    <TableRow key={`component-${index}`}>
                                        <TableCell>{component.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={component.type}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{component.unit}</TableCell>
                                        <TableCell align="right">
                                            {component.quantity}
                                        </TableCell>
                                        <TableCell align="right">
                                            {component.component_price
                                                ? `${component.component_price} ₽`
                                                : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>
                                                {component.order_price
                                                    ? `${component.order_price} ₽`
                                                    : '-'}
                                            </strong>
                                        </TableCell>
                                        {!disabled && (
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        openDialog(component)
                                                    }
                                                    disabled={disabled}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleDelete(
                                                            component.component_id,
                                                        )
                                                    }
                                                    disabled={disabled}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Итоговая стоимость */}
                    <Box sx={{ mt: 1, textAlign: 'right' }}>
                        <Typography variant="subtitle1">
                            <strong>
                                Стоимость комплектующих: {totalCost.toFixed(2)}{' '}
                                ₽
                            </strong>
                        </Typography>
                    </Box>
                </>
            ) : (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                        Комплектующие не добавлены
                    </Typography>
                </Paper>
            )}

            {/* Диалог добавления/редактирования комплектующих */}
            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingComponent
                        ? 'Редактировать комплектующее'
                        : 'Добавить комплектующее'}
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
                            label="Комплектующие"
                            value={componentForm.component_id}
                            onChange={e => {
                                const selectedId = e.target.value;
                                const selected = availableComponents.find(
                                    c => c.id === parseInt(selectedId),
                                );
                                setComponentForm(prev => ({
                                    ...prev,
                                    component_id: selectedId,
                                    price:
                                        prev.autoPrice && selected
                                            ? selected.price *
                                              (parseInt(prev.quantity) || 1)
                                            : prev.price,
                                }));
                            }}
                            required
                        >
                            {availableComponents.map(component => (
                                <MenuItem
                                    key={component.id}
                                    value={component.id}
                                >
                                    {component.name} ({component.type}) -{' '}
                                    {component.price}₽/{component.unit}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            label="Количество"
                            type="number"
                            value={componentForm.quantity}
                            onChange={e => {
                                const quantity = parseInt(e.target.value) || 1;
                                const selected = availableComponents.find(
                                    c =>
                                        c.id ===
                                        parseInt(componentForm.component_id),
                                );
                                setComponentForm(prev => ({
                                    ...prev,
                                    quantity: e.target.value,
                                    price:
                                        prev.autoPrice && selected
                                            ? selected.price * quantity
                                            : prev.price,
                                }));
                            }}
                            inputProps={{ min: 1 }}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Цена"
                            type="number"
                            value={componentForm.price}
                            onChange={e =>
                                setComponentForm(prev => ({
                                    ...prev,
                                    price: e.target.value,
                                    autoPrice: false, // пользователь задал цену вручную — перестаём автосчитать
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
                            !componentForm.component_id ||
                            !componentForm.quantity
                        }
                    >
                        {editingComponent ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OrderComponents;
