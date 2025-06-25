import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/Auth/useAuth.jsx';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Отображаем индикатор загрузки, пока проверяем аутентификацию
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу логина,
  // сохраняя текущий путь для возврата после успешной авторизации
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
