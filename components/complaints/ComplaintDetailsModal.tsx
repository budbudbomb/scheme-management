'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  User,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  DownloadSimple,
  Microphone,
  VideoCamera,
  Play,
  ArrowBendUpRight,
} from '@phosphor-icons/react';
import type { Complaint } from '@/types/models';
import {
  complaintCategoryLabel,
  complaintStatusLabel,
  complaintStatusColor,
  roleLabel,
  formatDate,
} from '@/lib/utils/formatters';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  canReview?: boolean;
  onOpenReview?: (complaint: Complaint, action: 'resolve' | 'reject' | 'forward') => void;
}

export default function ComplaintDetailsModal({
  complaint,
  onClose,
  canReview = false,
  onOpenReview,
}: ComplaintDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when open
  useEffect(() => {
    if (!complaint) return;
    const origOverflow = document.body.style.overflow;
    const origTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const mainEl = document.querySelector('main');
    const origMainOverflow = mainEl ? mainEl.style.overflow : '';
    if (mainEl) mainEl.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = origOverflow;
      document.body.style.touchAction = origTouchAction;
      if (mainEl) mainEl.style.overflow = origMainOverflow;
    };
  }, [complaint]);

  if (!complaint || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden transition-all transform animate-scale-in"
      >
        {/* Header - Fixed at Top */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded-md">
                {complaint.ticketNumber}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${complaintStatusColor(complaint.status)}`}>
                {complaintStatusLabel(complaint.status)}
              </span>
              {complaint.isEscalated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                  <ArrowBendUpRight size={12} weight="bold" />
                  Forwarded {complaint.escalations && complaint.escalations.length > 0 ? `from ${roleLabel(complaint.escalations[complaint.escalations.length - 1].forwarderRole)}` : ''}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">{complaint.subject}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-4 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applicant</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm font-semibold text-slate-800">
                <User size={14} className="text-indigo-600 shrink-0" />
                <span className="truncate">{complaint.applicantName}</span>
              </div>
              <span className="text-[11px] text-slate-500">{roleLabel(complaint.applicantRole)}</span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm font-medium text-slate-800">
                <MapPin size={14} className="text-indigo-600 shrink-0" />
                <span className="truncate">{complaint.assignedLocation}</span>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
              <span className="inline-block mt-1 text-xs font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {complaintCategoryLabel(complaint.category)}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied Date</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-700">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span>{formatDate(complaint.appliedAt, 'dd MMM yyyy, HH:mm')}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Complaint Description</h3>
            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {complaint.description}
            </div>
          </div>

          {/* Incident date if specified */}
          {complaint.incidentDate && (
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Date of Incident / Occurrence: </span>
              {formatDate(complaint.incidentDate)}
            </div>
          )}

          {/* Voice Note Section if present */}
          {complaint.voiceNoteUrl && (
            <div>
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Microphone size={16} className="text-purple-600" />
                Voice Note Recorded by Applicant
              </h3>
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-purple-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span>{complaint.voiceNoteName || 'voice_recording.webm'}</span>
                  {complaint.voiceNoteDuration && (
                    <span className="text-purple-600 font-semibold">({complaint.voiceNoteDuration}s)</span>
                  )}
                </div>
                {complaint.voiceNoteUrl && complaint.voiceNoteUrl !== '#voice-note' ? (
                  <audio controls className="w-full sm:w-64 h-9">
                    <source src={complaint.voiceNoteUrl} type="audio/webm" />
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-xs text-purple-800 font-medium">
                    <Play size={13} weight="fill" className="text-purple-600" />
                    <span>Demo voice note attached ({complaint.voiceNoteDuration || 6}s)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Note Section if present */}
          {complaint.videoNoteUrl && (
            <div>
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <VideoCamera size={16} className="text-blue-600" />
                Video Note Attached
              </h3>
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium text-blue-950">
                  <span>{complaint.videoNoteName || 'video_clip.mp4'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Video Evidence</span>
                </div>
                {complaint.videoNoteUrl && complaint.videoNoteUrl !== '#video-clip' ? (
                  <video controls className="w-full max-h-56 rounded-lg bg-black border border-blue-100">
                    <source src={complaint.videoNoteUrl} />
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <div className="p-4 rounded-lg bg-white border border-blue-200 text-center text-xs text-blue-700 font-medium">
                    Video file attached ({complaint.videoNoteName || 'video_evidence.mp4'})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Attachment */}
          {complaint.documentName && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supporting Document</h3>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">{complaint.documentName}</p>
                    <p className="text-[11px] text-slate-500">Supporting file</p>
                  </div>
                </div>
                <a
                  href={complaint.documentUrl || '#'}
                  download={complaint.documentName}
                  onClick={(e) => {
                    if (!complaint.documentUrl || complaint.documentUrl === '#') {
                      e.preventDefault();
                      alert(`Mock download triggered for: ${complaint.documentName}`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                >
                  <DownloadSimple size={14} weight="bold" />
                  Download
                </a>
              </div>
            </div>
          )}

          {/* Escalation & Forwarding Trail */}
          {((complaint.escalations && complaint.escalations.length > 0) || complaint.isEscalated) && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <ArrowBendUpRight size={14} weight="bold" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
                  Escalation & Forwarding Trail
                </h4>
                <span className="ml-auto text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200/80">
                  Hierarchical Escalation
                </span>
              </div>

              {complaint.escalations && complaint.escalations.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {complaint.escalations.map((esc, idx) => (
                    <div key={idx} className="p-3 bg-white/95 border border-indigo-100 rounded-lg text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          Forwarded by <strong className="text-indigo-900">{esc.forwardedBy}</strong> ({roleLabel(esc.forwarderRole)})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(esc.forwardedAt, 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium">
                        <ArrowBendUpRight size={13} weight="bold" />
                        <span>Escalated to: <strong>{esc.forwardedToLabel}</strong></span>
                      </div>
                      <div className="text-slate-600 bg-slate-50 border border-slate-200/70 rounded p-2 text-xs italic">
                        &ldquo;{esc.reason}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-indigo-800">
                  This grievance was forwarded up the hierarchy for higher administrative review.
                </p>
              )}
            </div>
          )}

          {/* Review Status & Feedback */}
          {complaint.status !== 'pending' && (
            <div className={`p-4 rounded-xl border ${
              complaint.status === 'resolved' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {complaint.status === 'resolved' ? (
                  <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
                ) : (
                  <XCircle size={18} weight="fill" className="text-rose-600 shrink-0" />
                )}
                <h4 className={`text-xs sm:text-sm font-bold ${
                  complaint.status === 'resolved' ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {complaint.status === 'resolved' ? 'Resolution Remarks' : 'Rejection Reason'}
                </h4>
                {complaint.reviewedBy && (
                  <span className="text-[11px] text-slate-500 ml-auto">
                    By <strong className="text-slate-700">{complaint.reviewedBy}</strong>
                    {complaint.reviewedAt && ` on ${formatDate(complaint.reviewedAt, 'dd MMM yyyy')}`}
                  </span>
                )}
              </div>
              <p className={`text-xs sm:text-sm ${
                complaint.status === 'resolved' ? 'text-emerald-800' : 'text-rose-800'
              } whitespace-pre-line leading-relaxed`}>
                {complaint.reviewerComment || 'No remarks provided.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium border border-slate-200 rounded-xl text-slate-700 hover:bg-white transition-colors"
          >
            Close
          </button>

          {canReview && complaint.status === 'pending' && onOpenReview && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  onClose();
                  onOpenReview(complaint, 'forward');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                title="Forward up hierarchy"
              >
                <ArrowBendUpRight size={16} weight="bold" />
                <span>Forward Up</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenReview(complaint, 'reject');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <XCircle size={16} weight="bold" />
                Reject
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenReview(complaint, 'resolve');
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <CheckCircle size={16} weight="bold" />
                Resolve Complaint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
