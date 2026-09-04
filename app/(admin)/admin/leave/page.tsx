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
  Sparkle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/auth/context';

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
  leaveType: 'casual' | 'medical' | 'earned';
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

  return (
    <div className="space-y-6 pb-12">
      {/* ── Minimalist Clean Header: Title + Role Name + Role Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave Management</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            <ShieldCheck size={14} weight="fill" className="text-indigo-600" />
            {activeRole === 'chief_program_manager' ? 'Chief Program Manager' : 'Senior Program Manager'}
          </span>
        </div>

        {/* 2 Clean Role Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveRole('chief_program_manager');
              toast.info('Switched view to Chief Program Manager');
            }}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeRole === 'chief_program_manager'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Chief Program Manager
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRole('senior_program_manager');
              toast.info('Switched view to Senior Program Manager');
            }}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeRole === 'senior_program_manager'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Senior Program Manager
          </button>
        </div>
      </div>

      {/* ── Enhanced Visual KPIs (Leave Balance Cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Casual Leave */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 border border-blue-200/70 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Casual Leave</span>
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">CL</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{leaveBalance.casual.available}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {leaveBalance.casual.total} Days Left</span>
          </div>
          <div className="w-full bg-blue-100/80 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(leaveBalance.casual.available / leaveBalance.casual.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Earned Leave */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-200/70 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Earned Leave</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">EL</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{leaveBalance.earned.available}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {leaveBalance.earned.total} Days Left</span>
          </div>
          <div className="w-full bg-emerald-100/80 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(leaveBalance.earned.available / leaveBalance.earned.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Medical Leave */}
        <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/30 border border-rose-200/70 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Medical Leave</span>
            <span className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">ML</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{leaveBalance.medical.available}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {leaveBalance.medical.total} Days Left</span>
          </div>
          <div className="w-full bg-rose-100/80 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(leaveBalance.medical.available / leaveBalance.medical.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Special Leave */}
        <div className="bg-gradient-to-br from-purple-50/70 to-violet-50/30 border border-purple-200/70 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Special / Restricted</span>
            <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">SL</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{leaveBalance.special.available}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {leaveBalance.special.total} Days Left</span>
          </div>
          <div className="w-full bg-purple-100/80 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-violet-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(leaveBalance.special.available / leaveBalance.special.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 2 Main Tabs ── */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-xs px-2">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {/* Tab 1: My Leave */}
          <button
            type="button"
            onClick={() => setActiveTab('my_leave')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'my_leave'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <CalendarCheck size={18} weight={activeTab === 'my_leave' ? 'bold' : 'regular'} />
            <span>1. My Leave</span>
            <span
              className={cn(
                'ml-1 px-2 py-0.5 rounded-full text-xs font-bold',
                activeTab === 'my_leave' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              )}
            >
              {currentMyLeavesList.length}
            </span>
          </button>

          {/* Tab 2: Approve & Monitor Leaves (Combined in 1 Tab) */}
          <button
            type="button"
            onClick={() => setActiveTab('team_leave')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'team_leave'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Users size={18} weight={activeTab === 'team_leave' ? 'bold' : 'regular'} />
            <span>2. Approve & Monitor Leaves</span>
            {pendingPcCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {pendingPcCount} Pending
              </span>
            )}
            <span
              className={cn(
                'ml-1 px-2 py-0.5 rounded-full text-xs font-bold',
                activeTab === 'team_leave' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              )}
            >
              {pcLeaves.length + monitorLeaves.length}
            </span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: MY LEAVE
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'my_leave' && (
        <div className="space-y-6">
          {/* Action Bar & Apply Button */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4.5 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                My Leave Applications
              </h2>
              <p className="text-xs text-slate-500">
                Track status of your submitted leaves or apply for a new leave.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={18} weight="bold" />
              <span>+ Apply My Leave</span>
            </button>
          </div>

          {/* My Leaves Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {currentMyLeavesList.length === 0 ? (
              <div className="text-center py-12 px-4">
                <ClipboardText size={40} className="mx-auto text-slate-300 mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No leave applications yet</h3>
                <p className="text-xs text-slate-400 mt-1">Click &quot;+ Apply My Leave&quot; above to submit an application.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-3.5">Leave Type</th>
                      <th className="px-5 py-3.5">Duration & Dates</th>
                      <th className="px-5 py-3.5">Total Days</th>
                      <th className="px-5 py-3.5">Reason</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Applied Date</th>
                      <th className="px-5 py-3.5">Sanctioning Authority</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentMyLeavesList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                            item.leaveType === 'casual' && 'bg-blue-50 text-blue-700 border border-blue-200',
                            item.leaveType === 'earned' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                            item.leaveType === 'medical' && 'bg-rose-50 text-rose-700 border border-rose-200',
                            item.leaveType === 'special' && 'bg-purple-50 text-purple-700 border border-purple-200'
                          )}>
                            {item.leaveType}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(item.startDate)} → {formatDate(item.endDate)}
                          {item.isHalfDay && (
                            <span className="block text-xs font-normal text-amber-600 mt-0.5">Half Day Leave</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                        </td>
                        <td className="px-5 py-4 text-slate-600 max-w-xs truncate" title={item.reason}>
                          {item.reason}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize',
                            item.status === 'applied' && 'bg-amber-50 text-amber-700 border border-amber-200',
                            item.status === 'approved' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                            item.status === 'rejected' && 'bg-rose-50 text-rose-700 border border-rose-200'
                          )}>
                            {item.status === 'applied' && <Clock size={12} weight="bold" className="text-amber-500" />}
                            {item.status === 'approved' && <CheckCircle size={12} weight="fill" className="text-emerald-500" />}
                            {item.status === 'rejected' && <XCircle size={12} weight="fill" className="text-rose-500" />}
                            {item.status === 'applied' ? 'Pending Approval' : item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(item.appliedAt)}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {item.approverName || 'State Project Director'}
                          {item.approverComment && (
                            <p className="text-slate-400 italic text-[11px] mt-0.5">&quot;{item.approverComment}&quot;</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {item.status === 'applied' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMyLeaves(prev => ({
                                  ...prev,
                                  [activeRole]: prev[activeRole].filter(l => l.id !== item.id)
                                }));
                                toast.info('Leave application cancelled');
                              }}
                              className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: APPROVE & MONITOR LEAVES
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'team_leave' && (
        <div className="space-y-6">
          {/* Sub-Tabs Switcher */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setTeamSubTab('coordinators')}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                teamSubTab === 'coordinators'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <UserCheck size={18} weight={teamSubTab === 'coordinators' ? 'bold' : 'regular'} />
              <span>Program Coordinators (Approve / Reject)</span>
              {pendingPcCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white animate-pulse">
                  {pendingPcCount} Pending
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  {pcLeaves.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTeamSubTab('fellows_interns')}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                teamSubTab === 'fellows_interns'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <Users size={18} weight={teamSubTab === 'fellows_interns' ? 'bold' : 'regular'} />
              <span>Fellows & Interns (Monitor Only)</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                {monitorLeaves.length}
              </span>
            </button>
          </div>

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
                  <Funnel size={16} className="text-slate-500" />
                  <select
                    value={pcStatusFilter}
                    onChange={e => setPcStatusFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-xl py-2 px-3 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Status ({pcLeaves.length})</option>
                    <option value="applied">Pending Approval ({pendingPcCount})</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* PC Applications Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {filteredPcLeaves.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Users size={40} className="mx-auto text-slate-300 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700">No coordinator applications found</h3>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or status filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          <th className="px-5 py-3.5">Coordinator Name</th>
                          <th className="px-5 py-3.5">District / Division</th>
                          <th className="px-5 py-3.5">Leave Type</th>
                          <th className="px-5 py-3.5">Dates & Duration</th>
                          <th className="px-5 py-3.5">Reason & Handover</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-right">Sanction Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPcLeaves.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{item.pcName}</div>
                              <div className="text-xs text-slate-400">{item.email} • {item.phone}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-800 flex items-center gap-1">
                                <MapPin size={13} className="text-indigo-600" />
                                {item.district}
                              </div>
                              <div className="text-xs text-slate-500">{item.division}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                                item.leaveType === 'casual' && 'bg-blue-50 text-blue-700 border border-blue-200',
                                item.leaveType === 'medical' && 'bg-rose-50 text-rose-700 border border-rose-200',
                                item.leaveType === 'earned' && 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              )}>
                                {item.leaveType}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="font-medium text-slate-900">
                                {formatDate(item.startDate)} → {formatDate(item.endDate)}
                              </div>
                              <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                              </div>
                            </td>
                            <td className="px-5 py-4 max-w-xs">
                              <div className="text-slate-700 text-xs line-clamp-2" title={item.reason}>
                                {item.reason}
                              </div>
                              <div className="text-[11px] text-indigo-700 mt-1 font-medium bg-indigo-50 px-2 py-0.5 rounded inline-block">
                                Handover: {item.substituteName}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize',
                                item.status === 'applied' && 'bg-amber-50 text-amber-700 border border-amber-200',
                                item.status === 'approved' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                item.status === 'rejected' && 'bg-rose-50 text-rose-700 border border-rose-200'
                              )}>
                                {item.status === 'applied' && <Clock size={12} weight="bold" className="text-amber-500" />}
                                {item.status === 'approved' && <CheckCircle size={12} weight="fill" className="text-emerald-500" />}
                                {item.status === 'rejected' && <XCircle size={12} weight="fill" className="text-rose-500" />}
                                {item.status === 'applied' ? 'Pending Approval' : item.status}
                              </span>
                              {item.approverComment && (
                                <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1 max-w-[140px]" title={item.approverComment}>
                                  &quot;{item.approverComment}&quot;
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              {item.status === 'applied' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPcLeave(item);
                                      setPcModalMode('approve');
                                      setPcRemark(`Sanctioned by ${currentManager.designation}`);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                                  >
                                    <Check size={14} weight="bold" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPcLeave(item);
                                      setPcModalMode('reject');
                                      setPcRemark('');
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                                  >
                                    <X size={14} weight="bold" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPcLeave(item);
                                    setPcModalMode('view');
                                  }}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                >
                                  View Details
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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

              {/* Monitor Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {filteredMonitorLeaves.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <ClipboardText size={40} className="mx-auto text-slate-300 mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700">No records found</h3>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          <th className="px-5 py-3.5">Candidate</th>
                          <th className="px-5 py-3.5">Role</th>
                          <th className="px-5 py-3.5">District / Block</th>
                          <th className="px-5 py-3.5">Leave Type</th>
                          <th className="px-5 py-3.5">Duration</th>
                          <th className="px-5 py-3.5">Reason</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Handled by Coordinator</th>
                          <th className="px-5 py-3.5 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMonitorLeaves.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {item.name}
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-bold capitalize',
                                item.role === 'fellow' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              )}>
                                {item.role}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs">
                              <div className="font-semibold text-slate-800">{item.district}</div>
                              <div className="text-slate-500">Block: {item.block}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="capitalize px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                {item.leaveType}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-xs">
                              <div className="font-medium text-slate-900">
                                {formatDate(item.startDate)} → {formatDate(item.endDate)}
                              </div>
                              <div className="text-slate-500 mt-0.5 font-semibold">
                                {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                              </div>
                            </td>
                            <td className="px-5 py-4 max-w-xs text-xs text-slate-600 truncate" title={item.reason}>
                              {item.reason}
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize',
                                item.status === 'applied' && 'bg-amber-50 text-amber-700 border border-amber-200',
                                item.status === 'approved' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                item.status === 'rejected' && 'bg-rose-50 text-rose-700 border border-rose-200'
                              )}>
                                {item.status === 'applied' && <Clock size={12} weight="bold" className="text-amber-500" />}
                                {item.status === 'approved' && <CheckCircle size={12} weight="fill" className="text-emerald-500" />}
                                {item.status === 'rejected' && <XCircle size={12} weight="fill" className="text-rose-500" />}
                                {item.status === 'applied' ? 'Pending PC' : item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-600">
                              <div className="font-medium text-slate-800">{item.reviewedByPC}</div>
                              {item.pcComment && (
                                <div className="text-slate-400 text-[11px] italic line-clamp-1 max-w-[150px]" title={item.pcComment}>
                                  &quot;{item.pcComment}&quot;
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedMonitorLeave(item)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: APPLY LEAVE (FOR PROGRAM MANAGER)
         ══════════════════════════════════════════════════════════════════ */}
      {isApplyModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CalendarCheck size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Apply Leave</h3>
                  <p className="text-xs text-slate-500">{currentManager.designation}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4">
              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Leave Type *
                </label>
                <select
                  value={applyForm.leaveType}
                  onChange={e => setApplyForm(f => ({ ...f, leaveType: e.target.value as any }))}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="casual">Casual Leave (CL) - Available: {leaveBalance.casual.available} Days</option>
                  <option value="earned">Earned Leave (EL) - Available: {leaveBalance.earned.available} Days</option>
                  <option value="medical">Medical Leave (ML) - Available: {leaveBalance.medical.available} Days</option>
                  <option value="special">Special / Restricted Holiday - Available: {leaveBalance.special.available} Days</option>
                </select>
              </div>

              {/* Half Day Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="half-day-check"
                  checked={applyForm.isHalfDay}
                  onChange={e => setApplyForm(f => ({ ...f, isHalfDay: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="half-day-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Half Day Leave
                </label>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={e => setApplyForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={e => setApplyForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <span className="text-xs text-slate-500 truncate max-w-[280px]">
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
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
