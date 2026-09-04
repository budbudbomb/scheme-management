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

const INITIAL_TEAM_LEAVES: TeamLeaveApp[] = [
  {
    id: 'tl-1',
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
    id: 'tl-2',
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
    id: 'tl-3',
    applicantId: 'int-1',
    applicantName: 'Divya Sharma',
    applicantRole: 'intern',
    assignedLocation: 'Indore Block A',
    leaveType: 'casual',
    startDate: '2026-09-04',
    endDate: '2026-09-05',
    totalDays: 2,
    reason: 'Need to attend urgent university certificate verification in college.',
    status: 'applied',
    appliedAt: '2026-09-02T14:30:00Z',
  },
  {
    id: 'tl-4',
    applicantId: 'int-2',
    applicantName: 'Karan Malhotra',
    applicantRole: 'intern',
    assignedLocation: 'Sanwer Block',
    leaveType: 'casual',
    startDate: '2026-09-03',
    endDate: '2026-09-04',
    totalDays: 2,
    reason: 'Severe viral fever and doctor advice for bed rest.',
    documentName: 'Doctor_Certificate.pdf',
    status: 'applied',
    appliedAt: '2026-09-03T08:15:00Z',
  },
  {
    id: 'tl-5',
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
    id: 'tl-6',
    applicantId: 'int-3',
    applicantName: 'Rohit Yadav',
    applicantRole: 'intern',
    assignedLocation: 'Depalpur Block',
    leaveType: 'casual',
    startDate: '2026-09-03',
    endDate: '2026-09-03',
    totalDays: 1,
    reason: 'Brother marriage ceremony preparations.',
    status: 'approved',
    appliedAt: '2026-08-30T16:00:00Z',
    approverComment: 'Approved. Handover tasks.',
  },
  {
    id: 'tl-7',
    applicantId: 'int-4',
    applicantName: 'Riya Gupta',
    applicantRole: 'intern',
    assignedLocation: 'Sanwer Block',
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

export default function PCLeavePage() {
  const [activeTab, setActiveTab] = useState<'apply' | 'review'>('review');

  // ── Tab 1: PC's own leaves state ──
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

  // ── Tab 2: Team leave review state ──
  const [teamLeaves, setTeamLeaves] = useState<TeamLeaveApp[]>(INITIAL_TEAM_LEAVES);
  const [roleFilter, setRoleFilter] = useState<'all' | 'fellow' | 'intern'>('all');
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
    setTeamLeaves(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'approved' } : app))
    );
    toast.success('Leave request approved successfully');
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
      setTeamLeaves(prev =>
        prev.map(app =>
          app.id === rejectModalAppId
            ? { ...app, status: 'rejected', approverComment: rejectionReason.trim() }
            : app
        )
      );
      toast.success('Leave request declined');
    }
    setRejectModalAppId(null);
    setRejectionReason('');
  }

  // ── Filtered Team Requests ──
  const filteredTeamLeaves = useMemo(() => {
    return teamLeaves.filter(app => {
      const matchRole = roleFilter === 'all' || app.applicantRole === roleFilter;
      const matchSearch =
        searchQuery === '' ||
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.assignedLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [teamLeaves, roleFilter, searchQuery]);

  // ── Summary Metrics for Division ──
  const teamMetrics = useMemo(() => {
    const totalFellows = 8;
    const totalInterns = 24;
    const pendingCount = teamLeaves.filter(a => a.status === 'applied').length;
    const pendingFellows = teamLeaves.filter(a => a.status === 'applied' && a.applicantRole === 'fellow').length;
    const pendingInterns = teamLeaves.filter(a => a.status === 'applied' && a.applicantRole === 'intern').length;

    // Today's active leaves
    const onLeaveToday = teamLeaves.filter(
      a =>
        a.status === 'approved' &&
        a.startDate <= '2026-09-04' &&
        a.endDate >= '2026-09-03'
    );

    return {
      totalFellows,
      totalInterns,
      totalTeam: totalFellows + totalInterns,
      pendingCount,
      pendingFellows,
      pendingInterns,
      onLeaveTodayCount: onLeaveToday.length,
      onLeaveTodayNames: onLeaveToday.map(a => `${a.applicantName} (${a.applicantRole === 'fellow' ? 'Fellow' : 'Intern'})`),
    };
  }, [teamLeaves]);

  // PC's own metrics
  const pcMetrics = useMemo(() => {
    const totalEntitlement = 12; // 1 CL / Month
    const usedDays = pcLeaves
      .filter(l => l.status === 'approved')
      .reduce((acc, curr) => acc + curr.totalDays, 0);
    const pendingDays = pcLeaves
      .filter(l => l.status === 'applied')
      .reduce((acc, curr) => acc + curr.totalDays, 0);
    const remainingDays = Math.max(0, totalEntitlement - usedDays);

    return { totalEntitlement, usedDays, pendingDays, remainingDays };
  }, [pcLeaves]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-[11px] font-semibold text-indigo-700 mb-1.5">
            <span>Indore Division</span>
            <span className="text-indigo-300">&bull;</span>
            <span>Program Coordinator Leave Desk</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor and review leave requests for your division fellows &amp; interns, or apply for your own leaves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'apply' ? (
            <button
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-98"
            >
              <Plus size={16} weight="bold" />
              Apply for Leave
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>{teamMetrics.pendingCount} Pending Requests Awaiting Action</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ─── */}
      <div className="flex items-stretch border-b border-slate-200 gap-0">
        {/* Tab 1: Apply for Leave */}
        <button
          onClick={() => setActiveTab('apply')}
          className={cn(
            'group flex items-center gap-2.5 px-5 py-3 text-sm font-semibold transition-all duration-200 relative select-none border-b-2 -mb-px',
            activeTab === 'apply'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          )}
        >
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
            activeTab === 'apply' ? 'bg-indigo-50' : 'bg-slate-100 group-hover:bg-slate-200'
          )}>
            <Calendar
              size={15}
              weight="fill"
              className={activeTab === 'apply' ? 'text-indigo-600' : 'text-slate-400'}
            />
          </div>
          <span>Apply for Leave</span>
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
            activeTab === 'apply'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              : 'bg-slate-100 text-slate-400'
          )}>
            Coordinator
          </span>
        </button>

        {/* Tab 2: Review Leave Applications */}
        <button
          onClick={() => setActiveTab('review')}
          className={cn(
            'group flex items-center gap-2.5 px-5 py-3 text-sm font-semibold transition-all duration-200 relative select-none border-b-2 -mb-px',
            activeTab === 'review'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          )}
        >
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
            activeTab === 'review' ? 'bg-indigo-50' : 'bg-slate-100 group-hover:bg-slate-200'
          )}>
            <Users
              size={15}
              weight="fill"
              className={activeTab === 'review' ? 'text-indigo-600' : 'text-slate-400'}
            />
          </div>
          <span>Review Leave Applications</span>
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
            activeTab === 'review'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              : 'bg-slate-100 text-slate-400'
          )}>
            Fellows &amp; Interns
          </span>

          {/* Pending count badge */}
          {teamMetrics.pendingCount > 0 && (
            <span className={cn(
              'flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-black rounded-full border transition-colors',
              activeTab === 'review'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            )}>
              {teamMetrics.pendingCount}
            </span>
          )}

          {/* Pulsing notification dot */}
          {teamMetrics.pendingCount > 0 && activeTab !== 'review' && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: APPLY FOR LEAVE (PC Self Leave)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'apply' && (
        <div className="space-y-5">
          {/* Summary Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Entitlement</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Calendar size={18} weight="fill" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {pcMetrics.totalEntitlement} <span className="text-xs font-medium text-slate-400">Days / Yr</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">1 CL accrued each month</div>
            </div>

            <div className="card p-4 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Remaining Balance</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle size={18} weight="fill" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                {pcMetrics.remainingDays} <span className="text-xs font-medium text-slate-400">Days</span>
              </div>
              <div className="text-[11px] text-emerald-600/90 font-medium mt-1">Available to apply</div>
            </div>

            <div className="card p-4 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Leaves Taken</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                  <CalendarCheck size={18} weight="fill" />
                </div>
              </div>
              <div className="text-2xl font-bold text-sky-700 mt-2">
                {pcMetrics.usedDays} <span className="text-xs font-medium text-slate-400">Days</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Approved in 2026</div>
            </div>

            <div className="card p-4 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Approval</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock size={18} weight="fill" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">
                {pcMetrics.pendingDays} <span className="text-xs font-medium text-slate-400">Days</span>
              </div>
              <div className="text-[11px] text-amber-700/80 font-medium mt-1">Under CPM review</div>
            </div>
          </div>

          {/* Visual Progress Meter */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700">Casual Leave (CL) Quota Utilization</div>
              <div className="text-xs text-slate-500">
                You have utilized <strong>{pcMetrics.usedDays} days</strong> out of your <strong>{pcMetrics.totalEntitlement} days</strong> annual allowance.
              </div>
            </div>
            <div className="w-full sm:w-64 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>{pcMetrics.remainingDays} Days Available</span>
                <span>{Math.round((pcMetrics.remainingDays / pcMetrics.totalEntitlement) * 100)}% Balance</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(pcMetrics.usedDays / pcMetrics.totalEntitlement) * 100}%` }}
                  className="bg-sky-500 h-full"
                  title="Used Leaves"
                />
                <div
                  style={{ width: `${(pcMetrics.pendingDays / pcMetrics.totalEntitlement) * 100}%` }}
                  className="bg-amber-400 h-full"
                  title="Pending Leaves"
                />
                <div
                  style={{ width: `${(pcMetrics.remainingDays / pcMetrics.totalEntitlement) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title="Remaining Leaves"
                />
              </div>
            </div>
          </div>

          {/* PC Leave History List */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardText size={16} weight="fill" className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">My Leave Applications</span>
              </div>
              <span className="text-xs text-slate-500">{pcLeaves.length} record(s)</span>
            </div>

            {pcLeaves.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                No leave applications yet. Click &quot;Apply for Leave&quot; above to submit one.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pcLeaves.map(app => {
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
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                              {app.totalDays} {app.totalDays === 1 ? 'Day' : 'Days'}
                            </span>
                            <span className={cn('badge border text-xs flex items-center gap-1 font-semibold', sBadge.cls)}>
                              <StatusIcon size={12} weight="fill" />
                              {sBadge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Calendar size={14} className="text-indigo-600 shrink-0" />
                            <span className="font-medium">
                              {formatDate(app.startDate)} &mdash; {formatDate(app.endDate)}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-slate-400">Applied on {formatDate(app.appliedAt)}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-2">
                            {/* 1. Reason for Leave Heading & View Button */}
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shadow-2xs">
                              <span className="text-xs font-semibold text-slate-700">
                                Reason for Leave
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setViewReasonModal({
                                    applicant: 'You (Coordinator)',
                                    role: 'Program Co-ordinator',
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
          TAB 2: REVIEW LEAVE APPLICATION (FELLOWS & INTERNS)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'review' && (
        <div className="space-y-5">
          {/* ── Review Tab KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Card 1: Division Strength */}
            <div className="card card-hover relative overflow-hidden p-5">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500 rounded-t-[var(--radius-lg)]" />
              <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Users size={18} weight="fill" className="text-indigo-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                    {teamMetrics.totalTeam}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-700">Division Strength</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-semibold text-purple-700">{teamMetrics.totalFellows} Fellows</span>
                <span className="text-slate-300 text-xs">·</span>
                <span className="text-[11px] font-semibold text-emerald-700">{teamMetrics.totalInterns} Interns</span>
              </div>
            </div>

            {/* Card 2: On Leave Today */}
            <div className="card card-hover relative overflow-hidden p-5">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500 rounded-t-[var(--radius-lg)]" />
              <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <CalendarCheck size={18} weight="fill" className="text-emerald-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                    {teamMetrics.onLeaveTodayCount}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-700">On Leave Today</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {teamMetrics.onLeaveTodayCount === 0 ? 'All members present' : 'Members absent today'}
              </div>
            </div>

            {/* Card 3: Pending Fellow Approvals */}
            <div className="card card-hover relative overflow-hidden p-5">
              <div className={cn(
                'absolute top-0 left-0 right-0 h-[3px] rounded-t-[var(--radius-lg)]',
                teamMetrics.pendingFellows > 0 ? 'bg-amber-500' : 'bg-slate-300'
              )} />
              <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock size={18} weight="fill" className="text-amber-600" />
                </div>
                <div className="text-right">
                  <div className={cn(
                    'text-3xl font-bold tracking-tight tabular-nums leading-none',
                    teamMetrics.pendingFellows > 0 ? 'text-amber-600' : 'text-slate-900'
                  )}>
                    {teamMetrics.pendingFellows}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Fellow Approvals</span>
                {teamMetrics.pendingFellows > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md leading-none">
                    pending
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {teamMetrics.pendingFellows > 0 ? 'Action required by you' : 'All caught up!'}
              </div>
            </div>

            {/* Card 4: Approved YTD */}
            <div className="card card-hover relative overflow-hidden p-5">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500 rounded-t-[var(--radius-lg)]" />
              <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} weight="fill" className="text-sky-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                    {teamLeaves.filter(a => a.status === 'approved').length}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-700">Approved (YTD)</div>
              <div className="text-[11px] text-slate-400 mt-1">Processed this term</div>
            </div>

          </div>

          {/* Role Filter & Search Bar */}
          <div className="card p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Role filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1">Filter Role:</span>
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150',
                    roleFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  All Applications ({teamLeaves.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('fellow')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150',
                    roleFilter === 'fellow'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  Fellows ({teamLeaves.filter(a => a.applicantRole === 'fellow').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('intern')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150',
                    roleFilter === 'intern'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  Interns ({teamLeaves.filter(a => a.applicantRole === 'intern').length})
                </button>
              </div>

              {/* Status counter chips */}
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {teamMetrics.pendingCount} Pending
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {teamLeaves.filter(a => a.status === 'approved').length} Approved
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by fellow or intern name, district, or reason…"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3.5">
            {filteredTeamLeaves.length === 0 ? (
              <div className="card p-10 text-center text-slate-400 text-sm">
                No leave applications match your search or filter.
              </div>
            ) : (
              filteredTeamLeaves.map(app => {
                const tBadge = leaveTypeBadge(app.leaveType);
                const sBadge = statusBadge(app.status);
                const StatusIcon = sBadge.icon;
                const isPending = app.status === 'applied';
                const isFellow = app.applicantRole === 'fellow';
                // PC can only Approve/Reject Fellow leaves; Interns are monitor-only
                const canActOnLeave = isPending && isFellow;

                return (
                  <div
                    key={app.id}
                    className={cn(
                      'card transition-all duration-200 p-5 hover:shadow-sm',
                      canActOnLeave ? 'border-amber-200/80 hover:border-amber-300' : 'hover:border-slate-300'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Details */}
                      <div className="space-y-2.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shadow-inner',
                                isFellow ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              )}
                            >
                              {app.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{app.applicantName}</span>
                                <span
                                  className={cn(
                                    'text-[10px] font-bold uppercase px-2 py-0.5 rounded-md',
                                    isFellow
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  )}
                                >
                                  {isFellow ? 'CM Fellow' : 'Intern'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">{app.assignedLocation}</span>
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

                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Calendar size={14} className="text-indigo-600 shrink-0" />
                          <span className="font-medium">
                            Leave Duration: {formatDate(app.startDate)} &mdash; {formatDate(app.endDate)}
                          </span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-slate-400">Applied on {formatDate(app.appliedAt)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          {/* 1. Reason for Leave Heading & View Button */}
                          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                            <span className="text-xs font-semibold text-slate-700">
                              Reason for Leave
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setViewReasonModal({
                                  applicant: app.applicantName,
                                  role: `${isFellow ? 'CM Fellow' : 'Intern'} (${app.assignedLocation})`,
                                  leaveType: tBadge.label,
                                  duration: `${formatDate(app.startDate)} — ${formatDate(app.endDate)} (${app.totalDays} ${app.totalDays === 1 ? 'Day' : 'Days'})`,
                                  reason: app.reason,
                                  documentName: app.documentName,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg transition shadow-2xs"
                            >
                              <Eye size={13} weight="bold" />
                              View
                            </button>
                          </div>

                          {/* 2. Upload Document - ONLY IF ATTACHED */}
                          {app.documentName && (
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                                <FileText size={15} className="text-indigo-600 shrink-0" />
                                <span className="truncate">{app.documentName}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewDocName(app.documentName || 'Document')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg transition shadow-2xs"
                              >
                                <Eye size={13} weight="bold" />
                                View
                              </button>
                            </div>
                          )}
                        </div>

                        {app.approverComment && (
                          <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2 mt-1">
                            <strong>Approver Comment:</strong> {app.approverComment}
                          </div>
                        )}
                      </div>

                      {/* Right: Review Action Buttons */}
                      {isPending && isFellow && (
                        // Fellows: PC can Approve or Reject
                        <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleApprove(app.id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95"
                          >
                            <Check size={14} weight="bold" />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => openRejectModal(app.id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95"
                          >
                            <X size={14} weight="bold" />
                            Reject
                          </button>
                        </div>
                      )}

                      {isPending && !isFellow && (
                        // Interns: PC can only monitor, not approve/reject
                        <div className="shrink-0 pt-2 sm:pt-0 flex items-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-500">
                            <Eye size={14} className="text-slate-400" />
                            Monitor Only
                          </div>
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
