import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем перехватчик запросов для подстановки токена авторизации
Api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    },
);

// Добавляем перехватчик ответов для обработки ошибок авторизации
Api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        // Если сервер вернул ошибку 401 (не авторизован) и это не повторный запрос
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Здесь можно добавить логику обновления токена, если у вас есть refresh token
                // const refreshToken = localStorage.getItem('refreshToken');
                // const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
                // const { token } = response.data;
                // localStorage.setItem('token', token);
                // originalRequest.headers.Authorization = `Bearer ${token}`;
                // return Api(originalRequest);

                // Если refresh token отсутствует или недействителен, выходим из системы
                localStorage.removeItem('token');
                window.location.href = '/login';
            } catch (refreshError) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    },
);

export default Api;
