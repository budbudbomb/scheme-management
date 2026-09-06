'use client';

import GPSAttendanceWidget from '@/components/attendance/GPSAttendanceWidget';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import type { AttendanceRecord } from '@/types/models';
import { cn, formatDate, formatMonth, downloadBlob } from '@/lib/utils/formatters';
import { SkeletonCard, SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import SelectPopup, { DatePopup } from '@/components/shared/SelectPopup';
import {
  Fingerprint,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  DownloadSimple,
  MagnifyingGlass,
  MapPin,
  CalendarBlank,
  CaretDown,
  CaretUp,
  BellRinging,
  SquaresFour,
  Table as TableIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

type ActiveTab = 'self' | 'interns';
type StatusFilter = 'all' | 'present' | 'absent' | 'half_day' | 'on_leave';
type ViewMode = 'cards' | 'table';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'on_leave', label: 'On Leave' },
];

const DISTRICT_BLOCKS = [
  { id: 'all', name: 'All Blocks' },
  { id: 'blk-seh-01', name: 'Ashta' },
  { id: 'blk-seh-02', name: 'Ichhawar' },
  { id: 'blk-seh-03', name: 'Budhni' },
  { id: 'blk-seh-04', name: 'Sehore Rural' },
];

export default function FellowAttendancePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('self');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selfRecords, setSelfRecords] = useState<AttendanceRecord[]>([]);
  const [internRecords, setInternRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Drill-down block state (collapsed by default)
  const [expandedBlockIds, setExpandedBlockIds] = useState<Record<string, boolean>>({});
  const [nudgedInterns, setNudgedInterns] = useState<Record<string, boolean>>({});

  // Filters for Interns tab
  const [fromDate, setFromDate] = useState<string>('2026-09-06');
  const [toDate, setToDate] = useState<string>('2026-09-06');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const loadInterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.list({
        role: 'intern',
        districtId: 'dst-sehore',
        limit: 300,
      });
      setInternRecords(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load intern attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSelf();
    loadInterns();
  }, [loadSelf, loadInterns]);

  const handleNudgeIntern = (userName: string, userId: string) => {
    setNudgedInterns((prev) => ({ ...prev, [userId]: true }));
    toast.success(`Attendance reminder sent to ${userName}`);
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlockIds((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  // Filtered intern records
  const filteredInterns = useMemo(() => {
    return internRecords.filter((r) => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (selectedBlock !== 'all' && r.block?.id !== selectedBlock) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.userName.toLowerCase().includes(q);
        const matchBlock = r.block?.name?.toLowerCase().includes(q);
        const matchPanchayat = r.panchayatName?.toLowerCase().includes(q);
        if (!matchName && !matchBlock && !matchPanchayat) return false;
      }
      return true;
    });
  }, [internRecords, fromDate, toDate, selectedBlock, selectedStatus, searchQuery]);

  // Overall statistics for active date range & filters
  const internStats = useMemo(() => {
    const total = filteredInterns.length;
    const present = filteredInterns.filter((r) => r.status === 'present').length;
    const absent = filteredInterns.filter((r) => r.status === 'absent').length;
    const halfDay = filteredInterns.filter((r) => r.status === 'half_day').length;
    const onLeave = filteredInterns.filter((r) => r.status === 'on_leave').length;
    const rate = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;

    return { total, present, absent, halfDay, onLeave, rate };
  }, [filteredInterns]);

  // Block Cards Aggregation
  const blockCardsData = useMemo(() => {
    const blocks = DISTRICT_BLOCKS.filter((b) => b.id !== 'all');
    return blocks.map((b) => {
      const records = filteredInterns.filter((r) => r.block?.id === b.id);
      const total = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const halfDay = records.filter((r) => r.status === 'half_day').length;
      const onLeave = records.filter((r) => r.status === 'on_leave').length;
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
        interns: records,
      };
    });
  }, [filteredInterns]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const today = new Date();
      const blob = await attendanceApi.exportReport({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        format: 'csv',
        role: 'intern',
        districtId: 'dst-sehore',
        blockId: selectedBlock !== 'all' ? selectedBlock : undefined,
      });
      downloadBlob(blob, `district-intern-attendance-${fromDate || 'start'}-to-${toDate || 'end'}.csv`);
      toast.success('District intern attendance exported');
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mark your daily attendance and review field interns across Sehore district blocks
          </p>
        </div>

        {activeTab === 'interns' && (
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
        )}
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
          onClick={() => setActiveTab('interns')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
            activeTab === 'interns'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Users size={16} weight="bold" />
          <span>Block Interns</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
            {blockCardsData.length} Blocks
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
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">This Month</h2>
                <p className="text-xs text-slate-500">
                  {formatMonth(new Date().getMonth() + 1, new Date().getFullYear())} — CM Fellow
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
          TAB 2: DISTRICT INTERNS REVIEW (DRILL-DOWN BLOCK CARDS)
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'interns' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Interns
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                {internStats.total}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Present
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">
                {internStats.present}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                Absent
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">
                {internStats.absent}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                On Leave
              </span>
              <span className="text-xl sm:text-2xl font-black text-indigo-600 mt-1 block">
                {internStats.onLeave}
              </span>
            </div>

            <div className="card p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Attendance Rate
              </span>
              <span className="text-xl sm:text-2xl font-black text-indigo-700 mt-1 block">
                {internStats.rate}%
              </span>
            </div>
          </div>

          {/* Filter Bar: Unified compact card */}
          <div className="card bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Section: Date Range with Presets + From/To */}
            <div className="p-4 space-y-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date Range</span>
                {/* View Toggle */}
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

                {/* From / To Date Pickers */}
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

            {/* Section: Entity Filters — Search, Block, Status */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search intern, block, GP..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
                <MagnifyingGlass size={15} className="absolute left-3 top-2.5 text-slate-400" />
              </div>

              <SelectPopup
                title="Select Block"
                value={selectedBlock}
                options={DISTRICT_BLOCKS.map((b) => ({ value: b.id, label: b.name }))}
                onChange={setSelectedBlock}
              />

              <SelectPopup
                title="Select Status"
                value={selectedStatus}
                options={STATUS_OPTIONS}
                onChange={(val) => setSelectedStatus(val as StatusFilter)}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              VIEW MODE 1: DRILL-DOWN BLOCK CARDS
             ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'cards' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sehore District Blocks ({blockCardsData.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Drill down into any block to review intern attendance, check-in times and GPS location
                  </p>
                </div>
              </div>

              {blockCardsData.length === 0 ? (
                <div className="card p-8 text-center text-slate-400 text-xs">
                  No records match the current filters.
                </div>
              ) : (
                blockCardsData.map((b) => {
                  const isExpanded = !!expandedBlockIds[b.blockId];
                  const presentPct = b.total > 0 ? (b.present / b.total) * 100 : 0;
                  const halfDayPct = b.total > 0 ? (b.halfDay / b.total) * 100 : 0;
                  const absentPct = b.total > 0 ? ((b.absent + b.onLeave) / b.total) * 100 : 0;

                  return (
                    <div
                      key={b.blockId}
                      className="card bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden transition-all"
                    >
                      {/* Block Card Header */}
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
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW MODE 2: TABLE VIEW
             ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'table' && (
            <div>
              {loading ? (
                <SkeletonTable rows={6} />
              ) : error ? (
                <ErrorState message={error} onRetry={loadInterns} />
              ) : filteredInterns.length === 0 ? (
                <div className="card p-8">
                  <EmptyState
                    icon={Fingerprint}
                    title="No intern records found"
                    description="No records match your selected date range, status, or search filters."
                  />
                </div>
              ) : (
                <div className="card overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                  <table className="w-full text-sm hidden md:table">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="text-left px-5 py-3.5">Intern</th>
                        <th className="text-left px-5 py-3.5">Block / GP</th>
                        <th className="text-left px-5 py-3.5">Date</th>
                        <th className="text-left px-5 py-3.5">Check-in Time</th>
                        <th className="text-left px-5 py-3.5">Status</th>
                        <th className="text-left px-5 py-3.5">GPS Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInterns.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {r.userName.charAt(0)}
                            </div>
                            <span>{r.userName}</span>
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

                  {/* Mobile Cards */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {filteredInterns.map((r) => (
                      <div key={r.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {r.userName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{r.userName}</div>
                              <div className="text-xs text-slate-500">
                                {r.block?.name} Block {r.panchayatName ? `· GP: ${r.panchayatName}` : ''}
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
