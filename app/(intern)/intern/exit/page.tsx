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
  ArrowLeft,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function InternExitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [exit, setExit] = useState<ExitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Mock deliverable stats for the logged in intern
  const tasksTotal = 15;
  const tasksCompleted = 13; // 2 incomplete -> triggers midway warning popup!

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await exitApi.list();
      // Only show exit if explicitly submitted by this user
      const myExit = user?.id ? res.items.find(e => e.applicant.id === user.id) : null;
      setExit(myExit ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load exit details');
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
      downloadBlob(blob as Blob, `CMYP-Intern-Certificate-${user?.name || 'Candidate'}.pdf`);
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
          router.push('/intern/dashboard');
        }
      }, 150);
    } else {
      router.push('/intern/dashboard');
    }
  };

  return (
    <div className="space-y-6 pb-12 sm:pb-6">
      {/* Page Header with Back Button */}
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
          <h1 className="text-xl font-bold text-slate-900">Internship Exit & Completion</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Apply to exit the CMYIGGP program and receive your official Certificate of Completion
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonCard />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : exit ? (
        /* Active or Completed Exit Application Card */
        <div className="card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
            <div>
              <div className="text-base font-bold text-slate-900">Exit Application Status</div>
              <div className="text-xs text-slate-500 mt-0.5">Submitted on {formatDate(exit.appliedAt)}</div>
            </div>
            <span className={cn('badge text-xs px-3 py-1 font-semibold', exitStatusColor(exit.status))}>
              {exitStatusLabel(exit.status)}
            </span>
          </div>

          {/* Workflow Status Timeline */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Approval Journey
            </div>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Step 1: Application */}
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle size={18} weight="fill" />
                <span>Exit Applied</span>
              </div>
              <div className="h-0.5 w-8 bg-emerald-300 hidden sm:block" />

              {/* Step 2: PM Review */}
              <div
                className={cn(
                  'flex items-center gap-2 text-xs font-semibold',
                  exit.status === 'approved' || exit.status === 'force_approved'
                    ? 'text-emerald-700'
                    : exit.status === 'rejected'
                    ? 'text-rose-700'
                    : 'text-blue-700'
                )}
              >
                {exit.status === 'approved' || exit.status === 'force_approved' ? (
                  <CheckCircle size={18} weight="fill" />
                ) : exit.status === 'rejected' ? (
                  <Warning size={18} weight="fill" />
                ) : (
                  <HourglassHigh size={18} weight="bold" className="animate-spin" />
                )}
                <span>Review by Program Manager (HR)</span>
              </div>
              <div
                className={cn(
                  'h-0.5 w-8 hidden sm:block',
                  exit.status === 'approved' || exit.status === 'force_approved' ? 'bg-emerald-300' : 'bg-slate-200'
                )}
              />

              {/* Step 3: Certificate */}
              <div
                className={cn(
                  'flex items-center gap-2 text-xs font-semibold',
                  exit.certificateIssued
                    ? 'text-emerald-700'
                    : exit.status === 'approved'
                    ? 'text-slate-500'
                    : 'text-slate-400'
                )}
              >
                <Certificate size={18} weight={exit.certificateIssued ? 'fill' : 'regular'} />
                <span>Certificate Issuance</span>
              </div>
            </div>
          </div>

          {/* Midway Exit Warning Notice (if applicable) */}
          {exit.incompleteTasks > 0 && (exit.status === 'pending_pm_review' || exit.status === 'pending') && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <Warning size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
              <div>
                <strong>Midway Exit with {exit.incompleteTasks} Incomplete Task(s):</strong> Your application is under review. Please note that leaving before task completion makes you ineligible for the completion certificate unless explicitly waived.
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="text-xs text-slate-600 bg-white rounded-lg p-3 border border-slate-100">
            <span className="font-semibold text-slate-900">Your stated reason:</span> &ldquo;{exit.reason || 'Completed program tenure'}&rdquo;
          </div>

          {/* Approval Decision Notes */}
          {exit.approverComment && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
              <div className="font-bold text-slate-800 mb-1">
                Decision Note from Program Manager ({exit.approvedBy?.name || 'HR Team'}):
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
                      <div className="text-xs text-emerald-700 mt-0.5">Signed and verified by Program Manager (HR)</div>
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  Your exit has been recorded. No completion certificate was issued due to incomplete deliverables or specific exit conditions.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* No exit request yet — Application Info & CTA */
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-3 text-base">Before You Apply for Exit</h2>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="text-[#162F5E] font-bold text-sm">·</span>
                <span>You can apply for program exit at any point during your internship tenure.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#162F5E] font-bold text-sm">·</span>
                <span>
                  Your exit request is reviewed directly by the <strong>Program Manager (HR)</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#162F5E] font-bold text-sm">·</span>
                <span>
                  The official <strong>Certificate of Completion</strong> requires all assigned tasks and surveys to be completed. Exiting midway will forfeit your certificate.
                </span>
              </li>
            </ul>

            {/* Quick deliverables overview */}
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
              id="intern-apply-exit-btn"
              onClick={() => setApplyOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
            >
              <ArrowCircleUpRight size={18} weight="bold" />
              <span>Apply for Program Exit</span>
            </button>
          </div>
        </div>
      )}

      {/* Midway Warning & Exit Application Modal */}
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
