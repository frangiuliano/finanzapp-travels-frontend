import { notifyExpensesChanged } from '@/lib/expense-events';
import api from './api';
import type {
  StatementImportConfirmResult,
  StatementImportSelection,
  StatementImportUploadResult,
} from '@/types/statement-import';

export const statementImportService = {
  async upload(
    boardId: string,
    paymentMethodId: string,
    file: File,
  ): Promise<StatementImportUploadResult> {
    const formData = new FormData();
    formData.append('boardId', boardId);
    formData.append('paymentMethodId', paymentMethodId);
    formData.append('file', file);

    // No headers set here on purpose: the browser fills in
    // multipart/form-data with the correct boundary on its own.
    const response = await api.post('/statement-imports', formData);
    return response.data;
  },

  async getSession(importId: string): Promise<StatementImportUploadResult> {
    const response = await api.get(`/statement-imports/${importId}`);
    return response.data;
  },

  async confirm(
    importId: string,
    selections: StatementImportSelection[],
  ): Promise<StatementImportConfirmResult> {
    const response = await api.post(`/statement-imports/${importId}/confirm`, {
      selections,
    });
    notifyExpensesChanged();
    return response.data;
  },

  async cancel(importId: string): Promise<void> {
    await api.delete(`/statement-imports/${importId}`);
  },
};
