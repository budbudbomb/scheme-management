'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { exitApi } from '@/lib/api/exit';
import type { ExitRequest } from '@/types/models';
import { cn, exitStatusColor, exitStatusLabel, formatDate, downloadBlob } from '@/lib/utils/formatters';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import ErrorState from '@/components/shared/ErrorState';
import ExitApplyModal from '@/components/exit/ExitApplyModal';
import { useAuth } from '@/lib/auth/context';
import {
  ArrowCircleUpRight,
  DownloadSimple,
  Warning,
  CheckCircle,
  Certificate,
  HourglassHigh,
  Clock,
  ShieldCheck,
  ArrowLeft,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function FellowExitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [exit, setExit] = useState<ExitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fellow mock metrics: 20 assigned, 18 completed -> 2 pending, triggers midway warning!
  const tasksTotal = 20;
  const tasksCompleted = 18;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await exitApi.list();
      // Only show exit if explicitly submitted by this fellow
      const myExit = user?.id ? res.items.find(e => e.applicant.id === user.id) : null;
      setExit(myExit ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadCert = async () => {
    if (!exit?.id) return;
    setDownloading(true);
    try {
      const blob = await exitApi.downloadCertificate(exit.id);
      downloadBlob(blob as Blob, `CMYP-Fellow-Certificate-${user?.name || 'Fellow'}.pdf`);
      toast.success('Certificate of Completion downloaded successfully');
    } catch {
      toast.error('Certificate not available yet');
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.history.back();
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          router.push('/fellow/dashboard');
        }
      }, 150);
    } else {
      router.push('/fellow/dashboard');
    }
  };

  return (
    <div className="space-y-6 pb-12 sm:pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
          aria-label="Back"
          title="Back"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fellowship Program Exit</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Apply to conclude your fellowship, undergo PC and PM reviews, and obtain your completion certificate
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonCard />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : exit ? (
        /* Active Exit Request Card */
        <div className="card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
            <div>
              <div className="text-base font-bold text-slate-900">Exit Application Status</div>
              <div className="text-xs text-slate-500 mt-0.5">Applied on {formatDate(exit.appliedAt)}</div>
            </div>
            <span className={cn('badge text-xs px-3 py-1 font-semibold', exitStatusColor(exit.status))}>
              {exitStatusLabel(exit.status)}
            </span>
          </div>

          {/* 3-Stage Approval Journey Tracker */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Multi-Stage Approval Pipeline
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stage 1 */}
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <CheckCircle size={16} weight="fill" />
                  <span>1. Application Submitted</span>
                </div>
                <p className="text-2xs text-slate-500 mt-1">Submitted by you anytime</p>
              </div>

              {/* Stage 2 */}
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {exit.reviewedByPc ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle size={16} weight="fill" />
                      <span>2. PC Review Complete</span>
                    </span>
                  ) : exit.status === 'pending_pc_review' ? (
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <HourglassHigh size={16} className="animate-spin" />
                      <span>2. Pending PC Review</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">2. Program Coordinator</span>
                  )}
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  {exit.reviewedByPc
                    ? `Forwarded with ${exit.certificateEligible ? 'certificate recommendation' : 'no certificate'}`
                    : 'Reviews tasks & surveys done'}
                </p>
              </div>

              {/* Stage 3 */}
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {exit.status === 'approved' || exit.status === 'force_approved' ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle size={16} weight="fill" />
                      <span>3. PM Approved</span>
                    </span>
                  ) : exit.status === 'rejected' ? (
                    <span className="text-rose-700 flex items-center gap-1.5">
                      <Warning size={16} weight="fill" />
                      <span>3. Exit Rejected</span>
                    </span>
                  ) : (
                    <span className="text-blue-700 flex items-center gap-1.5">
                      <HourglassHigh size={16} />
                      <span>3. Program Manager (HR)</span>
                    </span>
                  )}
                </div>
                <p className="text-2xs text-slate-500 mt-1">Final decision & certificate issuance</p>
              </div>
            </div>
          </div>

          {/* Warning for midway exit with incomplete tasks */}
          {exit.incompleteTasks > 0 && exit.status === 'pending_pc_review' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <Warning size={18} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
              <div>
                <strong>Incomplete Tasks:</strong> You have {exit.incompleteTasks} pending task(s). Your Program Coordinator will review your deliverables to determine if you are eligible for the completion certificate.
              </div>
            </div>
          )}

          {/* PC Review Feedback card */}
          {exit.reviewedByPc && (
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[#162F5E] flex items-center gap-1.5">
                  <ShieldCheck size={16} weight="fill" />
                  Reviewed by Program Coordinator ({exit.reviewedByPc.name}):
                </span>
                <span className="text-slate-500 text-2xs">{exit.pcReviewedAt ? formatDate(exit.pcReviewedAt) : ''}</span>
              </div>
              <div className="text-slate-700 mb-1">
                <strong>Certificate Status:</strong>{' '}
                {exit.certificateEligible ? (
                  <span className="text-emerald-700 font-semibold">Recommended for Certificate of Completion</span>
                ) : (
                  <span className="text-rose-700 font-semibold">Not Recommended for Certificate</span>
                )}
              </div>
              {exit.pcComment && <p className="text-slate-600 mt-1">&ldquo;{exit.pcComment}&rdquo;</p>}
            </div>
          )}

          {/* PM Decision card */}
          {exit.approvedBy && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
              <div className="font-bold text-slate-800 mb-1">
                Program Manager Decision ({exit.approvedBy.name}):
              </div>
              <p className="text-slate-600">&ldquo;{exit.approverComment}&rdquo;</p>
            </div>
          )}

          {/* Certificate Download Area */}
          {(exit.status === 'approved' || exit.certificateIssued) && (
            <div className="pt-2">
              {exit.certificateIssued ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Certificate size={22} weight="fill" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-950">Official Certificate of Completion Issued</div>
                      <div className="text-xs text-emerald-700 mt-0.5">Issued and signed by Program Manager (HR)</div>
                    </div>
                  </div>
                  <button
                    onClick={downloadCert}
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>{downloading ? 'Downloading...' : 'Download Certificate (PDF)'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  Exit approved without a certificate of completion as per coordinator review and deliverables audit.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* No exit request yet */
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-3 text-base">Before You Apply for Exit</h2>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="text-[#162F5E] font-bold text-sm">·</span>
                <span>You can apply for program exit at any point during your fellowship tenure.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#162F5E] font-bold text-sm">·</span>
                <span>
                  Your exit request is audited by your <strong>Program Coordinator (PC)</strong> and final approval is granted by the <strong>Program Manager (HR)</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#162F5E] font-bold text-sm">·</span>
                <span>
                  The official <strong>Certificate of Completion</strong> requires all assigned tasks and surveys to be completed. Exiting midway will forfeit your certificate.
                </span>
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock size={16} className="text-slate-400" />
                <span>Assigned Tasks: <strong>{tasksTotal}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle size={16} className="text-emerald-500" />
                <span>Completed Tasks: <strong>{tasksCompleted}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="fellow-apply-exit-btn"
              onClick={() => setApplyOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
            >
              <ArrowCircleUpRight size={18} weight="bold" />
              <span>Apply for Program Exit</span>
            </button>
          </div>
        </div>
      )}

      {/* Midway Exit Modal */}
      {user && (
        <ExitApplyModal
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          onSuccess={load}
          currentUser={user}
          tasksTotal={tasksTotal}
          tasksCompleted={tasksCompleted}
        />
      )}
    </div>
  );
}
