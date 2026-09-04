'use client';

import { useState, useMemo } from 'react';
import {
  DistrictProgress,
  BlockProgress,
  InternTaskItem,
  getDivisionTaskProgress,
  getDistrictTaskProgress,
} from '@/lib/api/hierarchyTasks';
import {
  Users,
  CheckSquare,
  Warning,
  CheckCircle,
  Clock,
  CaretDown,
  CaretUp,
  ArrowLeft,
  ArrowRight,
  MagnifyingGlass,
  Funnel,
  BellRinging,
  ChatCircleDots,
  MapPin,
  ListBullets,
  SquaresFour,
  Buildings,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { toast } from 'sonner';

interface HierarchicalTaskMonitorProps {
  role: 'fellow' | 'pc';
  divisionId?: string;
  districtId?: string;
  districtName?: string;
}

type ViewMode = 'accordion' | 'tabs';
type StatusFilter = 'all' | 'completed' | 'in_progress' | 'pending' | 'overdue';

export default function HierarchicalTaskMonitor({
  role,
  divisionId,
  districtId,
  districtName,
}: HierarchicalTaskMonitorProps) {
  // ── PC Division Data & State ──
  const divisionData = useMemo(() => {
    return getDivisionTaskProgress(divisionId);
  }, [divisionId]);

  // Selected district for PC drill-down (null = show all district cards first)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  // ── Fellow District Data ──
  const fellowDistrictData = useMemo(() => {
    return getDistrictTaskProgress(districtId, districtName);
  }, [districtId, districtName]);

  // Active district being viewed (either Fellow's district, or PC's selected district)
  const activeDistrict: DistrictProgress | null = useMemo(() => {
    if (role === 'fellow') {
      return fellowDistrictData;
    }
    if (!selectedDistrictId) return null;
    return divisionData.districts.find(d => d.districtId === selectedDistrictId) || divisionData.districts[0];
  }, [role, fellowDistrictData, selectedDistrictId, divisionData]);

  // ── View Mode: Accordion vs Tabs ──
  const [viewMode, setViewMode] = useState<ViewMode>('accordion');

  // In Tabs mode: which block is selected ('all' or blockId)
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');

  // In Accordion mode: expanded block IDs (default all expanded or first 2)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
    'blk-seh-01': true,
    'blk-seh-02': true,
    'blk-bhp-01': true,
    'blk-rsn-01': true,
  });

  // ── Filters & Search ──
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Nudge state tracking (set of intern IDs that have been nudged)
  const [nudgedInterns, setNudgedInterns] = useState<Record<string, boolean>>({});

  const toggleAccordionBlock = (blockId: string) => {
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const handleNudgeIntern = (intern: InternTaskItem) => {
    setNudgedInterns(prev => ({ ...prev, [intern.internId]: true }));
    toast.success(`Reminder sent to ${intern.internName}!`, {
      description: `Task nudge notification dispatched for "${intern.taskName}".`,
    });
  };

  const handleWhatsAppNudge = (intern: InternTaskItem) => {
    const text = encodeURIComponent(
      `Hello ${intern.internName}, this is an urgent reminder from CMYP regarding your pending task "${intern.taskName}". Please complete your submissions at the earliest.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Helper for status badge
  const renderStatusBadge = (status: InternTaskItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={13} weight="bold" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={13} weight="bold" />
            <span>In Progress</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <Warning size={13} weight="bold" />
            <span>Overdue</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} weight="bold" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  // Filter interns based on status and search query
  const filterInterns = (interns: InternTaskItem[]) => {
    return interns.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        item.internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.blockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.panchayatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.taskName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════════════
          LEVEL 1: PC DIVISION DISTRICT OVERVIEW CARDS (WHEN NO DISTRICT SELECTED)
         ══════════════════════════════════════════════════════════════════════ */}
      {role === 'pc' && !activeDistrict && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Division Header Strip */}
          <div className="card p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    Division Task Oversight
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Admin-Assigned Intern Tasks</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Buildings size={24} className="text-indigo-600 shrink-0" weight="duotone" />
                  <span>{divisionData.divisionName}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Select a district below to monitor block-wise execution, intern submissions, and overdue alerts.
                </p>
              </div>

              {/* Division Overall Progress Ring/Bar */}
              <div className="bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-xl flex items-center gap-4 shrink-0 shadow-2xs">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Division Progress
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {divisionData.completionRate}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {divisionData.completedTasks} of {divisionData.totalInterns} Interns Done
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-700 bg-white shadow-2xs">
                  {divisionData.completionRate}%
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Total Districts</span>
                <span className="text-base font-bold text-slate-900">{divisionData.totalDistricts}</span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Total Blocks</span>
                <span className="text-base font-bold text-slate-900">{divisionData.totalBlocks}</span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Total Interns</span>
                <span className="text-base font-bold text-slate-900">{divisionData.totalInterns}</span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Overdue Tasks</span>
                <span className="text-base font-bold text-rose-600">{divisionData.overdueTasks} Attention Needed</span>
              </div>
            </div>
          </div>

          {/* Section Heading */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Districts in {divisionData.divisionName}</h3>
              <p className="text-xs text-slate-500">Click any district card to drill down into Block-wise intern progress</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {divisionData.districts.length} Districts
            </span>
          </div>

          {/* District Overview Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {divisionData.districts.map((district) => {
              const isHigh = district.completionRate >= 75;
              const isMedium = district.completionRate >= 50 && district.completionRate < 75;
              const hasOverdue = district.overdueTasks > 0;

              return (
                <div
                  key={district.districtId}
                  onClick={() => setSelectedDistrictId(district.districtId)}
                  className="card p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer group bg-white flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Top Health Indicator Line */}
                  <div
                    className={cn(
                      'absolute top-0 left-0 right-0 h-1.5',
                      isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{district.districtName} District</span>
                        </h4>
                        <span className="text-xs text-slate-500">
                          Fellow in Charge: <strong className="text-slate-700">{district.fellowName}</strong>
                        </span>
                      </div>
                      <span className={cn(
                        'text-xs font-bold px-2.5 py-1 rounded-lg shrink-0',
                        isHigh ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isMedium ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      )}>
                        {district.completionRate}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Intern Completion</span>
                        <span>{district.completedTasks} / {district.totalInterns}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                          )}
                          style={{ width: `${district.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick block breakdown chips */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">{district.blocks.length} Blocks:</span>
                      {district.blocks.map(b => (
                        <span key={b.blockId} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {b.blockName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer with Status count and Drill-down Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {hasOverdue ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <Warning size={12} weight="bold" /> {district.overdueTasks} Overdue
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                          <CheckCircle size={13} weight="bold" className="text-emerald-500" /> On Track
                        </span>
                      )}
                    </div>

                    <div className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                      <span>View Blocks</span>
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEVEL 2: DISTRICT BLOCK-WISE VIEW (FOR FELLOW OR PC DRILLED-DOWN)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeDistrict && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* District Header & Breadcrumb for PC */}
          <div className="card p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                {role === 'pc' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDistrictId(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer mb-1"
                  >
                    <ArrowLeft size={14} weight="bold" />
                    <span>Back to All {divisionData.divisionName} Districts</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    {role === 'pc' ? 'District Drill-Down' : 'District Task Oversight'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Admin-Assigned Intern Tasks</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <MapPin size={24} className="text-indigo-600 shrink-0" weight="duotone" />
                  <span>{activeDistrict.districtName} District</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-600">
                  Fellow in Charge: <strong className="text-slate-900 font-semibold">{activeDistrict.fellowName}</strong>{' '}
                  <span className="text-slate-500">({activeDistrict.fellowPhone})</span>
                </p>
              </div>

              {/* District Completion Box */}
              <div className="bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-xl flex items-center gap-4 shrink-0 shadow-2xs">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    District Progress
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {activeDistrict.completionRate}%
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {activeDistrict.completedTasks} of {activeDistrict.totalInterns} Interns Done
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-700 bg-white shadow-2xs">
                  {activeDistrict.completionRate}%
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Assigned Blocks</span>
                <span className="text-base font-bold text-slate-900">{activeDistrict.blocks.length} Blocks</span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Total Interns</span>
                <span className="text-base font-bold text-slate-900">{activeDistrict.totalInterns}</span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">In Progress</span>
                <span className="text-base font-bold text-indigo-600">{activeDistrict.inProgressTasks}</span>
              </div>
              <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl">
                <span className="text-slate-500 block text-[11px] font-medium mb-0.5">Overdue Tasks</span>
                <span className="text-base font-bold text-rose-600">{activeDistrict.overdueTasks} Action Needed</span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              INTERACTIVE CONTROL BAR: VIEW SWITCHER + FILTERS + SEARCH
             ══════════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* View Mode Switcher Button (Accordion vs Tabs) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('accordion')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none',
                  viewMode === 'accordion'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <ListBullets size={15} weight="bold" />
                <span>Accordion View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('tabs')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none',
                  viewMode === 'tabs'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <SquaresFour size={15} weight="bold" />
                <span>Tabs / Pills View</span>
              </button>
            </div>

            {/* Search Input and Status Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap flex-1 md:justify-end">
              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search intern, task, block…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
                <MagnifyingGlass size={15} className="absolute left-3 top-2 text-slate-400 pointer-events-none" />
              </div>

              {/* Status Filter Dropdown or Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scroll-hide">
                {(['all', 'completed', 'in_progress', 'pending', 'overdue'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer',
                      statusFilter === status
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              MODE A: TABS / PILLS VIEW
             ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'tabs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Horizontally scrolling block pill bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scroll-hide">
                {/* All Blocks pill */}
                <button
                  type="button"
                  onClick={() => setSelectedBlockId('all')}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border',
                    selectedBlockId === 'all'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>All Blocks</span>
                  <span className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    selectedBlockId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  )}>
                    {activeDistrict.blocks.length}
                  </span>
                </button>

                {/* Individual Block pills */}
                {activeDistrict.blocks.map(b => {
                  const isSelected = selectedBlockId === b.blockId;
                  const hasOverdue = b.overdueTasks > 0;

                  return (
                    <button
                      key={b.blockId}
                      type="button"
                      onClick={() => setSelectedBlockId(b.blockId)}
                      className={cn(
                        'px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border',
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        b.completionRate >= 75 ? 'bg-emerald-500' : b.completionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      )} />
                      <span>{b.blockName}</span>
                      <span className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px]',
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      )}>
                        {b.completionRate}%
                      </span>
                      {hasOverdue && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Overdue task inside" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Display Interns for the selected block (or all blocks) */}
              <div className="space-y-3">
                {activeDistrict.blocks
                  .filter(b => selectedBlockId === 'all' || b.blockId === selectedBlockId)
                  .map(block => {
                    const filtered = filterInterns(block.interns);
                    if (filtered.length === 0 && (searchQuery || statusFilter !== 'all')) return null;

                    return (
                      <div key={block.blockId} className="card p-4 sm:p-5 border border-slate-200 bg-white shadow-2xs space-y-4">
                        {/* Block Sub-header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{block.blockName} Block</h4>
                            <span className="text-xs text-slate-500">
                              ({block.completedTasks} / {block.totalInterns} Interns Completed)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs font-bold px-2 py-0.5 rounded-md',
                              block.completionRate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            )}>
                              {block.completionRate}% Done
                            </span>
                            {block.overdueTasks > 0 && (
                              <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                {block.overdueTasks} Overdue
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Intern Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filtered.map(intern => (
                            <InternTaskCard
                              key={intern.internId}
                              intern={intern}
                              isNudged={!!nudgedInterns[intern.internId]}
                              onNudge={() => handleNudgeIntern(intern)}
                              onWhatsApp={() => handleWhatsAppNudge(intern)}
                              renderStatusBadge={renderStatusBadge}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MODE B: ACCORDION VIEW
             ══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'accordion' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {activeDistrict.blocks.map(block => {
                const isExpanded = !!expandedBlocks[block.blockId];
                const filtered = filterInterns(block.interns);
                const isHigh = block.completionRate >= 75;
                const isMedium = block.completionRate >= 50 && block.completionRate < 75;

                return (
                  <div
                    key={block.blockId}
                    className="card border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    {/* Accordion Block Header Bar */}
                    <div
                      onClick={() => toggleAccordionBlock(block.blockId)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                            isHigh ? 'bg-emerald-100 text-emerald-800' : isMedium ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          )}
                        >
                          {block.completionRate}%
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                              {block.blockName} Block
                            </h4>
                            {block.overdueTasks > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                {block.overdueTasks} Overdue
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {block.completedTasks} completed · {block.inProgressTasks} in progress · {block.pendingTasks} pending
                          </p>
                        </div>
                      </div>

                      {/* Right Progress & Chevron */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:block text-right">
                          <span className="text-xs font-bold text-slate-700 block">
                            {block.completedTasks} / {block.totalInterns} Interns
                          </span>
                          <span className="text-[10px] text-slate-400">Target: 100%</span>
                        </div>

                        <div className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
                          {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                        </div>
                      </div>
                    </div>

                    {/* Progress line under header */}
                    <div className="w-full h-1 bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                        )}
                        style={{ width: `${block.completionRate}%` }}
                      />
                    </div>

                    {/* Accordion Content: Intern List */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 space-y-3">
                        {filtered.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400">
                            No interns match the selected filters for this block.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filtered.map(intern => (
                              <InternTaskCard
                                key={intern.internId}
                                intern={intern}
                                isNudged={!!nudgedInterns[intern.internId]}
                                onNudge={() => handleNudgeIntern(intern)}
                                onWhatsApp={() => handleWhatsAppNudge(intern)}
                                renderStatusBadge={renderStatusBadge}
                              />
                            ))}
                          </div>
                        )}
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
  );
}

// ── Reusable Individual Intern Task Card ─────────────────────────────────────

interface InternTaskCardProps {
  intern: InternTaskItem;
  isNudged: boolean;
  onNudge: () => void;
  onWhatsApp: () => void;
  renderStatusBadge: (status: InternTaskItem['status']) => React.ReactNode;
}

function InternTaskCard({
  intern,
  isNudged,
  onNudge,
  onWhatsApp,
  renderStatusBadge,
}: InternTaskCardProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-200 transition-all shadow-2xs space-y-3">
      {/* Top Row: Intern identity + Status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {intern.internName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {intern.internName}
            </h5>
            <p className="text-[11px] text-slate-400 truncate">
              GP: {intern.panchayatName} · {intern.villageName}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {renderStatusBadge(intern.status)}
        </div>
      </div>

      {/* Task Details & Submissions */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="truncate max-w-[200px] text-slate-800 font-semibold">{intern.taskName}</span>
          <span className="shrink-0 text-slate-400">Due: {intern.dueDate}</span>
        </div>

        {/* Survey Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Surveys Submitted</span>
            <span className="font-bold text-slate-700">
              {intern.submissionsCount} / {intern.targetSubmissions}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                intern.status === 'completed'
                  ? 'bg-emerald-500'
                  : intern.status === 'overdue'
                  ? 'bg-rose-500'
                  : 'bg-indigo-600'
              )}
              style={{
                width: `${Math.min(100, (intern.submissionsCount / intern.targetSubmissions) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions: Contact + Nudge Reminder */}
      <div className="pt-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] text-slate-400">
          Active: {intern.lastActiveDate}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Quick WhatsApp Reminder */}
          <button
            type="button"
            onClick={onWhatsApp}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
            title="Send WhatsApp reminder"
            aria-label="Send WhatsApp reminder"
          >
            <ChatCircleDots size={14} weight="bold" />
          </button>

          {/* Direct Portal Nudge */}
          <button
            type="button"
            onClick={onNudge}
            disabled={isNudged || intern.status === 'completed'}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
              intern.status === 'completed'
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : isNudged
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 active:scale-95'
            )}
          >
            <BellRinging size={13} weight="bold" />
            <span>{isNudged ? 'Nudged ✓' : 'Nudge'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
