import { get, post, postFormData } from './client';
import type { Meeting } from '@/types/models';
import { MOCK_MEETINGS } from './mockData';

export interface MeetingsQuery {
  organizerId?: string;
  inviteeId?: string;
  from?: string;
  to?: string;
}

export const trainingApi = {
  listMeetings: async (params?: MeetingsQuery): Promise<Meeting[]> => {
    try {
      return await get<Meeting[]>('/training/meetings', params as Record<string, unknown>);
    } catch {
      return MOCK_MEETINGS;
    }
  },

  getMeetingById: async (id: string): Promise<Meeting> => {
    try {
      return await get<Meeting>(`/training/meetings/${id}`);
    } catch {
      const found = MOCK_MEETINGS.find(m => m.id === id);
      if (found) return found;
      throw new Error('Meeting not found');
    }
  },

  scheduleMeeting: (formData: FormData) =>
    postFormData<Meeting>('/training/meetings', formData),

  getMyMeetings: async (params?: { from?: string; to?: string }): Promise<Meeting[]> => {
    try {
      return await get<Meeting[]>('/training/meetings/my', params as Record<string, unknown>);
    } catch {
      return MOCK_MEETINGS;
    }
  },

  registerPushSubscription: (subscription: PushSubscriptionJSON) =>
    post<void>('/training/push-subscribe', subscription),
};
