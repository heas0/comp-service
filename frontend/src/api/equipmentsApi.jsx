import Api from './Api';

const EquipmentsApi = {
    // Получить всю технику
    getAll: async () => {
        try {
            const response = await Api.get('/equipments');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении техники:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при получении техники',
            );
        }
    },

    // Получить технику по ID
    getById: async id => {
        try {
            const response = await Api.get(`/equipments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении техники:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при получении техники',
            );
        }
    },

    // Получить технику по клиенту
    getByClientId: async clientId => {
        try {
            const response = await Api.get(`/equipments/client/${clientId}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении техники клиента:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при получении техники клиента',
            );
        }
    },

    // Создать новую технику
    create: async equipmentData => {
        try {
            const response = await Api.post('/equipments', equipmentData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании техники:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при создании техники',
            );
        }
    },

    // Обновить технику
    update: async (id, equipmentData) => {
        try {
            const response = await Api.put(`/equipments/${id}`, equipmentData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении техники:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при обновлении техники',
            );
        }
    },

    // Удалить технику
    delete: async id => {
        try {
            const response = await Api.delete(`/equipments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении техники:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при удалении техники',
            );
        }
    },
};

export default EquipmentsApi;
