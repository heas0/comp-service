import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

const Layout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh' }}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '240px',
                height: '100vh'
            }}>
                <Header />
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Sidebar />
                </Box>
                <Box>
                    <Footer />
                </Box>
            </Box>
            <Container component="main" sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Outlet />
            </Container>
        </Box>
    );
};

export default Layout;