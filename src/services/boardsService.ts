import api from './api';
import { MOCK_BOARDS } from '@/mocks/boards';
import { Board, BoardType } from '@/types/board';
import { ParticipantRole } from './tripsService';

interface BoardApiRecord {
  _id: string;
  name: string;
  baseCurrency: string;
  type?: BoardType;
  createdAt: string;
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
    isShared,
    createdAt: record.createdAt,
    userRole: record.userRole,
    createdBy: record.createdBy,
  };
}

function isBoardMocksEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_BOARD_MOCKS === 'true';
}

export { isBoardMocksEnabled };

export const boardsService = {
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
};
