import api from './api';

export interface UserPreferences {
  activeBoardId: string | null;
}

export const userPreferencesService = {
  async updatePreferences(data: { activeBoardId?: string | null }) {
    const response = await api.patch<UserPreferences>(
      '/auth/preferences',
      data,
    );
    return response.data;
  },
};
