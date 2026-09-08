'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardText,
  Plus,
  Check,
  X,
  XCircle,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  CalendarCheck,
  Calendar,
  FileText,
  Users,
  UserCheck,
  Funnel,
  Buildings,
  MapPin,
  ArrowRight,
  ChatText,
  UploadSimple,
  ShieldCheck,
  Info,
  Sparkle,
  Eye
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/auth/context';
import SelectPopup, { DatePopup } from '@/components/shared/SelectPopup';

// ── Types ─────────────────────────────────────────────────────────────
type AdminRole = 'chief_program_manager' | 'senior_program_manager';
type TabType = 'my_leave' | 'team_leave';
type TeamSubTab = 'coordinators' | 'fellows_interns';

interface ManagerProfile {
  id: string;
  name: string;
  designation: string;
  role: AdminRole;
  code: string;
  email: string;
  phone: string;
  department: string;
  location: string;
}

interface ManagerLeaveApplication {
  id: string;
  leaveType: 'casual' | 'medical' | 'earned' | 'special';
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  emergencyContact: string;
  documentName?: string;
  status: 'applied' | 'approved' | 'rejected';
  appliedAt: string;
  approverComment?: string;
  approverName?: string;
}

interface CoordinatorLeaveApplication {
  id: string;
  pcId: string;
  pcName: string;
  email: string;
  phone: string;
  district: string;
  division: string;
  leaveType: 'casual' | 'medical' | 'earned' | 'special';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  substituteName: string;
  status: 'applied' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  approverComment?: string;
  documentName?: string;
}

interface CandidateLeaveApplication {
  id: string;
  name: string;
  role: 'fellow' | 'intern';
  district: string;
  block: string;
  leaveType: 'casual' | 'medical' | 'earned' | 'unplanned';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'applied' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedByPC: string;
  pcComment?: string;
}

// ── Manager Profiles ──────────────────────────────────────────────────
const MANAGER_PROFILES: Record<AdminRole, ManagerProfile> = {
  chief_program_manager: {
    id: 'cpm-01',
    name: 'Dr. Rajesh Verma',
    designation: 'Chief Program Manager',
    role: 'chief_program_manager',
    code: 'CPM-MP-001',
    email: 'cpm@cmyp.mp.gov.in',
    phone: '+91 98260 11223',
    department: 'State PMU',
    location: 'Bhopal'
  },
  senior_program_manager: {
    id: 'spm-01',
    name: 'Pooja Sharma',
    designation: 'Senior Program Manager',
    role: 'senior_program_manager',
    code: 'SPM-MP-004',
    email: 'spm@cmyp.mp.gov.in',
    phone: '+91 94250 88771',
    department: 'Operations PMU',
    location: 'Bhopal'
  }
};

// ── Initial Mock Data ─────────────────────────────────────────────────
const INITIAL_MY_LEAVES: Record<AdminRole, ManagerLeaveApplication[]> = {
  chief_program_manager: [
    {
      id: 'ml-cpm-1',
      leaveType: 'earned',
      startDate: '2026-09-22',
      endDate: '2026-09-25',
      totalDays: 4,
      isHalfDay: false,
      reason: 'Attending National Governance Symposium and annual family commitment.',
      emergencyContact: '+91 98260 11223',
      documentName: 'Invitation_Letter_Symposium.pdf',
      status: 'applied',
      appliedAt: '2026-09-02T11:20:00Z'
    },
    {
      id: 'ml-cpm-2',
      leaveType: 'casual',
      startDate: '2026-08-14',
      endDate: '2026-08-14',
      totalDays: 1,
      isHalfDay: false,
      reason: 'Personal administrative work at district registrar office.',
      emergencyContact: '+91 98260 11223',
      status: 'approved',
      appliedAt: '2026-08-10T09:15:00Z',
      approverComment: 'Approved by State Project Director.',
      approverName: 'Shri Manoj Govil, IAS'
    },
    {
      id: 'ml-cpm-3',
      leaveType: 'medical',
      startDate: '2026-07-06',
      endDate: '2026-07-08',
      totalDays: 3,
      isHalfDay: false,
      reason: 'Severe gastrointestinal infection, medical rest advised.',
      emergencyContact: '+91 98260 11223',
      documentName: 'Medical_Fitness_Cert.pdf',
      status: 'approved',
      appliedAt: '2026-07-05T14:30:00Z',
      approverComment: 'Sanctioned with medical certificate submitted.',
      approverName: 'Shri Manoj Govil, IAS'
    }
  ],
  senior_program_manager: [
    {
      id: 'ml-spm-1',
      leaveType: 'casual',
      startDate: '2026-09-18',
      endDate: '2026-09-19',
      totalDays: 2,
      isHalfDay: false,
      reason: 'Family wedding event in Jabalpur.',
      emergencyContact: '+91 94250 88771',
      status: 'applied',
      appliedAt: '2026-09-03T10:00:00Z'
    },
    {
      id: 'ml-spm-2',
      leaveType: 'casual',
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      totalDays: 0.5,
      isHalfDay: true,
      reason: 'Doctor appointment second half.',
      emergencyContact: '+91 94250 88771',
      status: 'approved',
      appliedAt: '2026-07-30T16:00:00Z',
      approverComment: 'Approved. Field phone reachable.',
      approverName: 'Dr. Rajesh Verma'
    }
  ]
};

