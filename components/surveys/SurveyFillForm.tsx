'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Warning,
  ClipboardText,
  User,
  Phone,
  CalendarBlank,
  FileText,
  Paperclip,
  CheckCircle,
  Sparkle,
  Plus,
  Microphone,
  VideoCamera,
  Camera,
  Trash,
  Play,
  Stop,
  X,
  UploadSimple,
} from '@phosphor-icons/react';
import type { Survey, SurveyQuestion, QuestionMediaAnswer } from '@/types/models';
import { surveysApi } from '@/lib/api/surveys';
import { cn, formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';

interface SurveyFillFormProps {
  survey: Survey;
  backHref?: string;
  onSuccess?: () => void;
}

export default function SurveyFillForm({ survey, backHref = '/surveys', onSuccess }: SurveyFillFormProps) {
  const router = useRouter();

  // ── Step State ──
  // 0 = General & Stakeholder Details Screen
  // 1..N = Question 1 to Question N
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // ── Section 1: Stakeholder Details ──
  const [stakeholderName, setStakeholderName] = useState('');
  const [stakeholderContact, setStakeholderContact] = useState('');
  const [stakeholderLocation, setStakeholderLocation] = useState('');
  const [stakeholderCategory, setStakeholderCategory] = useState('Beneficiary');
  const [stakeholderErrors, setStakeholderErrors] = useState<{ name?: string }>({});

  // ── Section 2: Survey Answers ──
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [mediaAnswers, setMediaAnswers] = useState<Record<string, QuestionMediaAnswer>>({});
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // ── Live Voice Recording Simulation State ──
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden File Inputs for Media
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const questions: SurveyQuestion[] = survey.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion: SurveyQuestion | undefined = currentStepIndex > 0 ? questions[currentStepIndex - 1] : undefined;

  // Voice recording timer effect
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Format seconds to mm:ss
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (currentError) setCurrentError(null);
  };

  const handleToggleMultipleChoice = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || [];
    const next = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    handleAnswerChange(questionId, next);
  };

  // Media capture handlers
  const handleMediaUpload = (questionId: string, type: 'voice' | 'video' | 'image', file: File) => {
    const url = URL.createObjectURL(file);
    setMediaAnswers(prev => {
      const existing = prev[questionId] || {};
      if (type === 'voice') {
        return { ...prev, [questionId]: { ...existing, voiceUrl: url, voiceName: file.name } };
      } else if (type === 'video') {
        return { ...prev, [questionId]: { ...existing, videoUrl: url, videoName: file.name } };
      } else {
        return { ...prev, [questionId]: { ...existing, imageUrl: url, imageName: file.name } };
      }
    });
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} note attached`);
  };

  const removeMedia = (questionId: string, type: 'voice' | 'video' | 'image') => {
    setMediaAnswers(prev => {
      const existing = { ...(prev[questionId] || {}) };
      if (type === 'voice') {
        delete existing.voiceUrl;
        delete existing.voiceName;
      } else if (type === 'video') {
        delete existing.videoUrl;
        delete existing.videoName;
      } else {
        delete existing.imageUrl;
        delete existing.imageName;
      }
      return { ...prev, [questionId]: existing };
    });
    toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} removed`);
  };

  const stopVoiceRecording = (questionId: string) => {
    setIsRecordingVoice(false);
    // Simulate created audio note
    const dummyVoiceUrl = `data:audio/wav;base64,voice_note_${Date.now()}`;
    setMediaAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        voiceUrl: dummyVoiceUrl,
        voiceName: `Voice_Note_${formatSeconds(recordingSeconds)}.wav`,
      },
    }));
    toast.success('Voice note recorded');
  };

  // Step 0: Validate Stakeholder and proceed
  const handleStartSurvey = () => {
    if (!stakeholderName.trim()) {
      setStakeholderErrors({ name: 'Stakeholder Full Name is required before starting the survey' });
      toast.error('Please enter the stakeholder full name');
      return;
    }
    setStakeholderErrors({});
    if (totalQuestions === 0) {
      toast.error('This survey has no questions configured');
      return;
    }
    setCurrentStepIndex(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validate current question before proceeding
  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion) return true;
    if (currentQuestion.required) {
      const val = answers[currentQuestion.id];
      if (val === undefined || val === null || val === '') {
        setCurrentError('This question is required. Please select or enter an answer.');
        toast.error('Please answer the question to continue');
        return false;
      }
      if (Array.isArray(val) && val.length === 0) {
        setCurrentError('Please select at least one option.');
        toast.error('Please select at least one option');
        return false;
      }
    }
    setCurrentError(null);
    return true;
  };

  const handleNextQuestion = () => {
    if (!validateCurrentQuestion()) return;

    if (currentStepIndex < totalQuestions) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmitSurvey();
    }
  };

  const handlePrevQuestion = () => {
    setCurrentError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitSurvey = async () => {
    if (!validateCurrentQuestion()) return;

    setIsSubmitting(true);
    try {
      await surveysApi.submitResponse(survey.id, {
        stakeholder: {
          fullName: stakeholderName.trim(),
          contactInfo: stakeholderContact.trim() || undefined,
          district: stakeholderLocation.trim() || undefined,
        },
        answers,
      });

      toast.success('Survey response submitted successfully!');
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForNextStakeholder = () => {
    setStakeholderName('');
    setStakeholderContact('');
    setStakeholderLocation('');
    setAnswers({});
    setMediaAnswers({});
    setCurrentError(null);
    setStakeholderErrors({});
    setCurrentStepIndex(0);
    setSubmittedSuccess(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Success Celebration Screen ──
  if (submittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle size={36} weight="fill" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Survey Response Submitted!</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Response for stakeholder <span className="font-semibold text-slate-800">"{stakeholderName}"</span> has been recorded for <span className="font-semibold text-slate-800">"{survey.title}"</span>.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
          <button
            type="button"
            onClick={resetForNextStakeholder}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer btn-press"
          >
            <Plus size={16} weight="bold" />
            <span>Interview Next Stakeholder</span>
          </button>
          <Link
            href={backHref}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Back to Surveys
          </Link>
        </div>
      </div>
    );
  }

  // Calculate overall progress percentage
  const progressPercent = totalQuestions > 0
    ? Math.round((currentStepIndex / totalQuestions) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-32 sm:pb-24">
      {/* ── Top Header & Stepper Bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (currentStepIndex > 0) {
                handlePrevQuestion();
              } else if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push(backHref);
              }
            }}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={17} weight="bold" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {survey.title}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                Survey
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {currentStepIndex === 0 ? 'General & Stakeholder Information' : `Question ${currentStepIndex} of ${totalQuestions}`}
            </p>
          </div>
        </div>

        {/* Status indicator on desktop */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-600">
          <ClipboardText size={15} className="text-indigo-600" weight="bold" />
          <span>{currentStepIndex === 0 ? 'Step 0: Profile' : `Question ${currentStepIndex} / ${totalQuestions}`}</span>
        </div>
      </div>

      {/* ── Stepper UI (Desktop Grid & Mobile Slim Progress Bar) ── */}
      {/* Mobile Progress Bar (Pinned on Phone View) */}
      <div className="sm:hidden -mx-2 px-2 sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md pt-1 pb-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1 px-1">
          <span>{currentStepIndex === 0 ? 'Stakeholder Details' : `Question ${currentStepIndex} of ${totalQuestions}`}</span>
          <span className="text-indigo-600 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper Grid (Matching Create Task Stepper) */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-5 gap-2">
          {/* Step 0: Stakeholder Details */}
          <button
            type="button"
            onClick={() => setCurrentStepIndex(0)}
            className={cn(
              'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5',
              currentStepIndex === 0
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
              currentStepIndex === 0 ? 'bg-white/20 text-white' : stakeholderName.trim() ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            )}>
              {stakeholderName.trim() && currentStepIndex > 0 ? <Check size={13} weight="bold" /> : '0'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight truncate">Stakeholder</div>
              <div className={cn('text-[10px] truncate', currentStepIndex === 0 ? 'text-indigo-100' : 'text-slate-400')}>
                {stakeholderName ? stakeholderName : 'Profile'}
              </div>
            </div>
          </button>

          {/* Question Stepper Cards / Progress */}
          {questions.slice(0, 4).map((q, idx) => {
            const qNum = idx + 1;
            const isCurrent = currentStepIndex === qNum;
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '';

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  if (stakeholderName.trim()) {
                    setCurrentStepIndex(qNum);
                  } else {
                    toast.error('Please enter stakeholder name first');
                  }
                }}
                className={cn(
                  'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5',
                  isCurrent
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                  isCurrent ? 'bg-white/20 text-white' : isAnswered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                )}>
                  {isAnswered && !isCurrent ? <Check size={13} weight="bold" /> : qNum}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    Q{qNum}: {q.type.replace('_', ' ')}
                  </div>
                  <div className={cn('text-[10px] truncate', isCurrent ? 'text-indigo-100' : 'text-slate-400')}>
                    {isAnswered ? 'Answered' : q.required ? 'Required' : 'Optional'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 0: GENERAL & STAKEHOLDER DETAILS
         ══════════════════════════════════════════════════════════════════════ */}
      {currentStepIndex === 0 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Survey General Details Banner */}
          <div className="card p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Survey Overview
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                  {survey.title}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalQuestions} Question{totalQuestions !== 1 ? 's' : ''}
              </span>
            </div>

            {survey.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {survey.description}
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <CalendarBlank size={15} className="text-slate-400" />
                <span>Active: {formatDate(survey.startDate || '')} – {formatDate(survey.endDate || '')}</span>
              </div>
              {survey.participantsRequired && (
                <span>Target: {survey.participantsRequired} Respondents</span>
              )}
            </div>
          </div>

          {/* Attached Documents if available */}
          {survey.documents && survey.documents.length > 0 && (
            <div className="card p-4 bg-indigo-50/40 border border-indigo-100 space-y-2">
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Paperclip size={14} className="text-indigo-600" weight="bold" />
                <span>Survey Guidelines &amp; Reference Documents</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {survey.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs text-indigo-900 font-semibold shadow-2xs hover:border-indigo-300 transition-colors"
                  >
                    <FileText size={15} className="text-indigo-600" />
                    <span>{doc.name}</span>
                    <span className="text-[10px] text-slate-400">({doc.size})</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Stakeholder Details Form */}
          <div className="card p-5 sm:p-7 space-y-5 border border-slate-200/90 shadow-xs bg-white">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Stakeholder Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Capture the profile information of the respondent or citizen before starting questions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name (Required) */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar Verma"
                    value={stakeholderName}
                    onChange={e => {
                      setStakeholderName(e.target.value);
                      if (stakeholderErrors.name) setStakeholderErrors({});
                    }}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      stakeholderErrors.name ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200 bg-white'
                    )}
                  />
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                </div>
                {stakeholderErrors.name && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                    <Warning size={13} weight="bold" /> {stakeholderErrors.name}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Contact Info
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210 or email"
                    value={stakeholderContact}
                    onChange={e => setStakeholderContact(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Phone size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Stakeholder Category */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Stakeholder Category
                </label>
                <select
                  value={stakeholderCategory}
                  onChange={e => setStakeholderCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                >
                  <option value="Beneficiary">Scheme Beneficiary</option>
                  <option value="Farmer">Farmer / Agriculturalist</option>
                  <option value="Youth">Youth / Student</option>
                  <option value="Women Self-Help Group">SHG Member / Woman Entrepreneur</option>
                  <option value="Panchayat Representative">Panchayat Official / Sarpanch</option>
                  <option value="Other Citizen">General Citizen</option>
                </select>
              </div>

              {/* Location / Village / District */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Location / Village / District (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gram Panchayat Pipariya, Block Hoshangabad"
                  value={stakeholderLocation}
                  onChange={e => setStakeholderLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action: "Start Survey" Button */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <Link
              href={backHref}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleStartSurvey}
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2.5 cursor-pointer btn-press"
            >
              <span>Start Survey</span>
              <ArrowRight size={17} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREENS 1..N: TYPEFORM-LIKE QUESTION INTERFACE (ONE BY ONE)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentStepIndex > 0 && currentQuestion && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Typeform Question Card */}
          <div className="card p-6 sm:p-10 border border-slate-200/90 shadow-sm bg-white min-h-[380px] flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Question Number & Required Tag */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                    Question {currentStepIndex} of {totalQuestions}
                  </span>
                  {currentQuestion.required ? (
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      Required *
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                      Optional
                    </span>
                  )}
                </div>

                <span className="text-xs font-medium text-slate-400">
                  Stakeholder: <strong className="text-slate-700">{stakeholderName}</strong>
                </span>
              </div>

              {/* Question Prompt (Typeform Big Typography) */}
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug">
                  {currentQuestion.question || 'Untitled Question'}
                </h2>
              </div>

              {/* ── Question Input Area ── */}
              {/* 1. Single Choice */}
              {currentQuestion.type === 'single_choice' && (
                <div className="space-y-2.5 pt-2">
                  {(currentQuestion.options || []).map((opt, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === opt;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 rounded-2xl border text-left text-sm transition-all cursor-pointer select-none',
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-400 font-bold text-indigo-950 shadow-xs ring-1 ring-indigo-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 shadow-2xs'
                        )}
                      >
                        <span className={cn(
                          'w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                          isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                        )}>
                          {letter}
                        </span>
                        <span className="flex-1 text-sm sm:text-base">{opt}</span>
                        {isSelected && <Check size={18} weight="bold" className="text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Multiple Choice */}
              {currentQuestion.type === 'multiple_choice' && (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs text-slate-400 font-medium">Select all that apply:</p>
                  {(currentQuestion.options || []).map((opt, optIdx) => {
                    const currentSelected = (answers[currentQuestion.id] as string[]) || [];
                    const isSelected = currentSelected.includes(opt);
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleToggleMultipleChoice(currentQuestion.id, opt)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 rounded-2xl border text-left text-sm transition-all cursor-pointer select-none',
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-400 font-bold text-indigo-950 shadow-xs ring-1 ring-indigo-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 shadow-2xs'
                        )}
                      >
                        <span className={cn(
                          'w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                          isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                        )}>
                          {letter}
                        </span>
                        <span className="flex-1 text-sm sm:text-base">{opt}</span>
                        <div className={cn(
                          'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        )}>
                          {isSelected && <Check size={13} weight="bold" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. Likert Scale (5-points) */}
              {currentQuestion.type === 'likert_scale' && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((point) => {
                      const isSelected = answers[currentQuestion.id] === point;
                      const defaultLabels = ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];
                      const pointLabel = currentQuestion.likertConfig?.labels?.[point - 1] || defaultLabels[point - 1];

                      return (
                        <button
                          key={point}
                          type="button"
                          onClick={() => handleAnswerChange(currentQuestion.id, point)}
                          className={cn(
                            'p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md font-bold scale-[1.02]'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700'
                          )}
                        >
                          <span className="text-lg sm:text-2xl font-black">{point}</span>
                          <span className={cn(
                            'text-[10px] sm:text-xs leading-tight line-clamp-2',
                            isSelected ? 'text-indigo-100' : 'text-slate-500'
                          )}>
                            {pointLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Dichotomous (Yes / No) */}
              {currentQuestion.type === 'dichotomous' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {['Yes', 'No'].map((opt) => {
                    const isSelected = answers[currentQuestion.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                        className={cn(
                          'p-4 sm:p-5 rounded-2xl border text-center font-bold text-base sm:text-lg transition-all cursor-pointer flex items-center justify-center gap-2.5',
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        {opt === 'Yes' && <Check size={18} weight="bold" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 5. Descriptive Text */}
              {currentQuestion.type === 'descriptive' && (
                <div className="pt-2">
                  <textarea
                    rows={4}
                    placeholder={currentQuestion.placeholder || 'Type detailed stakeholder answer or observations here…'}
                    value={answers[currentQuestion.id] || ''}
                    onChange={e => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none hover:border-slate-300 leading-relaxed shadow-2xs"
                  />
                </div>
              )}

              {/* Error message */}
              {currentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <Warning size={16} weight="bold" className="shrink-0" />
                  <span>{currentError}</span>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════════
                  PARTICIPANT MEDIA CAPTURE (VOICE, VIDEO, IMAGE)
                 ════════════════════════════════════════════════════════════════ */}
              {(currentQuestion.allowVoice || currentQuestion.allowVideo || currentQuestion.allowImage) && (
                <div className="pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkle size={14} className="text-indigo-600" weight="fill" />
                        Participant Media Attachments
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Capture audio notes, video statements, or photo of participant
                      </p>
                    </div>
                  </div>

                  {/* Hidden inputs for real file selection */}
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMediaUpload(currentQuestion.id, 'voice', f);
                    }}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMediaUpload(currentQuestion.id, 'video', f);
                    }}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMediaUpload(currentQuestion.id, 'image', f);
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Voice Note Option */}
                    {currentQuestion.allowVoice && (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                            <Microphone size={15} weight="bold" className="text-purple-600" />
                            Voice Note
                          </span>
                          {mediaAnswers[currentQuestion.id]?.voiceUrl && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              Attached ✓
                            </span>
                          )}
                        </div>

                        {/* If Voice Attached */}
                        {mediaAnswers[currentQuestion.id]?.voiceUrl ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-purple-200 text-xs text-purple-900">
                            <div className="flex items-center gap-2 truncate">
                              <Play size={14} weight="fill" className="text-purple-600 shrink-0" />
                              <span className="truncate text-[11px] font-medium">
                                {mediaAnswers[currentQuestion.id]?.voiceName || 'voice_recording.wav'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMedia(currentQuestion.id, 'voice')}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete voice note"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        ) : isRecordingVoice ? (
                          /* While Recording */
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                              <span className="font-bold">{formatSeconds(recordingSeconds)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => stopVoiceRecording(currentQuestion.id)}
                              className="px-2 py-1 rounded-md bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Stop size={11} weight="fill" />
                              <span>Stop</span>
                            </button>
                          </div>
                        ) : (
                          /* Initial Voice Action Buttons */
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIsRecordingVoice(true)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Microphone size={13} weight="bold" />
                              <span>Record</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => audioInputRef.current?.click()}
                              className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs transition-colors cursor-pointer"
                              title="Upload audio file"
                            >
                              <UploadSimple size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video Note Option */}
                    {currentQuestion.allowVideo && (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <VideoCamera size={15} weight="bold" className="text-blue-600" />
                            Video Note
                          </span>
                          {mediaAnswers[currentQuestion.id]?.videoUrl && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              Attached ✓
                            </span>
                          )}
                        </div>

                        {mediaAnswers[currentQuestion.id]?.videoUrl ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-blue-200 text-xs text-blue-900">
                            <div className="flex items-center gap-2 truncate">
                              <VideoCamera size={14} weight="fill" className="text-blue-600 shrink-0" />
                              <span className="truncate text-[11px] font-medium">
                                {mediaAnswers[currentQuestion.id]?.videoName || 'video_clip.mp4'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMedia(currentQuestion.id, 'video')}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete video"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full py-1.5 px-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <VideoCamera size={13} weight="bold" />
                            <span>Capture / Upload Video</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Participant Photo / Image Option */}
                    {currentQuestion.allowImage && (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <Camera size={15} weight="bold" className="text-emerald-600" />
                            Participant Photo
                          </span>
                          {mediaAnswers[currentQuestion.id]?.imageUrl && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              Attached ✓
                            </span>
                          )}
                        </div>

                        {mediaAnswers[currentQuestion.id]?.imageUrl ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-emerald-200 text-xs text-emerald-900">
                            <div className="flex items-center gap-2 truncate">
                              <Camera size={14} weight="fill" className="text-emerald-600 shrink-0" />
                              <span className="truncate text-[11px] font-medium">
                                {mediaAnswers[currentQuestion.id]?.imageName || 'participant_photo.jpg'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMedia(currentQuestion.id, 'image')}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full py-1.5 px-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Camera size={13} weight="bold" />
                            <span>Take Photo / Upload</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PHONE VIEW & DESKTOP BOTTOM ACTION BAR (BACK & NEXT NAVIGATION)
             ══════════════════════════════════════════════════════════════════ */}
          <div className="fixed sm:sticky bottom-0 left-0 right-0 z-30 sm:z-10 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 border-t sm:border border-slate-200/90 sm:rounded-2xl shadow-lg flex items-center justify-between gap-3">
            {/* Back Button */}
            <button
              type="button"
              onClick={handlePrevQuestion}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer select-none"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Back</span>
            </button>

            {/* Next or Submit Button */}
            {currentStepIndex < totalQuestions ? (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer btn-press select-none"
              >
                <span>Next Question</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitSurvey}
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2 cursor-pointer btn-press select-none disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <span>Submit Survey Response</span>
                    <Check size={16} weight="bold" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
