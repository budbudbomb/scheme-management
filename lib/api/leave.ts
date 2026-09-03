import { get, post, patch } from './client';
import type { LeaveApplication, LeaveBalance, LeaveType } from '@/types/models';
import { MOCK_PAGINATED_LEAVE, MOCK_LEAVE_BALANCE, MOCK_LEAVE_APPLICATIONS } from './mockData';

export interface LeaveQuery {
  status?: 'applied' | 'approved' | 'rejected';
  userId?: string;
  divisionId?: string;
  districtId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLeave {
  items: LeaveApplication[];
  total: number;
  page: number;
  limit: number;
}

export const leaveApi = {
  list: async (params?: LeaveQuery): Promise<PaginatedLeave> => {
    try {
      return await get<PaginatedLeave>('/leave', params as Record<string, unknown>);
    } catch {
      let items = [...MOCK_LEAVE_APPLICATIONS];
      if (params?.status) items = items.filter(l => l.status === params.status);
      return { items, total: items.length, page: 1, limit: 20 };
    }
  },

  getById: async (id: string): Promise<LeaveApplication> => {
    try {
      return await get<LeaveApplication>(`/leave/${id}`);
    } catch {
      const found = MOCK_LEAVE_APPLICATIONS.find(l => l.id === id);
      if (found) return found;
      throw new Error('Leave application not found');
    }
  },

  apply: async (data: { leaveType: LeaveType; startDate: string; endDate: string; reason: string }): Promise<LeaveApplication> => {
    try {
      return await post<LeaveApplication>('/leave/apply', data);
    } catch {
      return {
        id: `leave-new-${Date.now()}`,
        applicant: { id: 'u-current', name: 'You', role: 'intern' },
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'applied',
        appliedAt: new Date().toISOString(),
      };
    }
  },

  approve: async (id: string, comment?: string): Promise<LeaveApplication> => {
    try {
      return await patch<LeaveApplication>(`/leave/${id}/approve`, { comment });
    } catch {
      const found = MOCK_LEAVE_APPLICATIONS.find(l => l.id === id);
      return { ...(found ?? MOCK_LEAVE_APPLICATIONS[0]), status: 'approved', approverComment: comment };
    }
  },

  reject: async (id: string, comment: string): Promise<LeaveApplication> => {
    try {
      return await patch<LeaveApplication>(`/leave/${id}/reject`, { comment });
    } catch {
      const found = MOCK_LEAVE_APPLICATIONS.find(l => l.id === id);
      return { ...(found ?? MOCK_LEAVE_APPLICATIONS[0]), status: 'rejected', approverComment: comment };
    }
  },

  getMyBalance: async (): Promise<LeaveBalance> => {
    try {
      return await get<LeaveBalance>('/leave/my-balance');
    } catch {
      return MOCK_LEAVE_BALANCE;
    }
  },

  getMyApplications: async (params?: { status?: string }): Promise<PaginatedLeave> => {
    try {
      return await get<PaginatedLeave>('/leave/my', params as Record<string, unknown>);
    } catch {
      return MOCK_PAGINATED_LEAVE;
    }
  },
};
