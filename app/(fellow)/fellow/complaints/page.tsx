'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
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
  FileText,
  Calendar,
  ClipboardText,
  Play,
  Pause,
  Microphone,
  VideoCamera,
  Hourglass,
} from '@phosphor-icons/react';
import { complaintApi } from '@/lib/api/complaints';
import type { Complaint, ComplaintStatus } from '@/types/models';
import {
  complaintCategoryLabel,
  complaintStatusLabel,
  complaintStatusColor,
  formatDate,
  cn,
} from '@/lib/utils/formatters';
import AddComplaintModal from '@/components/complaints/AddComplaintModal';
import ComplaintDetailsModal from '@/components/complaints/ComplaintDetailsModal';
import ReviewComplaintModal from '@/components/complaints/ReviewComplaintModal';
import VideoPlayerModal from '@/components/complaints/VideoPlayerModal';

export default function FellowComplaintsPage() {
  const [activeTab, setActiveTab] = useState<'my_complaints' | 'review_interns'>('my_complaints');

  // Tab 1: Fellow's own complaints state
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [myLoading, setMyLoading] = useState(true);

  // Tab 2: Intern complaints review state
  const [internComplaints, setInternComplaints] = useState<Complaint[]>([]);
  const [internLoading, setInternLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [reviewActionData, setReviewActionData] = useState<{
    complaint: Complaint | null;
    action: 'resolve' | 'reject' | null;
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

  const loadMyComplaints = useCallback(async () => {
    setMyLoading(true);
    try {
      const data = await complaintApi.getMyComplaints('fellow');
      setMyComplaints(data);
    } catch {
      // Fallback in API
    } finally {
      setMyLoading(false);
    }
  }, []);

  const loadInternComplaints = useCallback(async () => {
    setInternLoading(true);
    try {
      const data = await complaintApi.getReviewComplaints('fellow');
      setInternComplaints(data);
    } catch {
      // Fallback in API
    } finally {
      setInternLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyComplaints();
    loadInternComplaints();
  }, [loadMyComplaints, loadInternComplaints]);

  // Tab 1 Stats
  const myStats = useMemo(() => {
    return {
      total: myComplaints.length,
      pending: myComplaints.filter(c => c.status === 'pending').length,
      resolved: myComplaints.filter(c => c.status === 'resolved').length,
      rejected: myComplaints.filter(c => c.status === 'rejected').length,
    };
  }, [myComplaints]);

  // Tab 2 Stats
  const internStats = useMemo(() => {
    return {
      total: internComplaints.length,
      pending: internComplaints.filter(c => c.status === 'pending').length,
      resolved: internComplaints.filter(c => c.status === 'resolved').length,
      rejected: internComplaints.filter(c => c.status === 'rejected').length,
    };
  }, [internComplaints]);

  // Tab 1 filtered
  const filteredMyComplaints = useMemo(() => {
    return myComplaints.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.subject.toLowerCase().includes(q) ||
          c.ticketNumber.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [myComplaints, statusFilter, searchQuery]);

  // Tab 2 filtered
  const filteredInternComplaints = useMemo(() => {
    return internComplaints.filter(c => {
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
  }, [internComplaints, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Complaint Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-none">
            Manage your grievances to Program Coordinator and review complaints submitted by your Interns
          </p>
        </div>
        <button
          id="fellow-add-complaint-btn"
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#172554] hover:bg-[#0f172a] text-white active:scale-95 transition-all shrink-0 shadow-xs cursor-pointer"
        >
          <Plus size={15} weight="bold" />
          <span>Complaint</span>
        </button>
      </div>

      {/* ── Sleek Segmented Tab Switch (Matching Leave page) ── */}
      <div className="w-full max-w-md bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 grid grid-cols-2 gap-1 shadow-2xs">
        {/* Tab 1: My Complaints */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('my_complaints');
            setStatusFilter('all');
            setSearchQuery('');
          }}
          className={cn(
            'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 select-none cursor-pointer text-center',
            activeTab === 'my_complaints'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          )}
        >
          <ChatCircleDots
            size={16}
            weight={activeTab === 'my_complaints' ? 'fill' : 'bold'}
            className={activeTab === 'my_complaints' ? 'text-indigo-600' : 'text-slate-500'}
          />
          <span className="truncate">My Complaints</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200/70 text-slate-700 font-bold">
            {myComplaints.length}
          </span>
        </button>

        {/* Tab 2: Review Intern Complaints */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('review_interns');
            setStatusFilter('all');
            setSearchQuery('');
          }}
          className={cn(
            'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 select-none cursor-pointer relative text-center',
            activeTab === 'review_interns'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          )}
        >
          <Users
            size={16}
            weight={activeTab === 'review_interns' ? 'fill' : 'bold'}
            className={activeTab === 'review_interns' ? 'text-indigo-600' : 'text-slate-500'}
          />
          <span className="truncate sm:hidden">Review Interns</span>
          <span className="hidden sm:inline truncate">Review Intern Complaints</span>
          {internStats.pending > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-black bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              {internStats.pending}
            </span>
          )}
          {internStats.pending > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border-2 border-white" />
            </span>
          )}
        </button>
      </div>

      {/* ── KPI Metrics Section: 4 Circles in a Single Row (referencing 3rd ss) ── */}
      <div className="flex items-center justify-between sm:justify-start sm:gap-5 overflow-x-auto no-scrollbar py-1 px-0.5">
        {(activeTab === 'my_complaints'
          ? [
              {
                key: 'all',
                label: 'Total',
                value: myStats.total,
                icon: ChatCircleDots,
                color: 'text-indigo-600',
                activeStyle: 'bg-[#172554] text-white border-[#172554] shadow-md ring-2 ring-indigo-300/60',
              },
              {
                key: 'pending',
                label: 'Pending',
                value: myStats.pending,
                icon: Hourglass,
                color: 'text-amber-500',
                activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
              },
              {
                key: 'resolved',
                label: 'Resolved',
                value: myStats.resolved,
                icon: CheckCircle,
                color: 'text-emerald-600',
                activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
              },
              {
                key: 'rejected',
                label: 'Rejected',
                value: myStats.rejected,
                icon: XCircle,
                color: 'text-rose-500',
                activeStyle: 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-300/60',
              },
            ]
          : [
              {
                key: 'all',
                label: 'Total',
                value: internStats.total,
                icon: Users,
                color: 'text-indigo-600',
                activeStyle: 'bg-[#172554] text-white border-[#172554] shadow-md ring-2 ring-indigo-300/60',
              },
              {
                key: 'pending',
                label: 'Pending',
                value: internStats.pending,
                icon: Hourglass,
                color: 'text-amber-500',
                activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
              },
              {
                key: 'resolved',
                label: 'Resolved',
                value: internStats.resolved,
                icon: CheckCircle,
                color: 'text-emerald-600',
                activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
              },
              {
                key: 'rejected',
                label: 'Rejected',
                value: internStats.rejected,
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
                'group shrink-0 w-[72px] h-[72px] sm:w-[76px] sm:h-[76px] rounded-full aspect-square flex flex-col items-center justify-center p-1 border transition-all duration-200 cursor-pointer select-none text-center',
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

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'my_complaints'
                ? 'Search your complaints...'
                : 'Search intern name, ticket #, or issue...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <Funnel size={14} /> Status:
          </span>
          {(['all', 'pending', 'resolved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
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
      {/* Main Content Area */}
      {activeTab === 'my_complaints' ? (
        // TAB 1: FELLOW'S OWN COMPLAINTS
        myLoading ? (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading complaints...</div>
        ) : filteredMyComplaints.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <ShieldWarning size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No complaints found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {myComplaints.length === 0
                ? 'You have not submitted any complaints to the Program Coordinator.'
                : 'No complaints match the filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Header bar matching Leave Applications count */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <ClipboardText size={18} weight="fill" className="text-slate-500" />
                <span className="text-sm font-bold text-slate-900">My Complaints</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{filteredMyComplaints.length} record(s)</span>
            </div>

            {/* ── Mobile View: Separate Cards for Each Complaint ── */}
            <div className="sm:hidden space-y-3">
              {filteredMyComplaints.map(item => (
                <div key={item.id} className="card p-4 sm:p-5 hover:border-slate-300 transition-all space-y-3 shadow-2xs">
                  {/* Top Row: Left = Chips (Category + Ticket No), Right = Status Badge on Top Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge border text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                        {complaintCategoryLabel(item.category)}
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/70">
                        {item.ticketNumber}
                      </span>
                    </div>

                    {/* Status Badge in Top Right Corner */}
                    <span className={cn('badge border text-xs flex items-center gap-1 font-semibold shrink-0', complaintStatusColor(item.status))}>
                      {item.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />}
                      {item.status === 'resolved' && <CheckCircle size={12} weight="fill" className="text-emerald-600" />}
                      {item.status === 'rejected' && <XCircle size={12} weight="fill" className="text-rose-600" />}
                      {complaintStatusLabel(item.status)}
                    </span>
                  </div>

                  {/* Dates: Incident & Applied */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Calendar size={14} className="text-indigo-600 shrink-0" />
                      <span>Incident: {formatDate(item.incidentDate || item.appliedAt, 'dd MMM yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 sm:before:content-['•'] sm:before:mr-1 sm:before:text-slate-300">
                      <span>Applied on {formatDate(item.appliedAt, 'dd MMM yyyy')}</span>
                    </div>
                  </div>

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

                  {/* PC Remarks if reviewed */}
                  {item.reviewerComment && (
                    <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded px-3 py-2 mt-1">
                      <strong>PC Remarks:</strong> &ldquo;{item.reviewerComment}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Desktop View: Full Complaints Table ── */}
            <div className="hidden sm:block card overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Subject & Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Submitted On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">PC Remarks</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMyComplaints.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedComplaint(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        {item.ticketNumber}
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
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${complaintStatusColor(item.status)}`}>
                          {complaintStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        {item.reviewerComment ? (
                          <p className="truncate text-slate-700 text-[11px] italic">
                            &ldquo;{item.reviewerComment}&rdquo;
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">Pending review by PC</span>
                        )}
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
      ) : (
        // TAB 2: REVIEW INTERN COMPLAINTS
        internLoading ? (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading intern complaints...</div>
        ) : filteredInternComplaints.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No grievances pending</h3>
            <p className="text-xs text-slate-500 mt-1">
              No intern complaints currently match your filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Header bar matching review count */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Users size={18} weight="fill" className="text-slate-500" />
                <span className="text-sm font-bold text-slate-900">Intern Complaints</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{filteredInternComplaints.length} record(s)</span>
            </div>

            {/* ── Mobile View: Separate Review Cards ── */}
            <div className="sm:hidden space-y-3">
              {filteredInternComplaints.map(item => {
                const isPending = item.status === 'pending';
                const initials = item.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2);

                return (
                  <div key={item.id} className="card p-4 sm:p-5 hover:border-slate-300 transition-all space-y-3.5 shadow-2xs">
                    {/* Header Row: Avatar + Name & Location (Left), Status Badge (Right) */}
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
                        {item.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />}
                        {item.status === 'resolved' && <CheckCircle size={12} weight="fill" className="text-emerald-600" />}
                        {item.status === 'rejected' && <XCircle size={12} weight="fill" className="text-rose-600" />}
                        {complaintStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* Chips Row: Category + Ticket Number */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {complaintCategoryLabel(item.category)}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.ticketNumber}
                      </span>
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
                            title={playingAudioId === item.id ? 'Pause Voice Note' : 'Play Voice Note'}
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
                            title="Play Video Note"
                          >
                            <Play size={13} weight="fill" className="ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reviewer Comment if already reviewed */}
                    {item.reviewerComment && (
                      <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2">
                        <strong>Reviewer Comment:</strong> {item.reviewerComment}
                      </div>
                    )}

                    {/* Bottom Action Buttons: Approve / Reject 50-50 Grid */}
                    {isPending && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setReviewActionData({ complaint: item, action: 'resolve' })}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Check size={16} weight="bold" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewActionData({ complaint: item, action: 'reject' })}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <X size={16} weight="bold" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Desktop View: Review Intern Complaints Table ── */}
            <div className="hidden sm:block card overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Intern & Block</th>
                    <th className="py-3 px-4">Subject & Issue</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInternComplaints.map(item => (
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
                        <p className="text-[11px] text-slate-500">{item.assignedLocation}</p>
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
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${complaintStatusColor(item.status)}`}>
                          {complaintStatusLabel(item.status)}
                        </span>
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
                                Approve
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
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Reviewed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Quick Video Player Modal */}
      <VideoPlayerModal
        video={playingVideoUrl}
        onClose={() => setPlayingVideoUrl(null)}
      />

      {/* Add Complaint Modal for Fellow */}
      <AddComplaintModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(newComp) => {
          setMyComplaints(prev => [newComp, ...prev]);
        }}
        userRole="fellow"
        recipientLabel="Program Coordinator (PC)"
      />

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        canReview={activeTab === 'review_interns'}
        onOpenReview={(comp, action) => {
          setReviewActionData({ complaint: comp, action });
        }}
      />

      {/* Review Action Modal */}
      <ReviewComplaintModal
        complaint={reviewActionData.complaint}
        action={reviewActionData.action}
        reviewerRole="fellow"
        onClose={() => setReviewActionData({ complaint: null, action: null })}
        onSuccess={(updated) => {
          setInternComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
        }}
      />
    </div>
  );
}
