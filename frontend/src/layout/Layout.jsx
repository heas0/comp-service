import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Box from '@mui/material/Box';

const Layout = () => {
    return (
        <Box>
            <Header />
            <Box display="flex">
                <Sidebar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
