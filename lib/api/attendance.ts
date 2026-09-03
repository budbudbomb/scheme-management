import { get, post, patch } from './client';
import type { AttendanceRecord, AttendanceReportRow } from '@/types/models';
import { MOCK_ATTENDANCE_RECORDS, MOCK_PAGINATED_ATTENDANCE } from './mockData';

export interface AttendanceQuery {
  userId?: string;
  divisionId?: string;
  districtId?: string;
  blockId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAttendance {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

export const attendanceApi = {
  list: async (params?: AttendanceQuery): Promise<PaginatedAttendance> => {
    try {
      return await get<PaginatedAttendance>('/attendance', params as Record<string, unknown>);
    } catch {
      return MOCK_PAGINATED_ATTENDANCE;
    }
  },

  markAttendance: async (data: { latitude: number; longitude: number; date: string }): Promise<AttendanceRecord> => {
    try {
      return await post<AttendanceRecord>('/attendance/mark', data);
    } catch {
      return {
        id: `att-new-${Date.now()}`,
        userId: 'u-current',
        userName: 'You',
        date: data.date,
        markedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'present' as const,
      };
    }
  },

  exportReport: (params: {
    divisionId?: string; districtId?: string; blockId?: string;
    month: number; year: number; format: 'csv' | 'pdf';
  }) => get<Blob>('/attendance/export', params as Record<string, unknown>),

  getMyAttendance: async (params?: { month?: number; year?: number }): Promise<AttendanceRecord[]> => {
    try {
      return await get<AttendanceRecord[]>('/attendance/my', params as Record<string, unknown>);
    } catch {
      return MOCK_ATTENDANCE_RECORDS;
    }
  },
};
