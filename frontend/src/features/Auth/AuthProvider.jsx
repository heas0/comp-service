import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.jsx';
import AuthApi from './api/authApi.jsx';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Загрузка данных пользователя при инициализации или изменении токена
    useEffect(() => {
        const fetchUserData = async () => {
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const userData = await AuthApi.getCurrentUser();
                setUser(userData);
                setError(null);
            } catch (err) {
                console.error('Ошибка при получении данных пользователя:', err);
                setError('Не удалось загрузить данные пользователя');
                // Если токен невалидный - выходим из системы
                if (err.response?.status === 401) {
                    logout();
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [token]);

    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            const data = await AuthApi.login(username, password);

            if (data && data.token) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
                return true;
            } else {
                throw new Error('Неверный формат ответа от сервера');
            }
        } catch (err) {
            setError(err.message || 'Ошибка при входе в систему');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await AuthApi.logout();
            }
        } catch (err) {
            console.error('Ошибка при выходе из системы:', err);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    const isAuthenticated = !!token;

    const authContextValue = {
        user,
        token,
        login,
        logout,
        isAuthenticated,
        loading,
        error,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
