'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  UploadSimple,
  ShieldWarning,
  Paperclip,
  CheckCircle,
  Check,
  Microphone,
  Stop,
  Play,
  VideoCamera,
  Trash,
  Camera,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { complaintApi } from '@/lib/api/complaints';
import { useAuth } from '@/lib/auth/context';
import type { Complaint, ComplaintCategory } from '@/types/models';
import { cn } from '@/lib/utils/formatters';

const schema = z.object({
  category: z.enum(['stipend', 'field_travel', 'workload_tasks', 'infrastructure', 'interpersonal', 'other'] as const),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(120, 'Subject is too long'),
  description: z.string().min(15, 'Please provide sufficient details (min 15 characters)'),
  incidentDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddComplaintModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (complaint: Complaint) => void;
  userRole: 'intern' | 'fellow' | 'pc';
  recipientLabel?: string;
}

export default function AddComplaintModal({
  open,
  onClose,
  onSuccess,
  userRole,
  recipientLabel,
}: AddComplaintModalProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Voice Note Recording & Upload
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNoteBlob, setVoiceNoteBlob] = useState<{ url: string; name: string; duration: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Video Note Upload / Capture
  const [videoNote, setVideoNote] = useState<{ url: string; name: string } | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when open ("frozen" screen)
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'infrastructure',
      incidentDate: new Date().toISOString().split('T')[0],
    },
  });

  // Voice recording handlers
  const startVoiceRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setVoiceNoteBlob({
            url,
            name: `voice_note_${Date.now()}.webm`,
            duration: recordingSeconds || 5,
          });
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingVoice(true);
        setRecordingSeconds(0);

        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((sec) => sec + 1);
        }, 1000);
      } else {
        // Fallback simulated recording if browser mediaDevices not supported
        setIsRecordingVoice(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((sec) => sec + 1);
        }, 1000);
      }
    } catch {
      // If mic permission blocked, offer file upload directly
      toast.error('Microphone access not granted. Please upload an audio file instead.');
      audioInputRef.current?.click();
    }
  };

  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback demo recording URL
      setVoiceNoteBlob({
        url: '#voice-note',
        name: `voice_note_${Date.now()}.wav`,
        duration: recordingSeconds || 6,
      });
    }

    setIsRecordingVoice(false);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVoiceNoteBlob({
        url,
        name: file.name,
        duration: 10,
      });
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoNote({
        url,
        name: file.name,
      });
    }
  };

  if (!open || !mounted) return null;

  const targetRoleText = recipientLabel ?? (
    userRole === 'intern' ? 'Assigned Fellow' :
    userRole === 'fellow' ? 'Program Coordinator (PC)' :
    'Senior Program Manager / CPM'
  );

  const onSubmit = async (data: FormData) => {
    try {
      const location =
        user?.block?.name ? `${user.block.name} (${user.district?.name ?? 'District'})` :
        user?.district?.name ? `${user.district.name} District` :
        user?.division?.name ?? 'State PMU';

      const created = await complaintApi.create(
        {
          ...data,
          documentName: selectedFile ? selectedFile.name : undefined,
          documentUrl: selectedFile ? '#' : undefined,
          voiceNoteUrl: voiceNoteBlob?.url,
          voiceNoteName: voiceNoteBlob?.name,
          voiceNoteDuration: voiceNoteBlob?.duration,
          videoNoteUrl: videoNote?.url,
          videoNoteName: videoNote?.name,
        },
        {
          id: user?.id ?? `u-${userRole}-01`,
          name: user?.name ?? 'Current User',
          role: userRole,
          location,
        }
      );

      toast.success(`Complaint ${created.ticketNumber} submitted successfully!`);
      reset();
      setSelectedFile(null);
      setVoiceNoteBlob(null);
      setVideoNote(null);
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit complaint');
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-hidden">
      {/* Backdrop touch blocker */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden transition-all transform animate-scale-in"
      >
        {/* Header - Fixed at Top */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldWarning size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Submit New Complaint</h2>
              <p className="text-[11px] text-slate-500">
                Will be submitted for review to: <span className="font-semibold text-slate-700">{targetRoleText}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complaint Category <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="infrastructure">Device, SIM & Portal</option>
                <option value="stipend">Stipend & Allowances</option>
                <option value="field_travel">Field & Travel Logistics</option>
                <option value="workload_tasks">Workload & Assignments</option>
                <option value="interpersonal">Interpersonal Grievance</option>
                <option value="other">Other Inquiry / Issue</option>
              </select>
              {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Incident / Occurrence
              </label>
              <input
                type="date"
                {...register('incidentDate')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject / Short Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Delay in village travel expense reimbursement"
              {...register('subject')}
              className={cn(
                'w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                errors.subject ? 'border-rose-400' : 'border-slate-200'
              )}
            />
            {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe the issue in detail, including specific locations, personnel involved, and any prior communication..."
              {...register('description')}
              className={cn(
                'w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none',
                errors.description ? 'border-rose-400' : 'border-slate-200'
              )}
            />
            {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
          </div>

          {/* Media Evidence & Attachments — Single Row with Circular Buttons */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="block text-xs font-semibold text-slate-700">
                Media Evidence & Supporting Documents
              </span>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>

            {/* Hidden native inputs */}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioFileChange}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={handleVideoFileChange}
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
            />

            {/* Single Row: 3 Circular Buttons */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-100">
              {/* 1. Voice Note Circle Button */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isRecordingVoice) {
                        stopVoiceRecording();
                      } else {
                        startVoiceRecording();
                      }
                    }}
                    className={cn(
                      'w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm cursor-pointer',
                      isRecordingVoice
                        ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                        : voiceNoteBlob
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                        : 'bg-purple-50/80 text-purple-600 border border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                    )}
                    title={isRecordingVoice ? 'Stop Recording' : 'Record Voice Note'}
                  >
                    {isRecordingVoice ? (
                      <Stop size={22} weight="fill" />
                    ) : (
                      <Microphone size={22} weight="bold" />
                    )}
                  </button>
                  {voiceNoteBlob && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs ring-2 ring-white">
                      <Check size={12} weight="bold" />
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-800">Voice Note</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-500">
                    {isRecordingVoice ? 'Recording...' : voiceNoteBlob ? 'Recorded' : 'Record'}
                  </span>
                  {!isRecordingVoice && !voiceNoteBlob && (
                    <>
                      <span className="text-[10px] text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        className="text-[10px] text-purple-600 hover:underline font-medium"
                      >
                        Upload
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 2. Video Note Circle Button */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-1.5">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className={cn(
                      'w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm cursor-pointer',
                      videoNote
                        ? 'bg-sky-100 text-sky-700 border-2 border-sky-400'
                        : 'bg-sky-50/80 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:border-sky-300'
                    )}
                    title="Record or Upload Video Note"
                  >
                    <VideoCamera size={22} weight="bold" />
                  </button>
                  {videoNote && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs ring-2 ring-white">
                      <Check size={12} weight="bold" />
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-800">Video Note</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {videoNote ? 'Video added' : 'Camera / Upload'}
                </span>
              </div>

              {/* 3. Document / File Circle Button */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-1.5">
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className={cn(
                      'w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm cursor-pointer',
                      selectedFile
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-400'
                        : 'bg-indigo-50/80 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
                    )}
                    title="Attach PDF or Document"
                  >
                    <Paperclip size={22} weight="bold" />
                  </button>
                  {selectedFile && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs ring-2 ring-white">
                      <Check size={12} weight="bold" />
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-800">Document</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {selectedFile ? 'Attached' : 'PDF / Photo'}
                </span>
              </div>
            </div>

            {/* Active Voice Recording Live Banner */}
            {isRecordingVoice && (
              <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="font-bold">{formatSeconds(recordingSeconds)}</span>
                  <span className="text-[11px] text-rose-600 font-medium">Recording voice note...</span>
                </div>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] flex items-center gap-1 hover:bg-rose-700"
                >
                  <Stop size={12} weight="fill" />
                  <span>Stop & Attach</span>
                </button>
              </div>
            )}

            {/* Attached Items Cards */}
            {(voiceNoteBlob || videoNote || selectedFile) && (
              <div className="mt-3 space-y-2">
                {voiceNoteBlob && (
                  <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950">
                    <div className="flex items-center gap-2 truncate">
                      <Microphone size={15} weight="bold" className="text-purple-600 shrink-0" />
                      <span className="truncate text-xs font-medium max-w-[200px]">{voiceNoteBlob.name}</span>
                      <span className="text-[11px] text-purple-600 font-semibold shrink-0">({voiceNoteBlob.duration}s)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVoiceNoteBlob(null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Remove voice note"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {videoNote && (
                  <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-950">
                    <div className="flex items-center gap-2 truncate">
                      <VideoCamera size={15} weight="bold" className="text-sky-600 shrink-0" />
                      <span className="truncate text-xs font-medium max-w-[220px]">{videoNote.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoNote(null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Remove video note"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {selectedFile && (
                  <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip size={15} weight="bold" className="text-indigo-600 shrink-0" />
                      <span className="truncate text-xs font-medium max-w-[220px]">{selectedFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Remove document"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isRecordingVoice}
              className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Submit Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
