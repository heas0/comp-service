import Api from './Api';

const AnalyticsApi = {
    getAll: async () => {
        try {
            const res = await Api.get('/analytics');
            return res.data;
        } catch (error) {
            console.error('Ошибка при получении аналитики:', error);
            throw new Error(
                error.response?.data?.message ||
                    'Ошибка при получении аналитики',
            );
        }
    },
};

export default AnalyticsApi;
