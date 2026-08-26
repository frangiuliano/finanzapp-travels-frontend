import api from './api';
import { MOCK_BOARDS } from '@/mocks/boards';
import { Board, BoardType } from '@/types/board';
import { ParticipantRole } from './tripsService';

interface BoardApiRecord {
  _id: string;
  name: string;
  baseCurrency: string;
  type?: BoardType;
  parentBoardId?: string;
  linkedEverydayBoardId?: string;
  createdAt: string;
  archivedAt?: string;
  userRole?: ParticipantRole;
  createdBy?: Board['createdBy'];
  isShared?: boolean;
  participantCount?: number;
}

function mapBoard(record: BoardApiRecord): Board {
  const isShared =
    record.isShared ??
    (typeof record.participantCount === 'number'
      ? record.participantCount > 1
      : false);

  return {
    _id: record._id,
    name: record.name,
    baseCurrency: record.baseCurrency,
    type: record.type ?? 'travel',
    parentBoardId: record.parentBoardId,
    linkedEverydayBoardId: record.linkedEverydayBoardId,
    isShared,
    createdAt: record.createdAt,
    archivedAt: record.archivedAt,
    userRole: record.userRole,
    createdBy: record.createdBy,
  };
}

function isBoardMocksEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_BOARD_MOCKS === 'true';
}

export { isBoardMocksEnabled };

export interface CreateBoardInput {
  name: string;
  baseCurrency?: string;
  type?: BoardType;
  parentBoardId?: string;
  categoryNames: string[];
}

export const boardsService = {
  async createBoard(
    data: CreateBoardInput,
  ): Promise<{ message: string; board: Board }> {
    if (isBoardMocksEnabled()) {
      const board: Board = {
        _id: `mock-${Date.now()}`,
        name: data.name,
        baseCurrency: data.baseCurrency ?? 'USD',
        type: data.type ?? 'everyday',
        parentBoardId: data.parentBoardId,
        isShared: false,
        createdAt: new Date().toISOString(),
        userRole: ParticipantRole.OWNER,
      };
      return { message: 'Tablero creado (mock)', board };
    }

    const response = await api.post<{
      message?: string;
      board?: BoardApiRecord;
      trip?: BoardApiRecord;
    }>('/boards', data);
    const record = response.data.board ?? response.data.trip;
    if (!record) {
      throw new Error('Respuesta inválida al crear tablero');
    }
    return {
      message: response.data.message ?? 'Tablero creado exitosamente',
      board: mapBoard(record),
    };
  },

  async getAllBoards(): Promise<{ boards: Board[] }> {
    if (isBoardMocksEnabled()) {
      return { boards: MOCK_BOARDS };
    }

    const response = await api.get<{
      boards?: BoardApiRecord[];
      trips?: BoardApiRecord[];
    }>('/boards');
    const records = response.data.boards ?? response.data.trips ?? [];
    return { boards: records.map(mapBoard) };
  },

  async getArchivedBoards(): Promise<{ boards: Board[] }> {
    if (isBoardMocksEnabled()) return { boards: [] };
    const response = await api.get<{
      boards?: BoardApiRecord[];
      trips?: BoardApiRecord[];
    }>('/boards/archived');
    return {
      boards: (response.data.boards ?? response.data.trips ?? []).map(mapBoard),
    };
  },

  async archiveBoard(id: string): Promise<{ board: Board }> {
    const response = await api.patch<{ board: BoardApiRecord }>(
      `/boards/${id}/archive`,
    );
    return { board: mapBoard(response.data.board) };
  },

  async unarchiveBoard(id: string): Promise<{ board: Board }> {
    const response = await api.patch<{ board: BoardApiRecord }>(
      `/boards/${id}/unarchive`,
    );
    return { board: mapBoard(response.data.board) };
  },

  async updateExpenseLink(
    travelBoardId: string,
    everydayBoardId: string | null,
  ): Promise<{ message: string; board: Board }> {
    const response = await api.patch<{
      message: string;
      board: BoardApiRecord;
    }>(`/boards/${travelBoardId}/expense-link`, { everydayBoardId });
    return {
      message: response.data.message,
      board: mapBoard(response.data.board),
    };
  },

  async getBoardById(id: string): Promise<{ board: Board }> {
    if (isBoardMocksEnabled()) {
      const board = MOCK_BOARDS.find((item) => item._id === id);
      if (!board) {
        throw new Error('Tablero mock no encontrado');
      }
      return { board };
    }

    const response = await api.get<{
      board?: BoardApiRecord;
      trip?: BoardApiRecord;
    }>(`/boards/${id}`);
    const record = response.data.board ?? response.data.trip;
    if (!record) {
      throw new Error('Tablero no encontrado');
    }
    return { board: mapBoard(record) };
  },

  async deleteBoard(id: string): Promise<void> {
    if (isBoardMocksEnabled()) {
      return;
    }

    await api.delete(`/boards/${id}`);
  },
};
