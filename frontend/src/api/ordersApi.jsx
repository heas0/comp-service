import Api from './Api';

const OrdersApi = {
    // Получить все заказы с полной информацией
    getAll: async () => {
        try {
            const response = await Api.get('/orders');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении заказов:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при получении заказов',
            );
        }
    },

    // Получить заказ по ID с полной информацией
    getById: async id => {
        try {
            const response = await Api.get(`/orders/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении заказа:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при получении заказа',
            );
        }
    },

    // Создать новый заказ
    create: async orderData => {
        try {
            const response = await Api.post('/orders', orderData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании заказа:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при создании заказа',
            );
        }
    },

    // Обновить заказ
    update: async (id, orderData) => {
        try {
            const response = await Api.put(`/orders/${id}`, orderData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении заказа:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при обновлении заказа',
            );
        }
    },

    // Удалить заказ
    delete: async id => {
        try {
            const response = await Api.delete(`/orders/${id}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении заказа:', error);
            throw new Error(
                error.response?.data?.message || 'Ошибка при удалении заказа',
            );
        }
    },

    // Получить комплектующие заказа
    getOrderComponents: async orderId => {
        try {
            const response = await Api.get(`/orders/${orderId}/components`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении комплектующих заказа:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при получении комплектующих заказа',
            );
        }
    },

    // Получить услуги заказа
    getOrderServices: async orderId => {
        try {
            const response = await Api.get(`/orders/${orderId}/services`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении услуг заказа:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при получении услуг заказа',
            );
        }
    },

    // Добавить комплектующее к заказу
    addComponent: async (orderId, componentData) => {
        try {
            const response = await Api.post(
                `/orders/${orderId}/components`,
                componentData,
            );
            return response.data;
        } catch (error) {
            console.error(
                'Ошибка при добавлении комплектующего к заказу:',
                error,
            );
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при добавлении комплектующего к заказу',
            );
        }
    },

    // Добавить услугу к заказу
    addService: async (orderId, serviceData) => {
        try {
            const response = await Api.post(
                `/orders/${orderId}/services`,
                serviceData,
            );
            return response.data;
        } catch (error) {
            console.error('Ошибка при добавлении услуги к заказу:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при добавлении услуги к заказу',
            );
        }
    },

    // Удалить комплектующее из заказа
    removeComponent: async (orderId, componentId) => {
        try {
            const response = await Api.delete(
                `/orders/${orderId}/components/${componentId}`,
            );
            return response.data;
        } catch (error) {
            console.error(
                'Ошибка при удалении комплектующего из заказа:',
                error,
            );
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при удалении комплектующего из заказа',
            );
        }
    },

    // Удалить услугу из заказа
    removeService: async (orderId, serviceId) => {
        try {
            const response = await Api.delete(
                `/orders/${orderId}/services/${serviceId}`,
            );
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении услуги из заказа:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при удалении услуги из заказа',
            );
        }
    },

    // Обновить комплектующее в заказе
    updateComponent: async (orderId, componentId, componentData) => {
        try {
            const response = await Api.put(
                `/orders/${orderId}/components/${componentId}`,
                componentData,
            );
            return response.data;
        } catch (error) {
            console.error(
                'Ошибка при обновлении комплектующего в заказе:',
                error,
            );
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при обновлении комплектующего в заказе',
            );
        }
    },

    // Обновить услугу в заказе
    updateService: async (orderId, serviceId, serviceData) => {
        try {
            const response = await Api.put(
                `/orders/${orderId}/services/${serviceId}`,
                serviceData,
            );
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении услуги в заказе:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при обновлении услуги в заказе',
            );
        }
    },
};

export default OrdersApi;
