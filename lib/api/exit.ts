import { get, post, patch } from './client';
import type { ExitRequest } from '@/types/models';
import { MOCK_PAGINATED_EXIT, MOCK_EXIT_REQUESTS } from './mockData';

export interface ExitQuery {
  status?: string;
  divisionId?: string;
  districtId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedExit {
  items: ExitRequest[];
  total: number;
  page: number;
  limit: number;
}

export const exitApi = {
  list: async (params?: ExitQuery): Promise<PaginatedExit> => {
    try {
      return await get<PaginatedExit>('/exit', params as Record<string, unknown>);
    } catch {
      let items = [...MOCK_EXIT_REQUESTS];
      if (params?.status) items = items.filter(e => e.status === params.status);
      return { items, total: items.length, page: 1, limit: 20 };
    }
  },

  getById: async (id: string): Promise<ExitRequest> => {
    try {
      return await get<ExitRequest>(`/exit/${id}`);
    } catch {
      const found = MOCK_EXIT_REQUESTS.find(e => e.id === id);
      if (found) return found;
      throw new Error('Exit request not found');
    }
  },

  apply: async (data: { reason: string }): Promise<ExitRequest> => {
    try {
      return await post<ExitRequest>('/exit/apply', data);
    } catch {
      return {
        id: `exit-new-${Date.now()}`,
        applicant: { id: 'u-current', name: 'You', role: 'intern' },
        reason: data.reason,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        incompleteTasks: 0,
      };
    }
  },

  approve: async (id: string, comment?: string): Promise<ExitRequest> => {
    try {
      return await patch<ExitRequest>(`/exit/${id}/approve`, { comment });
    } catch {
      const found = MOCK_EXIT_REQUESTS.find(e => e.id === id);
      return { ...(found ?? MOCK_EXIT_REQUESTS[0]), status: 'approved', approverComment: comment };
    }
  },

  reject: async (id: string, comment: string): Promise<ExitRequest> => {
    try {
      return await patch<ExitRequest>(`/exit/${id}/reject`, { comment });
    } catch {
      const found = MOCK_EXIT_REQUESTS.find(e => e.id === id);
      return { ...(found ?? MOCK_EXIT_REQUESTS[0]), status: 'rejected', approverComment: comment };
    }
  },

  forceApprove: async (id: string, comment?: string): Promise<ExitRequest> => {
    try {
      return await patch<ExitRequest>(`/exit/${id}/force-approve`, { comment });
    } catch {
      const found = MOCK_EXIT_REQUESTS.find(e => e.id === id);
      return { ...(found ?? MOCK_EXIT_REQUESTS[0]), status: 'force_approved', approverComment: comment };
    }
  },

  downloadCertificate: (id: string) =>
    get<Blob>(`/exit/${id}/certificate`),
};
