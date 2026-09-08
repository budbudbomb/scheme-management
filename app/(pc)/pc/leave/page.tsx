'use client';

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

interface PCLeaveApp {
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

interface TeamLeaveApp {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: 'fellow' | 'intern';
  assignedLocation: string;
  leaveType: 'casual' | 'unplanned' | 'earned';
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
const INITIAL_PC_LEAVES: PCLeaveApp[] = [
  {
    id: 'pc-1',
    leaveType: 'casual',
    startDate: '2026-09-12',
    endDate: '2026-09-13',
    totalDays: 2,
    reason: 'Attending family function at Bhopal hometown.',
    status: 'applied',
    appliedAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'pc-2',
    leaveType: 'casual',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    totalDays: 2,
    reason: 'Personal administrative work at district registrar office.',
    documentName: 'Govt_Appointment_Slip.pdf',
    documentUrl: '#',
    status: 'approved',
    appliedAt: '2026-08-08T09:30:00Z',
    approverComment: 'Approved by CPM.',
  },
  {
    id: 'pc-3',
    leaveType: 'casual',
    startDate: '2026-07-20',
    endDate: '2026-07-20',
    totalDays: 1,
    reason: 'Home urgent maintenance work.',
    status: 'rejected',
    appliedAt: '2026-07-18T14:00:00Z',
    approverComment: 'Division monthly review meeting scheduled on this day.',
  },
];

const INITIAL_FELLOW_LEAVES: TeamLeaveApp[] = [
  {
    id: 'fl-1',
    applicantId: 'fel-1',
    applicantName: 'Vikram Singh',
    applicantRole: 'fellow',
    assignedLocation: 'Indore District',
    leaveType: 'casual',
    startDate: '2026-09-10',
    endDate: '2026-09-11',
    totalDays: 2,
    reason: 'Family function in hometown.',
    documentName: 'Invitation.pdf',
    status: 'applied',
    appliedAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'fl-2',
    applicantId: 'fel-2',
    applicantName: 'Anita Deshmukh',
    applicantRole: 'fellow',
    assignedLocation: 'Ujjain District',
    leaveType: 'casual',
    startDate: '2026-09-04',
    endDate: '2026-09-04',
    totalDays: 1,
    reason: 'Personal urgent medical checkup.',
    status: 'applied',
    appliedAt: '2026-09-03T09:15:00Z',
  },
  {
    id: 'fl-3',
    applicantId: 'fel-3',
    applicantName: 'Rajesh Mehra',
    applicantRole: 'fellow',
    assignedLocation: 'Dewas District',
    leaveType: 'casual',
    startDate: '2026-09-03',
    endDate: '2026-09-03',
    totalDays: 1,
    reason: 'Urgent home bank work.',
    status: 'approved',
    appliedAt: '2026-09-01T15:00:00Z',
    approverComment: 'Approved. Ensure tasks are aligned.',
  },
  {
    id: 'fl-4',
    applicantId: 'fel-4',
    applicantName: 'Priya Sen',
    applicantRole: 'fellow',
    assignedLocation: 'Dhar District',
    leaveType: 'casual',
    startDate: '2026-08-25',
    endDate: '2026-08-26',
    totalDays: 2,
    reason: 'Personal leave for family ceremony.',
    status: 'approved',
    appliedAt: '2026-08-20T11:00:00Z',
    approverComment: 'Approved.',
  },
  {
    id: 'fl-5',
    applicantId: 'fel-5',
    applicantName: 'Alok Verma',
    applicantRole: 'fellow',
    assignedLocation: 'Khargone District',
    leaveType: 'casual',
    startDate: '2026-07-15',
    endDate: '2026-07-16',
    totalDays: 2,
    reason: 'Out of station for competitive examination.',
    status: 'rejected',
    appliedAt: '2026-07-12T10:00:00Z',
    approverComment: 'Division monthly review meeting scheduled on this day.',
  },
];

// Helper: Calculate days between dates (inclusive)
function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = e.getTime() - s.getTime();
  if (diffTime < 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export default function PCLeavePage() {
  // Active Tab: 'apply' (Coordinator's Own Leave) or 'review' (Review Fellows' Leave)
  const [activeTab, setActiveTab] = useState<'apply' | 'review'>('apply');

  // ── Tab 1: PC's own leave state ──
  const [pcLeaves, setPcLeaves] = useState<PCLeaveApp[]>(INITIAL_PC_LEAVES);
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

  // ── Tab 2: Fellow leave review state ──
  const [fellowLeaves, setFellowLeaves] = useState<TeamLeaveApp[]>(INITIAL_FELLOW_LEAVES);
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal
  const [rejectModalAppId, setRejectModalAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Mount tracking for React Portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when ANY modal is open
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
    const newApp: PCLeaveApp = {
      id: `pc-${Date.now()}`,
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

    setPcLeaves(prev => [newApp, ...prev]);
    toast.success('Leave application submitted successfully!');
    setShowApplyModal(false);
    setFormStartDate('');
    setFormEndDate('');
    setFormReason('');
    setFormFile(null);
  }

  // ── Tab 2 Handlers (Approve / Reject) ──
  function handleApprove(id: string) {
    setFellowLeaves(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'approved' } : app))
    );
    toast.success('Fellow leave request approved successfully');
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
      setFellowLeaves(prev =>
        prev.map(app =>
          app.id === rejectModalAppId
            ? { ...app, status: 'rejected', approverComment: rejectionReason.trim() }
            : app
        )
      );
      toast.success('Fellow leave request declined');
    }
    setRejectModalAppId(null);
    setRejectionReason('');
  }

