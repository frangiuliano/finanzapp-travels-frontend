import api from './api';

export const botService = {
  async generateLinkToken() {
    const response = await api.post('/bot/generate-link-token');
    return response.data;
  },
};
