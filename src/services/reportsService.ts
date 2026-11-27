import api from './api';
import type { BoardCalendarReport, ConsolidatedReport } from '@/types/report';

export const reportsService = {
  async getBoardCalendarReport(
    boardId: string,
    yearMonth: string,
  ): Promise<{ report: BoardCalendarReport }> {
    const params = new URLSearchParams({ boardId, yearMonth });
    const response = await api.get(`/reports/board?${params.toString()}`);
    return response.data;
  },

  async getConsolidatedReport(
    yearMonth: string,
    boardIds?: string[],
  ): Promise<{ report: ConsolidatedReport }> {
    const params = new URLSearchParams({ yearMonth });
    if (boardIds?.length) {
      params.set('boardIds', boardIds.join(','));
    }
    const response = await api.get(
      `/reports/consolidated?${params.toString()}`,
    );
    return response.data;
  },
};