const INITIAL_PC_LEAVES: CoordinatorLeaveApplication[] = [
  {
    id: 'pcl-1',
    pcId: 'pc-101',
    pcName: 'Amit Saxena',
    email: 'amit.saxena@cmyp.mp.gov.in',
    phone: '+91 98765 43210',
    district: 'Bhopal',
    division: 'Bhopal Division',
    leaveType: 'casual',
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    totalDays: 3,
    reason: 'Family urgent ceremony at home district (Gwalior). Work handover assigned to Associate PC.',
    substituteName: 'Priya Joshi (Assistant Coordinator)',
    documentName: 'Handover_Form_Bhopal.pdf',
    status: 'applied',
    appliedAt: '2026-09-02T14:30:00Z'
  },
  {
    id: 'pcl-2',
    pcId: 'pc-102',
    pcName: 'Sanjay Deshmukh',
    email: 'sanjay.deshmukh@cmyp.mp.gov.in',
    phone: '+91 97654 32109',
    district: 'Indore',
    division: 'Indore Division',
    leaveType: 'medical',
    startDate: '2026-09-08',
    endDate: '2026-09-14',
    totalDays: 7,
    reason: 'Hospitalization for minor orthopedic treatment. Medical prescription attached.',
    substituteName: 'Kavita Chandel (Indore Block Lead)',
    documentName: 'Hospital_Admission_Slip.pdf',
    status: 'applied',
    appliedAt: '2026-09-03T09:15:00Z'
  },
  {
    id: 'pcl-3',
    pcId: 'pc-103',
    pcName: 'Rashmi Parmar',
    email: 'rashmi.parmar@cmyp.mp.gov.in',
    phone: '+91 96543 21098',
    district: 'Ujjain',
    division: 'Ujjain Division',
    leaveType: 'earned',
    startDate: '2026-08-20',
    endDate: '2026-08-25',
    totalDays: 6,
    reason: 'Annual family leave during religious festival in ancestral village.',
    substituteName: 'Deepak Patel (Fellow Mentor)',
    status: 'approved',
    appliedAt: '2026-08-10T11:00:00Z',
    reviewedAt: '2026-08-12T15:20:00Z',
    approverComment: 'Approved. Substitute notified to maintain daily KPI sync.'
  },
  {
    id: 'pcl-4',
    pcId: 'pc-104',
    pcName: 'Virendra Singh',
    email: 'virendra.singh@cmyp.mp.gov.in',
    phone: '+91 95432 10987',
    district: 'Jabalpur',
    division: 'Jabalpur Division',
    leaveType: 'casual',
    startDate: '2026-08-18',
    endDate: '2026-08-18',
    totalDays: 1,
    reason: 'Personal work in tehsil office.',
    substituteName: 'Neeraj Agrawal',
    status: 'approved',
    appliedAt: '2026-08-16T12:00:00Z',
    reviewedAt: '2026-08-17T10:00:00Z',
    approverComment: 'Sanctioned for 1 day.'
  },
  {
    id: 'pcl-5',
    pcId: 'pc-105',
    pcName: 'Mohit Tiwari',
    email: 'mohit.tiwari@cmyp.mp.gov.in',
    phone: '+91 94321 09876',
    district: 'Gwalior',
    division: 'Gwalior Division',
    leaveType: 'casual',
    startDate: '2026-08-05',
    endDate: '2026-08-07',
    totalDays: 3,
    reason: 'Urgent home visit.',
    substituteName: 'None specified',
    status: 'rejected',
    appliedAt: '2026-08-03T16:45:00Z',
    reviewedAt: '2026-08-04T09:30:00Z',
    approverComment: 'Rejected due to State Review Mission scheduled on the same dates.'
  }
];

