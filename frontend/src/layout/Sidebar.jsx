import { NavLink } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

const Sidebar = () => {
    // Список пунктов меню
    const menuItems = [
        { path: '/orders', label: 'Заказы' },
        { path: '/clients', label: 'Клиенты' },
        { path: '/equipments', label: 'Техника клиентов' },
        { path: '/services', label: 'Услуги' },
        { path: '/components', label: 'Комплектующие' },
        { path: '/analytics', label: 'Аналитика' },
    ];

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    position: 'static',
                    boxSizing: 'border-box',
                },
            }}
        >
            <List>
                {menuItems.map(item => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton component={NavLink} to={item.path}>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;
