'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MagnifyingGlass,
  Funnel,
  ShieldWarning,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChatCircleDots,
  Users,
  Check,
  X,
  BuildingOffice,
  ShieldCheck,
  Calendar,
  FileText,
  Play,
  Pause,
  Microphone,
  VideoCamera,
  Hourglass,
  ArrowBendUpRight,
} from '@phosphor-icons/react';
import { complaintApi } from '@/lib/api/complaints';
import type { Complaint, ComplaintStatus } from '@/types/models';
import {
  complaintCategoryLabel,
  complaintStatusLabel,
  complaintStatusColor,
  roleLabel,
  formatDate,
  cn,
} from '@/lib/utils/formatters';
import ComplaintDetailsModal from '@/components/complaints/ComplaintDetailsModal';
import ReviewComplaintModal from '@/components/complaints/ReviewComplaintModal';
import VideoPlayerModal from '@/components/complaints/VideoPlayerModal';

export default function AdminComplaintsPage() {
  const [activeTab, setActiveTab] = useState<'review_pcs' | 'all_grievances'>('review_pcs');

  // Tab 1: PC complaints
  const [pcComplaints, setPcComplaints] = useState<Complaint[]>([]);
  // Tab 2: All complaints across state
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'pc' | 'fellow' | 'intern'>('all');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [reviewActionData, setReviewActionData] = useState<{
    complaint: Complaint | null;
    action: 'resolve' | 'reject' | 'forward' | null;
  }>({ complaint: null, action: null });

  // Audio / Video Note playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<{ url: string; title: string } | null>(null);

  const togglePlayAudio = (id: string, url?: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      if (url && url !== '#voice-note') {
        const audio = new Audio(url);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingAudioId(null);
      } else {
        setTimeout(() => setPlayingAudioId(prev => (prev === id ? null : prev)), 6000);
      }
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pcs, all] = await Promise.all([
        complaintApi.getReviewComplaints('spm_cpm'),
        complaintApi.list(),
      ]);
      setPcComplaints(pcs);
      setAllComplaints(all.items);
    } catch {
      // Handled in API
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab 1 Stats
  const pcStats = useMemo(() => {
    return {
      total: pcComplaints.length,
      pending: pcComplaints.filter(c => c.status === 'pending').length,
      resolved: pcComplaints.filter(c => c.status === 'resolved').length,
      rejected: pcComplaints.filter(c => c.status === 'rejected').length,
    };
  }, [pcComplaints]);

  // Tab 2 Stats
  const allStats = useMemo(() => {
    return {
      total: allComplaints.length,
      pending: allComplaints.filter(c => c.status === 'pending').length,
      resolved: allComplaints.filter(c => c.status === 'resolved').length,
      rejected: allComplaints.filter(c => c.status === 'rejected').length,
    };
  }, [allComplaints]);

  // Tab 1 filtered
  const filteredPcComplaints = useMemo(() => {
    return pcComplaints.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.subject.toLowerCase().includes(q) ||
          c.ticketNumber.toLowerCase().includes(q) ||
          c.applicantName.toLowerCase().includes(q) ||
          c.assignedLocation.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pcComplaints, statusFilter, searchQuery]);

  // Tab 2 filtered
  const filteredAllComplaints = useMemo(() => {
    return allComplaints.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (roleFilter !== 'all' && c.applicantRole !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.subject.toLowerCase().includes(q) ||
          c.ticketNumber.toLowerCase().includes(q) ||
          c.applicantName.toLowerCase().includes(q) ||
          c.assignedLocation.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allComplaints, statusFilter, roleFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── FROZEN STICKY HEADER: Title + Description + Tab Switcher (stays stable when scrolling up/down) ── */}
      <div className="sticky top-0 z-20 bg-slate-50/95 lg:bg-white/95 backdrop-blur-md -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-3.5 pb-3 sm:pt-5 sm:pb-4 border-b border-slate-200/80 shadow-2xs space-y-3 sm:space-y-4 transition-all">
        {/* Header Title + Description */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Complaints & Grievances</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-none">
              Review divisional Coordinator complaints and monitor state-wide grievance resolution
            </p>
          </div>
        </div>

        {/* ── Sleek Segmented Tab Switch (Matching Leave page) ── */}
        <div className="w-full max-w-md bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 grid grid-cols-2 gap-1 shadow-2xs">
          {/* Tab 1: Review Coordinator Complaints */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('review_pcs');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 select-none cursor-pointer relative text-center',
              activeTab === 'review_pcs'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            )}
          >
            <ShieldCheck
              size={16}
              weight={activeTab === 'review_pcs' ? 'fill' : 'bold'}
              className={activeTab === 'review_pcs' ? 'text-indigo-600' : 'text-slate-500'}
            />
            <span className="truncate sm:hidden">Review PCs</span>
            <span className="hidden sm:inline truncate">Review Coordinators</span>
            {pcStats.pending > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-black bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                {pcStats.pending}
              </span>
            )}
            {pcStats.pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border-2 border-white" />
              </span>
            )}
          </button>

          {/* Tab 2: All Grievances (State-wide) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('all_grievances');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 select-none cursor-pointer text-center',
              activeTab === 'all_grievances'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            )}
          >
            <Users
              size={16}
              weight={activeTab === 'all_grievances' ? 'fill' : 'bold'}
              className={activeTab === 'all_grievances' ? 'text-indigo-600' : 'text-slate-500'}
            />
            <span className="truncate sm:hidden">All Grievances</span>
            <span className="hidden sm:inline truncate">All Grievances (State-wide)</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200/70 text-slate-700 font-bold">
              {allComplaints.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Mobile View: 4 Circles in a Single Row ── */}
      <div className="sm:hidden flex items-center justify-between overflow-x-auto no-scrollbar py-1 px-0.5">
        {(activeTab === 'review_pcs'
          ? [
              {
                key: 'all',
                label: 'Total',
                value: pcStats.total,
                icon: ShieldCheck,
                color: 'text-indigo-600',
                activeStyle: 'bg-[#172554] text-white border-[#172554] shadow-md ring-2 ring-indigo-300/60',
              },
              {
                key: 'pending',
                label: 'Pending',
                value: pcStats.pending,
                icon: Hourglass,
                color: 'text-amber-500',
                activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
              },
              {
                key: 'resolved',
                label: 'Resolved',
                value: pcStats.resolved,
                icon: CheckCircle,
                color: 'text-emerald-600',
                activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
              },
              {
                key: 'rejected',
                label: 'Rejected',
                value: pcStats.rejected,
                icon: XCircle,
                color: 'text-rose-500',
                activeStyle: 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-300/60',
              },
            ]
          : [
              {
                key: 'all',
                label: 'Total',
                value: allStats.total,
                icon: Users,
                color: 'text-indigo-600',
                activeStyle: 'bg-[#172554] text-white border-[#172554] shadow-md ring-2 ring-indigo-300/60',
              },
              {
                key: 'pending',
                label: 'Pending',
                value: allStats.pending,
                icon: Hourglass,
                color: 'text-amber-500',
                activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
              },
              {
                key: 'resolved',
                label: 'Resolved',
                value: allStats.resolved,
                icon: CheckCircle,
                color: 'text-emerald-600',
                activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
              },
              {
                key: 'rejected',
                label: 'Rejected',
                value: allStats.rejected,
                icon: XCircle,
                color: 'text-rose-500',
                activeStyle: 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-300/60',
              },
            ]
        ).map((item) => {
          const Icon = item.icon;
          const isSelected = statusFilter === item.key;
          return (
            <button
              key={`circle-${item.label}`}
              type="button"
              onClick={() => {
                setStatusFilter((prev) => (prev === item.key ? 'all' : (item.key as typeof statusFilter)));
              }}
              title={`Filter by ${item.label}`}
              className={cn(
                'group shrink-0 w-[72px] h-[72px] rounded-full aspect-square flex flex-col items-center justify-center p-1 border transition-all duration-200 cursor-pointer select-none text-center',
                isSelected
                  ? item.activeStyle
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 shadow-2xs'
              )}
            >
              <Icon
                size={13}
                weight={isSelected ? 'fill' : 'bold'}
                className={cn('shrink-0 mb-0.5 transition-colors', isSelected ? 'text-white' : item.color)}
              />
              <span
                className={cn(
                  'text-base font-black tracking-tight leading-none',
                  isSelected ? 'text-white' : 'text-slate-900'
                )}
              >
                {item.value}
              </span>
              <span
                className={cn(
                  'text-[9px] font-semibold tracking-tight mt-0.5 max-w-[62px] truncate px-0.5 text-center leading-tight',
                  isSelected ? 'text-white/90' : 'text-slate-500'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Desktop View: Executive KPI Square Cards (referencing 2nd ss) ── */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {(activeTab === 'review_pcs'
          ? [
              {
                key: 'all',
                cardTitle: 'Total Complaints',
                value: pcStats.total,
                icon: ShieldCheck,
                iconBg: 'bg-indigo-50',
                iconColor: 'text-indigo-600',
                valueColor: 'text-slate-900',
                subtitle: 'Logged in portal',
              },
              {
                key: 'pending',
                cardTitle: 'Pending Review',
                value: pcStats.pending,
                icon: Hourglass,
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-600',
                valueColor: 'text-amber-600',
                subtitle: 'Awaiting resolution',
              },
              {
                key: 'resolved',
                cardTitle: 'Resolved',
                value: pcStats.resolved,
                icon: CheckCircle,
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
                valueColor: 'text-emerald-600',
                subtitle: 'Successfully closed',
              },
              {
                key: 'rejected',
                cardTitle: 'Rejected',
                value: pcStats.rejected,
                icon: XCircle,
                iconBg: 'bg-rose-50',
                iconColor: 'text-rose-600',
                valueColor: 'text-slate-900',
                subtitle: 'Returned with remarks',
              },
            ]
          : [
              {
                key: 'all',
                cardTitle: 'Total Grievances',
                value: allStats.total,
                icon: Users,
                iconBg: 'bg-indigo-50',
                iconColor: 'text-indigo-600',
                valueColor: 'text-slate-900',
                subtitle: 'Created state-wide',
              },
              {
                key: 'pending',
                cardTitle: 'Pending Review',
                value: allStats.pending,
                icon: Hourglass,
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-600',
                valueColor: 'text-amber-600',
                subtitle: 'Awaiting resolution',
              },
              {
                key: 'resolved',
                cardTitle: 'Resolved',
                value: allStats.resolved,
                icon: CheckCircle,
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
                valueColor: 'text-emerald-600',
                subtitle: 'Successfully closed',
              },
              {
                key: 'rejected',
                cardTitle: 'Rejected',
                value: allStats.rejected,
                icon: XCircle,
                iconBg: 'bg-rose-50',
                iconColor: 'text-rose-600',
                valueColor: 'text-slate-900',
                subtitle: 'Returned with remarks',
              },
            ]
        ).map((item) => {
          const Icon = item.icon;
          const isSelected = statusFilter === item.key;
          return (
            <div
              key={`kpi-card-${item.cardTitle}`}
              onClick={() => {
                setStatusFilter((prev) => (prev === item.key ? 'all' : (item.key as typeof statusFilter)));
              }}
              className={cn(
                'card p-3.5 sm:p-4 transition-all duration-200 cursor-pointer select-none relative overflow-hidden',
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20'
                  : 'hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/40'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 line-clamp-1">{item.cardTitle}</span>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', item.iconBg)}>
                  <Icon size={16} weight="fill" className={item.iconColor} />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className={cn('text-2xl sm:text-3xl font-black tracking-tight leading-none', item.valueColor)}>
                  {item.value}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    Active
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-1.5 truncate">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'review_pcs'
                ? 'Search PC name, ticket #, division...'
                : 'Search any applicant, ticket #, subject...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-wrap">
          {/* Role Filter (Tab 2 only) */}
          {activeTab === 'all_grievances' && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs font-semibold text-slate-400">Role:</span>
              {(['all', 'pc', 'fellow', 'intern'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? 'All' : roleLabel(r)}
                </button>
              ))}
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Funnel size={14} /> Status:
            </span>
            {(['all', 'pending', 'resolved', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'review_pcs' ? (
        // TAB 1: REVIEW PC COMPLAINTS
        loading ? (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading complaints...</div>
        ) : filteredPcComplaints.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">
              No Program Coordinator complaints currently require PMU action.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Header bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} weight="fill" className="text-slate-500" />
                <span className="text-sm font-bold text-slate-900">Coordinator Complaints</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{filteredPcComplaints.length} record(s)</span>
            </div>

            {/* ── Mobile View: Review PC Complaints Cards ── */}
            <div className="sm:hidden space-y-3">
              {filteredPcComplaints.map(item => {
                const isPending = item.status === 'pending';
                const initials = item.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2);
                const lastEsc = item.escalations && item.escalations.length > 0 ? item.escalations[item.escalations.length - 1] : null;

                return (
                  <div key={item.id} className="card p-4 space-y-3 hover:border-slate-300 transition-all shadow-2xs">
                    {/* Header Row: Avatar + Name & District (Left), Status Badge (Right) */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{item.applicantName}</h3>
                          <span className="text-xs text-slate-400">({item.assignedLocation})</span>
                        </div>
                      </div>

                      {/* Status Badge in Top Right Corner */}
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0', complaintStatusColor(item.status))}>
                        {complaintStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Chips Row: Category + Ticket Number + Forwarded Badge if any */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {complaintCategoryLabel(item.category)}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.ticketNumber}
                      </span>
                      {item.isEscalated && (
                        <span className="badge border text-[11px] font-bold bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 shadow-2xs">
                          <ArrowBendUpRight size={12} weight="bold" /> Forwarded from {lastEsc ? roleLabel(lastEsc.forwarderRole) : 'Coordinator'}
                        </span>
                      )}
                    </div>

                    {/* Incident & Applied Dates */}
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar size={14} className="text-indigo-600 shrink-0" />
                        <span>Incident: {formatDate(item.incidentDate || item.appliedAt, 'dd MMM yyyy')}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">Applied on {formatDate(item.appliedAt, 'dd MMM yyyy')}</div>
                    </div>

                    {/* Subject */}
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">{item.subject}</p>

                    {/* Forwarded Details Callout Banner */}
                    {item.isEscalated && (
                      <div className="p-2.5 rounded-xl bg-purple-50/85 border border-purple-200/90 text-xs text-purple-950 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-purple-900">
                          <ArrowBendUpRight size={14} weight="bold" className="text-purple-600 shrink-0" />
                          <span>Forwarded by {lastEsc ? `${lastEsc.forwardedBy} (${roleLabel(lastEsc.forwarderRole)})` : 'Coordinator'}</span>
                        </div>
                        {lastEsc?.reason && (
                          <p className="text-[11px] text-purple-800 italic pl-5">
                            &ldquo;{lastEsc.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: Left = View details, Right = Circular Action Buttons (Document, Voice, Video) on bottom right corner */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* View details */}
                      <button
                        type="button"
                        onClick={() => setSelectedComplaint(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/70 transition shadow-2xs cursor-pointer"
                      >
                        <Eye size={14} weight="bold" />
                        <span>View details</span>
                      </button>

                      {/* Circular Action Buttons on bottom right corner */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Circular Document button if document attached */}
                        {item.documentName && (
                          <button
                            type="button"
                            onClick={() => setSelectedComplaint(item)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-90"
                            title={item.documentName ? `Document: ${item.documentName}` : 'View Attachment'}
                          >
                            <FileText size={15} weight="bold" className="text-indigo-600" />
                          </button>
                        )}

                        {/* Circular Voice Note play button */}
                        {item.voiceNoteUrl && (
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(item.id, item.voiceNoteUrl)}
                            className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-90"
                            title={playingAudioId === item.id ? 'Pause Voice Note' : (item.voiceNoteName || 'Play Voice Note')}
                          >
                            {playingAudioId === item.id ? (
                              <Pause size={13} weight="fill" />
                            ) : (
                              <Play size={13} weight="fill" className="ml-0.5" />
                            )}
                          </button>
                        )}

                        {/* Circular Video Note play button */}
                        {item.videoNoteUrl && (
                          <button
                            type="button"
                            onClick={() => setPlayingVideoUrl({ url: item.videoNoteUrl!, title: item.videoNoteName || 'Video Note' })}
                            className="w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-90"
                            title={item.videoNoteName || 'Play Video Note'}
                          >
                            <Play size={13} weight="fill" className="ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review Actions: 3-Col Resolve, Reject, Forward on Mobile */}
                    {isPending ? (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setReviewActionData({ complaint: item, action: 'resolve' })}
                          className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Check size={14} weight="bold" />
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewActionData({ complaint: item, action: 'reject' })}
                          className="w-full py-2 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <X size={14} weight="bold" />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewActionData({ complaint: item, action: 'forward' })}
                          className="w-full py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Forward up to State Grievance Committee"
                        >
                          <ArrowBendUpRight size={14} weight="bold" />
                          Forward
                        </button>
                      </div>
                    ) : (
                      item.reviewerComment && (
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 mt-1">
                          <strong>PMU Decision:</strong> &ldquo;{item.reviewerComment}&rdquo;
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Desktop View: Full Coordinator Complaints Table ── */}
            <div className="hidden sm:block card overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Coordinator & Division</th>
                    <th className="py-3 px-4">Subject & Issue</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPcComplaints.map(item => {
                    const lastEsc = item.escalations && item.escalations.length > 0 ? item.escalations[item.escalations.length - 1] : null;

                    return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedComplaint(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        {item.ticketNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{item.applicantName}</p>
                        <p className="text-[11px] text-slate-400">{item.assignedLocation}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{item.subject}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {complaintCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(item.appliedAt, 'dd MMM yyyy')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${complaintStatusColor(item.status)}`}>
                            {complaintStatusLabel(item.status)}
                          </span>
                          {item.isEscalated && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200"
                              title={lastEsc ? `Forwarded by ${lastEsc.forwardedBy}: "${lastEsc.reason}"` : 'Forwarded grievance'}
                            >
                              <ArrowBendUpRight size={11} weight="bold" />
                              Forwarded from {lastEsc ? roleLabel(lastEsc.forwarderRole) : 'Coordinator'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComplaint(item);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye size={16} />
                          </button>

                          {item.status === 'pending' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReviewActionData({ complaint: item, action: 'resolve' });
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <Check size={12} weight="bold" />
                                Resolve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReviewActionData({ complaint: item, action: 'reject' });
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              >
                                <X size={12} weight="bold" />
                                Reject
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReviewActionData({ complaint: item, action: 'forward' });
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                                title="Forward up to State Grievance Committee"
                              >
                                <ArrowBendUpRight size={12} weight="bold" />
                                Forward
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Reviewed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // TAB 2: STATE-WIDE ALL GRIEVANCES
        loading ? (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading state-wide grievances...</div>
        ) : filteredAllComplaints.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ShieldWarning size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No complaints found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No records match the active role, status, or search filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Header bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Users size={18} weight="fill" className="text-slate-500" />
                <span className="text-sm font-bold text-slate-900">All Grievances</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{filteredAllComplaints.length} record(s)</span>
            </div>

            {/* ── Mobile View: Separate Cards for Each Complaint ── */}
            <div className="sm:hidden space-y-3">
              {filteredAllComplaints.map(item => {
                const initials = item.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2);

                return (
                  <div key={item.id} className="card p-4 space-y-3 hover:border-slate-300 transition-all shadow-2xs">
                    {/* Top Row: Avatar + Name + Role Badge + District (Left), Status Badge (Right) */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{item.applicantName}</h3>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {roleLabel(item.applicantRole)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">({item.assignedLocation})</span>
                        </div>
                      </div>

                      {/* Status Badge in Top Right Corner */}
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0', complaintStatusColor(item.status))}>
                        {complaintStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Chips Row: Category + Ticket Number + Forwarded Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {complaintCategoryLabel(item.category)}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.ticketNumber}
                      </span>
                      {item.isEscalated && (
                        <span className="badge border text-[11px] font-bold bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 shadow-2xs">
                          <ArrowBendUpRight size={12} weight="bold" /> Forwarded
                        </span>
                      )}
                    </div>

                    {/* Incident & Applied Dates */}
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar size={14} className="text-indigo-600 shrink-0" />
                        <span>Incident: {formatDate(item.incidentDate || item.appliedAt, 'dd MMM yyyy')}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">Applied on {formatDate(item.appliedAt, 'dd MMM yyyy')}</div>
                    </div>

                    {/* Subject */}
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">{item.subject}</p>

                    {/* Bottom Row: Left = View details, Right = Circular Action Buttons (Document, Voice, Video) on bottom right corner */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* View details */}
                      <button
                        type="button"
                        onClick={() => setSelectedComplaint(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/70 transition shadow-2xs cursor-pointer"
                      >
                        <Eye size={14} weight="bold" />
                        <span>View details</span>
                      </button>

                      {/* Circular Action Buttons on bottom right corner */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Circular Document button if document attached */}
                        {item.documentName && (
                          <button
                            type="button"
                            onClick={() => setSelectedComplaint(item)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-90"
                            title={item.documentName ? `Document: ${item.documentName}` : 'View Attachment'}
                          >
                            <FileText size={15} weight="bold" className="text-indigo-600" />
                          </button>
                        )}

                        {/* Circular Voice Note play button */}
                        {item.voiceNoteUrl && (
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(item.id, item.voiceNoteUrl)}
                            className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-90"
                            title={playingAudioId === item.id ? 'Pause Voice Note' : (item.voiceNoteName || 'Play Voice Note')}
                          >
                            {playingAudioId === item.id ? (
                              <Pause size={13} weight="fill" />
                            ) : (
                              <Play size={13} weight="fill" className="ml-0.5" />
                            )}
                          </button>
                        )}

                        {/* Circular Video Note play button */}
                        {item.videoNoteUrl && (
                          <button
                            type="button"
                            onClick={() => setPlayingVideoUrl({ url: item.videoNoteUrl!, title: item.videoNoteName || 'Video Note' })}
                            className="w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-90"
                            title={item.videoNoteName || 'Play Video Note'}
                          >
                            <Play size={13} weight="fill" className="ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop View: All Grievances Table ── */}
            <div className="hidden sm:block card overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Reviewer Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAllComplaints.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedComplaint(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer sm:cursor-default"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        {item.ticketNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{item.applicantName}</p>
                        <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                          {roleLabel(item.applicantRole)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.assignedLocation}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{item.subject}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {complaintCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {item.targetRole === 'fellow' ? 'Fellow' : item.targetRole === 'pc' ? 'Program Coordinator' : 'State PMU'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${complaintStatusColor(item.status)}`}>
                            {complaintStatusLabel(item.status)}
                          </span>
                          {item.isEscalated && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200"
                              title="Forwarded grievance"
                            >
                              <ArrowBendUpRight size={11} weight="bold" />
                              Forwarded
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComplaint(item);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        canReview={activeTab === 'review_pcs'}
        onOpenReview={(comp, action) => {
          setReviewActionData({ complaint: comp, action });
        }}
      />

      {/* Review Action Modal */}
      <ReviewComplaintModal
        complaint={reviewActionData.complaint}
        action={reviewActionData.action}
        reviewerRole="spm_cpm"
        onClose={() => setReviewActionData({ complaint: null, action: null })}
        onSuccess={(updated) => {
          setPcComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
          setAllComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
        }}
      />

      {/* Quick Video Player Modal */}
      <VideoPlayerModal
        video={playingVideoUrl}
        onClose={() => setPlayingVideoUrl(null)}
      />
    </div>
  );
}
