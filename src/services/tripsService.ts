import api from './api';

export enum ParticipantRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export interface Trip {
  _id: string;
  name: string;
  baseCurrency: string;
  createdAt: string;
  userRole?: ParticipantRole;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const tripsService = {
  async getAllTrips(): Promise<{ trips: Trip[] }> {
    const response = await api.get('/trips');
    return response.data;
  },

  async getTripById(id: string): Promise<{ trip: Trip }> {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  async createTrip(data: {
    name: string;
    baseCurrency?: string;
  }): Promise<{ message: string; trip: Trip }> {
    const response = await api.post('/trips', data);
    return response.data;
  },

  async updateTrip(
    id: string,
    data: { name?: string; baseCurrency?: string },
  ): Promise<{ message: string; trip: Trip }> {
    const response = await api.patch(`/trips/${id}`, data);
    return response.data;
  },

  async deleteTrip(id: string): Promise<void> {
    await api.delete(`/trips/${id}`);
  },
};
