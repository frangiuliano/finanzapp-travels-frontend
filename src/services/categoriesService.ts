import api from './api';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@/types/category';

export const categoriesService = {
  async getByBoard(
    boardId: string,
    includeInactive = false,
  ): Promise<{ categories: Category[] }> {
    const params = new URLSearchParams({ boardId });
    if (includeInactive) {
      params.set('includeInactive', 'true');
    }
    const response = await api.get(`/categories?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<{ category: Category }> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryDto): Promise<{
    message: string;
    category: Category;
  }> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateCategoryDto,
  ): Promise<{ message: string; category: Category }> {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  },

  async archive(id: string): Promise<{ message: string; category: Category }> {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
