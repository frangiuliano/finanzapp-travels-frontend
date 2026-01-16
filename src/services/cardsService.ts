import api from './api';
import { Card, CreateCardDto, UpdateCardDto } from '@/types/card';

export const cardsService = {
  async createCard(
    createCardDto: CreateCardDto,
  ): Promise<{ message: string; card: Card }> {
    const response = await api.post('/cards', createCardDto);
    return response.data;
  },

  async getCards(): Promise<{ cards: Card[] }> {
    const response = await api.get('/cards');
    return response.data;
  },

  async getCardsByTrip(tripId: string): Promise<{ cards: Card[] }> {
    const response = await api.get(`/cards/trip/${tripId}`);
    return response.data;
  },

  async getCard(id: string): Promise<{ card: Card }> {
    const response = await api.get(`/cards/${id}`);
    return response.data;
  },

  async updateCard(
    id: string,
    updateCardDto: UpdateCardDto,
  ): Promise<{ message: string; card: Card }> {
    const response = await api.patch(`/cards/${id}`, updateCardDto);
    return response.data;
  },

  async deleteCard(id: string): Promise<void> {
    await api.delete(`/cards/${id}`);
  },
};
