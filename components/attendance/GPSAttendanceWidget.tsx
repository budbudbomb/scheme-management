'use client';

import { useState, useCallback } from 'react';
import { MapPin, CheckCircle, Warning, Spinner, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/formatters';
import { attendanceApi } from '@/lib/api/attendance';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

// Leaflet must be loaded client-side only (no SSR)
const MapPreview = dynamic(() => import('./MapPreview'), { ssr: false });

type Step = 'idle' | 'requesting' | 'preview' | 'submitting' | 'done' | 'error';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function GPSAttendanceWidget() {
  const [step, setStep] = useState<Step>('idle');
  const [location, setLocation] = useState<Location | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [markedAt, setMarkedAt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Your browser does not support location access.');
      setStep('error');
      return;
    }

    setStep('requesting');
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStep('preview');
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: 'Location access was denied. Please enable location permissions in your browser settings and try again.',
          2: 'Your location could not be determined. Please try again in a moment.',
          3: 'Location request timed out. Please try again.',
        };
        setErrorMsg(msgs[err.code] ?? 'Failed to get location. Please try again.');
        setStep('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const confirmAttendance = useCallback(async () => {
    if (!location) return;
    setIsSubmitting(true);
    setStep('submitting');
    try {
      await attendanceApi.markAttendance({
        latitude: location.latitude,
        longitude: location.longitude,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setMarkedAt(format(new Date(), 'hh:mm a'));
      setStep('done');
      toast.success('Attendance marked successfully!');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to mark attendance.');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [location]);

  const reset = () => {
    setStep('idle');
    setLocation(null);
    setErrorMsg(null);
    setMarkedAt(null);
  };

  // ── Done state ──
  if (step === 'done') {
    return (
      <div className="card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle size={24} weight="fill" className="text-emerald-600" />
        </div>
        <div>
          <div className="font-semibold text-slate-900 text-sm">Attendance Marked</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Checked in at {markedAt} · {format(new Date(), 'dd MMM yyyy')}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (step === 'error') {
    return (
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <Warning size={20} weight="fill" className="text-rose-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-slate-900 text-sm">Location Error</div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="mt-4 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Preview state (show map) ──
  if (step === 'preview' && location) {
    return (
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900 text-sm">Confirm Your Location</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Accuracy: ±{Math.round(location.accuracy)}m
            </div>
          </div>
          <button
            onClick={reset}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Map preview */}
        <div className="rounded-xl overflow-hidden h-48 border border-slate-200">
          <MapPreview lat={location.latitude} lng={location.longitude} />
        </div>

        <div className="text-xs text-slate-400 text-center">
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </div>

        <button
          id="gps-confirm-attendance"
          onClick={confirmAttendance}
          disabled={isSubmitting}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]',
            'text-white font-medium text-sm py-3 rounded-[var(--radius)]',
            'transition-all duration-150'
          )}
        >
          <CheckCircle size={16} weight="bold" />
          Confirm Attendance
        </button>
      </div>
    );
  }

  // ── Idle / requesting state ──
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
          step === 'requesting' ? 'bg-indigo-100' : 'bg-slate-100'
        )}>
          {step === 'requesting' ? (
            <Spinner size={24} className="text-indigo-600 animate-spin" />
          ) : (
            <MapPin size={24} weight="fill" className="text-slate-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-sm">
            {step === 'requesting' ? 'Getting your location…' : 'Mark Attendance'}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {step === 'requesting'
              ? 'Please allow location access when prompted.'
              : `${format(new Date(), 'EEEE, dd MMM yyyy')} · Tap to check in`}
          </p>
        </div>
      </div>

      {step === 'idle' && (
        <button
          id="gps-mark-attendance"
          onClick={requestLocation}
          className={cn(
            'mt-4 w-full flex items-center justify-center gap-2',
            'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
            'text-white font-medium text-sm py-3 rounded-[var(--radius)]',
            'transition-all duration-150'
          )}
        >
          <MapPin size={16} weight="fill" />
          Check In Now
        </button>
      )}
    </div>
  );
}
