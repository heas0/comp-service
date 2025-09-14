import Api from './Api';

const ComponentsApi = {
    // Получить все комплектующие
    getAll: async () => {
        try {
            const response = await Api.get('/components');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении комплектующих:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при получении комплектующих',
            );
        }
    },

    // Получить комплектующее по ID
    getById: async id => {
        try {
            const response = await Api.get(`/components/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении комплектующего:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при получении комплектующего',
            );
        }
    },

    // Создать новое комплектующее
    create: async componentData => {
        try {
            const response = await Api.post('/components', componentData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании комплектующего:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при создании комплектующего',
            );
        }
    },

    // Обновить комплектующее
    update: async (id, componentData) => {
        try {
            const response = await Api.put(`/components/${id}`, componentData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении комплектующего:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при обновлении комплектующего',
            );
        }
    },

    // Удалить комплектующее
    delete: async id => {
        try {
            const response = await Api.delete(`/components/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении комплектующего:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при удалении комплектующего',
            );
        }
    },
};

export default ComponentsApi;
