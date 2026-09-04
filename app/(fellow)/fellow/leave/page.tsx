"use client";
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  ClipboardText,
  X,
  Check,
  UploadSimple,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  FileText,
  Users,
  CalendarCheck,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils/formatters';

// ─── Types ────────────────────────────────────────────────────
type LeaveTypeOption = 'casual' | 'unplanned' | 'earned';

interface FellowLeaveApp {
  id: string;
  leaveType: LeaveTypeOption;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentName?: string;
  documentUrl?: string;
  status: 'applied' | 'approved' | 'rejected';
  appliedAt: string;
  approverComment?: string;
}

interface InternLeaveApp {
  id: string;
  internId: string;
  internName: string;
  internBlock: string;
  leaveType: 'casual' | 'unplanned';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'applied' | 'approved' | 'rejected';
  appliedAt: string;
  approverComment?: string;
  documentName?: string;
}

// ─── Initial Mock Data ────────────────────────────────────────
const INITIAL_FELLOW_LEAVES: FellowLeaveApp[] = [
  {
    id: 'fl-1',
    leaveType: 'casual',
    startDate: '2026-09-10',
    endDate: '2026-09-11',
    totalDays: 2,
    reason: 'Family function in hometown.',
    status: 'applied',
    appliedAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'fl-2',
    leaveType: 'casual',
    startDate: '2026-08-20',
    endDate: '2026-08-22',
    totalDays: 3,
    reason: 'Viral fever and doctor prescribed rest.',
    documentName: 'Medical_Prescription.pdf',
    documentUrl: '#',
    status: 'approved',
    appliedAt: '2026-08-19T09:30:00Z',
    approverComment: 'Approved. Get well soon.',
  },
  {
    id: 'fl-3',
    leaveType: 'casual',
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    totalDays: 1,
    reason: 'Personal administrative work.',
    status: 'rejected',
    appliedAt: '2026-07-14T11:00:00Z',
    approverComment: 'Critical survey review meeting scheduled on this day.',
  },
];

const INITIAL_INTERN_LEAVES: InternLeaveApp[] = [
  {
    id: 'il-1',
    internId: 'int-1',
    internName: 'Divya Sharma',
    internBlock: 'Indore Block A',
    leaveType: 'casual',
    startDate: '2026-09-04',
    endDate: '2026-09-05',
    totalDays: 2,
    reason: 'Need to attend urgent university certificate verification in college.',
    status: 'applied',
    appliedAt: '2026-09-02T14:30:00Z',
  },
  {
    id: 'il-2',
    internId: 'int-2',
    internName: 'Karan Malhotra',
    internBlock: 'Sanwer Block',
    leaveType: 'casual',
    startDate: '2026-09-03',
    endDate: '2026-09-04',
    totalDays: 2,
    reason: 'Severe food poisoning and doctor advice for bed rest.',
    documentName: 'Doctor_Certificate.pdf',
    status: 'applied',
    appliedAt: '2026-09-03T08:15:00Z',
  },
  {
    id: 'il-3',
    internId: 'int-3',
    internName: 'Rohit Yadav',
    internBlock: 'Depalpur Block',
    leaveType: 'casual',
    startDate: '2026-09-03',
    endDate: '2026-09-03',
    totalDays: 1,
    reason: 'Brother marriage ceremony preparations.',
    status: 'approved',
    appliedAt: '2026-08-30T16:00:00Z',
    approverComment: 'Approved. Ensure tasks are handed over.',
  },
  {
    id: 'il-4',
    internId: 'int-4',
    internName: 'Priya Patel',
    internBlock: 'Mhow Block',
    leaveType: 'unplanned',
    startDate: '2026-09-08',
    endDate: '2026-09-08',
    totalDays: 1,
    reason: 'Family emergency at village.',
    status: 'applied',
    appliedAt: '2026-09-02T18:45:00Z',
  },
  {
    id: 'il-5',
    internId: 'int-5',
    internName: 'Sanjay Bose',
    internBlock: 'Indore Block B',
    leaveType: 'casual',
    startDate: '2026-08-25',
    endDate: '2026-08-26',
    totalDays: 2,
    reason: 'Personal work in native district.',
    status: 'approved',
    appliedAt: '2026-08-22T10:00:00Z',
    approverComment: 'Approved.',
  },
  {
    id: 'il-6',
    internId: 'int-6',
    internName: 'Riya Gupta',
    internBlock: 'Sanwer Block',
    leaveType: 'casual',
    startDate: '2026-08-18',
    endDate: '2026-08-19',
    totalDays: 2,
    reason: 'Fever and cold.',
    status: 'rejected',
    appliedAt: '2026-08-17T12:00:00Z',
    approverComment: 'Survey submission deadline week; leave not approved.',
  },
];

