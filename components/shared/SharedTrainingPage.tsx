'use client';

// Shared training page for all roles — same view with consistent meeting card display

import { useEffect, useState } from 'react';
import { trainingApi } from '@/lib/api/training';
import type { Meeting } from '@/types/models';
import { cn, formatDate } from '@/lib/utils/formatters';
import { Video, CalendarBlank, Clock, Users, BellRinging } from '@phosphor-icons/react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { toast } from 'sonner';

export default function SharedTrainingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await trainingApi.getMyMeetings();
      setMeetings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const requestNotification = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled! You will be notified before meetings.');
      // TODO: Register service worker push subscription
    } else {
      toast.error('Notification permission denied');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Training &amp; Meetings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your scheduled Zoom meetings and training sessions</p>
        </div>
        <button
          id="enable-notifications-btn"
          onClick={requestNotification}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 btn-press"
        >
          <BellRinging size={16} />
          Enable Notifications
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2].map(i => <SkeletonCard key={i} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !meetings.length ? (
        <div className="card"><EmptyState icon={Video} title="No meetings scheduled" description="Your Program Coordinator or Admin will schedule training sessions that will appear here." /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map(m => (
            <div key={m.id} className="card card-hover p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Video size={20} className="text-indigo-600" weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm truncate">{m.title}</div>
                  <div className="space-y-1 mt-1.5">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <CalendarBlank size={12} />
                      {formatDate(m.scheduledAt, 'EEEE, dd MMM · hh:mm a')}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={12} />{m.duration}min</span>
                      <span className="flex items-center gap-1"><Users size={12} />{m.invitees.length} people</span>
                    </div>
                  </div>
                </div>
              </div>
              {m.agenda && (
                <p className="mt-2.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5 leading-relaxed truncate-2">{m.agenda}</p>
              )}
              {m.documentUrl && (
                <a
                  href={m.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-indigo-600 hover:underline"
                >
                  📄 View Meeting Document
                </a>
              )}
              {m.zoomJoinUrl ? (
                <a
                  href={m.zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-[var(--radius-sm)] text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press"
                >
                  <Video size={14} weight="fill" />
                  Join Meeting
                </a>
              ) : (
                <div className="mt-3 w-full py-2 rounded-[var(--radius-sm)] text-xs text-center text-slate-400 border border-slate-200">
                  Meeting link will be available soon
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
