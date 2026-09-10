'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { exitApi } from '@/lib/api/exit';
import type { ExitRequest } from '@/types/models';
import { cn, exitStatusColor, exitStatusLabel, formatDate, roleLabel, downloadBlob } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ExitPerformanceAuditModal from '@/components/exit/ExitPerformanceAuditModal';
import { useAuth } from '@/lib/auth/context';
import {
  ArrowCircleUpRight,
  Warning,
  CheckCircle,
  ClipboardText,
  Certificate,
  DownloadSimple,
  Eye,
  MagnifyingGlass,
  ShieldCheck,
  Check,
  X,
  Clock,
  CheckSquare,
  ArrowLeft,
  MapPin,
  Users,
  Briefcase,
  CaretDown,
} from '@phosphor-icons/react';
import { MP_LOCATION_HIERARCHY } from '@/lib/utils/locationData';
import SelectPopup from '@/components/shared/SelectPopup';
import { toast } from 'sonner';

type FilterTab = 'pending' | 'intern' | 'fellow' | 'pc' | 'approved' | 'all';

export default function ProgramManagerExitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<ExitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-card Certificate toggle state
  const [certSwitchMap, setCertSwitchMap] = useState<Record<string, boolean>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Deliverables Audit Modal (opened only when clicking 'View Details')
  const [selectedRequest, setSelectedRequest] = useState<ExitRequest | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await exitApi.list();
      setData(res.items);

      // Initialize certificate switch for each request
      const initMap: Record<string, boolean> = {};
      res.items.forEach((r) => {
        initMap[r.id] = r.incompleteTasks === 0 && (r.certificateEligible ?? true);
      });
      setCertSwitchMap(initMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load exit requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Administrative Location Filters (all defaulted to 'all')
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');

  // Available divisions from MP hierarchy
  const availableDivisions = useMemo(() => MP_LOCATION_HIERARCHY, []);

  // Available districts based on selected division
  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'all') {
      return MP_LOCATION_HIERARCHY.flatMap((d) => d.districts || []);
    }
    const div = MP_LOCATION_HIERARCHY.find((d) => d.name === selectedDivision);
    return div?.districts || [];
  }, [selectedDivision]);

  // Available blocks based on selected district
  const availableBlocks = useMemo(() => {
    if (selectedDistrict === 'all') {
      if (selectedDivision === 'all') {
        return MP_LOCATION_HIERARCHY.flatMap((d) => (d.districts || []).flatMap((dst) => dst.blocks || []));
      }
      const div = MP_LOCATION_HIERARCHY.find((d) => d.name === selectedDivision);
      return (div?.districts || []).flatMap((dst) => dst.blocks || []);
    }
    const dst = availableDistricts.find((d) => d.name === selectedDistrict);
    return dst?.blocks || [];
  }, [selectedDistrict, selectedDivision, availableDistricts]);

  const handleDivisionChange = (newDiv: string) => {
    setSelectedDivision(newDiv);
    setSelectedDistrict('all');
    setSelectedBlock('all');
  };

  const handleDistrictChange = (newDst: string) => {
    setSelectedDistrict(newDst);
    setSelectedBlock('all');
  };

  const handleResetLocations = () => {
    setSelectedDivision('all');
    setSelectedDistrict('all');
    setSelectedBlock('all');
  };

  // Filter data first by administrative location
  const locationFilteredData = useMemo(() => {
    return data.filter((req) => {
      if (selectedDivision !== 'all' && req.division && req.division !== selectedDivision) return false;
      if (selectedDistrict !== 'all' && req.district && req.district !== selectedDistrict) return false;
      if (selectedBlock !== 'all' && req.block && req.block !== selectedBlock) return false;
      return true;
    });
  }, [data, selectedDivision, selectedDistrict, selectedBlock]);

  // Statistics calculation (scoped to active location filter)
  const stats = useMemo(() => {
    const pendingTotal = locationFilteredData.filter(
      (r) => r.status === 'pending_pm_review' || r.status === 'pending'
    ).length;
    const internPending = locationFilteredData.filter(
      (r) =>
        (r.status === 'pending_pm_review' || r.status === 'pending') &&
        (r.applicantRole === 'intern' || r.applicant.role === 'intern')
    ).length;
    const fellowPending = locationFilteredData.filter(
      (r) =>
        r.status === 'pending_pm_review' &&
        (r.applicantRole === 'fellow' || r.applicant.role === 'fellow')
    ).length;
    const pcPending = locationFilteredData.filter(
      (r) =>
        (r.status === 'pending_pm_review' || r.status === 'pending') &&
        (r.applicantRole === 'pc' || r.applicant.role === 'pc')
    ).length;
    const certsIssued = locationFilteredData.filter((r) => r.certificateIssued).length;

    return {
      pendingTotal,
      internPending,
      fellowPending,
      pcPending,
      certsIssued,
    };
  }, [locationFilteredData]);

  // KPI card items configuration for circular mobile bar and desktop grid
  const kpiItems = useMemo(
    () => [
      {
        key: 'pending' as FilterTab,
        label: 'Pending',
        mobileLabel: 'Pending',
        desktopTitle: 'Pending PM Review',
        desktopSub: 'Awaiting decision',
        value: stats.pendingTotal,
        icon: Clock,
        color: 'text-amber-600',
        activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
        activeText: 'text-white',
        activeSub: 'text-amber-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-400/30',
        activeDesktopText: 'text-amber-950',
        activeDesktopIconBg: 'bg-amber-500 text-white shadow-xs',
      },
      {
        key: 'intern' as FilterTab,
        label: 'Interns',
        mobileLabel: 'Interns',
        desktopTitle: 'Intern Exits',
        desktopSub: 'Direct to PM',
        value: stats.internPending,
        icon: Users,
        color: 'text-blue-600',
        activeStyle: 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300/60',
        activeText: 'text-white',
        activeSub: 'text-blue-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-xs ring-1 ring-blue-400/30',
        activeDesktopText: 'text-blue-950',
        activeDesktopIconBg: 'bg-blue-600 text-white shadow-xs',
      },
      {
        key: 'fellow' as FilterTab,
        label: 'Fellows',
        mobileLabel: 'Fellows',
        desktopTitle: 'Fellow Exits',
        desktopSub: 'PC forwarded',
        value: stats.fellowPending,
        icon: ShieldCheck,
        color: 'text-indigo-600',
        activeStyle: 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300/60',
        activeText: 'text-white',
        activeSub: 'text-indigo-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-xs ring-1 ring-indigo-400/30',
        activeDesktopText: 'text-indigo-950',
        activeDesktopIconBg: 'bg-indigo-600 text-white shadow-xs',
      },
      {
        key: 'pc' as FilterTab,
        label: 'Coords',
        mobileLabel: 'Coords',
        desktopTitle: 'Coordinator Exits',
        desktopSub: 'Direct to PM',
        value: stats.pcPending,
        icon: Briefcase,
        color: 'text-purple-600',
        activeStyle: 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300/60',
        activeText: 'text-white',
        activeSub: 'text-purple-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-purple-50/90 border-purple-300 text-purple-950 shadow-xs ring-1 ring-purple-400/30',
        activeDesktopText: 'text-purple-950',
        activeDesktopIconBg: 'bg-purple-600 text-white shadow-xs',
      },
      {
        key: 'approved' as FilterTab,
        label: 'Issued',
        mobileLabel: 'Issued',
        desktopTitle: 'Certificates Issued',
        desktopSub: 'Official completion',
        value: stats.certsIssued,
        icon: Certificate,
        color: 'text-emerald-600',
        activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
        activeText: 'text-white',
        activeSub: 'text-emerald-100',
        activeIcon: 'text-white',
        activeDesktopStyle: 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs ring-1 ring-emerald-400/30',
        activeDesktopText: 'text-emerald-950',
        activeDesktopIconBg: 'bg-emerald-600 text-white shadow-xs',
      },
    ],
    [stats]
  );

  // Filtered requests based on active tab, search, and location
  const filteredData = useMemo(() => {
    return locationFilteredData.filter((req) => {
      const role = req.applicantRole || req.applicant.role;
      if (activeTab === 'pending') {
        if (req.status !== 'pending_pm_review' && req.status !== 'pending') return false;
      } else if (activeTab === 'intern') {
        if (role !== 'intern') return false;
      } else if (activeTab === 'fellow') {
        if (role !== 'fellow') return false;
      } else if (activeTab === 'pc') {
        if (role !== 'pc') return false;
      } else if (activeTab === 'approved') {
        if (req.status !== 'approved' && req.status !== 'force_approved') return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = req.applicant.name.toLowerCase().includes(query);
        const matchesReason = req.reason?.toLowerCase().includes(query) ?? false;
        const matchesLoc = [req.division, req.district, req.block].some((l) => l?.toLowerCase().includes(query));
        return matchesName || matchesReason || matchesLoc;
      }

      return true;
    });
  }, [locationFilteredData, activeTab, searchQuery]);

  const toggleCertSwitch = (id: string) => {
    setCertSwitchMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleQuickApprove = async (req: ExitRequest, force = false) => {
    setActionInProgress(req.id);
    const shouldIssueCert = certSwitchMap[req.id] ?? (req.incompleteTasks === 0);
    try {
      await exitApi.pmReview(req.id, {
        action: force ? 'force_approve' : 'approve',
        issueCertificate: shouldIssueCert,
        comment: force
          ? 'Force-approved by Program Manager (HR) with tasks waived.'
          : shouldIssueCert
          ? 'Approved with Certificate of Completion awarded.'
          : 'Approved without Certificate of Completion.',
        pmUser: { id: user?.id ?? 'pm-hr-01', name: user?.name ?? 'Sunil Sharma', role: 'pm' },
      });
      toast.success(
        force
          ? 'Exit force-approved (tasks waived)'
          : `Exit approved${shouldIssueCert ? ' & Certificate issued' : ''}`
      );
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleQuickReject = async (req: ExitRequest) => {
    setActionInProgress(req.id);
    try {
      await exitApi.pmReview(req.id, {
        action: 'reject',
        issueCertificate: false,
        comment: 'Exit application rejected by Program Manager (HR).',
        pmUser: { id: user?.id ?? 'pm-hr-01', name: user?.name ?? 'Sunil Sharma', role: 'pm' },
      });
      toast.success('Exit application rejected');
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDownloadCert = async (req: ExitRequest) => {
    try {
      const blob = await exitApi.downloadCertificate(req.id);
      downloadBlob(blob as Blob, `CMYP-Completion-Certificate-${req.applicant.name}.pdf`);
      toast.success('Certificate downloaded');
    } catch {
      toast.error('Failed to download certificate');
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.history.back();
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          router.push('/login');
        }
      }, 150);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── FROZEN STICKY HEADER: Title + Circular KPIs ── */}
      <div className="sticky top-0 z-20 bg-slate-50/95 lg:bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 lg:-mt-8 pt-3.5 pb-2.5 sm:pt-4 sm:pb-3 border-b border-slate-200/80 shadow-xs space-y-2.5 sm:space-y-3">
        {/* Header - Aligned cleanly */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 whitespace-nowrap">Exit Management</h1>
                <span className="badge bg-[#162F5E] text-white text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                  Program Manager (HR)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Review candidate exits directly, toggle completion certificates, and take approval decisions on the main card.
              </p>
            </div>
          </div>
        </div>

        {/* ── KPI Cards: Phone View (Circular Shape from Task Page) ── */}
        <div className="flex sm:hidden items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth snap-x">
          {kpiItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.key;
            return (
              <button
                key={`phone-${item.key}`}
                type="button"
                onClick={() => setActiveTab((prev) => (prev === item.key ? 'all' : item.key))}
                title={`Filter by ${item.desktopTitle}`}
                className={cn(
                  'group shrink-0 w-[72px] h-[72px] rounded-full aspect-square snap-start flex flex-col items-center justify-center p-1 border transition-all duration-200 cursor-pointer select-none text-center',
                  isSelected
                    ? item.activeStyle
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 shadow-2xs'
                )}
              >
                <Icon
                  size={13}
                  weight={isSelected ? 'fill' : 'bold'}
                  className={cn(
                    'shrink-0 mb-0.5 transition-colors',
                    isSelected ? item.activeIcon : item.color
                  )}
                />
                <span
                  className={cn(
                    'text-base font-black tracking-tight leading-none',
                    isSelected ? item.activeText : 'text-slate-800'
                  )}
                >
                  {item.value}
                </span>
                <span
                  className={cn(
                    'text-[8.5px] font-semibold tracking-tight mt-0.5 max-w-[62px] truncate px-0.5 text-center leading-tight',
                    isSelected ? item.activeSub : 'text-slate-500'
                  )}
                >
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── KPI Cards: Desktop View (5 Rounded Cards in Grid) ── */}
        <div className="hidden sm:grid sm:grid-cols-5 sm:gap-3">
          {kpiItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.key;
            return (
              <button
                key={`desktop-${item.key}`}
                type="button"
                onClick={() => setActiveTab((prev) => (prev === item.key ? 'all' : item.key))}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3',
                  isSelected
                    ? item.activeDesktopStyle
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
                )}
              >
                <div className="min-w-0">
                  <div className={cn('text-xs font-semibold truncate', isSelected ? item.activeDesktopText : 'text-slate-500')}>
                    {item.desktopTitle}
                  </div>
                  <div className={cn('text-2xl font-black mt-1', isSelected ? item.activeDesktopText : 'text-slate-800')}>
                    {item.value}
                  </div>
                  <div className="text-2xs text-slate-400 mt-0.5 truncate">{item.desktopSub}</div>
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? item.activeDesktopIconBg : 'bg-slate-100 ' + item.color
                  )}
                >
                  <Icon size={20} weight={isSelected ? 'fill' : 'bold'} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Unified Filter Tabs, Location Pills & Search Card ── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 text-xs font-semibold">
          {[
            { id: 'pending', label: 'Pending Decisions', count: stats.pendingTotal },
            { id: 'intern', label: 'Interns', count: stats.internPending },
            { id: 'fellow', label: 'Fellows (PC Forwarded)', count: stats.fellowPending },
            { id: 'pc', label: 'Program Coordinators', count: stats.pcPending },
            { id: 'approved', label: 'Approved Exits' },
            { id: 'all', label: 'All Records' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={cn(
                  'px-3.5 py-1.5 sm:py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-[#162F5E] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'ml-1.5 px-1.5 py-0.5 rounded-full text-2xs font-bold',
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 2: Location Pills (Single row in pill shaped fields) + Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* Location Filters in a Single Row of Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 text-slate-400 shrink-0 pr-0.5">
              <MapPin size={14} weight="fill" className="text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Location:</span>
            </div>

            {/* Division Pill Popup */}
            <SelectPopup
              variant="pill"
              title="Select Division"
              value={selectedDivision}
              placeholder="All Divisions"
              options={[
                { value: 'all', label: 'All Divisions' },
                ...availableDivisions.map((div) => ({ value: div.name, label: div.name })),
              ]}
              onChange={handleDivisionChange}
            />

            {/* District Pill Popup */}
            <SelectPopup
              variant="pill"
              title="Select District"
              value={selectedDistrict}
              placeholder="All Districts"
              options={[
                { value: 'all', label: 'All Districts' },
                ...availableDistricts.map((dst) => ({ value: dst.name, label: dst.name })),
              ]}
              onChange={handleDistrictChange}
            />

            {/* Block Pill Popup */}
            <SelectPopup
              variant="pill"
              title="Select Block"
              value={selectedBlock}
              placeholder="All Blocks"
              options={[
                { value: 'all', label: 'All Blocks' },
                ...availableBlocks.map((blk) => ({ value: blk.name, label: blk.name })),
              ]}
              onChange={(val) => setSelectedBlock(val)}
            />

            {/* Clear button if any location filtered */}
            {(selectedDivision !== 'all' || selectedDistrict !== 'all' || selectedBlock !== 'all') && (
              <button
                type="button"
                onClick={handleResetLocations}
                className="shrink-0 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64 shrink-0">
            <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#162F5E] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Main Exit Cards List */}
      {loading ? (
        <SkeletonTable rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : !filteredData.length ? (
        <div className="card">
          <EmptyState
            icon={ArrowCircleUpRight}
            title="No Exit Requests Found"
            description="There are no exit applications matching the current filter."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((req) => {
            const role = req.applicantRole || req.applicant.role;
            const totalTasks = req.performanceAudit?.tasksTotal ?? 15;
            const completedTasks = req.performanceAudit?.tasksCompleted ?? (totalTasks - req.incompleteTasks);
            const inProgressTasks = req.incompleteTasks;
            const surveys = req.performanceAudit?.surveysConducted ?? 28;
            const isPendingPm = req.status === 'pending_pm_review' || req.status === 'pending';
            const isCertEnabled = certSwitchMap[req.id] ?? false;
            const isActionLoading = actionInProgress === req.id;

            return (
              <div
                key={req.id}
                className={cn(
                  'card p-4 sm:p-5 transition-all space-y-3.5 border shadow-xs rounded-2xl',
                  isPendingPm
                    ? 'border-blue-200/90 bg-white hover:shadow-md'
                    : 'border-slate-200 bg-white'
                )}
              >
                {/* 1. Header: Candidate Info & Top-Right View Details Button */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {req.applicant.name}
                      </span>
                      <span
                        className={cn(
                          'badge text-[10px] sm:text-xs font-bold uppercase tracking-wide',
                          role === 'pc'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : role === 'fellow'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        )}
                      >
                        {roleLabel(role)}
                      </span>
                      <span className={cn('badge text-[10px] sm:text-xs font-semibold', exitStatusColor(req.status))}>
                        {exitStatusLabel(req.status)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Applied <strong>{formatDate(req.appliedAt)}</strong>
                      {req.reason && (
                        <> · Reason: <span className="italic text-slate-700">&ldquo;{req.reason}&rdquo;</span></>
                      )}
                    </p>
                    {(req.district || req.division) && (
                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <MapPin size={11} className="text-slate-500" />
                          {[req.block, req.district, req.division?.replace(/ Division$/i, '')].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Top-Right Details / Certificate CTA */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {req.certificateIssued && (
                      <button
                        onClick={() => handleDownloadCert(req)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                        title="Download Certificate"
                      >
                        <DownloadSimple size={14} weight="bold" />
                        <span className="hidden sm:inline">Certificate</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setAuditModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                    >
                      <Eye size={14} weight="bold" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* PC Coordinator Recommendation Bar (for Fellows) */}
                {req.reviewedByPc && (
                  <div className="flex items-center justify-between gap-2 text-xs bg-blue-50/80 border border-blue-200/80 px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck size={16} className="text-[#162F5E] shrink-0" weight="fill" />
                      <div className="truncate text-2xs sm:text-xs">
                        <span className="font-bold text-slate-800">
                          PC ({req.reviewedByPc.name}):{' '}
                        </span>
                        <span className="text-slate-700 italic">&ldquo;{req.pcComment}&rdquo;</span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'badge shrink-0 text-[10px] font-bold uppercase',
                        req.certificateEligible
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      )}
                    >
                      {req.certificateEligible ? 'PC Eligible' : 'PC Ineligible'}
                    </span>
                  </div>
                )}

                {/* 2. Middle: Perfectly Proportioned 3-Column Circular Button KPIs */}
                <div className="p-3 sm:p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-3 gap-2 max-w-sm sm:max-w-md mx-auto sm:mx-0">
                    {/* Circle 1: Total Tasks */}
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-slate-900 font-extrabold text-sm sm:text-base">
                        {totalTasks}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1.5 uppercase tracking-wide text-center">
                        Total Tasks
                      </span>
                    </div>

                    {/* Circle 2: Completed Tasks */}
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center text-emerald-700 font-extrabold text-sm sm:text-base">
                        {completedTasks}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-700 mt-1.5 uppercase tracking-wide text-center">
                        Completed
                      </span>
                    </div>

                    {/* Circle 3: Tasks in Progress */}
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center p-2 rounded-xl border shadow-2xs',
                        inProgressTasks > 0
                          ? 'bg-amber-50/60 border-amber-200/80'
                          : 'bg-white border-slate-200/70'
                      )}
                    >
                      <div
                        className={cn(
                          'w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 flex items-center justify-center font-extrabold text-sm sm:text-base',
                          inProgressTasks > 0
                            ? 'border-amber-500 bg-white text-amber-700'
                            : 'border-slate-300 bg-slate-50 text-slate-400'
                        )}
                      >
                        {inProgressTasks}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] sm:text-xs font-bold mt-1.5 uppercase tracking-wide text-center',
                          inProgressTasks > 0 ? 'text-amber-700' : 'text-slate-500'
                        )}
                      >
                        In Progress
                      </span>
                    </div>
                  </div>

                  {/* Field Surveys Pill & Incomplete Warning Strip */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <ClipboardText size={16} className="text-indigo-600 shrink-0" weight="bold" />
                      <span>
                        Field Surveys: <strong className="text-slate-900">{surveys} Submissions</strong>
                      </span>
                    </div>

                    {inProgressTasks > 0 && isPendingPm && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        <Warning size={14} weight="fill" className="text-amber-600 shrink-0" />
                        <span>{inProgressTasks} task(s) incomplete (midway exit)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Bottom Row: Issue Certificate Switch + Smart Action Buttons */}
                {isPendingPm ? (
                  <div className="space-y-3 pt-1">
                    {/* Certificate Toggle Switch Card */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/90 border border-slate-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                            isCertEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          )}
                        >
                          <Certificate size={18} weight={isCertEnabled ? 'fill' : 'regular'} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            Issue Certificate of Completion
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {isCertEnabled
                              ? 'Official certificate will be awarded upon approval'
                              : 'Exit will be approved without completion certificate'}
                          </div>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isCertEnabled}
                        onClick={() => toggleCertSwitch(req.id)}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-2xs',
                          isCertEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                        )}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                            isCertEnabled ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>

                    {/* Action Buttons: Side-by-side on mobile and desktop */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleQuickReject(req)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 cursor-pointer disabled:opacity-50 transition-all shadow-2xs active:scale-[0.98]"
                      >
                        <X size={15} weight="bold" />
                        <span>Reject Exit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleQuickApprove(req, false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50 transition-all shadow-xs active:scale-[0.98] truncate"
                      >
                        <Check size={16} weight="bold" className="shrink-0" />
                        <span className="truncate">
                          {isCertEnabled ? 'Approve & Issue Certificate' : 'Approve Exit'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Decided Status Summary Strip */
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={17} weight="fill" className="text-emerald-600 shrink-0" />
                      <span className="text-slate-700">
                        Exit Decision Recorded: <strong>{exitStatusLabel(req.status)}</strong>
                        {req.approverComment ? ` — “${req.approverComment}”` : ''}
                      </span>
                    </div>
                    {req.certificateIssued ? (
                      <span className="badge bg-emerald-100 text-emerald-800 border-emerald-200 text-2xs font-bold flex items-center gap-1 shrink-0">
                        <Certificate size={13} weight="fill" />
                        Certificate Issued
                      </span>
                    ) : (
                      <span className="badge bg-slate-200 text-slate-600 text-2xs font-medium shrink-0">
                        No Certificate
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deliverables Details Modal (Read-only / inspection mode) */}
      {user && (
        <ExitPerformanceAuditModal
          open={auditModalOpen}
          request={selectedRequest}
          onClose={() => setAuditModalOpen(false)}
          onUpdated={loadData}
          currentUser={user}
        />
      )}
    </div>
  );
}
