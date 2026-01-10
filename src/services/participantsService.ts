import api from './api';
import type {
  Participant,
  Invitation,
  InvitationInfo,
  AcceptInvitationResult,
} from '@/types/participant';

export const participantsService = {
  async inviteParticipant(
    tripId: string,
    email: string,
  ): Promise<{ invitation: Invitation }> {
    const response = await api.post('/participants/invite', { tripId, email });
    return response.data;
  },

  async getInvitationInfo(token: string): Promise<InvitationInfo> {
    const response = await api.get(`/participants/invitation/${token}`);
    return response.data;
  },

  async acceptInvitation(token: string): Promise<AcceptInvitationResult> {
    const response = await api.post(`/participants/invitation/${token}/accept`);
    return response.data;
  },

  async cancelInvitation(
    invitationId: string,
  ): Promise<{ invitation: Invitation }> {
    const response = await api.delete(
      `/participants/invitation/${invitationId}`,
    );
    return response.data;
  },

  async getParticipants(
    tripId: string,
  ): Promise<{ participants: Participant[] }> {
    const response = await api.get(`/participants/trip/${tripId}`);
    return response.data;
  },

  async getPendingInvitations(
    tripId: string,
  ): Promise<{ invitations: Invitation[] }> {
    const response = await api.get(`/participants/trip/${tripId}/invitations`);
    return { invitations: response.data };
  },

  async removeParticipant(
    tripId: string,
    participantId: string,
  ): Promise<void> {
    await api.delete(
      `/participants/trip/${tripId}/participant/${participantId}`,
    );
  },

  async addGuestParticipant(
    tripId: string,
    guestName: string,
    guestEmail?: string,
  ): Promise<{ participant: Participant; message: string }> {
    const response = await api.post('/participants/guest', {
      tripId,
      guestName,
      guestEmail,
    });
    return response.data;
  },

  async inviteGuest(
    participantId: string,
    email: string,
  ): Promise<{ invitation: Invitation; message: string }> {
    const response = await api.post(
      `/participants/guest/${participantId}/invite`,
      { email },
    );
    return response.data;
  },
};
