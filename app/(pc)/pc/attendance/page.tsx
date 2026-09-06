'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import type { AttendanceRecord } from '@/types/models';
import { cn, formatDate, formatMonth, downloadBlob } from '@/lib/utils/formatters';
import { SkeletonTable, SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import GPSAttendanceWidget from '@/components/attendance/GPSAttendanceWidget';
import SelectPopup, { DatePopup } from '@/components/shared/SelectPopup';
import {
  Fingerprint,
  DownloadSimple,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MagnifyingGlass,
  MapPin,
  Buildings,
  UserCheck,
  CalendarBlank,
  ArrowLeft,
  ArrowRight,
  CaretDown,
  CaretUp,
  BellRinging,
  SquaresFour,
  Table as TableIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

type ActiveTab = 'self' | 'review';
type StatusFilter = 'all' | 'present' | 'absent' | 'half_day' | 'on_leave';
type ViewMode = 'cards' | 'table';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'on_leave', label: 'On Leave' },
];

const DISTRICTS = [
  { id: 'all', name: 'All Districts' },
  { id: 'dst-sehore', name: 'Sehore', fellowName: 'Vikramaditya Singh', fellowPhone: '+91 98261 23456' },
  { id: 'dst-02', name: 'Bhopal', fellowName: 'Kavita Patel', fellowPhone: '+91 98262 34567' },
  { id: 'dst-raisen', name: 'Raisen', fellowName: 'Rajesh Chouhan', fellowPhone: '+91 98263 45678' },
  { id: 'dst-rajgarh', name: 'Rajgarh', fellowName: 'Sunita Malviya', fellowPhone: '+91 98264 56789' },
  { id: 'dst-vidisha', name: 'Vidisha', fellowName: 'Deepak Sharma', fellowPhone: '+91 98265 67890' },
];

const BLOCKS_BY_DISTRICT: Record<string, { id: string; name: string }[]> = {
  'dst-sehore': [
    { id: 'all', name: 'All Blocks' },
    { id: 'blk-seh-01', name: 'Ashta' },
    { id: 'blk-seh-02', name: 'Ichhawar' },
    { id: 'blk-seh-03', name: 'Budhni' },
    { id: 'blk-seh-04', name: 'Sehore Rural' },
  ],
  'dst-02': [
    { id: 'all', name: 'All Blocks' },
    { id: 'blk-bhp-01', name: 'Phanda' },
    { id: 'blk-bhp-02', name: 'Berasia' },
  ],
  'dst-raisen': [
    { id: 'all', name: 'All Blocks' },
    { id: 'blk-rsn-01', name: 'Sanchi' },
    { id: 'blk-rsn-02', name: 'Gairatganj' },
  ],
  'dst-rajgarh': [
    { id: 'all', name: 'All Blocks' },
    { id: 'blk-rjg-01', name: 'Biaora' },
    { id: 'blk-rjg-02', name: 'Khilchipur' },
  ],
  'dst-vidisha': [
    { id: 'all', name: 'All Blocks' },
    { id: 'blk-vds-01', name: 'Basoda' },
    { id: 'blk-vds-02', name: 'Kurwai' },
  ],
};

