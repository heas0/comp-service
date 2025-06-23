import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/Auth/useAuth.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Отображаем индикатор загрузки, пока проверяем аутентификацию
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
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
