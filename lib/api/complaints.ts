import { get, post, patch } from './client';
import type { Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority, CreateComplaintRequest } from '@/types/models';
import { MOCK_COMPLAINTS } from './mockData';

export interface ComplaintQuery {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  applicantRole?: 'intern' | 'fellow' | 'pc';
  targetRole?: 'fellow' | 'pc' | 'spm_cpm';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedComplaints {
  items: Complaint[];
  total: number;
  page: number;
  limit: number;
}

// In-memory array for client-side session mutations during dev/demo
let dynamicComplaints: Complaint[] = [...MOCK_COMPLAINTS];

export const complaintApi = {
  list: async (params?: ComplaintQuery): Promise<PaginatedComplaints> => {
    try {
      return await get<PaginatedComplaints>('/complaints', params as Record<string, unknown>);
    } catch {
      let filtered = [...dynamicComplaints];
      if (params?.status) filtered = filtered.filter(c => c.status === params.status);
      if (params?.category) filtered = filtered.filter(c => c.category === params.category);
      if (params?.priority) filtered = filtered.filter(c => c.priority === params.priority);
      if (params?.applicantRole) filtered = filtered.filter(c => c.applicantRole === params.applicantRole);
      if (params?.targetRole) filtered = filtered.filter(c => c.targetRole === params.targetRole);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.subject.toLowerCase().includes(q) ||
          c.ticketNumber.toLowerCase().includes(q) ||
          c.applicantName.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return { items: filtered, total: filtered.length, page: 1, limit: 50 };
    }
  },

  getById: async (id: string): Promise<Complaint> => {
    try {
      return await get<Complaint>(`/complaints/${id}`);
    } catch {
      const found = dynamicComplaints.find(c => c.id === id);
      if (found) return found;
      throw new Error('Complaint not found');
    }
  },

  getMyComplaints: async (userRole: 'intern' | 'fellow' | 'pc'): Promise<Complaint[]> => {
    try {
      const res = await get<PaginatedComplaints>('/complaints/my');
      return res.items;
    } catch {
      // In mock mode, filter complaints submitted by this role
      return dynamicComplaints.filter(c => c.applicantRole === userRole);
    }
  },

  getReviewComplaints: async (targetRole: 'fellow' | 'pc' | 'spm_cpm'): Promise<Complaint[]> => {
    try {
      const res = await get<PaginatedComplaints>('/complaints/review');
      return res.items;
    } catch {
      return dynamicComplaints.filter(c => c.targetRole === targetRole);
    }
  },

  create: async (
    data: CreateComplaintRequest,
    currentUser: { id: string; name: string; role: 'intern' | 'fellow' | 'pc'; location: string }
  ): Promise<Complaint> => {
    try {
      return await post<Complaint>('/complaints', data);
    } catch {
      // Determine target role by approval hierarchy:
      // Intern -> Fellow
      // Fellow -> PC
      // PC -> SPM/CPM
      const targetRole: 'fellow' | 'pc' | 'spm_cpm' =
        currentUser.role === 'intern' ? 'fellow' :
        currentUser.role === 'fellow' ? 'pc' : 'spm_cpm';

      const count = dynamicComplaints.length + 1;
      const ticketNumber = `CMP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

      const newComplaint: Complaint = {
        id: `cmp-new-${Date.now()}`,
        ticketNumber,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantRole: currentUser.role,
        assignedLocation: currentUser.location,
        category: data.category,
        priority: data.priority,
        subject: data.subject,
        description: data.description,
        incidentDate: data.incidentDate,
        documentName: data.documentName,
        documentUrl: data.documentUrl,
        voiceNoteUrl: data.voiceNoteUrl,
        voiceNoteName: data.voiceNoteName,
        voiceNoteDuration: data.voiceNoteDuration,
        videoNoteUrl: data.videoNoteUrl,
        videoNoteName: data.videoNoteName,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        targetRole,
      };

      dynamicComplaints = [newComplaint, ...dynamicComplaints];
      return newComplaint;
    }
  },

  resolve: async (
    id: string,
    comment?: string,
    reviewer?: { name: string; role: 'fellow' | 'pc' | 'spm_cpm' }
  ): Promise<Complaint> => {
    try {
      return await patch<Complaint>(`/complaints/${id}/resolve`, { comment });
    } catch {
      const foundIdx = dynamicComplaints.findIndex(c => c.id === id);
      if (foundIdx === -1) throw new Error('Complaint not found');

      const updated: Complaint = {
        ...dynamicComplaints[foundIdx],
        status: 'resolved',
        reviewedBy: reviewer?.name ?? 'Approver',
        reviewerRole: reviewer?.role,
        reviewerComment: comment ?? 'Complaint resolved and necessary action taken.',
        reviewedAt: new Date().toISOString(),
      };
      dynamicComplaints[foundIdx] = updated;
      return updated;
    }
  },

  reject: async (
    id: string,
    comment: string,
    reviewer?: { name: string; role: 'fellow' | 'pc' | 'spm_cpm' }
  ): Promise<Complaint> => {
    try {
      return await patch<Complaint>(`/complaints/${id}/reject`, { comment });
    } catch {
      const foundIdx = dynamicComplaints.findIndex(c => c.id === id);
      if (foundIdx === -1) throw new Error('Complaint not found');

      const updated: Complaint = {
        ...dynamicComplaints[foundIdx],
        status: 'rejected',
        reviewedBy: reviewer?.name ?? 'Approver',
        reviewerRole: reviewer?.role,
        reviewerComment: comment,
        reviewedAt: new Date().toISOString(),
      };
      dynamicComplaints[foundIdx] = updated;
      return updated;
    }
  },
};
