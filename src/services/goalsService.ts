import api from './api';
import type {
  CreateGoalInput,
  GoalPreviewResponse,
  GoalProgressResponse,
  GoalsListResponse,
  GoalWithResult,
  PreviewGoalInput,
  UpdateGoalHoldingsInput,
  UpdateGoalInput,
} from '@/types/goals';

export const goalsService = {
  async list(boardId: string): Promise<GoalsListResponse> {
    return (await api.get('/goals', { params: { boardId } })).data;
  },

  async get(boardId: string, goalId: string): Promise<GoalWithResult> {
    return (await api.get(`/goals/${goalId}`, { params: { boardId } })).data;
  },

  async getProgress(
    boardId: string,
    goalId: string,
  ): Promise<GoalProgressResponse> {
    return (await api.get(`/goals/${goalId}/progress`, { params: { boardId } }))
      .data;
  },

  async create(
    boardId: string,
    input: CreateGoalInput,
  ): Promise<GoalWithResult> {
    return (await api.post('/goals', input, { params: { boardId } })).data;
  },

  async preview(
    boardId: string,
    input: PreviewGoalInput,
  ): Promise<GoalPreviewResponse> {
    return (await api.post('/goals/preview', input, { params: { boardId } }))
      .data;
  },

  async update(
    boardId: string,
    goalId: string,
    input: UpdateGoalInput,
  ): Promise<GoalWithResult> {
    return (await api.patch(`/goals/${goalId}`, input, { params: { boardId } }))
      .data;
  },

  async updateHoldings(
    boardId: string,
    goalId: string,
    input: UpdateGoalHoldingsInput,
  ): Promise<GoalWithResult> {
    return (
      await api.patch(`/goals/${goalId}/holdings`, input, {
        params: { boardId },
      })
    ).data;
  },

  async remove(boardId: string, goalId: string): Promise<void> {
    await api.delete(`/goals/${goalId}`, { params: { boardId } });
  },
};
