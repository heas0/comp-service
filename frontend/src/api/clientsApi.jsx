import Api from './Api';

const ClientsApi = {
    // Получить всех клиентов
    getAll: async () => {
        try {
            const response = await Api.get('/clients');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении клиентов:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при получении клиентов',
            );
        }
    },

    // Получить клиента по ID
    getById: async id => {
        try {
            const response = await Api.get(`/clients/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении клиента:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при получении клиента',
            );
        }
    },

    // Создать нового клиента
    create: async clientData => {
        try {
            const response = await Api.post('/clients', clientData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании клиента:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при создании клиента',
            );
        }
    },

    // Обновить клиента
    update: async (id, clientData) => {
        try {
            const response = await Api.put(`/clients/${id}`, clientData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении клиента:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при обновлении клиента',
            );
        }
    },

    // Удалить клиента
    delete: async id => {
        try {
            const response = await Api.delete(`/clients/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении клиента:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при удалении клиента',
            );
        }
    },
};

export default ClientsApi;
