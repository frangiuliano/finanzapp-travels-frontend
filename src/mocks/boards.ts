import { Board } from '@/types/board';
import { ParticipantRole } from '@/services/tripsService';

/** Local mocks for shell validation without API (`VITE_BOARD_MOCKS=true`). */
export const MOCK_BOARDS: Board[] = [
  {
    _id: 'mock-everyday-solo',
    name: 'Casa',
    baseCurrency: 'ARS',
    type: 'everyday',
    isShared: false,
    createdAt: new Date().toISOString(),
    userRole: ParticipantRole.OWNER,
  },
  {
    _id: 'mock-everyday-shared',
    name: 'Pareja',
    baseCurrency: 'ARS',
    type: 'everyday',
    isShared: true,
    createdAt: new Date().toISOString(),
    userRole: ParticipantRole.OWNER,
  },
  {
    _id: 'mock-travel-shared',
    name: 'Bariloche 2026',
    baseCurrency: 'ARS',
    type: 'travel',
    isShared: true,
    createdAt: new Date().toISOString(),
    userRole: ParticipantRole.MEMBER,
  },
];
