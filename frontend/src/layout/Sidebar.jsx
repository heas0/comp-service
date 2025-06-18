import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    // Список пунктов меню
    const menuItems = [
        { path: '/orders', label: 'Заказы' },
        { path: '/clients', label: 'Клиенты' },
        { path: '/equipments', label: 'Техника клиентов' },
        { path: '/services', label: 'Услуги' },
        { path: '/materials', label: 'Материалы' },
    ]

    return (
        <aside>
            <nav>
                <ul>
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;