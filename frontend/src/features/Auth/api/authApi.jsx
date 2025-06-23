import Api from '../../../api/Api';

const AuthApi = {
  login: async (username, password) => {
    try {
      const response = await Api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      throw new Error(error.response?.data?.message || 'Ошибка авторизации');
    }
  },

  logout: async () => {
    try {
      const response = await Api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await Api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      throw error;
    }
  },
};

export default AuthApi;
