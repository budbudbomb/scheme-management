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
  FileText,
  ChatCircleDots,
  Calendar,
  ClipboardText,
  Play,
  Pause,
  Microphone,
  VideoCamera,
  Hourglass,
} from '@phosphor-icons/react';
import { complaintApi } from '@/lib/api/complaints';
import type { Complaint, ComplaintStatus, ComplaintCategory } from '@/types/models';
import {
  complaintCategoryLabel,
  complaintStatusLabel,
  complaintStatusColor,
  formatDate,
  truncate,
  cn,
} from '@/lib/utils/formatters';
import AddComplaintModal from '@/components/complaints/AddComplaintModal';
import ComplaintDetailsModal from '@/components/complaints/ComplaintDetailsModal';
import VideoPlayerModal from '@/components/complaints/VideoPlayerModal';

export default function InternComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ComplaintCategory>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

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
      const data = await complaintApi.getMyComplaints('intern');
      setComplaints(data);
    } catch {
      // Fallback handled in API
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const rejected = complaints.filter(c => c.status === 'rejected').length;
    return { total, pending, resolved, rejected };
  }, [complaints]);

  // Filtered complaints
  const filtered = useMemo(() => {
    return complaints.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = item.subject.toLowerCase().includes(q);
        const matchTicket = item.ticketNumber.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchSubject && !matchTicket && !matchDesc) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header with Top Right "+ Complaint" */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Complaint Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-none">
            Submit grievances and track approvals addressed to your assigned Fellow
          </p>
        </div>
        <button
          id="intern-add-complaint-btn"
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#172554] hover:bg-[#0f172a] text-white active:scale-95 transition-all shrink-0 shadow-xs cursor-pointer"
        >
          <Plus size={15} weight="bold" />
          <span>Complaint</span>
        </button>
      </div>

      {/* ── KPI Metrics Section: 4 Circles in a Single Row (referencing 3rd ss) ── */}
      <div className="flex items-center justify-between sm:justify-start sm:gap-5 overflow-x-auto no-scrollbar py-1 px-0.5">
        {[
          {
            key: 'all',
            label: 'Total',
            value: stats.total,
            icon: ChatCircleDots,
            color: 'text-indigo-600',
            activeStyle: 'bg-[#172554] text-white border-[#172554] shadow-md ring-2 ring-indigo-300/60',
          },
          {
            key: 'pending',
            label: 'Pending',
            value: stats.pending,
            icon: Hourglass,
            color: 'text-amber-500',
            activeStyle: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300/60',
          },
          {
            key: 'resolved',
            label: 'Resolved',
            value: stats.resolved,
            icon: CheckCircle,
            color: 'text-emerald-600',
            activeStyle: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/60',
          },
          {
            key: 'rejected',
            label: 'Rejected',
            value: stats.rejected,
            icon: XCircle,
            color: 'text-rose-500',
            activeStyle: 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-300/60',
          },
        ].map((item) => {
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
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket # or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Pills */}
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

      {/* Complaints Main Content Area */}
      {loading ? (
        <div className="card p-8 text-center text-slate-400 text-sm">Loading complaints...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <ShieldWarning size={24} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No complaints found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {complaints.length === 0
              ? 'You have not submitted any complaints yet. Click "Add Complaint" to log an issue.'
              : 'No complaints match your current search and filter criteria.'}
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
            <span className="text-xs text-slate-500 font-medium">{filtered.length} record(s)</span>
          </div>

          {/* ── Mobile View: Separate Cards for Each Complaint ── */}
          <div className="sm:hidden space-y-3">
            {filtered.map(item => (
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

                {/* Fellow Remarks if reviewed */}
                {item.reviewerComment && (
                  <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 rounded px-3 py-2 mt-1">
                    <strong>Fellow Remarks:</strong> &ldquo;{item.reviewerComment}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Desktop View: Full Complaints Table ── */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardText size={16} weight="fill" className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">My Complaints</span>
              </div>
              <span className="text-xs text-slate-500">{filtered.length} record(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Subject & Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Submitted On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Fellow Remarks</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => (
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
                          <p className="truncate text-slate-700 text-[11px] italic" title={item.reviewerComment}>
                            &ldquo;{item.reviewerComment}&rdquo;
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">Pending review</span>
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
        </div>
      )}

      {/* Add Complaint Modal */}
      <AddComplaintModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(newComp) => {
          setComplaints(prev => [newComp, ...prev]);
        }}
        userRole="intern"
        recipientLabel="Assigned Fellow"
      />

      {/* Details Modal */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />

      {/* Quick Video Player Modal */}
      <VideoPlayerModal
        video={playingVideoUrl}
        onClose={() => setPlayingVideoUrl(null)}
      />
    </div>
  );
}
