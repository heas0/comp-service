import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
    return (
        <>
            <Header />
            <Sidebar />
            <Outlet /> {/* Здесь будут рендериться страницы */}
            <Footer />
        </>
    );
};

export default Layout;