function calcDays(start: string, end: string): number {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

function leaveTypeBadge(type: string) {
  switch (type) {
    case 'casual':
    case 'medical':
      return { label: 'Casual Leave (CL)', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'unplanned':
      return { label: 'Unplanned Leave', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'earned':
      return { label: 'Earned Leave (EL)', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
    default:
      return { label: type, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

function statusBadge(status: 'applied' | 'approved' | 'rejected') {
  switch (status) {
    case 'approved':
      return { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
    case 'rejected':
      return { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle };
    case 'applied':
    default:
      return { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
  }
}

export default function FellowLeavePage() {
  const [activeTab, setActiveTab] = useState<'apply' | 'review'>('apply');

  // ── Tab 1: Fellow's own leaves state ──
  const [fellowLeaves, setFellowLeaves] = useState<FellowLeaveApp[]>(INITIAL_FELLOW_LEAVES);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formType, setFormType] = useState<LeaveTypeOption>('casual');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);

  // Document preview modal
  const [viewDocName, setViewDocName] = useState<string | null>(null);

  // Reason preview modal
  const [viewReasonModal, setViewReasonModal] = useState<{
    applicant: string;
    role: string;
    leaveType: string;
    duration: string;
    reason: string;
    documentName?: string;
  } | null>(null);

  // ── Tab 2: Intern leave review state ──
  const [internLeaves, setInternLeaves] = useState<InternLeaveApp[]>(INITIAL_INTERN_LEAVES);
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal
  const [rejectModalAppId, setRejectModalAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Mount tracking for React Portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when ANY modal is open so it NEVER shakes, jitters, or shifts
  const isAnyModalOpen = Boolean(showApplyModal || rejectModalAppId || viewDocName || viewReasonModal);

  useEffect(() => {
    if (isAnyModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
      };
    }
  }, [isAnyModalOpen]);

  // ── Tab 1 Handlers ──
  function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formStartDate || !formEndDate) {
      toast.error('Please select both Start Date and End Date');
      return;
    }
    if (formStartDate > formEndDate) {
      toast.error('End Date cannot be before Start Date');
      return;
    }
    if (!formReason.trim()) {
      toast.error('Please provide a reason for leave');
      return;
    }

    const totalDays = calcDays(formStartDate, formEndDate);
    const newApp: FellowLeaveApp = {
      id: `fl-${Date.now()}`,
      leaveType: formType,
      startDate: formStartDate,
      endDate: formEndDate,
      totalDays,
      reason: formReason.trim(),
      documentName: formFile ? formFile.name : undefined,
      documentUrl: formFile ? URL.createObjectURL(formFile) : undefined,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    };

    setFellowLeaves(prev => [newApp, ...prev]);
    toast.success('Leave application submitted successfully!');
    setShowApplyModal(false);
    setFormStartDate('');
    setFormEndDate('');
    setFormReason('');
    setFormFile(null);
  }

  // ── Tab 2 Handlers (Approve / Reject) ──
  function handleApproveIntern(id: string) {
    setInternLeaves(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'approved' } : app))
    );
    toast.success('Intern leave request approved successfully');
  }

  function openRejectModal(id: string) {
    setRejectModalAppId(id);
    setRejectionReason('');
  }

  function handleConfirmReject() {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    if (rejectModalAppId) {
      setInternLeaves(prev =>
        prev.map(app =>
          app.id === rejectModalAppId
            ? { ...app, status: 'rejected', approverComment: rejectionReason.trim() }
            : app
        )
      );
      toast.success('Intern leave request declined');
    }
    setRejectModalAppId(null);
    setRejectionReason('');
  }

  // ── Filtered Intern Requests ──
  const filteredInternLeaves = useMemo(() => {
    return internLeaves.filter(app => {
      const matchSearch =
        searchQuery === '' ||
        app.internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [internLeaves, searchQuery]);

  // ── Summary Metrics for Interns ──
  const internMetrics = useMemo(() => {
    const activeCount = 6;
    const pendingCount = internLeaves.filter(i => i.status === 'applied').length;
    const todayStr = '2026-09-03';
    const onLeaveToday = internLeaves.filter(
      i => i.status === 'approved' && i.startDate <= todayStr && i.endDate >= todayStr
    );
    return {
      activeCount,
      pendingCount,
      onLeaveTodayCount: onLeaveToday.length,
      onLeaveTodayNames: onLeaveToday.map(i => i.internName),
    };
  }, [internLeaves]);

  return (
    <div className="space-y-6">
      {/* ── Page Title & Main Action ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Apply for your leaves and review leave applications submitted by your interns
          </p>
        </div>
        {activeTab === 'apply' && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={16} weight="bold" />
            Apply for Leave
          </button>
        )}
      </div>

      {/* ── Enhanced Segmented Tab Control (As requested with live red notification dot) ── */}
      <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Tab 1: Apply for Leave (Fellow Self) */}
        <button
          onClick={() => setActiveTab('apply')}
          className={cn(
            'flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none',
            activeTab === 'apply'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          )}
        >
          <CalendarCheck
            size={18}
            weight={activeTab === 'apply' ? 'fill' : 'bold'}
            className={activeTab === 'apply' ? 'text-indigo-600' : 'text-slate-500'}
          />
          <span>Apply for Leave</span>
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
              activeTab === 'apply'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                : 'bg-slate-200/70 text-slate-500'
            )}
          >
            Fellow
          </span>
        </button>

        {/* Tab 2: Review Leave Application (Interns Review) */}
        <button
          onClick={() => setActiveTab('review')}
          className={cn(
            'flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative select-none',
            activeTab === 'review'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          )}
        >
          <Users
            size={18}
            weight={activeTab === 'review' ? 'fill' : 'bold'}
            className={activeTab === 'review' ? 'text-indigo-600' : 'text-slate-500'}
          />
          <span>Review Leave Application</span>
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
              activeTab === 'review'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                : 'bg-slate-200/70 text-slate-500'
            )}
          >
            Interns
          </span>
          {internMetrics.pendingCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-black bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              {internMetrics.pendingCount}
            </span>
          )}
          {/* Pulsing red notification dot (as drawn in user image) */}
          {internMetrics.pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border-2 border-white"></span>
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: FELLOW APPLY FOR LEAVE
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'apply' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardText size={16} weight="fill" className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">My Leave Applications</span>
              </div>
              <span className="text-xs text-slate-500">{fellowLeaves.length} record(s)</span>
            </div>

            {fellowLeaves.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                No leave applications yet. Click &quot;Apply for Leave&quot; above to submit one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {fellowLeaves.map(app => {
                  const tBadge = leaveTypeBadge(app.leaveType);
                  const sBadge = statusBadge(app.status);
                  const StatusIcon = sBadge.icon;

                  return (
                    <div key={app.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('badge border text-xs font-semibold', tBadge.cls)}>
                              {tBadge.label}
                            </span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {app.totalDays} {app.totalDays === 1 ? 'Day' : 'Days'}
                            </span>
                            <span className={cn('badge border text-xs flex items-center gap-1', sBadge.cls)}>
                              <StatusIcon size={12} weight="fill" />
                              {sBadge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={14} className="text-slate-400 shrink-0" />
                            <span>
                              {formatDate(app.startDate)} &mdash; {formatDate(app.endDate)}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span>Applied on {formatDate(app.appliedAt)}</span>
                          </div>

                          {/* Action Buttons: Reason for Leave always; Upload Document ONLY if attached */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-2">
                            {/* 1. Reason for Leave Heading & View Button */}
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
                              <span className="text-xs font-semibold text-slate-700">
                                Reason for Leave
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setViewReasonModal({
                                    applicant: 'You (Fellow)',
                                    role: 'CM Fellow',
                                    leaveType: tBadge.label,
                                    duration: `${formatDate(app.startDate)} — ${formatDate(app.endDate)} (${app.totalDays} ${app.totalDays === 1 ? 'Day' : 'Days'})`,
                                    reason: app.reason,
                                    documentName: app.documentName,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded transition shadow-2xs"
                              >
                                <Eye size={13} weight="bold" />
                                View
                              </button>
                            </div>

                            {/* 2. Upload Document - ONLY SHOW IF DOCUMENT WAS ACTUALLY UPLOADED */}
                            {app.documentName && (
                              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                                  <FileText size={15} className="text-indigo-600 shrink-0" />
                                  <span className="truncate">{app.documentName}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setViewDocName(app.documentName || 'Document')}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded transition shadow-2xs"
                                >
                                  <Eye size={13} weight="bold" />
                                  View
                                </button>
                              </div>
                            )}
                          </div>

                          {app.approverComment && (
                            <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded px-3 py-2 mt-2">
                              <strong>Approver Comment:</strong> {app.approverComment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: REVIEW LEAVE APPLICATION
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'review' && (
        <div className="space-y-5">
          {/* Summary View */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Users size={20} weight="fill" className="text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{internMetrics.activeCount}</div>
                <div className="text-xs text-slate-500 font-medium">Active Interns Count</div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CalendarCheck size={20} weight="fill" className="text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{internMetrics.onLeaveTodayCount}</div>
                <div className="text-xs text-slate-500 font-medium">
                  On Leave Today
                  {internMetrics.onLeaveTodayNames.length > 0 && (
                    <span className="text-indigo-600 font-semibold block text-[11px] truncate max-w-[180px]">
                      ({internMetrics.onLeaveTodayNames.join(', ')})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock size={20} weight="fill" className="text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{internMetrics.pendingCount}</div>
                <div className="text-xs text-slate-500 font-medium">Pending Approvals Count</div>
              </div>
            </div>
          </div>

          {/* ── Search Filter Only (Current Status removed) ── */}
          <div className="card p-3.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by intern name or reason…"
                className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
              />
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* ── Intern Applications List (Desktop & Mobile view) ── */}
          <div className="space-y-3">
            {filteredInternLeaves.length === 0 ? (
              <div className="card p-10 text-center text-slate-400 text-sm">
                No intern leave requests found matching the selected filters.
              </div>
            ) : (
              filteredInternLeaves.map(app => {
                const tBadge = leaveTypeBadge(app.leaveType);
                const sBadge = statusBadge(app.status);
                const StatusIcon = sBadge.icon;
                const isPending = app.status === 'applied';

                return (
                  <div key={app.id} className="card p-4 sm:p-5 hover:border-slate-300 transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {app.internName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm">{app.internName}</span>
                              <span className="text-xs text-slate-400 ml-1.5">({app.internBlock})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-auto sm:ml-0 flex-wrap">
                            <span className={cn('badge border text-xs font-semibold', tBadge.cls)}>
                              {tBadge.label}
                            </span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {app.totalDays} {app.totalDays === 1 ? 'Day' : 'Days'}
                            </span>
                            <span className={cn('badge border text-xs flex items-center gap-1 font-semibold', sBadge.cls)}>
                              <StatusIcon size={12} weight="fill" />
                              {sBadge.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 pt-0.5">
                          <Calendar size={14} className="text-indigo-600 shrink-0" />
                          <span className="font-medium">
                            Leave Duration: {formatDate(app.startDate)} &mdash; {formatDate(app.endDate)}
                          </span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-slate-400">Applied on {formatDate(app.appliedAt)}</span>
                        </div>

                        {/* Action Buttons: Reason for Leave always; Upload Document ONLY if attached */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                          {/* 1. Reason for Leave Heading & View Button */}
                          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
                            <span className="text-xs font-semibold text-slate-700">
                              Reason for Leave
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setViewReasonModal({
                                  applicant: app.internName,
                                  role: `Intern (${app.internBlock})`,
                                  leaveType: tBadge.label,
                                  duration: `${formatDate(app.startDate)} — ${formatDate(app.endDate)} (${app.totalDays} ${app.totalDays === 1 ? 'Day' : 'Days'})`,
                                  reason: app.reason,
                                  documentName: app.documentName,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded transition shadow-2xs"
                            >
                              <Eye size={13} weight="bold" />
                              View
                            </button>
                          </div>

                          {/* 2. Upload Document - ONLY SHOW IF DOCUMENT WAS ACTUALLY UPLOADED */}
                          {app.documentName && (
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                                <FileText size={15} className="text-indigo-600 shrink-0" />
                                <span className="truncate">{app.documentName}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewDocName(app.documentName || 'Document')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded transition shadow-2xs"
                              >
                                <Eye size={13} weight="bold" />
                                View
                              </button>
                            </div>
                          )}
                        </div>

                        {app.approverComment && (
                          <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded px-3 py-2 mt-1">
                            <strong>Approver Comment:</strong> {app.approverComment}
                          </div>
                        )}
                      </div>

                      {/* Right: Review Action Buttons (Approve / Reject) */}
                      {isPending && (
                        <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleApproveIntern(app.id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[var(--radius)] text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
                          >
                            <Check size={14} weight="bold" />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => openRejectModal(app.id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[var(--radius)] text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition active:scale-95"
                          >
                            <X size={14} weight="bold" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PORTAL-RENDERED MODALS (Mounted to document.body for true viewport centering)
      ══════════════════════════════════════════════════════════ */}
      {mounted && typeof document !== 'undefined' && (
        <>
          {/* 1. APPLY FOR LEAVE MODAL */}
          {showApplyModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-in fade-in"
                onClick={e => {
                  if (e.target === e.currentTarget) setShowApplyModal(false);
                }}
              >
                <div
                  className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 select-text flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-2">
                      <Plus size={18} weight="bold" className="text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-base">Apply for Leave</h3>
                    </div>
                    <button
                      onClick={() => setShowApplyModal(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleApplySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Leave Type *
                      </label>
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value as LeaveTypeOption)}
                        className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="casual">Casual Leave (CL)</option>
                        <option value="unplanned">Unplanned Leave</option>
                        <option value="earned">Earned Leave (EL)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Start Date (Calendar) *
                        </label>
                        <input
                          type="date"
                          value={formStartDate}
                          onChange={e => setFormStartDate(e.target.value)}
                          className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          End Date (Calendar) *
                        </label>
                        <input
                          type="date"
                          value={formEndDate}
                          onChange={e => setFormEndDate(e.target.value)}
                          className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          required
                        />
                      </div>
                    </div>

                    {formStartDate && formEndDate && formStartDate <= formEndDate && (
                      <div className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-3 py-2 flex items-center gap-1.5">
                        <Calendar size={14} />
                        Total Duration: <strong>{calcDays(formStartDate, formEndDate)} Day(s)</strong>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Reason for Leave *
                      </label>
                      <textarea
                        rows={3}
                        value={formReason}
                        onChange={e => setFormReason(e.target.value)}
                        placeholder="Explain the reason for taking leave…"
                        className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Upload Document (Optional)
                      </label>
                      <div className="border border-dashed border-slate-300 rounded-[var(--radius)] p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition">
                        <input
                          type="file"
                          id="fellow-doc-upload"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setFormFile(e.target.files[0]);
                            }
                          }}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        {formFile ? (
                          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded border border-slate-200 text-left">
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={20} className="text-indigo-600 shrink-0" />
                              <div className="truncate">
                                <div className="text-xs font-semibold text-slate-800 truncate">{formFile.name}</div>
                                <div className="text-[11px] text-slate-400">{(formFile.size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setViewDocName(formFile.name)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded transition"
                              >
                                <Eye size={13} weight="bold" />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormFile(null)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="fellow-doc-upload" className="cursor-pointer block">
                            <UploadSimple size={24} className="mx-auto text-slate-400 mb-1" />
                            <div className="text-xs font-semibold text-indigo-600 hover:underline">
                              Click to upload medical slip, certificate or document
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">PDF, PNG, JPG up to 5MB</div>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowApplyModal(false)}
                        className="px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-[var(--radius)] text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                      >
                        Submit Application
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}

          {/* 2. REJECTION POPUP */}
          {rejectModalAppId &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-in fade-in"
                onClick={e => {
                  if (e.target === e.currentTarget) setRejectModalAppId(null);
                }}
              >
                <div
                  className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 select-text animate-in zoom-in-95 duration-150"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-rose-50/60">
                    <div className="flex items-center gap-2">
                      <XCircle size={20} weight="fill" className="text-rose-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Decline Leave Request</h3>
                    </div>
                    <button
                      onClick={() => setRejectModalAppId(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Please enter the reason for rejecting this leave application. This comment will be visible to the intern.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Rejection Reason *
                      </label>
                      <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder="e.g. Critical survey deadline; presence required in field…"
                        className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setRejectModalAppId(null)}
                        className="px-4 py-2 rounded-[var(--radius)] text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmReject}
                        disabled={!rejectionReason.trim()}
                        className="px-4 py-2 rounded-[var(--radius)] text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* 3. DOCUMENT VIEW MODAL */}
          {viewDocName &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-in fade-in"
                onClick={e => {
                  if (e.target === e.currentTarget) setViewDocName(null);
                }}
              >
                <div
                  className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 select-text animate-in zoom-in-95 duration-150"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-2">
                      <FileText size={18} weight="fill" className="text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-sm truncate">{viewDocName}</h3>
                    </div>
                    <button
                      onClick={() => setViewDocName(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-6 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                      <FileText size={36} weight="duotone" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{viewDocName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Attached Verification Document</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 text-left">
                      <strong>Status:</strong> Verified attachment. This document serves as authentic proof for leave authorization.
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewDocName(null)}
                      className="w-full py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-[var(--radius)] transition shadow-sm"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* 4. REASON FOR LEAVE MODAL */}
          {viewReasonModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-in fade-in"
                onClick={e => {
                  if (e.target === e.currentTarget) setViewReasonModal(null);
                }}
              >
                <div
                  className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 select-text animate-in zoom-in-95 duration-150"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText size={18} weight="fill" className="text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Reason for Leave</h3>
                    </div>
                    <button
                      onClick={() => setViewReasonModal(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed max-h-60 overflow-y-auto">
                      {viewReasonModal.reason}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewReasonModal(null)}
                      className="w-full py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-[var(--radius)] transition shadow-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
}
