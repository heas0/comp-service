import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "./useAuth.jsx";

const LoginForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [formError, setFormError] = useState(null);

    const { login, isAuthenticated, loading, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Определяем, откуда пользователь был перенаправлен
    const from = location.state?.from?.pathname || "/orders";

    // При успешной авторизации перенаправляем пользователя
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.username.trim() || !formData.password.trim()) {
            setFormError('Пожалуйста, заполните все поля');
            return;
        }

        try {
            await login(formData.username, formData.password);
        } catch (err) {
            setFormError(err.message || 'Произошла ошибка при авторизации');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Вход в систему</h2>

                {(formError || error) && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {formError || error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Логин
                        </label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="Введите логин"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Пароль
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Введите пароль"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md ${
                            loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } transition-colors`}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
