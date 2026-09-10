import { get, post, patch } from './client';
import type { ExitRequest, AssigneeRef, UserRole, ExitPerformanceAudit } from '@/types/models';
import { MOCK_EXIT_REQUESTS } from './mockData';

export interface ExitQuery {
  status?: string;
  applicantRole?: UserRole;
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

export interface ApplicantAuditDetail {
  tasks: Array<{
    id: string;
    name: string;
    status: 'completed' | 'pending' | 'in_progress' | 'overdue';
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    completedAt?: string;
  }>;
  surveys: Array<{
    id: string;
    title: string;
    date: string;
    stakeholdersReached: number;
    status: 'submitted' | 'verified';
  }>;
}

// In-memory working copy for local demo reactivity
let workingExitRequests = [...MOCK_EXIT_REQUESTS];

export const exitApi = {
  list: async (params?: ExitQuery): Promise<PaginatedExit> => {
    try {
      return await get<PaginatedExit>('/exit', params as Record<string, unknown>);
    } catch {
      let items = [...workingExitRequests];
      if (params?.status) {
        items = items.filter(e => e.status === params.status);
      }
      if (params?.applicantRole) {
        items = items.filter(e => e.applicantRole === params.applicantRole || e.applicant.role === params.applicantRole);
      }
      return { items, total: items.length, page: 1, limit: 20 };
    }
  },

  getById: async (id: string): Promise<ExitRequest> => {
    try {
      return await get<ExitRequest>(`/exit/${id}`);
    } catch {
      const found = workingExitRequests.find(e => e.id === id);
      if (found) return found;
      throw new Error('Exit request not found');
    }
  },

  apply: async (data: {
    reason: string;
    applicant?: AssigneeRef;
    incompleteTasks?: number;
    performanceAudit?: ExitPerformanceAudit;
  }): Promise<ExitRequest> => {
    try {
      return await post<ExitRequest>('/exit/apply', data);
    } catch {
      const applicant = data.applicant ?? { id: 'u-curr-01', name: 'Current User', role: 'intern' as UserRole };
      // Fellow applications route to PC first; Intern and PC route directly to PM
      const initialStatus = applicant.role === 'fellow' ? 'pending_pc_review' : 'pending_pm_review';
      const incomplete = data.incompleteTasks ?? 0;
      
      const newRequest: ExitRequest = {
        id: `exit-${Date.now()}`,
        applicant,
        applicantRole: applicant.role,
        reason: data.reason,
        status: initialStatus,
        appliedAt: new Date().toISOString(),
        incompleteTasks: incomplete,
        performanceAudit: data.performanceAudit ?? {
          tasksTotal: 15,
          tasksCompleted: 15 - incomplete,
          tasksPending: incomplete,
          surveysConducted: 30,
        },
      };

      workingExitRequests = [newRequest, ...workingExitRequests];
      return newRequest;
    }
  },

  /** Step 1 for Fellows: PC Reviews deliverables, marks certificate eligibility, and forwards to PM */
  pcReview: async (
    id: string,
    data: {
      action: 'forward' | 'reject';
      eligibleForCertificate: boolean;
      comment?: string;
      pcUser?: AssigneeRef;
    }
  ): Promise<ExitRequest> => {
    try {
      return await patch<ExitRequest>(`/exit/${id}/pc-review`, data);
    } catch {
      const idx = workingExitRequests.findIndex(e => e.id === id);
      const target = workingExitRequests[idx] ?? workingExitRequests[0];
      const reviewer = data.pcUser ?? { id: 'usr-pc-01', name: 'Anjali Verma', role: 'pc' as UserRole };

      const updated: ExitRequest = {
        ...target,
        status: data.action === 'forward' ? 'pending_pm_review' : 'rejected',
        reviewedByPc: reviewer,
        pcComment: data.comment || (data.action === 'forward' ? 'Forwarded to Program Manager for final exit approval.' : 'Rejected at PC review stage.'),
        pcReviewedAt: new Date().toISOString(),
        certificateEligible: data.eligibleForCertificate,
        certificateEligibilityMarkedBy: reviewer,
        certificateEligibilityNote: data.eligibleForCertificate
          ? 'Marked eligible based on verified field tasks and survey submissions.'
          : 'Marked ineligible due to incomplete or substandard deliverables.',
      };

      if (idx >= 0) workingExitRequests[idx] = updated;
      return updated;
    }
  },

  /** Final Decision by Program Manager (HR) */
  pmReview: async (
    id: string,
    data: {
      action: 'approve' | 'reject' | 'force_approve';
      issueCertificate: boolean;
      comment?: string;
      pmUser?: AssigneeRef;
    }
  ): Promise<ExitRequest> => {
    try {
      return await patch<ExitRequest>(`/exit/${id}/pm-review`, data);
    } catch {
      const idx = workingExitRequests.findIndex(e => e.id === id);
      const target = workingExitRequests[idx] ?? workingExitRequests[0];
      const reviewer = data.pmUser ?? { id: 'pm-hr-01', name: 'Sunil Sharma', role: 'pm' as UserRole };

      const newStatus = data.action === 'approve'
        ? 'approved'
        : data.action === 'force_approve'
        ? 'force_approved'
        : 'rejected';

      const updated: ExitRequest = {
        ...target,
        status: newStatus,
        approvedBy: reviewer,
        approverComment: data.comment || (newStatus === 'rejected' ? 'Exit rejected by Program Manager.' : 'Exit approved by Program Manager.'),
        approvedAt: new Date().toISOString(),
        certificateIssued: data.issueCertificate && newStatus !== 'rejected',
        certificateIssuedAt: data.issueCertificate && newStatus !== 'rejected' ? new Date().toISOString() : undefined,
        certificateUrl: data.issueCertificate && newStatus !== 'rejected' ? `/certificates/cert-${id}.pdf` : undefined,
      };

      if (idx >= 0) workingExitRequests[idx] = updated;
      return updated;
    }
  },

  approve: async (id: string, comment?: string): Promise<ExitRequest> => {
    return exitApi.pmReview(id, { action: 'approve', issueCertificate: true, comment });
  },

  reject: async (id: string, comment: string): Promise<ExitRequest> => {
    return exitApi.pmReview(id, { action: 'reject', issueCertificate: false, comment });
  },

  forceApprove: async (id: string, comment?: string): Promise<ExitRequest> => {
    return exitApi.pmReview(id, { action: 'force_approve', issueCertificate: false, comment });
  },

  /** Fetch granular task & survey details for audit modal */
  getApplicantAudit: async (applicantId: string): Promise<ApplicantAuditDetail> => {
    // Generate contextual mock tasks & surveys based on applicant id
    return {
      tasks: [
        {
          id: 't-01',
          name: 'Village Infrastructure Need Assessment Survey',
          status: 'completed',
          priority: 'high',
          dueDate: '2026-08-20',
          completedAt: '2026-08-18',
        },
        {
          id: 't-02',
          name: 'Panchayat Grievance Redressal Camp Documentation',
          status: 'completed',
          priority: 'medium',
          dueDate: '2026-08-25',
          completedAt: '2026-08-24',
        },
        {
          id: 't-03',
          name: 'CM Welfare Scheme Beneficiary Verification',
          status: 'completed',
          priority: 'high',
          dueDate: '2026-08-30',
          completedAt: '2026-08-29',
        },
        {
          id: 't-04',
          name: 'Monthly Progress Report Submission (Q3)',
          status: 'completed',
          priority: 'low',
          dueDate: '2026-09-02',
          completedAt: '2026-09-01',
        },
        {
          id: 't-05',
          name: 'Gram Sabha Digital Portal Training & Handover',
          status: applicantId === 'u-intern-02' || applicantId === 'usr-fellow-01' ? 'pending' : 'completed',
          priority: 'medium',
          dueDate: '2026-09-10',
        },
      ],
      surveys: [
        {
          id: 's-01',
          title: 'Household Livelihood & Skill Assessment',
          date: '2026-08-12',
          stakeholdersReached: 18,
          status: 'verified',
        },
        {
          id: 's-02',
          title: 'Rural Drinking Water & Sanitation Survey',
          date: '2026-08-22',
          stakeholdersReached: 14,
          status: 'verified',
        },
        {
          id: 's-03',
          title: 'Youth Employment & ITI Aspirations Poll',
          date: '2026-08-28',
          stakeholdersReached: 20,
          status: 'submitted',
        },
      ],
    };
  },

  downloadCertificate: async (id: string): Promise<Blob> => {
    try {
      return await get<Blob>(`/exit/${id}/certificate`);
    } catch {
      // Return a clean text/html or mock certificate Blob in demo mode
      const dummyCert = `
        %PDF-1.4
        % CMYP CERTIFICATE OF COMPLETION
        % Issued by Program Manager (HR) - Atal Bihari Vajpayee Institute of Good Governance
        % ID: ${id}
      `;
      return new Blob([dummyCert], { type: 'application/pdf' });
    }
  },
};
