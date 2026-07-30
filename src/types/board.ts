import { ParticipantRole } from '@/services/tripsService';

export type BoardType = 'everyday' | 'travel';

export interface Board {
  _id: string;
  name: string;
  baseCurrency: string;
  type: BoardType;
  isShared: boolean;
  createdAt: string;
  userRole?: ParticipantRole;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function boardTypeLabel(type: BoardType): string {
  return type === 'everyday' ? 'Cotidiano' : 'Viaje';
}

export function boardSharingLabel(isShared: boolean): string {
  return isShared ? 'Compartido' : 'Individual';
}
