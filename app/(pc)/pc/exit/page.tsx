'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { exitApi } from '@/lib/api/exit';
import type { ExitRequest } from '@/types/models';
import { cn, exitStatusColor, exitStatusLabel, formatDate, downloadBlob } from '@/lib/utils/formatters';
import { SkeletonTable, SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ExitPerformanceAuditModal from '@/components/exit/ExitPerformanceAuditModal';
import ExitApplyModal from '@/components/exit/ExitApplyModal';
import { useAuth } from '@/lib/auth/context';
import {
  ArrowCircleUpRight,
  Warning,
  CheckCircle,
  ClipboardText,
  CheckSquare,
  Certificate,
  DownloadSimple,
  Users,
  UserCircle,
  Eye,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function PCExitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reviews' | 'my_exit'>('reviews');

  // Fellow Exit Requests for PC review
  const [fellowRequests, setFellowRequests] = useState<ExitRequest[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Certificate switch state per request
  const [certSwitchMap, setCertSwitchMap] = useState<Record<string, boolean>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // PC's own exit request
  const [myExit, setMyExit] = useState<ExitRequest | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);

  // Deliverables audit modal
  const [selectedRequest, setSelectedRequest] = useState<ExitRequest | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  // PC's own mock metrics: 28 assigned, 28 completed (or 25/28 if midway)
  const pcTasksTotal = 28;
  const pcTasksCompleted = 28;

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewsError(null);
    try {
      const res = await exitApi.list();
      // Filter requests from fellows
      const fellows = res.items.filter(
        (r) => r.applicantRole === 'fellow' || r.applicant.role === 'fellow'
      );
      setFellowRequests(fellows);

      // Initialize cert switch state
      setCertSwitchMap((prev) => {
        const next = { ...prev };
        fellows.forEach((r) => {
          if (next[r.id] === undefined) {
            next[r.id] = r.certificateEligible ?? (r.incompleteTasks === 0);
          }
        });
        return next;
      });

      // Check if PC has applied for own exit in this session
      const own = user?.id ? res.items.find((r) => r.applicant.id === user.id) : null;
      setMyExit(own ?? null);
    } catch (err: unknown) {
      setReviewsError(err instanceof Error ? err.message : 'Failed to load exit requests');
    } finally {
      setLoadingReviews(false);
    }
  }, [user]);

  useEffect(() => {
    loadReviews();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'my_exit') setActiveTab('my_exit');
      else if (tab === 'reviews') setActiveTab('reviews');
    }
  }, [loadReviews]);

  const toggleCertSwitch = (id: string) => {
    setCertSwitchMap((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? false),
    }));
  };

  const handlePcForward = async (req: ExitRequest) => {
    setActionInProgress(req.id);
    const shouldRecommendCert = certSwitchMap[req.id] ?? (req.incompleteTasks === 0);
    try {
      await exitApi.pcReview(req.id, {
        action: 'forward',
        eligibleForCertificate: shouldRecommendCert,
        comment: shouldRecommendCert
          ? 'Deliverables verified. Recommended for PM exit approval with Certificate of Completion.'
          : 'Deliverables audited. Recommended for exit without completion certificate due to pending tasks.',
        pcUser: { id: user?.id ?? 'usr-pc-01', name: user?.name ?? 'Anjali Verma', role: 'pc' },
      });
      toast.success(
        `Exit forwarded to PM (${shouldRecommendCert ? 'Certificate Recommended' : 'No Certificate Recommended'})`
      );
      loadReviews();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to forward exit request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePcReject = async (req: ExitRequest) => {
    setActionInProgress(req.id);
    try {
      await exitApi.pcReview(req.id, {
        action: 'reject',
        eligibleForCertificate: false,
        comment: 'Exit rejected at PC review stage.',
        pcUser: { id: user?.id ?? 'usr-pc-01', name: user?.name ?? 'Anjali Verma', role: 'pc' },
      });
      toast.success('Fellow exit application rejected');
      loadReviews();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject exit');
    } finally {
      setActionInProgress(null);
    }
  };

  const openAuditModal = (req: ExitRequest) => {
    setSelectedRequest(req);
    setAuditModalOpen(true);
  };

  const downloadMyCert = async () => {
    if (!myExit?.id) return;
    setDownloadingCert(true);
    try {
      const blob = await exitApi.downloadCertificate(myExit.id);
      downloadBlob(blob as Blob, `CMYP-PC-Certificate-${user?.name || 'Coordinator'}.pdf`);
      toast.success('Certificate of Completion downloaded successfully');
    } catch {
      toast.error('Certificate not available yet');
    } finally {
      setDownloadingCert(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.history.back();
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          router.push('/pc/dashboard');
        }
      }, 150);
    } else {
      router.push('/pc/dashboard');
    }
  };

  return (
    <div className="space-y-6 pb-12 sm:pb-6">
      {/* Page Title & Tab Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
            <h1 className="text-xl font-bold text-slate-900">Program Exit Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Audit Fellow deliverables and recommend certificate eligibility for Program Manager approval
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer',
              activeTab === 'reviews'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Users size={16} weight={activeTab === 'reviews' ? 'bold' : 'regular'} />
            <span>Fellow Exit Reviews ({fellowRequests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('my_exit')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer',
              activeTab === 'my_exit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <UserCircle size={16} weight={activeTab === 'my_exit' ? 'bold' : 'regular'} />
            <span>My Exit Application</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FELLOW EXIT REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {loadingReviews ? (
            <SkeletonTable rows={4} />
          ) : reviewsError ? (
            <ErrorState message={reviewsError} onRetry={loadReviews} />
          ) : !fellowRequests.length ? (
            <div className="card">
              <EmptyState
                icon={ArrowCircleUpRight}
                title="No Fellow Exit Requests"
                description="Exit requests from Fellows in your division will appear here for deliverable audit and certificate recommendation."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {fellowRequests.map((req) => {
                const totalTasks = req.performanceAudit?.tasksTotal ?? 22;
                const completedTasks = req.performanceAudit?.tasksCompleted ?? (totalTasks - req.incompleteTasks);
                const inProgressTasks = req.incompleteTasks;
                const surveys = req.performanceAudit?.surveysConducted ?? 46;
                const isPendingPc = req.status === 'pending_pc_review';
                const isCertEnabled = certSwitchMap[req.id] ?? false;
                const isActionLoading = actionInProgress === req.id;

                return (
                  <div
                    key={req.id}
                    className={cn(
                      'card p-4 sm:p-5 transition-all space-y-3.5 border shadow-xs rounded-2xl',
                      isPendingPc
                        ? 'border-indigo-200/90 bg-white hover:shadow-md'
                        : 'border-slate-200 bg-white'
                    )}
                  >
                    {/* 1. Header: Fellow Info & Top-Right View Details Button */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                            {req.applicant.name}
                          </span>
                          <span className="badge bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                            FELLOW
                          </span>
                          <span className={cn('badge text-[10px] sm:text-xs font-semibold', exitStatusColor(req.status))}>
                            {exitStatusLabel(req.status)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          Applied <strong>{formatDate(req.appliedAt)}</strong>
                          {req.reason && (
                            <> · Reason: <span className="italic text-slate-700">&ldquo;{req.reason}&rdquo;</span></>
                          )}
                        </p>
                      </div>

                      {/* Top-Right Details CTA */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          onClick={() => openAuditModal(req)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye size={14} weight="bold" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Middle: Perfectly Proportioned 3-Column Circular Button KPIs */}
                    <div className="p-3 sm:p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="grid grid-cols-3 gap-2 max-w-sm sm:max-w-md mx-auto sm:mx-0">
                        {/* Circle 1: Total Tasks */}
                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-slate-900 font-extrabold text-sm sm:text-base">
                            {totalTasks}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1.5 uppercase tracking-wide text-center">
                            Total Tasks
                          </span>
                        </div>

                        {/* Circle 2: Completed Tasks */}
                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
                          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center text-emerald-700 font-extrabold text-sm sm:text-base">
                            {completedTasks}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 mt-1.5 uppercase tracking-wide text-center">
                            Completed
                          </span>
                        </div>

                        {/* Circle 3: Tasks in Progress */}
                        <div
                          className={cn(
                            'flex flex-col items-center justify-center p-2 rounded-xl border shadow-2xs',
                            inProgressTasks > 0
                              ? 'bg-amber-50/60 border-amber-200/80'
                              : 'bg-white border-slate-200/70'
                          )}
                        >
                          <div
                            className={cn(
                              'w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 flex items-center justify-center font-extrabold text-sm sm:text-base',
                              inProgressTasks > 0
                                ? 'border-amber-500 bg-white text-amber-700'
                                : 'border-slate-300 bg-slate-50 text-slate-400'
                            )}
                          >
                            {inProgressTasks}
                          </div>
                          <span
                            className={cn(
                              'text-[10px] sm:text-xs font-bold mt-1.5 uppercase tracking-wide text-center',
                              inProgressTasks > 0 ? 'text-amber-700' : 'text-slate-500'
                            )}
                          >
                            In Progress
                          </span>
                        </div>
                      </div>

                      {/* Field Surveys Pill & Incomplete Warning Strip */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <ClipboardText size={16} className="text-indigo-600 shrink-0" weight="bold" />
                          <span>
                            Field Surveys: <strong className="text-slate-900">{surveys} Submissions</strong>
                          </span>
                        </div>

                        {inProgressTasks > 0 && isPendingPc && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <Warning size={14} weight="fill" className="text-amber-600 shrink-0" />
                            <span>{inProgressTasks} task(s) incomplete (midway exit)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Bottom Row: Recommend Certificate Switch + Forward / Reject Action Buttons */}
                    {isPendingPc ? (
                      <div className="space-y-3 pt-1">
                        {/* Certificate Toggle Switch Card */}
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/90 border border-slate-200">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                isCertEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                              )}
                            >
                              <Certificate size={18} weight={isCertEnabled ? 'fill' : 'regular'} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 leading-tight">
                                Recommend Certificate of Completion
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {isCertEnabled
                                  ? 'Will recommend PM to award completion certificate'
                                  : 'Exit will be recommended without completion certificate'}
                              </div>
                            </div>
                          </div>

                          {/* Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isCertEnabled}
                            onClick={() => toggleCertSwitch(req.id)}
                            className={cn(
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-2xs',
                              isCertEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                            )}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                isCertEnabled ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                        </div>

                        {/* Action Buttons: Forward to PM (Primary) & Reject (Secondary) */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handlePcReject(req)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 cursor-pointer disabled:opacity-50 transition-all shadow-2xs"
                          >
                            <X size={15} weight="bold" />
                            <span>Reject Exit</span>
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handlePcForward(req)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                          >
                            <Check size={16} weight="bold" />
                            <span>Recommend & Forward to PM</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Post-Review status strip */
                      <div className="pt-2">
                        <div className="flex items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl flex-wrap">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-600 shrink-0" weight="fill" />
                            <span className="text-slate-700">
                              {req.status === 'pending_pm_review' ? (
                                <>
                                  Reviewed & forwarded to PM. Certificate recommendation:{' '}
                                  <strong>{req.certificateEligible ? 'Eligible' : 'Not Recommended'}</strong>
                                </>
                              ) : req.status === 'approved' ? (
                                <>
                                  Approved by PM. Certificate:{' '}
                                  <strong>{req.certificateIssued ? 'Issued' : 'Not Issued'}</strong>
                                </>
                              ) : (
                                <>Status: <strong>{exitStatusLabel(req.status)}</strong></>
                              )}
                            </span>
                          </div>
                          {req.status === 'pending_pm_review' && (
                            <span className="badge bg-blue-100 text-blue-800 border-blue-200 text-2xs font-semibold">
                              Pending PM Decision
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY EXIT APPLICATION (PC APPLIES) */}
      {activeTab === 'my_exit' && (
        <div className="space-y-4">
          {myExit ? (
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
                <div>
                  <div className="text-base font-bold text-slate-900">Coordinator Exit Status</div>
                  <div className="text-xs text-slate-500 mt-0.5">Applied on {formatDate(myExit.appliedAt)}</div>
                </div>
                <span className={cn('badge text-xs px-3 py-1 font-semibold', exitStatusColor(myExit.status))}>
                  {exitStatusLabel(myExit.status)}
                </span>
              </div>

              {/* Status information */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Review Journey:</div>
                <p className="text-slate-600">
                  As a Program Coordinator, your exit application is directly reviewed by the{' '}
                  <strong>Program Manager (HR)</strong>, who verifies all division tasks and issues the Certificate of Completion.
                </p>
                {myExit.approverComment && (
                  <div className="pt-2 border-t border-slate-200 text-slate-700">
                    <strong>Program Manager Remarks:</strong> &ldquo;{myExit.approverComment}&rdquo;
                  </div>
                )}
              </div>

              {/* Certificate Download */}
              {myExit.certificateIssued && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Certificate size={22} weight="fill" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-950">Official Certificate of Completion Ready</div>
                      <div className="text-xs text-emerald-700 mt-0.5">Signed by Program Manager (HR)</div>
                    </div>
                  </div>
                  <button
                    onClick={downloadMyCert}
                    disabled={downloadingCert}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>{downloadingCert ? 'Downloading...' : 'Download Certificate (PDF)'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-slate-900 text-base">Program Coordinator Exit</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Program Coordinators can apply to conclude their tenure at any time. Your exit application is sent directly to the <strong>Program Manager (HR)</strong> for deliverable verification and certificate issuance.
              </p>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setApplyOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
                >
                  <ArrowCircleUpRight size={16} weight="bold" />
                  <span>Apply for Program Coordinator Exit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Modal for PC reviewing fellows */}
      {user && (
        <ExitPerformanceAuditModal
          open={auditModalOpen}
          request={selectedRequest}
          onClose={() => setAuditModalOpen(false)}
          onUpdated={loadReviews}
          currentUser={user}
        />
      )}

      {/* PC Applying for own exit modal */}
      {user && (
        <ExitApplyModal
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          onSuccess={loadReviews}
          currentUser={user}
          tasksTotal={pcTasksTotal}
          tasksCompleted={pcTasksCompleted}
        />
      )}
    </div>
  );
}
