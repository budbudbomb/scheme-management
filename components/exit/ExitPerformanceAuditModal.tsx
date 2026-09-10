'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle,
  Clock,
  ClipboardText,
  CheckSquare,
} from '@phosphor-icons/react';
import { exitApi, type ApplicantAuditDetail } from '@/lib/api/exit';
import { formatDate } from '@/lib/utils/formatters';
import type { ExitRequest, AuthUser } from '@/types/models';
import { toast } from 'sonner';

interface ExitPerformanceAuditModalProps {
  request: ExitRequest | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  currentUser: AuthUser;
}

export default function ExitPerformanceAuditModal({
  request,
  open,
  onClose,
}: ExitPerformanceAuditModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'surveys'>('tasks');
  const [auditData, setAuditData] = useState<ApplicantAuditDetail | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !request) return;
    setActiveTab('tasks');
    setLoadingAudit(true);
    exitApi
      .getApplicantAudit(request.applicant.id)
      .then(setAuditData)
      .catch(() => toast.error('Failed to load deliverable details'))
      .finally(() => setLoadingAudit(false));
  }, [open, request]);

  if (!open || !request || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Simple Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-snug">Deliverables Details</h2>
            <p className="text-2xs text-slate-500 mt-0.5">
              Tasks & survey logs for <span className="font-semibold text-slate-700">{request.applicant.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Clean Two-Tab Bar */}
        <div className="flex items-center gap-6 px-5 border-b border-slate-100 bg-white text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'border-[#162F5E] text-[#162F5E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare size={16} />
            <span>Tasks Details ({auditData?.tasks.length ?? 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('surveys')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'surveys'
                ? 'border-[#162F5E] text-[#162F5E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardText size={16} />
            <span>Surveys Submissions ({auditData?.surveys.length ?? 0})</span>
          </button>
        </div>

        {/* Content Body: Just the Tasks or Surveys lists */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loadingAudit ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading details...</div>
          ) : activeTab === 'tasks' ? (
            <div className="space-y-2">
              {auditData?.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    {task.status === 'completed' ? (
                      <CheckCircle size={18} className="text-emerald-600 shrink-0" weight="fill" />
                    ) : (
                      <Clock size={18} className="text-amber-500 shrink-0" weight="fill" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 leading-snug truncate">{task.name}</div>
                      <div className="text-slate-400 text-2xs mt-0.5">
                        Due {formatDate(task.dueDate)}
                        {task.completedAt && ` · Done ${formatDate(task.completedAt)}`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`badge capitalize text-2xs shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold'
                        : 'bg-amber-100 text-amber-800 border-amber-200 font-semibold'
                    }`}
                  >
                    {task.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {auditData?.surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="font-semibold text-slate-900 leading-snug truncate">{survey.title}</div>
                    <div className="text-slate-500 text-2xs mt-0.5">
                      Submitted on {formatDate(survey.date)} · Reached {survey.stakeholdersReached} citizens
                    </div>
                  </div>
                  <span className="badge bg-blue-100 text-blue-800 border-blue-200 text-2xs uppercase font-semibold shrink-0">
                    {survey.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simple Footer: Just a single Close button */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
