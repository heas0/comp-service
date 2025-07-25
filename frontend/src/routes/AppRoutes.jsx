import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../layout/Layout.jsx';
import OrderList from '../features/Orders/OrderList.jsx';
import ClientList from '../features/Clients/ClientList.jsx';
import EquipmentList from '../features/Equipments/EquipmentList.jsx';
import ServiceList from '../features/Services/ServiceList.jsx';
import MaterialList from '../features/Materials/MaterialList.jsx';
import LoginForm from '../features/Auth/LoginForm.jsx';
import { AuthProvider } from '../features/Auth/AuthProvider.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function AppRoutes() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/orders" replace />} />
                    <Route path="orders" element={<OrderList />} />
                    <Route path="clients" element={<ClientList />} />
                    <Route path="equipments" element={<EquipmentList />} />
                    <Route path="services" element={<ServiceList />} />
                    <Route path="materials" element={<MaterialList />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default AppRoutes;