const INITIAL_MONITOR_LEAVES: CandidateLeaveApplication[] = [
  {
    id: 'cml-1',
    name: 'Aakash Verma',
    role: 'fellow',
    district: 'Sehore',
    block: 'Ashta',
    leaveType: 'casual',
    startDate: '2026-09-09',
    endDate: '2026-09-10',
    totalDays: 2,
    reason: 'Attending brother wedding reception.',
    status: 'applied',
    appliedAt: '2026-09-02T10:00:00Z',
    reviewedByPC: 'Vikram Rathore (PC Sehore)',
    pcComment: 'Application forwarded to PMU for monitoring.'
  },
  {
    id: 'cml-2',
    name: 'Divya Sharma',
    role: 'intern',
    district: 'Indore',
    block: 'Sanwer',
    leaveType: 'medical',
    startDate: '2026-09-07',
    endDate: '2026-09-09',
    totalDays: 3,
    reason: 'Severe viral flu, physician prescribed complete isolation.',
    status: 'approved',
    appliedAt: '2026-09-01T15:30:00Z',
    reviewedByPC: 'Sanjay Deshmukh (PC Indore)',
    pcComment: 'Approved upon doctor certificate verification.'
  },
  {
    id: 'cml-3',
    name: 'Rohan Gupta',
    role: 'fellow',
    district: 'Raisen',
    block: 'Gairatganj',
    leaveType: 'earned',
    startDate: '2026-09-15',
    endDate: '2026-09-18',
    totalDays: 4,
    reason: 'Family pilgrimage travel.',
    status: 'applied',
    appliedAt: '2026-09-03T11:45:00Z',
    reviewedByPC: 'Sunita Jain (PC Raisen)',
    pcComment: 'Pending review by PC.'
  },
  {
    id: 'cml-4',
    name: 'Priyanka Patel',
    role: 'intern',
    district: 'Dewas',
    block: 'Sonkatch',
    leaveType: 'casual',
    startDate: '2026-08-28',
    endDate: '2026-08-29',
    totalDays: 2,
    reason: 'University final semester marksheet and document verification.',
    status: 'approved',
    appliedAt: '2026-08-25T08:20:00Z',
    reviewedByPC: 'Kailash Meena (PC Dewas)',
    pcComment: 'Approved. Verified with college schedule.'
  },
  {
    id: 'cml-5',
    name: 'Ankit Mourya',
    role: 'fellow',
    district: 'Hoshangabad',
    block: 'Itarsi',
    leaveType: 'casual',
    startDate: '2026-08-22',
    endDate: '2026-08-22',
    totalDays: 1,
    reason: 'Personal work in home town.',
    status: 'approved',
    appliedAt: '2026-08-20T10:15:00Z',
    reviewedByPC: 'Maheshwari Sen (PC Hoshangabad)',
    pcComment: 'Approved for 1 day.'
  },
  {
    id: 'cml-6',
    name: 'Neha Chourasiya',
    role: 'intern',
    district: 'Bhopal',
    block: 'Phanda',
    leaveType: 'unplanned',
    startDate: '2026-08-15',
    endDate: '2026-08-16',
    totalDays: 2,
    reason: 'Urgent family emergency.',
    status: 'rejected',
    appliedAt: '2026-08-14T19:00:00Z',
    reviewedByPC: 'Amit Saxena (PC Bhopal)',
    pcComment: 'Independence Day state ceremony attendance mandatory.'
  },
  {
    id: 'cml-7',
    name: 'Siddharth Dave',
    role: 'fellow',
    district: 'Dhar',
    block: 'Badnawar',
    leaveType: 'medical',
    startDate: '2026-08-11',
    endDate: '2026-08-13',
    totalDays: 3,
    reason: 'Dengue fever recovery rest.',
    status: 'approved',
    appliedAt: '2026-08-10T12:00:00Z',
    reviewedByPC: 'Naveen Chouhan (PC Dhar)',
    pcComment: 'Approved with diagnostic reports.'
  }
];