export default function PCAttendancePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('self');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selfRecords, setSelfRecords] = useState<AttendanceRecord[]>([]);
  const [teamRecords, setTeamRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Drill-down state (collapsed by default)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [expandedBlockIds, setExpandedBlockIds] = useState<Record<string, boolean>>({});
  const [nudgedInterns, setNudgedInterns] = useState<Record<string, boolean>>({});

  // Filter States
  const [fromDate, setFromDate] = useState<string>('2026-09-06');
  const [toDate, setToDate] = useState<string>('2026-09-06');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync drilled-down district with filter if changed
  const effectiveDistrictId = selectedDistrictId || (selectedDistrictFilter !== 'all' ? selectedDistrictFilter : null);

  const loadSelf = useCallback(async () => {
    try {
      const today = new Date();
      const res = await attendanceApi.getMyAttendance({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      });
      setSelfRecords(res);
    } catch {
      // Handled silently
    }
  }, []);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.list({ limit: 400 });
      setTeamRecords(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSelf();
    loadTeam();
  }, [loadSelf, loadTeam]);

  // Nudge intern
  const handleNudgeIntern = (userName: string, userId: string) => {
    setNudgedInterns((prev) => ({ ...prev, [userId]: true }));
    toast.success(`Attendance nudge sent to ${userName}`);
  };

  // Toggle block expansion
  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlockIds((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  // Filter team records by date range, district, block, status, search
  const filteredRecords = useMemo(() => {
    return teamRecords.filter((r) => {
      // Date range filter
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;

      // District filter
      if (effectiveDistrictId && r.district?.id !== effectiveDistrictId) return false;

      // Block filter
      if (selectedBlockFilter !== 'all' && r.block?.id !== selectedBlockFilter) return false;

      // Status filter
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.userName.toLowerCase().includes(q);
        const matchDistrict = r.district?.name?.toLowerCase().includes(q);
        const matchBlock = r.block?.name?.toLowerCase().includes(q);
        const matchPanchayat = r.panchayatName?.toLowerCase().includes(q);
        if (!matchName && !matchDistrict && !matchBlock && !matchPanchayat) return false;
      }

      return true;
    });
  }, [teamRecords, fromDate, toDate, effectiveDistrictId, selectedBlockFilter, selectedStatus, searchQuery]);

  // Overall Statistics for current active view
  const overallStats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const absent = filteredRecords.filter((r) => r.status === 'absent').length;
    const halfDay = filteredRecords.filter((r) => r.status === 'half_day').length;
    const onLeave = filteredRecords.filter((r) => r.status === 'on_leave').length;
    const rate = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
    return { total, present, absent, halfDay, onLeave, rate };
  }, [filteredRecords]);

  // Grouping for District Cards (Level 1)
  const districtCardData = useMemo(() => {
    const list = DISTRICTS.filter((d) => d.id !== 'all');
    return list.map((d) => {
      // District records matching date range and search/status
      const distRecords = teamRecords.filter((r) => {
        if (r.district?.id !== d.id) return false;
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
        return true;
      });

      const fellowRec = distRecords.find((r) => r.role === 'fellow');
      const internRecs = distRecords.filter((r) => r.role === 'intern');

      const total = distRecords.length;
      const present = distRecords.filter((r) => r.status === 'present').length;
      const absent = distRecords.filter((r) => r.status === 'absent').length;
      const halfDay = distRecords.filter((r) => r.status === 'half_day').length;
      const onLeave = distRecords.filter((r) => r.status === 'on_leave').length;
      const rate = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;

      const blocks = BLOCKS_BY_DISTRICT[d.id]?.filter((b) => b.id !== 'all') || [];

      return {
        districtId: d.id,
        districtName: d.name,
        fellowName: d.fellowName,
        fellowPhone: d.fellowPhone,
        fellowStatus: fellowRec?.status || 'present',
        fellowMarkedAt: fellowRec?.markedAt || '09:15 AM',
        totalStaff: total,
        internCount: internRecs.length,
        blockCount: blocks.length,
        present,
        absent,
        halfDay,
        onLeave,
        rate,
      };
    });
  }, [teamRecords, fromDate, toDate, selectedStatus]);

  // Grouping for Block Cards (Level 2: when a district is selected)
  const blockCardData = useMemo(() => {
    if (!effectiveDistrictId) return [];
    const blocks = BLOCKS_BY_DISTRICT[effectiveDistrictId]?.filter((b) => b.id !== 'all') || [];

    return blocks.map((b) => {
      const blockRecords = filteredRecords.filter((r) => r.block?.id === b.id);
      const total = blockRecords.length;
      const present = blockRecords.filter((r) => r.status === 'present').length;
      const absent = blockRecords.filter((r) => r.status === 'absent').length;
      const halfDay = blockRecords.filter((r) => r.status === 'half_day').length;
      const onLeave = blockRecords.filter((r) => r.status === 'on_leave').length;
      const rate = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;

      return {
        blockId: b.id,
        blockName: b.name,
        total,
        present,
        absent,
        halfDay,
        onLeave,
        rate,
        interns: blockRecords,
      };
    });
  }, [effectiveDistrictId, filteredRecords]);

  // Active district metadata
  const activeDistrictMeta = useMemo(() => {
    if (!effectiveDistrictId) return null;
    return DISTRICTS.find((d) => d.id === effectiveDistrictId) || null;
  }, [effectiveDistrictId]);

  // Available blocks for dropdown filter
  const availableBlocks = useMemo(() => {
    if (!effectiveDistrictId || effectiveDistrictId === 'all') {
      return [{ id: 'all', name: 'All Blocks' }];
    }
    return BLOCKS_BY_DISTRICT[effectiveDistrictId] || [{ id: 'all', name: 'All Blocks' }];
  }, [effectiveDistrictId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const today = new Date();
      const blob = await attendanceApi.exportReport({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        format: 'csv',
        districtId: effectiveDistrictId || undefined,
        blockId: selectedBlockFilter !== 'all' ? selectedBlockFilter : undefined,
      });
      downloadBlob(blob, `attendance-report-${fromDate || 'start'}-to-${toDate || 'end'}.csv`);
      toast.success('Attendance report exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const selfPresentCount = selfRecords.filter((r) => r.status === 'present').length;

  const renderStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} weight="bold" />
            <span>Present</span>
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} weight="bold" />
            <span>Absent</span>
          </span>
        );
      case 'half_day':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} weight="bold" />
            <span>Half Day</span>
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CalendarBlank size={12} weight="bold" />
            <span>On Leave</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Export Action */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Attendance & Team Oversight</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mark your attendance and review field team attendance across Bhopal Division
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
        >
          {exporting ? (
            <span className="w-4 h-4 border-2 border-slate-400 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <DownloadSimple size={16} weight="bold" className="text-indigo-600" />
          )}
          <span>Export CSV</span>
        </button>
      </div>

      {/* 2. Top-Level Tab Switcher */}
      <div className="p-1.5 bg-slate-100 border border-slate-200/90 rounded-2xl flex items-center gap-1 shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('self')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
            activeTab === 'self'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Fingerprint size={16} weight="bold" />
          <span>My Attendance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
            activeTab === 'review'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Users size={16} weight="bold" />
          <span>Districts</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            {districtCardData.length} Districts
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: MY ATTENDANCE
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'self' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <GPSAttendanceWidget />

          <div className="card p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">My Attendance History</h2>
                <p className="text-xs text-slate-500">
                  {formatMonth(new Date().getMonth() + 1, new Date().getFullYear())} — Program Coordinator
                </p>
              </div>
              <div className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selfPresentCount} of {selfRecords.length} days Present
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-2">
              {selfRecords.map((r) => (
                <div key={r.id} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">{formatDate(r.date, 'dd')}</span>
                  <div
                    className={cn(
                      'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-2xs border transition-all',
                      r.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    )}
                    title={`${formatDate(r.date)}: ${r.status}`}
                  >
                    {r.status === 'present' ? 'P' : 'A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: REVIEW ATTENDANCE (DRILL-DOWNABLE CARDS & HIERARCHY)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'review' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Personnel
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                {overallStats.total}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Present
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">
                {overallStats.present}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                Absent
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">
                {overallStats.absent}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                On Leave
              </span>
              <span className="text-xl sm:text-2xl font-black text-indigo-600 mt-1 block">
                {overallStats.onLeave}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Attendance Rate
              </span>
              <span className="text-xl sm:text-2xl font-black text-indigo-700 mt-1 block">
                {overallStats.rate}%
              </span>
            </div>
          </div>

          {/* Filter Bar: Unified compact card */}
          <div className="card bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Section: Date Range with Presets + From/To */}
            <div className="p-4 space-y-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Range</span>
                {/* View Toggle - moved inline with section label */}
                <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200/90 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer select-none',
                      viewMode === 'cards'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    <SquaresFour size={13} weight="bold" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer select-none',
                      viewMode === 'table'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    <TableIcon size={13} weight="bold" />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              {/* Presets + From/To on one row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Preset Pills */}
                <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 border border-slate-200/80 rounded-lg shrink-0">
                  {(['today', 'week', 'month', 'all'] as const).map((preset) => {
                    const TODAY = '2026-09-06';
                    const isActive =
                      preset === 'today' ? (fromDate === TODAY && toDate === TODAY) :
                      preset === 'week' ? (fromDate === '2026-08-31' && toDate === TODAY) :
                      preset === 'month' ? (fromDate === '2026-09-01' && toDate === '2026-09-30') :
                      (!fromDate && !toDate);
                    const labels: Record<string, string> = { today: 'Today', week: 'Week', month: 'Month', all: 'All' };
                    const onClick = () => {
                      if (preset === 'today') { setFromDate(TODAY); setToDate(TODAY); }
                      else if (preset === 'week') { setFromDate('2026-08-31'); setToDate(TODAY); }
                      else if (preset === 'month') { setFromDate('2026-09-01'); setToDate('2026-09-30'); }
                      else { setFromDate(''); setToDate(''); }
                    };
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={onClick}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer',
                          isActive
                            ? 'bg-white text-indigo-700 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        )}
                      >
                        {labels[preset]}
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-slate-200 shrink-0" />

                {/* From / To Date Pickers side by side */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-[110px] max-w-[150px]">
                    <DatePopup
                      label="From"
                      value={fromDate}
                      placeholder="From Date"
                      onChange={(newFrom) => setFromDate(newFrom)}
                    />
                  </div>
                  <span className="text-slate-300 text-sm font-bold shrink-0">→</span>
                  <div className="flex-1 min-w-[110px] max-w-[150px]">
                    <DatePopup
                      label="To"
                      value={toDate}
                      placeholder="To Date"
                      onChange={(newTo) => setToDate(newTo)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Entity Filters — Search, District, Block, Status */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fellow, intern, GP..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
                <MagnifyingGlass size={15} className="absolute left-3 top-2.5 text-slate-400" />
              </div>

              <SelectPopup
                title="Select District"
                value={effectiveDistrictId || 'all'}
                options={DISTRICTS.map((d) => ({ value: d.id, label: d.name }))}
                onChange={(val) => {
                  setSelectedDistrictFilter(val);
                  setSelectedDistrictId(val === 'all' ? null : val);
                  setSelectedBlockFilter('all');
                }}
              />

              {effectiveDistrictId && (
                <SelectPopup
                  title="Select Block"
                  value={selectedBlockFilter}
                  options={availableBlocks.map((b) => ({ value: b.id, label: b.name }))}
                  onChange={setSelectedBlockFilter}
                />
              )}

              <SelectPopup
                title="Select Status"
                value={selectedStatus}
                options={STATUS_OPTIONS}
                onChange={(val) => setSelectedStatus(val as StatusFilter)}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              VIEW MODE 1: DRILL-DOWN HIERARCHY CARDS (DISTRICT → BLOCK → INTERN)
             ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'cards' && (
            <div className="space-y-5">
              {/* LEVEL 1: ALL DISTRICTS CARDS */}
              {!effectiveDistrictId && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Bhopal Division Districts
                      </h2>
                      <p className="text-xs text-slate-500">
                        Select a district to drill down into block-wise attendance and intern locations
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {districtCardData.map((d) => {
                      const presentPct = d.totalStaff > 0 ? (d.present / d.totalStaff) * 100 : 0;
                      const halfDayPct = d.totalStaff > 0 ? (d.halfDay / d.totalStaff) * 100 : 0;
                      const absentPct = d.totalStaff > 0 ? ((d.absent + d.onLeave) / d.totalStaff) * 100 : 0;

                      return (
                        <div
                          key={d.districtId}
                          onClick={() => {
                            setSelectedDistrictId(d.districtId);
                            setSelectedDistrictFilter(d.districtId);
                          }}
                          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2.5">
                            {/* Card Top: District Name & Percentage */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {d.districtName} District
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Fellow: <strong className="text-slate-800 font-semibold">{d.fellowName}</strong>
                                </p>
                              </div>

                              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-emerald-500 flex items-center justify-center font-black text-xs text-emerald-700 bg-slate-50 shrink-0">
                                {d.rate}%
                              </div>
                            </div>

                            {/* Fellow Attendance Status Line */}
                            <div className="text-xs flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-slate-600 font-medium">Fellow Attendance:</span>
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Present ({d.fellowMarkedAt})
                              </span>
                            </div>

                            {/* 3-Segment Progress Bar */}
                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                <span>Attendance Status</span>
                                <span>{d.present} / {d.totalStaff} Present</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 h-full" />
                                <div style={{ width: `${halfDayPct}%` }} className="bg-amber-400 h-full" />
                                <div style={{ width: `${absentPct}%` }} className="bg-rose-500 h-full" />
                              </div>
                            </div>

                            {/* Counts Row */}
                            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Present</span>
                                <span className="text-sm font-black text-emerald-600">{d.present}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Absent</span>
                                <span className="text-sm font-black text-rose-600">{d.absent}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Interns</span>
                                <span className="text-sm font-black text-slate-800">{d.internCount}</span>
                              </div>
                            </div>
                          </div>

                          {/* Drill-down action link */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                            <span>View {d.blockCount} Blocks &amp; Interns</span>
                            <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LEVEL 2: DISTRICT BLOCK-WISE CARDS (DRILLED DOWN) */}
              {effectiveDistrictId && activeDistrictMeta && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Drilled-down District Card Header with Back Button */}
                  <div className="card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDistrictId(null);
                            setSelectedDistrictFilter('all');
                            setSelectedBlockFilter('all');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer mb-1.5"
                        >
                          <ArrowLeft size={14} weight="bold" />
                          <span>Back to All Bhopal Division Districts</span>
                        </button>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          {activeDistrictMeta.name} District
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                          Fellow in Charge: <strong className="text-slate-900 font-semibold">{activeDistrictMeta.fellowName}</strong>{' '}
                          <span className="text-slate-500">({activeDistrictMeta.fellowPhone})</span>
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between gap-4 shrink-0 shadow-2xs">
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            District Attendance
                          </div>
                          <div className="text-xs text-slate-600 font-medium mt-0.5">
                            {overallStats.present} of {overallStats.total} Present
                          </div>
                        </div>
                        <div className="w-11 h-11 rounded-full border-4 border-slate-200 border-t-emerald-500 flex items-center justify-center font-black text-xs text-emerald-700 bg-white shadow-2xs shrink-0">
                          {overallStats.rate}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block Cards List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-slate-800">
                        Blocks in {activeDistrictMeta.name} ({blockCardData.length})
                      </h3>
                      <span className="text-xs text-slate-400">Click a block to view intern check-in details</span>
                    </div>

                    {blockCardData.length === 0 ? (
                      <div className="card p-8 text-center text-slate-400 text-xs">
                        No records match the current filters for this district.
                      </div>
                    ) : (
                      blockCardData.map((b) => {
                        const isExpanded = !!expandedBlockIds[b.blockId];
                        const presentPct = b.total > 0 ? (b.present / b.total) * 100 : 0;
                        const halfDayPct = b.total > 0 ? (b.halfDay / b.total) * 100 : 0;
                        const absentPct = b.total > 0 ? ((b.absent + b.onLeave) / b.total) * 100 : 0;

                        return (
                          <div
                            key={b.blockId}
                            className="card bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all"
                          >
                            {/* Block Card Header (Clickable to expand/collapse) */}
                            <div
                              onClick={() => toggleBlockExpanded(b.blockId)}
                              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-base">
                                    {b.blockName} Block
                                  </span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    {b.total} Interns
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {b.present} Present · {b.absent} Absent {b.onLeave > 0 ? `· ${b.onLeave} On Leave` : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="hidden sm:block w-32 space-y-1 text-right">
                                  <div className="text-xs font-black text-indigo-700">{b.rate}%</div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 h-full" />
                                    <div style={{ width: `${halfDayPct}%` }} className="bg-amber-400 h-full" />
                                    <div style={{ width: `${absentPct}%` }} className="bg-rose-500 h-full" />
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                                  <span>{isExpanded ? 'Hide Interns' : 'View Interns'}</span>
                                  {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Interns Section */}
                            {isExpanded && (
                              <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 space-y-3">
                                {b.interns.length === 0 ? (
                                  <p className="text-xs text-slate-400 py-2">No interns recorded for this block.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {b.interns.map((intern) => (
                                      <div
                                        key={intern.id}
                                        className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                              {intern.userName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                                {intern.userName}
                                              </div>
                                              <div className="text-[11px] text-slate-500 truncate">
                                                GP: {intern.panchayatName || '—'}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="shrink-0">{renderStatusBadge(intern.status)}</div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                                          <span className="flex items-center gap-1">
                                            <Clock size={13} className="text-slate-400" />
                                            <span>{intern.markedAt}</span>
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() => handleNudgeIntern(intern.userName, intern.id)}
                                            disabled={!!nudgedInterns[intern.id] || intern.status === 'present'}
                                            className={cn(
                                              'px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                                              intern.status === 'present'
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : nudgedInterns[intern.id]
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 active:scale-95'
                                            )}
                                          >
                                            <BellRinging size={12} weight="bold" />
                                            <span>{nudgedInterns[intern.id] ? 'Nudged ✓' : 'Nudge'}</span>
                                          </button>
                                        </div>

                                        {intern.locationAddress && (
                                          <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate pt-0.5">
                                            <MapPin size={12} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{intern.locationAddress}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW MODE 2: COMPREHENSIVE TABLE VIEW
             ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'table' && (
            <div>
              {loading ? (
                <SkeletonTable rows={6} />
              ) : error ? (
                <ErrorState message={error} onRetry={loadTeam} />
              ) : filteredRecords.length === 0 ? (
                <div className="card p-8">
                  <EmptyState
                    icon={Fingerprint}
                    title="No attendance records found"
                    description="No records match your selected date range, status, or search filters."
                  />
                </div>
              ) : (
                <div className="card overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                  {/* Desktop Table */}
                  <table className="w-full text-sm hidden md:table">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="text-left px-5 py-3.5">Name</th>
                        <th className="text-left px-5 py-3.5">Role</th>
                        <th className="text-left px-5 py-3.5">District</th>
                        <th className="text-left px-5 py-3.5">Block / GP</th>
                        <th className="text-left px-5 py-3.5">Date</th>
                        <th className="text-left px-5 py-3.5">Check-in Time</th>
                        <th className="text-left px-5 py-3.5">Status</th>
                        <th className="text-left px-5 py-3.5">Location / Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {r.userName.charAt(0)}
                            </div>
                            <span>{r.userName}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 text-xs font-semibold capitalize">
                            {r.role || 'intern'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">
                            {r.district?.name || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 text-xs">
                            <strong className="font-semibold text-slate-800">{r.block?.name || '—'}</strong>
                            {r.panchayatName && (
                              <span className="block text-slate-400 text-[11px]">GP: {r.panchayatName}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs">
                            {formatDate(r.date)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-semibold text-xs">
                            {r.markedAt}
                          </td>
                          <td className="px-5 py-3.5">
                            {renderStatusBadge(r.status)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs truncate max-w-xs">
                            {r.locationAddress || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Table Replacement Cards */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {filteredRecords.map((r) => (
                      <div key={r.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {r.userName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{r.userName}</div>
                              <div className="text-xs text-slate-500">
                                {r.district?.name} {r.block?.name ? `· ${r.block.name} Block` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">{renderStatusBadge(r.status)}</div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <CalendarBlank size={13} className="text-slate-400" />
                            {formatDate(r.date)}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {r.markedAt}
                          </span>
                        </div>

                        {r.locationAddress && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate pt-0.5">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{r.locationAddress}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