  // ── Filtered Fellow Requests ──
  const filteredFellowLeaves = useMemo(() => {
    return fellowLeaves.filter(app => {
      const matchSearch =
        searchQuery === '' ||
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.assignedLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [fellowLeaves, searchQuery]);

  // ── Summary Metrics for Fellows in Division ──
  const fellowMetrics = useMemo(() => {
    const activeCount = 8;
    const pendingCount = fellowLeaves.filter(a => a.status === 'applied').length;
    const todayStr = '2026-09-03';
    const onLeaveToday = fellowLeaves.filter(
      a => a.status === 'approved' && a.startDate <= todayStr && a.endDate >= todayStr
    );
    return {
      activeCount,
      pendingCount,
      onLeaveTodayCount: onLeaveToday.length,
      onLeaveTodayNames: onLeaveToday.map(a => a.applicantName),
    };
  }, [fellowLeaves]);

  // Badge helpers
  function leaveTypeBadge(type: string) {
    switch (type) {
      case 'casual':
        return { label: 'Casual Leave (CL)', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'unplanned':
        return { label: 'Unplanned Leave', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'earned':
        return { label: 'Earned Leave (EL)', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: type, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  }

  function statusBadge(status: string) {
    switch (status) {
      case 'applied':
        return { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'approved':
        return { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
      case 'rejected':
        return { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
      default:
        return { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
    }
  }

  return (
    <div className="space-y-6">
      {/* ── FROZEN STICKY HEADER: Title + Description + Tab Switcher (stays frozen while scrolling up/down) ── */}
      <div className="sticky top-0 z-20 bg-slate-50/95 lg:bg-white/95 backdrop-blur-md -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-3.5 pb-3 sm:pt-5 sm:pb-4 border-b border-slate-200/80 shadow-2xs space-y-3 sm:space-y-4">
        {/* ── Page Header + Top-Right Apply Button ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Leave Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Apply for your leaves and review leave applications submitted by your fellows
            </p>
          </div>
          {activeTab === 'apply' && (
            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={15} weight="bold" />
              <span className="whitespace-nowrap">Apply for Leave</span>
            </button>
          )}
        </div>

        {/* ── Sleek Segmented Tab Switch (Placed ABOVE Apply for Leave button) ── */}
        <div className="w-full max-w-md bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 grid grid-cols-2 gap-1 shadow-2xs">
          {/* Tab 1: Apply for Leave */}
          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 select-none cursor-pointer text-center',
              activeTab === 'apply'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            )}
          >
            <CalendarCheck
              size={16}
              weight={activeTab === 'apply' ? 'fill' : 'bold'}
              className={activeTab === 'apply' ? 'text-indigo-600' : 'text-slate-500'}
            />
            <span className="truncate">Apply for Leave</span>
          </button>

          {/* Tab 2: Review Leave Applications */}
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 select-none cursor-pointer relative text-center',
              activeTab === 'review'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            )}
          >
            <Users
              size={16}
              weight={activeTab === 'review' ? 'fill' : 'bold'}
              className={activeTab === 'review' ? 'text-indigo-600' : 'text-slate-500'}
            />
            <span className="truncate sm:hidden">Review Leaves</span>
            <span className="hidden sm:inline truncate">Review Leave Applications</span>
            {fellowMetrics.pendingCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-black bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                {fellowMetrics.pendingCount}
              </span>
            )}
            {/* Pulsing notification dot */}
            {fellowMetrics.pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border-2 border-white"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: PC APPLY FOR LEAVE
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'apply' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ClipboardText size={18} weight="fill" className="text-slate-500" />
              <span className="text-sm font-bold text-slate-900">My Leave Applications</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">{pcLeaves.length} record(s)</span>
          </div>

          {pcLeaves.length === 0 ? (
            <div className="card p-10 text-center text-slate-400 text-sm">
              No leave applications yet. Click &quot;Apply for Leave&quot; above to submit one.
            </div>
          ) : (
            <div className="space-y-3">
              {pcLeaves.map(app => {
                const tBadge = leaveTypeBadge(app.leaveType);
                const sBadge = statusBadge(app.status);
                const StatusIcon = sBadge.icon;
                return (
                  <div key={app.id} className="card p-4 sm:p-5 hover:border-slate-300 transition-all space-y-3 shadow-2xs">
                    {/* Top Row: Left = Chips (Leave Type + Days), Right = Status Badge on Top Right Corner */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('badge border text-xs font-semibold', tBadge.cls)}>
                          {tBadge.label}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/70">
                          {app.totalDays} {app.totalDays === 1 ? 'Day' : 'Days'}
                        </span>
                      </div>

                      {/* Status Badge in Top Right Corner */}
                      <span className={cn('badge border text-xs flex items-center gap-1 font-semibold shrink-0', sBadge.cls)}>
                        <StatusIcon size={12} weight="fill" />
                        {sBadge.label}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar size={14} className="text-indigo-600 shrink-0" />
                        <span>
                          {formatDate(app.startDate)} &mdash; {formatDate(app.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 sm:before:content-['•'] sm:before:mr-1 sm:before:text-slate-300">
                        <span>Applied on {formatDate(app.appliedAt)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {/* 1. View details */}
                      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-700">
                          View details
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setViewReasonModal({
                              applicant: 'You (Coordinator)',
                              role: 'Program Coordinator',
                              leaveType: tBadge.label,
                              duration: `${formatDate(app.startDate)} — ${formatDate(app.endDate)} (${app.totalDays} ${app.totalDays === 1 ? 'Day' : 'Days'})`,
                              reason: app.reason,
                              documentName: app.documentName,
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded transition shadow-2xs cursor-pointer"
                        >
                          <Eye size={13} weight="bold" />
                          View
                        </button>
                      </div>

                      {/* 2. Upload Document - ONLY IF ATTACHED */}
                      {app.documentName && (
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shadow-2xs">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                            <FileText size={15} className="text-indigo-600 shrink-0" />
                            <span className="truncate">{app.documentName}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewDocName(app.documentName || 'Document')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded transition shadow-2xs cursor-pointer"
                          >
                            <Eye size={13} weight="bold" />
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: REVIEW LEAVE APPLICATION (FELLOWS)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'review' && (
        <div className="space-y-5">
          {/* Summary View (Exactly matching Fellow's 3 cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Users size={20} weight="fill" className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{fellowMetrics.activeCount}</div>
                <div className="text-xs text-slate-500 font-medium">Active Fellows Count</div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CalendarCheck size={20} weight="fill" className="text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{fellowMetrics.onLeaveTodayCount}</div>
                <div className="text-xs text-slate-500 font-medium">
                  On Leave Today
                  {fellowMetrics.onLeaveTodayNames.length > 0 && (
                    <span className="text-purple-600 font-semibold block text-[11px] truncate max-w-[180px]">
                      ({fellowMetrics.onLeaveTodayNames.join(', ')})
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
                <div className="text-2xl font-bold text-slate-900">{fellowMetrics.pendingCount}</div>
                <div className="text-xs text-slate-500 font-medium">Pending Approvals Count</div>
              </div>
            </div>
          </div>

          {/* ── Search Filter ── */}
          <div className="card p-3.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by fellow name, district, or reason…"
                className="w-full text-sm rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
              />
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* ── Fellow Applications List ── */}
          <div className="space-y-3.5">
            {filteredFellowLeaves.length === 0 ? (
              <div className="card p-10 text-center text-slate-400 text-sm">
                No fellow leave requests found matching the search.
              </div>
            ) : (
              filteredFellowLeaves.map(app => {
                const tBadge = leaveTypeBadge(app.leaveType);
                const sBadge = statusBadge(app.status);
                const StatusIcon = sBadge.icon;
                const isPending = app.status === 'applied';

                return (
                  <div key={app.id} className="card p-4 sm:p-5 hover:border-slate-300 transition space-y-3.5">
                    {/* Header Row: Applicant info + Status badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200 shadow-inner">
                          {app.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{app.applicantName}</h3>
                          <span className="text-xs text-slate-400">({app.assignedLocation})</span>
                        </div>
                      </div>

                      <span className={cn('badge border text-xs flex items-center gap-1 font-semibold shrink-0', sBadge.cls)}>
                        <StatusIcon size={12} weight="fill" />
                        {sBadge.label}
                      </span>
                    </div>

                    {/* Chips Row: Leave type + Days */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('badge border text-xs font-semibold', tBadge.cls)}>
                        {tBadge.label}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {app.totalDays} {app.totalDays === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    {/* Duration & Applied Dates */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar size={14} className="text-indigo-600 shrink-0" />
                        <span>
                          Leave Duration: {formatDate(app.startDate)} &mdash; {formatDate(app.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 sm:before:content-['•'] sm:before:mr-1 sm:before:text-slate-300">
                        <span>Applied on {formatDate(app.appliedAt)}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Reason for Leave & Uploaded Document */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {/* 1. View details */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                        <span className="text-xs font-semibold text-slate-700">
                          View details
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setViewReasonModal({
                              applicant: app.applicantName,
                              role: `CM Fellow (${app.assignedLocation})`,
                              leaveType: tBadge.label,
                              duration: `${formatDate(app.startDate)} — ${formatDate(app.endDate)} (${app.totalDays} ${app.totalDays === 1 ? 'Day' : 'Days'})`,
                              reason: app.reason,
                              documentName: app.documentName,
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                        >
                          <Eye size={13} weight="bold" />
                          <span>View</span>
                        </button>
                      </div>

                      {/* 2. Upload Document */}
                      {app.documentName && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                            <FileText size={14} className="text-indigo-600 shrink-0" />
                            <span className="truncate">{app.documentName}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewDocName(app.documentName || 'Document')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                          >
                            <Eye size={13} weight="bold" />
                            <span>View</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {app.approverComment && (
                      <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2">
                        <strong>Approver Comment:</strong> {app.approverComment}
                      </div>
                    )}

                    {/* Bottom Action Buttons: Approve / Reject 50-50 Grid */}
                    {isPending && (
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleApprove(app.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Check size={16} weight="bold" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openRejectModal(app.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <X size={16} weight="bold" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
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
                      <h3 className="font-bold text-slate-900 text-base">Apply for Leave (Coordinator)</h3>
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
                          Start Date *
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
                          End Date *
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
                          id="pc-doc-upload-modal"
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
                          <label htmlFor="pc-doc-upload-modal" className="cursor-pointer block">
                            <UploadSimple size={24} className="mx-auto text-slate-400 mb-1" />
                            <div className="text-xs font-semibold text-indigo-600 hover:underline">
                              Click to upload certificate or supporting document
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
                      Please enter the reason for rejecting this leave application. This comment will be visible to the applicant.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Rejection Reason *
                      </label>
                      <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder="e.g. Critical division review scheduled; presence required in field…"
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