export default function AdminLeavePage() {
  const { user } = useAuth();

  // ── Role & Tab State ────────────────────────────────────────────────
  const [activeRole, setActiveRole] = useState<AdminRole>(() => {
    if (user?.pmuDesignation === 'senior_program_manager') return 'senior_program_manager';
    return 'chief_program_manager';
  });

  const [activeTab, setActiveTab] = useState<TabType>('my_leave');
  const [teamSubTab, setTeamSubTab] = useState<TeamSubTab>('coordinators');

  // Sync role if user changes
  useEffect(() => {
    if (user?.pmuDesignation === 'senior_program_manager') {
      setActiveRole('senior_program_manager');
    } else if (user?.pmuDesignation === 'chief_program_manager') {
      setActiveRole('chief_program_manager');
    }
  }, [user]);

  // ── Data State ──────────────────────────────────────────────────────
  const [myLeaves, setMyLeaves] = useState<Record<AdminRole, ManagerLeaveApplication[]>>(INITIAL_MY_LEAVES);
  const [pcLeaves, setPcLeaves] = useState<CoordinatorLeaveApplication[]>(INITIAL_PC_LEAVES);
  const [monitorLeaves] = useState<CandidateLeaveApplication[]>(INITIAL_MONITOR_LEAVES);

  // ── Modal States ────────────────────────────────────────────────────
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPcLeave, setSelectedPcLeave] = useState<CoordinatorLeaveApplication | null>(null);
  const [pcModalMode, setPcModalMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [pcRemark, setPcRemark] = useState('');
  const [selectedMonitorLeave, setSelectedMonitorLeave] = useState<CandidateLeaveApplication | null>(null);

  // ── Form State for My Leave ─────────────────────────────────────────
  const [applyForm, setApplyForm] = useState({
    leaveType: 'casual' as 'casual' | 'medical' | 'earned' | 'special',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    reason: '',
    emergencyContact: '',
    documentName: ''
  });

  // ── Filter States ───────────────────────────────────────────────────
  const [pcStatusFilter, setPcStatusFilter] = useState<string>('all');
  const [pcSearchQuery, setPcSearchQuery] = useState<string>('');

  const [monitorRoleFilter, setMonitorRoleFilter] = useState<string>('all');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<string>('all');
  const [monitorSearchQuery, setMonitorSearchQuery] = useState<string>('');

  // ── Current Manager Details ─────────────────────────────────────────
  const currentManager = MANAGER_PROFILES[activeRole];
  const currentMyLeavesList = myLeaves[activeRole] || [];

  // Calculate leave days for apply form
  const calculatedDays = useMemo(() => {
    if (!applyForm.startDate || !applyForm.endDate) return 0;
    if (applyForm.isHalfDay) return 0.5;
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [applyForm.startDate, applyForm.endDate, applyForm.isHalfDay]);

  // Handle Apply Leave Submit
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(applyForm.endDate) < new Date(applyForm.startDate)) {
      toast.error('End date cannot be earlier than start date');
      return;
    }
    if (!applyForm.reason.trim()) {
      toast.error('Please provide a reason for the leave');
      return;
    }

    const newApplication: ManagerLeaveApplication = {
      id: `ml-${activeRole}-${Date.now()}`,
      leaveType: applyForm.leaveType,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      totalDays: calculatedDays,
      isHalfDay: applyForm.isHalfDay,
      reason: applyForm.reason.trim(),
      emergencyContact: applyForm.emergencyContact.trim() || currentManager.phone,
      documentName: applyForm.documentName || undefined,
      status: 'applied',
      appliedAt: new Date().toISOString()
    };

    setMyLeaves(prev => ({
      ...prev,
      [activeRole]: [newApplication, ...(prev[activeRole] || [])]
    }));

    toast.success('Leave application submitted successfully');
    setIsApplyModalOpen(false);
    setApplyForm({
      leaveType: 'casual',
      startDate: '',
      endDate: '',
      isHalfDay: false,
      reason: '',
      emergencyContact: '',
      documentName: ''
    });
  };

  // Handle Coordinator Action (Approve / Reject)
  const handlePcDecision = (decision: 'approved' | 'rejected') => {
    if (!selectedPcLeave) return;

    if (decision === 'rejected' && !pcRemark.trim()) {
      toast.error('Please specify a rejection reason for the coordinator');
      return;
    }

    setPcLeaves(prev =>
      prev.map(item =>
        item.id === selectedPcLeave.id
          ? {
              ...item,
              status: decision,
              reviewedAt: new Date().toISOString(),
              approverComment: pcRemark.trim() || (decision === 'approved' ? `Approved by ${currentManager.designation}` : 'Rejected')
            }
          : item
      )
    );

    toast.success(
      decision === 'approved'
        ? `Leave approved for Coordinator ${selectedPcLeave.pcName}`
        : `Leave rejected for Coordinator ${selectedPcLeave.pcName}`
    );

    setSelectedPcLeave(null);
    setPcRemark('');
  };

  // Filtered PC Applications
  const filteredPcLeaves = useMemo(() => {
    return pcLeaves.filter(app => {
      const matchesStatus = pcStatusFilter === 'all' || app.status === pcStatusFilter;
      const matchesSearch =
        app.pcName.toLowerCase().includes(pcSearchQuery.toLowerCase()) ||
        app.district.toLowerCase().includes(pcSearchQuery.toLowerCase()) ||
        app.division.toLowerCase().includes(pcSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [pcLeaves, pcStatusFilter, pcSearchQuery]);

  // Filtered Monitor Applications
  const filteredMonitorLeaves = useMemo(() => {
    return monitorLeaves.filter(app => {
      const matchesRole = monitorRoleFilter === 'all' || app.role === monitorRoleFilter;
      const matchesStatus = monitorStatusFilter === 'all' || app.status === monitorStatusFilter;
      const matchesSearch =
        app.name.toLowerCase().includes(monitorSearchQuery.toLowerCase()) ||
        app.district.toLowerCase().includes(monitorSearchQuery.toLowerCase()) ||
        app.block.toLowerCase().includes(monitorSearchQuery.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [monitorLeaves, monitorRoleFilter, monitorStatusFilter, monitorSearchQuery]);

  // Counts
  const pendingPcCount = useMemo(() => pcLeaves.filter(l => l.status === 'applied').length, [pcLeaves]);
  const activeMonitorCount = useMemo(() => monitorLeaves.filter(l => l.status === 'approved').length, [monitorLeaves]);

  // Leave Balances for active manager
  const leaveBalance = useMemo(() => {
    const usedCasual = currentMyLeavesList.filter(l => l.leaveType === 'casual' && l.status === 'approved').reduce((acc, c) => acc + c.totalDays, 0);
    const usedEarned = currentMyLeavesList.filter(l => l.leaveType === 'earned' && l.status === 'approved').reduce((acc, c) => acc + c.totalDays, 0);
    const usedMedical = currentMyLeavesList.filter(l => l.leaveType === 'medical' && l.status === 'approved').reduce((acc, c) => acc + c.totalDays, 0);
    return {
      casual: { available: Math.max(0, 12 - usedCasual), total: 12 },
      earned: { available: Math.max(0, 18 - usedEarned), total: 18 },
      medical: { available: Math.max(0, 10 - usedMedical), total: 10 },
      special: { available: 2, total: 2 }
    };
  }, [currentMyLeavesList]);

  // Badge helpers
  function leaveTypeBadge(type: string) {
    switch (type) {
      case 'casual':
        return { label: 'Casual Leave (CL)', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'medical':
        return { label: 'Medical Leave (ML)', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'earned':
        return { label: 'Earned Leave (EL)', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'special':
        return { label: 'Special / Restricted', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
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
    <div className="space-y-6 pb-12">
      {/* ── FROZEN STICKY HEADER: Title + Description + Tab Switcher (stays frozen while scrolling up/down) ── */}
      <div className="sticky top-0 z-20 bg-slate-50/95 lg:bg-white/95 backdrop-blur-md -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-3.5 pb-3 sm:pt-5 sm:pb-4 border-b border-slate-200/80 shadow-2xs space-y-3 sm:space-y-4">
        {/* ── Page Header + Top-Right Apply Button ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Leave Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Apply for your leaves and review leave applications submitted by program coordinators &amp; field staff
            </p>
          </div>
          {activeTab === 'my_leave' && (
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={15} weight="bold" />
              <span className="whitespace-nowrap">Apply for Leave</span>
            </button>
          )}
        </div>

        {/* ── Sleek Segmented Tab Switch + Role Filter Card (Unified in same card) ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-auto bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-1 shadow-2xs">
            {/* Primary Switch: Apply for Leave / Review Leaves */}
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('my_leave')}
                className={cn(
                  'py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 select-none cursor-pointer text-center',
                  activeTab === 'my_leave'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                )}
              >
                <CalendarCheck
                  size={16}
                  weight={activeTab === 'my_leave' ? 'fill' : 'bold'}
                  className={activeTab === 'my_leave' ? 'text-indigo-600' : 'text-slate-500'}
                />
                <span className="truncate">Apply for Leave</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('team_leave')}
                className={cn(
                  'py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 select-none cursor-pointer relative text-center',
                  activeTab === 'team_leave'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                )}
              >
                <Users
                  size={16}
                  weight={activeTab === 'team_leave' ? 'fill' : 'bold'}
                  className={activeTab === 'team_leave' ? 'text-indigo-600' : 'text-slate-500'}
                />
                <span className="truncate">Review Leaves</span>
                {pendingPcCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border-2 border-white"></span>
                  </span>
                )}
              </button>
            </div>

            {/* Sub-Switch: Program Coordinators / Fellows (In the SAME card on desktop) */}
            {activeTab === 'team_leave' && (
              <>
                <div className="hidden sm:block w-px h-6 bg-slate-300 mx-1 shrink-0" />
                <div className="grid grid-cols-2 gap-1 border-t border-slate-200/80 pt-1 sm:border-t-0 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setTeamSubTab('coordinators')}
                    className={cn(
                      'py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 select-none cursor-pointer text-center',
                      teamSubTab === 'coordinators'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    )}
                  >
                    <UserCheck size={16} weight={teamSubTab === 'coordinators' ? 'bold' : 'regular'} />
                    <span className="truncate">Program Coordinators</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamSubTab('fellows_interns')}
                    className={cn(
                      'py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 select-none cursor-pointer text-center',
                      teamSubTab === 'fellows_interns'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    )}
                  >
                    <Users size={16} weight={teamSubTab === 'fellows_interns' ? 'bold' : 'regular'} />
                    <span className="truncate">Fellows</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: MY LEAVE
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'my_leave' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ClipboardText size={18} weight="fill" className="text-slate-500" />
              <span className="text-sm font-bold text-slate-900">My Leave Applications</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">{currentMyLeavesList.length} record(s)</span>
          </div>

          {currentMyLeavesList.length === 0 ? (
            <div className="card text-center py-12 px-4">
              <ClipboardText size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No leave applications yet</h3>
              <p className="text-xs text-slate-400 mt-1">Click &quot;Apply for Leave&quot; above to submit an application.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentMyLeavesList.map(item => {
                const tBadge = leaveTypeBadge(item.leaveType);
                const sBadge = statusBadge(item.status);
                const StatusIcon = sBadge.icon;
                const isPending = item.status === 'applied';

                return (
                  <div key={item.id} className="card p-4 sm:p-5 hover:border-slate-300 transition-all space-y-3 shadow-2xs">
                    {/* Top Row: Left = Chips (Leave Type + Days), Right = Status Badge in Top Right Corner */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('badge border text-xs font-semibold', tBadge.cls)}>
                          {tBadge.label}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/70">
                          {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                        </span>
                        {item.isHalfDay && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Half Day
                          </span>
                        )}
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
                          {formatDate(item.startDate)} &mdash; {formatDate(item.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 sm:before:content-['•'] sm:before:mr-1 sm:before:text-slate-300">
                        <span>Applied on {formatDate(item.appliedAt)}</span>
                      </div>
                    </div>

                    {/* Action Buttons: View details & Document */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                          <span className="text-xs font-semibold text-slate-700">
                            View details
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPcLeave({
                                id: item.id,
                                pcId: currentManager.id,
                                pcName: currentManager.name,
                                email: currentManager.email,
                                phone: currentManager.phone,
                                district: 'State HQ',
                                division: 'Bhopal',
                                leaveType: item.leaveType,
                                startDate: item.startDate,
                                endDate: item.endDate,
                                totalDays: item.totalDays,
                                reason: item.reason,
                                substituteName: item.approverName || 'None',
                                documentName: item.documentName,
                                status: item.status,
                                appliedAt: item.appliedAt,
                                approverComment: item.approverComment,
                              });
                              setPcModalMode('view');
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                          >
                            <Eye size={13} weight="bold" />
                            View
                          </button>
                        </div>

                        {item.documentName && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                              <FileText size={14} className="text-indigo-600 shrink-0" />
                              <span className="truncate">{item.documentName}</span>
                            </span>
                          </div>
                        )}
                      </div>

                        {isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              setMyLeaves(prev => ({
                                ...prev,
                                [activeRole]: prev[activeRole].filter(l => l.id !== item.id)
                              }));
                              toast.info('Leave application cancelled');
                            }}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                          >
                            Cancel Application
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: APPROVE & MONITOR LEAVES
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'team_leave' && (
        <div className="space-y-6">

          {/* ── Sub-Tab 1: Coordinators (Approve / Reject) ── */}
          {teamSubTab === 'coordinators' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase">Total PC Applications</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{pcLeaves.length}</div>
                </div>
                <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-amber-700 uppercase">Pending Approval</div>
                  <div className="text-2xl font-black text-amber-600 mt-2">{pendingPcCount}</div>
                </div>
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Approved Leaves</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">
                    {pcLeaves.filter(l => l.status === 'approved').length}
                  </div>
                </div>
                <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-rose-700 uppercase">Rejected Leaves</div>
                  <div className="text-2xl font-black text-rose-600 mt-2">
                    {pcLeaves.filter(l => l.status === 'rejected').length}
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-80">
                  <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Coordinator or District..."
                    value={pcSearchQuery}
                    onChange={e => setPcSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Funnel size={16} className="text-slate-500 shrink-0" />
                  <SelectPopup
                    title="Filter Status"
                    value={pcStatusFilter}
                    options={[
                      { value: 'all', label: `All Status (${pcLeaves.length})` },
                      { value: 'applied', label: `Pending Approval (${pendingPcCount})` },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                    onChange={setPcStatusFilter}
                    placeholder="All Status"
                    buttonClassName="w-full sm:w-48 text-xs font-semibold py-2 px-3 border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* PC Applications Cards (Design from 3rd screenshot) */}
              {filteredPcLeaves.length === 0 ? (
                <div className="card p-10 text-center text-slate-400 text-sm">
                  <Users size={40} className="mx-auto text-slate-300 mb-2" />
                  <h3 className="text-sm font-semibold text-slate-700">No coordinator applications found</h3>
                  <p className="text-xs text-slate-400 mt-1">Try clearing your search query or status filter.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredPcLeaves.map(item => {
                    const tBadge = leaveTypeBadge(item.leaveType);
                    const sBadge = statusBadge(item.status);
                    const StatusIcon = sBadge.icon;
                    const isPending = item.status === 'applied';
                    const initials = item.pcName.split(' ').map(n => n[0]).join('').slice(0, 2);

                    return (
                      <div key={item.id} className="card p-4 sm:p-5 hover:border-slate-300 transition space-y-3.5">
                        {/* Header Row: Avatar + Name/Location + Status Badge in Top Right */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200 shadow-inner">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 text-sm truncate">{item.pcName}</h3>
                              <span className="text-xs text-slate-400">({item.district} District)</span>
                            </div>
                          </div>

                          {/* Top Right Corner Status Badge */}
                          <span className={cn('badge border text-xs flex items-center gap-1 font-semibold shrink-0', sBadge.cls)}>
                            <StatusIcon size={12} weight="fill" />
                            {sBadge.label}
                          </span>
                        </div>

                        {/* Chips Row: Leave Type + Total Days */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('badge border text-xs font-semibold', tBadge.cls)}>
                            {tBadge.label}
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>

                        {/* Leave Duration & Applied Date */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Calendar size={14} className="text-indigo-600 shrink-0" />
                            <span>
                              Leave Duration: {formatDate(item.startDate)} &mdash; {formatDate(item.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 sm:before:content-['•'] sm:before:mr-1 sm:before:text-slate-300">
                            <span>Applied on {formatDate(item.appliedAt)}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Reason for Leave & Handover/Document */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {/* Reason for Leave */}
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                            <span className="text-xs font-semibold text-slate-700">
                              Reason for Leave
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPcLeave(item);
                                setPcModalMode('view');
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                            >
                              <Eye size={13} weight="bold" />
                              <span>View</span>
                            </button>
                          </div>

                          {/* Handover Substitute */}
                          {item.substituteName && item.substituteName !== 'None specified' && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[240px]">
                                <UserCheck size={14} className="text-indigo-600 shrink-0" />
                                <span className="truncate">Handover: {item.substituteName}</span>
                              </span>
                            </div>
                          )}

                          {/* Document if attached */}
                          {item.documentName && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                                <FileText size={14} className="text-indigo-600 shrink-0" />
                                <span className="truncate">{item.documentName}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPcLeave(item);
                                  setPcModalMode('view');
                                }}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                              >
                                <Eye size={13} weight="bold" />
                                <span>View</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Approver Remark if processed */}
                        {item.approverComment && (
                          <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2">
                            <strong>Sanction Remark:</strong> {item.approverComment}
                          </div>
                        )}

                        {/* Bottom Action Buttons: Approve / Reject 50-50 Grid */}
                        {isPending ? (
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPcLeave(item);
                                setPcModalMode('approve');
                                setPcRemark(`Sanctioned by ${currentManager.designation}`);
                              }}
                              className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <Check size={16} weight="bold" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPcLeave(item);
                                setPcModalMode('reject');
                                setPcRemark('');
                              }}
                              className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              <X size={16} weight="bold" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPcLeave(item);
                                setPcModalMode('view');
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            >
                              View Details &rarr;
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Sub-Tab 2: Fellows & Interns (Monitor Only) ── */}
          {teamSubTab === 'fellows_interns' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase">Total Monitored</div>
                  <div className="text-2xl font-black text-slate-900 mt-2">{monitorLeaves.length}</div>
                </div>
                <div className="bg-blue-50/40 border border-blue-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-blue-700 uppercase">Fellow Applications</div>
                  <div className="text-2xl font-black text-blue-600 mt-2">
                    {monitorLeaves.filter(l => l.role === 'fellow').length}
                  </div>
                </div>
                <div className="bg-purple-50/40 border border-purple-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-purple-700 uppercase">Intern Applications</div>
                  <div className="text-2xl font-black text-purple-600 mt-2">
                    {monitorLeaves.filter(l => l.role === 'intern').length}
                  </div>
                </div>
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs font-bold text-emerald-700 uppercase">Currently Approved</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">{activeMonitorCount}</div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="relative w-full md:w-80">
                  <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate, district, block..."
                    value={monitorSearchQuery}
                    onChange={e => setMonitorSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMonitorRoleFilter('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        monitorRoleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      All ({monitorLeaves.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonitorRoleFilter('fellow')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        monitorRoleFilter === 'fellow' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      Fellows ({monitorLeaves.filter(l => l.role === 'fellow').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonitorRoleFilter('intern')}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        monitorRoleFilter === 'intern' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      Interns ({monitorLeaves.filter(l => l.role === 'intern').length})
                    </button>
                  </div>

                  <select
                    value={monitorStatusFilter}
                    onChange={e => setMonitorStatusFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-xl py-2 px-3 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="applied">Applied (Pending PC)</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Monitor Applications Cards (Design from 3rd screenshot) */}
              {filteredMonitorLeaves.length === 0 ? (
                <div className="card p-10 text-center text-slate-400 text-sm">
                  <ClipboardText size={40} className="mx-auto text-slate-300 mb-2" />
                  <h3 className="text-sm font-semibold text-slate-700">No records found</h3>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredMonitorLeaves.map(item => {
                    const tBadge = leaveTypeBadge(item.leaveType);
                    const sBadge = statusBadge(item.status);
                    const StatusIcon = sBadge.icon;
                    const initials = item.name.split(' ').map(n => n[0]).join('').slice(0, 2);

                    return (
                      <div key={item.id} className="card p-4 sm:p-5 hover:border-slate-300 transition space-y-3.5">
                        {/* Header Row: Avatar + Name/Location + Status Badge in Top Right */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 shadow-inner">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 text-sm truncate">{item.name}</h3>
                              <span className="text-xs text-slate-400">
                                {item.district} &bull; Block: {item.block}
                              </span>
                            </div>
                          </div>

                          {/* Top Right Corner Status Badge */}
                          <span className={cn('badge border text-xs flex items-center gap-1 font-semibold shrink-0', sBadge.cls)}>
                            <StatusIcon size={12} weight="fill" />
                            {item.status === 'applied' ? 'Pending PC' : sBadge.label}
                          </span>
                        </div>

                        {/* Chips Row: Role + Leave Type + Total Days */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border',
                            item.role === 'fellow'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          )}>
                            {item.role}
                          </span>
                          <span className={cn('badge border text-xs font-semibold', tBadge.cls)}>
                            {tBadge.label}
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>

                        {/* Leave Duration & Applied Date */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Calendar size={14} className="text-indigo-600 shrink-0" />
                            <span>
                              Leave Duration: {formatDate(item.startDate)} &mdash; {formatDate(item.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 sm:before:content-['•'] sm:before:mr-1 sm:before:text-slate-300">
                            <span>Applied on {formatDate(item.appliedAt)}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Reason for Leave & PC Reviewer */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                              <span className="text-xs font-semibold text-slate-700">
                                Reason for Leave
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedMonitorLeave(item)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                              >
                                <Eye size={13} weight="bold" />
                                <span>View</span>
                              </button>
                            </div>

                            {item.reviewedByPC && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
                                <UserCheck size={14} className="text-indigo-600 shrink-0" />
                                <span>Reviewed by: <strong className="text-slate-800">{item.reviewedByPC}</strong></span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedMonitorLeave(item)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Full Details &rarr;
                          </button>
                        </div>

                        {item.pcComment && (
                          <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2">
                            <strong>Coordinator Note:</strong> &quot;{item.pcComment}&quot;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: APPLY LEAVE (FOR PROGRAM MANAGER)
         ══════════════════════════════════════════════════════════════════ */}
      {isApplyModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-300 ring-1 ring-black/10 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in duration-150">
            {/* Modal Header with distinct boundary */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                  <CalendarCheck size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Apply Leave</h3>
                  <p className="text-xs text-slate-500">{currentManager.designation}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleApplySubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Leave Type Popup */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Leave Type *
                  </label>
                  <SelectPopup
                    title="Select Leave Type"
                    value={applyForm.leaveType}
                    options={[
                      { value: 'casual', label: `Casual Leave (CL) - Available: ${leaveBalance.casual.available} Days` },
                      { value: 'earned', label: `Earned Leave (EL) - Available: ${leaveBalance.earned.available} Days` },
                      { value: 'medical', label: `Medical Leave (ML) - Available: ${leaveBalance.medical.available} Days` },
                      { value: 'special', label: `Special / Restricted Holiday - Available: ${leaveBalance.special.available} Days` },
                    ]}
                    onChange={val => setApplyForm(f => ({ ...f, leaveType: val as any }))}
                    placeholder="Select Leave Type"
                    buttonClassName="w-full text-sm border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800"
                  />
                </div>

                {/* Half Day Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="half-day-check"
                    checked={applyForm.isHalfDay}
                    onChange={e => setApplyForm(f => ({ ...f, isHalfDay: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="half-day-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Half Day Leave
                  </label>
                </div>

                {/* Date Pickers via Popups */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Start Date *
                    </label>
                    <DatePopup
                      value={applyForm.startDate}
                      onChange={val => setApplyForm(f => ({ ...f, startDate: val }))}
                      placeholder="dd-mm-yyyy"
                      buttonClassName="w-full text-sm border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      End Date *
                    </label>
                    <DatePopup
                      value={applyForm.endDate}
                      onChange={val => setApplyForm(f => ({ ...f, endDate: val }))}
                      placeholder="dd-mm-yyyy"
                      buttonClassName="w-full text-sm border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Calculated Total Days */}
                {calculatedDays > 0 && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                    <span className="text-indigo-800 font-semibold">Calculated Leave Duration:</span>
                    <span className="font-extrabold text-indigo-900 bg-indigo-200/60 px-2.5 py-1 rounded-md">
                      {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reason for Leave *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Specify official or personal justification for leave..."
                    value={applyForm.reason}
                    onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Emergency Reachable Number
                  </label>
                  <input
                    type="text"
                    placeholder={currentManager.phone}
                    value={applyForm.emergencyContact}
                    onChange={e => setApplyForm(f => ({ ...f, emergencyContact: e.target.value }))}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Document attachment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Supporting Document (Optional for Medical/Official)
                  </label>
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between bg-slate-50">
                    <span className="text-xs text-slate-500 truncate max-w-[240px]">
                      {applyForm.documentName || 'No document attached'}
                    </span>
                    <label className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer shadow-2xs">
                      <UploadSimple size={14} />
                      Choose File
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setApplyForm(f => ({ ...f, documentName: e.target.files![0].name }));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer with distinct boundary */}
              <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/90 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: COORDINATOR LEAVE REVIEW / APPROVAL / REJECTION
         ══════════════════════════════════════════════════════════════════ */}
      {selectedPcLeave && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {pcModalMode === 'approve' && 'Approve Coordinator Leave'}
                  {pcModalMode === 'reject' && 'Reject Coordinator Leave'}
                  {pcModalMode === 'view' && 'Coordinator Leave Details'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPcLeave.pcName} • {selectedPcLeave.district} ({selectedPcLeave.division})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPcLeave(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-xs text-slate-700 border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Leave Type:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedPcLeave.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Dates:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(selectedPcLeave.startDate)} → {formatDate(selectedPcLeave.endDate)} ({selectedPcLeave.totalDays} Days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Substitute Handover:</span>
                  <span className="font-semibold text-indigo-700">{selectedPcLeave.substituteName}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-500 block mb-1">Reason:</span>
                  <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                    {selectedPcLeave.reason}
                  </p>
                </div>
                {selectedPcLeave.documentName && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-medium text-slate-500">Attachment:</span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <FileText size={14} /> {selectedPcLeave.documentName}
                    </span>
                  </div>
                )}
              </div>

              {/* Approval or Rejection Remark Input */}
              {pcModalMode !== 'view' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {pcModalMode === 'approve' ? 'Approval Remark / Instructions (Optional)' : 'Rejection Reason *'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      pcModalMode === 'approve'
                        ? 'e.g. Sanctioned. Ensure daily progress updates with substitute coordinator.'
                        : 'e.g. Critical state mission in district on selected dates.'
                    }
                    value={pcRemark}
                    onChange={e => setPcRemark(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPcLeave(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {pcModalMode === 'approve' && (
                  <button
                    type="button"
                    onClick={() => handlePcDecision('approved')}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <Check size={16} weight="bold" />
                    Confirm Approval
                  </button>
                )}
                {pcModalMode === 'reject' && (
                  <button
                    type="button"
                    onClick={() => handlePcDecision('rejected')}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <X size={16} weight="bold" />
                    Confirm Rejection
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: MONITOR FELLOW / INTERN DETAILS
         ══════════════════════════════════════════════════════════════════ */}
      {selectedMonitorLeave && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Candidate Leave Record</h3>
                <p className="text-xs text-slate-500">
                  {selectedMonitorLeave.name} ({selectedMonitorLeave.role.toUpperCase()})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMonitorLeave(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">District & Block:</span>
                <span className="font-semibold text-slate-900">{selectedMonitorLeave.district} - {selectedMonitorLeave.block}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Leave Type:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedMonitorLeave.leaveType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Dates:</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(selectedMonitorLeave.startDate)} → {formatDate(selectedMonitorLeave.endDate)} ({selectedMonitorLeave.totalDays} Days)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold capitalize text-slate-900">{selectedMonitorLeave.status}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block mb-1">Reason:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                  {selectedMonitorLeave.reason}
                </p>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block mb-1">Program Coordinator Action:</span>
                <p className="bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 text-indigo-950 font-medium">
                  {selectedMonitorLeave.reviewedByPC}
                  {selectedMonitorLeave.pcComment && (
                    <span className="block mt-1 font-normal text-indigo-800 text-[11px] italic">
                      &quot;{selectedMonitorLeave.pcComment}&quot;
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMonitorLeave(null)}
                className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
