export enum ParticipantRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface Participant {
  _id: string;
  tripId: string;
  userId?:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
  guestName?: string;
  guestEmail?: string;
  invitationId?:
    | string
    | {
        _id: string;
        status: InvitationStatus;
        email: string;
      };
  role: ParticipantRole;
  createdAt: string;
  updatedAt: string;
}

export type GuestParticipant = Participant & {
  userId: undefined;
  guestName: string;
};

export type RegisteredParticipant = Participant & {
  userId:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
};

export interface Invitation {
  _id: string;
  tripId: string;
  email: string;
  invitedBy: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationInfo {
  invitation: Invitation;
  trip: {
    _id: string;
    name: string;
    description?: string;
  };
  inviter: {
    firstName: string;
    lastName: string;
  };
  userExists: boolean;
  userEmail: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  message: string;
  requiresRegistration?: boolean;
  email?: string;
  participant?: Participant;
}
