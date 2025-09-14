import Api from './Api';

const ServicesApi = {
    // Получить все услуги
    getAll: async () => {
        try {
            const response = await Api.get('/services');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении услуг:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при получении услуг',
            );
        }
    },

    // Получить услугу по ID
    getById: async id => {
        try {
            const response = await Api.get(`/services/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении услуги:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при получении услуги',
            );
        }
    },

    // Создать новую услугу
    create: async serviceData => {
        try {
            const response = await Api.post('/services', serviceData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании услуги:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при создании услуги',
            );
        }
    },

    // Обновить услугу
    update: async (id, serviceData) => {
        try {
            const response = await Api.put(`/services/${id}`, serviceData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении услуги:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при обновлении услуги',
            );
        }
    },

    // Удалить услугу
    delete: async id => {
        try {
            const response = await Api.delete(`/services/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении услуги:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при удалении услуги',
            );
        }
    },
};

export default ServicesApi;
