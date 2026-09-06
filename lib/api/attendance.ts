import { get, post, patch } from './client';
import type { AttendanceRecord, AttendanceReportRow } from '@/types/models';
import { MOCK_ATTENDANCE_RECORDS, MOCK_TEAM_ATTENDANCE, MOCK_PAGINATED_ATTENDANCE } from './mockData';

export interface AttendanceQuery {
  userId?: string;
  role?: 'fellow' | 'intern' | 'pc';
  divisionId?: string;
  districtId?: string;
  blockId?: string;
  status?: AttendanceRecord['status'];
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAttendance {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

function applyAttendanceFilters(params?: AttendanceQuery): PaginatedAttendance {
  let items = [...MOCK_TEAM_ATTENDANCE];

  if (params?.role) {
    items = items.filter(r => r.role === params.role);
  }
  if (params?.districtId && params.districtId !== 'all') {
    items = items.filter(r => r.district?.id === params.districtId);
  }
  if (params?.blockId && params.blockId !== 'all') {
    items = items.filter(r => r.block?.id === params.blockId);
  }
  if (params?.status && params.status !== 'all' as any) {
    items = items.filter(r => r.status === params.status);
  }
  if (params?.date) {
    items = items.filter(r => r.date === params.date);
  }
  if (params?.dateFrom) {
    items = items.filter(r => r.date >= params.dateFrom!);
  }
  if (params?.dateTo) {
    items = items.filter(r => r.date <= params.dateTo!);
  }
  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    items = items.filter(r =>
      r.userName.toLowerCase().includes(q) ||
      (r.district?.name && r.district.name.toLowerCase().includes(q)) ||
      (r.block?.name && r.block.name.toLowerCase().includes(q)) ||
      (r.panchayatName && r.panchayatName.toLowerCase().includes(q))
    );
  }

  const page = params?.page || 1;
  const limit = params?.limit || 100;
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
}

export const attendanceApi = {
  list: async (params?: AttendanceQuery): Promise<PaginatedAttendance> => {
    try {
      return await get<PaginatedAttendance>('/attendance', params as Record<string, unknown>);
    } catch {
      return applyAttendanceFilters(params);
    }
  },

  markAttendance: async (data: { latitude: number; longitude: number; date: string }): Promise<AttendanceRecord> => {
    try {
      return await post<AttendanceRecord>('/attendance/mark', data);
    } catch {
      const newRec: AttendanceRecord = {
        id: `att-new-${Date.now()}`,
        userId: 'u-pc-01',
        userName: 'You',
        role: 'pc',
        date: data.date,
        markedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'present' as const,
        locationAddress: 'Current GPS Location (Recorded)',
      };
      MOCK_ATTENDANCE_RECORDS.unshift(newRec);
      return newRec;
    }
  },

  exportReport: async (params: {
    divisionId?: string; districtId?: string; blockId?: string;
    month: number; year: number; format: 'csv' | 'pdf';
    role?: 'fellow' | 'intern';
  }): Promise<Blob> => {
    try {
      return await get<Blob>('/attendance/export', params as Record<string, unknown>);
    } catch {
      // Generate CSV content
      const filtered = applyAttendanceFilters({
        role: params.role,
        districtId: params.districtId,
        blockId: params.blockId,
      }).items;

      const header = 'Name,Role,District,Block,Gram Panchayat,Date,Marked At,Status,Location\n';
      const rows = filtered.map(r =>
        `"${r.userName}","${r.role || 'intern'}","${r.district?.name || '—'}","${r.block?.name || '—'}","${r.panchayatName || '—'}","${r.date}","${r.markedAt}","${r.status}","${r.locationAddress || '—'}"`
      ).join('\n');

      return new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    }
  },

  getMyAttendance: async (params?: { month?: number; year?: number }): Promise<AttendanceRecord[]> => {
    try {
      return await get<AttendanceRecord[]>('/attendance/my', params as Record<string, unknown>);
    } catch {
      return MOCK_ATTENDANCE_RECORDS;
    }
  },
};
