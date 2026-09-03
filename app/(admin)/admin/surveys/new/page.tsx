'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash,
  Copy,
  ArrowUp,
  ArrowDown,
  Check,
  Warning,
  RadioButton,
  CheckSquare,
  Sliders,
  ToggleLeft,
  TextT,
  Eye,
  EyeSlash,
  Sparkle,
  Calendar,
  Users,
  ClipboardText,
  Info,
  CheckCircle,
  X,
  CaretDown,
  UploadSimple,
  FileText,
  Paperclip,
  File,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { surveysApi } from '@/lib/api/surveys';
import type { QuestionType, SurveyQuestion, LikertConfig, SurveyDocument } from '@/types/models';
import { toast } from 'sonner';

// ── Question Types Metadata ──────────────────────────────────────────────────
interface QuestionTypeDef {
  type: QuestionType;
  label: string;
  icon: React.ElementType;
  description: string;
  gradient: string;
  borderHover: string;
  accentBadge: string;
}

const QUESTION_TYPES: QuestionTypeDef[] = [
  {
    type: 'single_choice',
    label: 'Single Choice',
    icon: RadioButton,
    description: 'Respondent selects only one option from a list',
    gradient: 'from-blue-500/10 to-indigo-500/10 text-indigo-600',
    borderHover: 'hover:border-indigo-400 hover:ring-indigo-100',
    accentBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    type: 'multiple_choice',
    label: 'Multiple Choice',
    icon: CheckSquare,
    description: 'Respondent can check multiple relevant options',
    gradient: 'from-emerald-500/10 to-teal-500/10 text-emerald-600',
    borderHover: 'hover:border-emerald-400 hover:ring-emerald-100',
    accentBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    type: 'likert_scale',
    label: 'Likert Scale',
    icon: Sliders,
    description: '5-point agreement, satisfaction or quality scale',
    gradient: 'from-purple-500/10 to-pink-500/10 text-purple-600',
    borderHover: 'hover:border-purple-400 hover:ring-purple-100',
    accentBadge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    type: 'dichotomous',
    label: 'Dichotomous',
    icon: ToggleLeft,
    description: 'Binary decision (Yes / No, True / False)',
    gradient: 'from-amber-500/10 to-orange-500/10 text-amber-600',
    borderHover: 'hover:border-amber-400 hover:ring-amber-100',
    accentBadge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    type: 'descriptive',
    label: 'Descriptive',
    icon: TextT,
    description: 'Open-ended text for explanations and feedback',
    gradient: 'from-cyan-500/10 to-sky-500/10 text-sky-600',
    borderHover: 'hover:border-sky-400 hover:ring-sky-100',
    accentBadge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
];

const LIKERT_PRESETS: { label: string; labels: string[] }[] = [
  {
    label: 'Satisfaction (Very Dissatisfied → Very Satisfied)',
    labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
  },
  {
    label: 'Agreement (Strongly Disagree → Strongly Agree)',
    labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  },
  {
    label: 'Quality / Effectiveness (Very Poor → Excellent)',
    labels: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'],
  },
  {
    label: 'Frequency (Never → Always)',
    labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  },
  {
    label: 'Importance (Not Important → Very Important)',
    labels: ['Not Important', 'Slightly Important', 'Moderately Important', 'Important', 'Very Important'],
  },
];

const DICHOTOMOUS_PRESETS: [string, string][] = [
  ['Yes', 'No'],
  ['True', 'False'],
  ['Agree', 'Disagree'],
  ['Applicable', 'Not Applicable'],
];

function makeInitialQuestion(type: QuestionType): SurveyQuestion {
  const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'single_choice':
      return {
        id,
        type,
        question: '',
        options: ['Option 1', 'Option 2', 'Option 3'],
        required: true,
      };
    case 'multiple_choice':
      return {
        id,
        type,
        question: '',
        options: ['Option 1', 'Option 2', 'Option 3'],
        required: true,
      };
    case 'likert_scale':
      return {
        id,
        type,
        question: '',
        likertConfig: {
          points: 5,
          lowLabel: 'Very Dissatisfied',
          midLabel: 'Neutral',
          highLabel: 'Very Satisfied',
          labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
        },
        required: true,
      };
    case 'dichotomous':
      return {
        id,
        type,
        question: '',
        dichotomousLabels: ['Yes', 'No'],
        required: true,
      };
    case 'descriptive':
      return {
        id,
        type,
        question: '',
        placeholder: 'Type detailed observations or respondent response here…',
        required: true,
      };
    default:
      return { id, type, question: '', required: true };
  }
}

export default function AdminNewSurveyPage() {
  const router = useRouter();

  // ── Step Navigation ─────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Step 1: General Details ─────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(Date.now() + 21 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [participantsRequired, setParticipantsRequired] = useState<number>(100);
  const [step1Errors, setStep1Errors] = useState<{ [key: string]: string }>({});

  // ── Supporting Documents ──
  const [documents, setDocuments] = useState<SurveyDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesAdded = (files: FileList | File[]) => {
    const newDocs: SurveyDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formattedSize = formatFileSize(file.size);
      if (documents.some(d => d.name === file.name && d.size === formattedSize)) {
        continue;
      }
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      newDocs.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: formattedSize,
        type: ext,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toLocaleDateString(),
      });
    }
    if (newDocs.length > 0) {
      setDocuments(prev => [...prev, ...newDocs]);
      toast.success(`${newDocs.length} document${newDocs.length > 1 ? 's' : ''} attached`);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success('Document removed');
  };

  // ── Step 2: Questions ───────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    makeInitialQuestion('single_choice'),
  ]);

  // ── Validation for Step 1 ───────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!title.trim() || title.trim().length < 3) {
      errs.title = 'Survey name must be at least 3 characters.';
    }
    if (!startDate) {
      errs.startDate = 'Start date is required.';
    }
    if (!endDate) {
      errs.endDate = 'End date is required.';
    }
    if (startDate && endDate && startDate > endDate) {
      errs.endDate = 'End date must be on or after start date.';
    }
    if (!participantsRequired || participantsRequired < 1) {
      errs.participantsRequired = 'Enter at least 1 participant.';
    }
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Question Management Handlers ────────────────────────────────────────────
  const addQuestion = (type: QuestionType) => {
    const newQ = makeInitialQuestion(type);
    setQuestions(prev => [...prev, newQ]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const updateQuestion = (index: number, updated: SurveyQuestion) => {
    setQuestions(prev => prev.map((q, i) => (i === index ? updated : q)));
  };

  const changeQuestionType = (index: number, newType: QuestionType) => {
    const existing = questions[index];
    const initialForType = makeInitialQuestion(newType);
    updateQuestion(index, {
      ...initialForType,
      id: existing.id,
      question: existing.question,
      required: existing.required,
    });
    toast.success(`Changed to ${QUESTION_TYPES.find(t => t.type === newType)?.label}`);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    toast.success('Question removed');
  };

  const duplicateQuestion = (index: number) => {
    const source = questions[index];
    const cloned: SurveyQuestion = {
      ...source,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      question: source.question ? `${source.question} (Copy)` : '',
      options: source.options ? [...source.options] : undefined,
    };
    const next = [...questions];
    next.splice(index + 1, 0, cloned);
    setQuestions(next);
    toast.success('Question duplicated');
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setQuestions(copy);
  };

  // ── Save Survey ─────────────────────────────────────────────────────────────
  const handleSave = async (allocateAsTask = false) => {
    if (!validateStep1()) {
      setCurrentStep(1);
      toast.error('Please complete all required general details');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question before saving the survey');
      return;
    }

    const emptyQuestions = questions.filter(q => !q.question.trim());
    if (emptyQuestions.length > 0) {
      toast.error(`Please provide question text for all ${emptyQuestions.length} questions`);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await surveysApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        participantsRequired,
        questions,
        documents: documents.length > 0 ? documents : undefined,
      });

      toast.success('Survey created successfully!');

      if (allocateAsTask) {
        router.push(`/admin/tasks/new?surveyId=${created.id}&surveyName=${encodeURIComponent(created.title)}`);
      } else {
        router.push('/admin/surveys');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-36 sm:pb-24 px-1.5 sm:px-0">
      {/* ── Top Breadcrumb & Page Header ── */}
      {/* Desktop Header */}
      <div className="hidden sm:flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/surveys"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-2xs"
            aria-label="Back to surveys"
          >
            <ArrowLeft size={18} weight="bold" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Create Survey</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Admin Builder
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Design structured field questionnaires for Program Coordinators, Fellows, and Interns
            </p>
          </div>
        </div>

        {/* Live Preview Button */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <Eye size={16} className="text-indigo-600" weight="bold" />
          <span>Live Preview</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* ── Mobile Frozen Header & Stepper (Stays pinned at top when scrolling) ── */}
      <div className="sm:hidden sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md -mx-4 px-4 pt-1.5 pb-2 space-y-2 border-b border-slate-200/80 shadow-2xs">
        {/* Mobile Header (Sleek, Compact, Single-Row) */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/admin/surveys"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0 shadow-2xs"
              aria-label="Back to surveys"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-slate-900 truncate">Create Survey</h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Questionnaire builder</p>
            </div>
          </div>

          {/* Mobile Live Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 shadow-2xs shrink-0 cursor-pointer active:scale-95"
          >
            <Eye size={13} className="text-indigo-600" weight="bold" />
            <span>Preview</span>
          </button>
        </div>

        {/* Mobile Stepper (Slim 2-tab segmented control) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              currentStep === 1
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <span className={cn('w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold', currentStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>1</span>
            <span className="truncate">General Details</span>
            {title.trim() && <CheckCircle size={13} className="text-emerald-500 shrink-0" weight="fill" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setCurrentStep(2);
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              currentStep === 2
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <span className={cn('w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold', currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700')}>2</span>
            <span className="truncate">Questions</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200/70 text-slate-700 font-bold">
              {questions.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Desktop Stepper Header Navigation ── */}
      <div className="hidden sm:block card p-2 sm:p-3 bg-white/90 backdrop-blur-md shadow-xs border border-slate-200/80">
        <div className="grid grid-cols-2 gap-2 relative">
          {/* Step 1 Button */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={cn(
              'flex items-center gap-3 p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer',
              currentStep === 1
                ? 'bg-indigo-50/90 border border-indigo-200/80 shadow-2xs'
                : 'hover:bg-slate-50 border border-transparent text-slate-600'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                currentStep === 1
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              1
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold tracking-tight text-slate-900 truncate flex items-center gap-1.5">
                <span>General Details</span>
                {title.trim() && <CheckCircle size={14} className="text-emerald-500 shrink-0" weight="fill" />}
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">Title, timeline &amp; targets</p>
            </div>
          </button>

          {/* Step 2 Button */}
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setCurrentStep(2);
            }}
            className={cn(
              'flex items-center gap-3 p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer',
              currentStep === 2
                ? 'bg-indigo-50/90 border border-indigo-200/80 shadow-2xs'
                : 'hover:bg-slate-50 border border-transparent text-slate-600'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                currentStep === 2
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              2
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold tracking-tight text-slate-900 truncate flex items-center gap-1.5">
                <span>Add Questions</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                  {questions.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">Interactive question builder</p>
            </div>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1: GENERAL DETAILS
         ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="card p-5 sm:p-7 space-y-6 border border-slate-200/80 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Step 1: General Information</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Define the primary purpose, duration, and target participation count for this survey.
              </p>
            </div>

            {/* Survey Name / Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Survey Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (step1Errors.title) setStep1Errors(prev => ({ ...prev, title: '' }));
                }}
                placeholder="e.g. District Livelihood Assessment & Scheme Coverage Q3"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
                  step1Errors.title ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 hover:border-slate-300'
                )}
              />
              {step1Errors.title && (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                  <Warning size={13} weight="bold" /> {step1Errors.title}
                </p>
              )}
            </div>

            {/* Timeline: Start Date & End Date (Single row on all screens) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      if (step1Errors.startDate) setStep1Errors(prev => ({ ...prev, startDate: '' }));
                    }}
                    className={cn(
                      'w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
                      step1Errors.startDate ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                    )}
                  />
                </div>
                {step1Errors.startDate && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                    <Warning size={13} weight="bold" /> {step1Errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => {
                      setEndDate(e.target.value);
                      if (step1Errors.endDate) setStep1Errors(prev => ({ ...prev, endDate: '' }));
                    }}
                    className={cn(
                      'w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
                      step1Errors.endDate ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                    )}
                  />
                </div>
                {step1Errors.endDate && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                    <Warning size={13} weight="bold" /> {step1Errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {/* Participants Required */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-800">
                  No. of Participants Required <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">Target sample size</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={participantsRequired}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setParticipantsRequired(val);
                      if (step1Errors.participantsRequired) {
                        setStep1Errors(prev => ({ ...prev, participantsRequired: '' }));
                      }
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold',
                      step1Errors.participantsRequired ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                    )}
                  />
                  <Users size={16} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[50, 100, 250, 500].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setParticipantsRequired(count)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                        participantsRequired === count
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              {step1Errors.participantsRequired && (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                  <Warning size={13} weight="bold" /> {step1Errors.participantsRequired}
                </p>
              )}
            </div>

            {/* Description / Instructions */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Description &amp; Field Instructions (optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly explain the objective of this survey and instructions for field respondents or interviewing officers…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none hover:border-slate-300"
              />
            </div>

            {/* ── Upload Supporting Documents ── */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">
                    Upload Documents (optional)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Attach survey questionnaires, field SOPs, guidelines, or reference materials
                  </p>
                </div>
                {documents.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {documents.length} {documents.length === 1 ? 'Document' : 'Documents'} Attached
                  </span>
                )}
              </div>

              {/* Drag and Drop Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.length) {
                    handleFilesAdded(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all group',
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 bg-slate-50/40'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleFilesAdded(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <UploadSimple size={22} weight="bold" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Click to upload document
                    </span>
                    <span className="text-sm text-slate-500"> or drag &amp; drop</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Supports PDF, DOC, DOCX, XLS, XLSX, CSV, TXT (up to 10MB each)
                  </p>
                </div>
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <FileText size={20} weight="bold" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                              {doc.type}
                            </span>
                            <span>•</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDocument(doc.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Remove document"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Actions (Desktop only - mobile has portalled bottom action bar) */}
            <div className="hidden sm:flex pt-4 border-t border-slate-100 items-center justify-between">
              <Link
                href="/admin/surveys"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleNextToStep2}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer btn-press"
              >
                <span>Next: Add Questions</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2: ADD QUESTIONS (TYPEFORM / INTERACTIVE GOOGLE FORMS STYLE)
         ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* List of Added Question Cards (Rendered above the Add Question Card) */}
          {questions.length > 0 && (
            <div className="space-y-4">
              {questions.map((q, qIndex) => {
                const typeCfg = QUESTION_TYPES.find(t => t.type === q.type) || QUESTION_TYPES[0];
                const Icon = typeCfg.icon;

                return (
                  <div
                    key={q.id}
                    className="card p-4 sm:p-6 border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all space-y-4 relative group"
                  >
                    {/* Card Header & Controls */}
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {qIndex + 1}
                        </span>

                        {/* Interactive Question Type Dropdown Selector */}
                        <div className="relative inline-flex items-center">
                          <select
                            value={q.type}
                            onChange={e => changeQuestionType(qIndex, e.target.value as QuestionType)}
                            className={cn(
                              'text-xs font-semibold pl-2.5 pr-6 py-1 rounded-full border cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-all',
                              typeCfg.accentBadge
                            )}
                            title="Click to change question type"
                          >
                            {QUESTION_TYPES.map(t => (
                              <option key={t.type} value={t.type}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-2 pointer-events-none text-slate-400">
                            <CaretDown size={11} weight="bold" />
                          </div>
                        </div>
                      </div>

                    {/* Actions: Move, Duplicate, Delete, Required */}
                    <div className="flex items-center gap-2">
                      {/* Required Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 select-none mr-2">
                        <input
                          type="checkbox"
                          checked={!!q.required}
                          onChange={e => updateQuestion(qIndex, { ...q, required: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Required</span>
                      </label>

                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'up')}
                        disabled={qIndex === 0}
                        title="Move question up"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <ArrowUp size={15} weight="bold" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'down')}
                        disabled={qIndex === questions.length - 1}
                        title="Move question down"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <ArrowDown size={15} weight="bold" />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => duplicateQuestion(qIndex)}
                        title="Duplicate question"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <Copy size={15} weight="bold" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        title="Delete question"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </div>

                  {/* Question Title Input */}
                  <div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => updateQuestion(qIndex, { ...q, question: e.target.value })}
                      placeholder="Type your question prompt here…"
                      className="w-full px-3.5 py-2.5 text-sm sm:text-base font-semibold rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-all"
                    />
                  </div>

                  {/* ── Sub-Editor Based on Question Type ── */}

                  {/* 1. SINGLE CHOICE & 2. MULTIPLE CHOICE */}
                  {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                    <div className="space-y-2.5 pl-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Options:</p>
                      <div className="space-y-2">
                        {(q.options ?? []).map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2.5 group/opt">
                            <div className="w-5 h-5 rounded flex items-center justify-center text-slate-300 shrink-0">
                              {q.type === 'single_choice' ? (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover/opt:border-indigo-400" />
                              ) : (
                                <div className="w-4 h-4 rounded border-2 border-slate-300 group-hover/opt:border-emerald-400" />
                              )}
                            </div>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const newOpts = [...(q.options ?? [])];
                                newOpts[optIndex] = e.target.value;
                                updateQuestion(qIndex, { ...q, options: newOpts });
                              }}
                              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {(q.options?.length ?? 0) > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOpts = q.options!.filter((_, i) => i !== optIndex);
                                  updateQuestion(qIndex, { ...q, options: newOpts });
                                }}
                                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <X size={14} weight="bold" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`];
                          updateQuestion(qIndex, { ...q, options: newOpts });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <Plus size={13} weight="bold" /> Add Option
                      </button>
                    </div>
                  )}

                  {/* 3. LIKERT SCALE */}
                  {q.type === 'likert_scale' && (() => {
                    const currentLabels = q.likertConfig?.labels || [
                      q.likertConfig?.lowLabel || 'Very Dissatisfied',
                      'Dissatisfied',
                      q.likertConfig?.midLabel || 'Neutral',
                      'Satisfied',
                      q.likertConfig?.highLabel || 'Very Satisfied',
                    ];

                    return (
                      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3.5">
                        {/* Preset selector */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                              Likert Scale Configuration (5 Points)
                            </span>
                            <span className="text-[11px] text-purple-600/80">
                              Edit option names directly inside any of the 5 boxes below
                            </span>
                          </div>
                          <select
                            onChange={e => {
                              const preset = LIKERT_PRESETS[parseInt(e.target.value)];
                              if (preset) {
                                updateQuestion(qIndex, {
                                  ...q,
                                  likertConfig: {
                                    points: 5,
                                    labels: [...preset.labels],
                                    lowLabel: preset.labels[0],
                                    midLabel: preset.labels[2],
                                    highLabel: preset.labels[4],
                                  },
                                });
                              }
                            }}
                            className="text-xs py-1.5 px-3 rounded-xl border border-purple-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs font-medium cursor-pointer"
                          >
                            {LIKERT_PRESETS.map((p, pIdx) => (
                              <option key={p.label} value={pIdx}>
                                Preset: {p.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Directly Editable 5 Boxes */}
                        <div className="grid grid-cols-5 gap-1 sm:gap-2.5">
                          {[0, 1, 2, 3, 4].map(idx => {
                            const pointNumber = idx + 1;
                            const label = currentLabels[idx] || '';

                            return (
                              <div
                                key={pointNumber}
                                className="p-1 sm:p-3 rounded-xl bg-white border-2 border-purple-200/90 hover:border-purple-400 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-100 transition-all shadow-2xs flex flex-col items-center gap-1 sm:gap-2 text-center"
                              >
                                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[10px] sm:text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                  {pointNumber}
                                </div>
                                <input
                                  type="text"
                                  value={label}
                                  onChange={e => {
                                    const updatedLabels = [...currentLabels];
                                    updatedLabels[idx] = e.target.value;
                                    updateQuestion(qIndex, {
                                      ...q,
                                      likertConfig: {
                                        points: 5,
                                        labels: updatedLabels,
                                        lowLabel: updatedLabels[0],
                                        midLabel: updatedLabels[2],
                                        highLabel: updatedLabels[4],
                                      },
                                    });
                                  }}
                                  placeholder={`Point ${pointNumber}`}
                                  className="w-full text-center text-[10px] sm:text-xs font-semibold text-slate-800 placeholder:text-slate-400 bg-transparent border-b border-purple-100 hover:border-purple-300 focus:border-purple-600 focus:outline-none py-0.5 sm:py-1 px-0.5 transition-colors"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4. DICHOTOMOUS (YES / NO) */}
                  {q.type === 'dichotomous' && (
                    <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          Dichotomous Binary Options
                        </span>
                        <div className="flex items-center gap-1.5">
                          {DICHOTOMOUS_PRESETS.map(([pos, neg]) => (
                            <button
                              key={`${pos}-${neg}`}
                              type="button"
                              onClick={() => updateQuestion(qIndex, { ...q, dichotomousLabels: [pos, neg] })}
                              className={cn(
                                'px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer',
                                q.dichotomousLabels?.[0] === pos && q.dichotomousLabels?.[1] === neg
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              )}
                            >
                              {pos} / {neg}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preview Toggle Buttons */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 py-2.5 px-4 rounded-xl bg-white border-2 border-amber-200 text-center text-sm font-bold text-amber-900 shadow-2xs">
                          {q.dichotomousLabels?.[0] ?? 'Yes'}
                        </div>
                        <div className="flex-1 py-2.5 px-4 rounded-xl bg-white border-2 border-slate-200 text-center text-sm font-bold text-slate-600 shadow-2xs">
                          {q.dichotomousLabels?.[1] ?? 'No'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. DESCRIPTIVE */}
                  {q.type === 'descriptive' && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Respondent Open-Text Preview:
                      </p>
                      <textarea
                        rows={2}
                        disabled
                        placeholder={q.placeholder || 'Type your detailed response here…'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm italic resize-none cursor-not-allowed"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Placeholder tip:</span>
                        <input
                          type="text"
                          value={q.placeholder ?? ''}
                          onChange={e => updateQuestion(qIndex, { ...q, placeholder: e.target.value })}
                          placeholder="Customize respondent placeholder guidance…"
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Desktop View: Full Add Question Card */}
        <div className="hidden sm:block card p-5 border border-indigo-100/80 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkle size={15} weight="fill" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {questions.length === 0 ? 'Add Your First Question' : 'Add Question'}
                </h3>
                <p className="text-xs text-slate-500">Pick any of the 5 question formats below to add to your survey</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'} added
            </span>
          </div>

          {/* 5 Question Type Rich Cards */}
          <div className="grid grid-cols-5 gap-2.5 pt-1">
            {QUESTION_TYPES.map(cfg => {
              const Icon = cfg.icon;
              return (
                <button
                  key={cfg.type}
                  type="button"
                  onClick={() => addQuestion(cfg.type)}
                  className={cn(
                    'p-3 rounded-xl border bg-white text-left transition-all shadow-2xs hover:shadow-md active:scale-95 group cursor-pointer flex flex-col justify-between gap-2 border-slate-200/90',
                    cfg.borderHover
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br', cfg.gradient)}>
                      <Icon size={18} weight="bold" />
                    </div>
                    <Plus size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {cfg.label}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                      {cfg.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile View: Ultra-slim card with pinned "+" button on extreme left and horizontally scrollable pills */}
        <div className="sm:hidden card p-2 border border-indigo-100/80 bg-white/95 backdrop-blur-xs shadow-xs flex items-center gap-2 overflow-hidden">
          {/* Stable '+' button on extreme left */}
          <button
            type="button"
            onClick={() => addQuestion('single_choice')}
            className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-90 transition-transform cursor-pointer"
            title="Add Question"
            aria-label="Add question"
          >
            <Plus size={18} weight="bold" />
          </button>

          {/* Vertical divider */}
          <div className="w-[1px] h-6 bg-slate-200 shrink-0" />

          {/* Horizontally scrollable pill buttons */}
          <div className="flex-1 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 shrink-0 w-max pr-1">
              {QUESTION_TYPES.map(cfg => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => addQuestion(cfg.type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer bg-white text-slate-800 border-slate-200/90 shrink-0 hover:border-indigo-300',
                      cfg.borderHover
                    )}
                  >
                    <div className={cn('w-4 h-4 rounded-full flex items-center justify-center bg-gradient-to-br text-white shrink-0 shadow-2xs', cfg.gradient)}>
                      <Icon size={10} weight="bold" />
                    </div>
                    <span className="whitespace-nowrap">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

          {/* Bottom Navigation & Save Controls (Desktop only) */}
          <div className="hidden sm:flex card p-4 sm:p-5 border border-slate-200 items-center justify-between flex-wrap gap-3 bg-white/95 backdrop-blur-md sticky bottom-4 z-20 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Back to General Details</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer btn-press disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Save Survey'}
                <Check size={16} weight="bold" />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 shadow-md transition-all flex items-center gap-2 cursor-pointer btn-press disabled:opacity-60"
                title="Save this survey and immediately assign it as a field task"
              >
                <span>Save &amp; Allocate as Task</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Frozen Bottom Action Bar (Portalled directly to document.body, sitting safely above BottomNav) ── */}
      {mounted && createPortal(
        <div className="sm:hidden fixed bottom-[calc(52px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2.5 shadow-lg">
          {currentStep === 1 ? (
            <div className="flex items-center gap-2 max-w-lg mx-auto">
              <Link
                href="/admin/surveys"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 shrink-0 text-center"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleNextToStep2}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Next: Add Questions</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 max-w-lg mx-auto">
              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center shrink-0 shadow-2xs hover:bg-slate-50 active:scale-95 cursor-pointer"
                aria-label="Back to general details"
              >
                <ArrowLeft size={16} weight="bold" />
              </button>

              {/* Save Survey Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(false)}
                className="flex-1 h-10 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={14} weight="bold" />
                )}
                <span>Save Survey</span>
              </button>

              {/* Save & Allocate Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
                className="h-10 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 shrink-0"
                title="Save and assign as task"
              >
                <span>Allocate</span>
                <ArrowRight size={13} weight="bold" />
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LIVE RESPONDENT PREVIEW MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Respondent Live Preview</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Fellow / Intern View
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Survey Header Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-white space-y-2 shadow-md">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Madhya Pradesh Youth Program Field Survey
                </span>
                <h2 className="text-xl font-bold leading-snug">{title || 'Untitled Survey'}</h2>
                {description && <p className="text-xs text-indigo-200 leading-relaxed">{description}</p>}
                <div className="flex items-center gap-4 text-xs text-indigo-300 pt-2 border-t border-indigo-700/60">
                  <span>📅 Active: {startDate} → {endDate}</span>
                  <span>🎯 Target: {participantsRequired} responses</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-bold text-indigo-600">{idx + 1}.</span>
                      <div className="font-semibold text-slate-800 text-sm leading-snug flex-1">
                        {q.question || `Untitled Question ${idx + 1}`}
                        {q.required && <span className="text-rose-500 ml-1">*</span>}
                      </div>
                    </div>

                    {/* Single choice preview */}
                    {q.type === 'single_choice' && (
                      <div className="space-y-1.5 pl-5">
                        {(q.options ?? []).map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                            <input type="radio" name={`preview-${q.id}`} className="text-indigo-600 focus:ring-indigo-500" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Multiple choice preview */}
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-1.5 pl-5">
                        {(q.options ?? []).map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                            <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Likert scale preview */}
                    {q.type === 'likert_scale' && (() => {
                      const labels = q.likertConfig?.labels || [
                        q.likertConfig?.lowLabel || 'Very Dissatisfied',
                        'Dissatisfied',
                        q.likertConfig?.midLabel || 'Neutral',
                        'Satisfied',
                        q.likertConfig?.highLabel || 'Very Satisfied',
                      ];
                      return (
                        <div className="pl-5 space-y-1.5">
                          <div className="grid grid-cols-5 gap-1.5 text-center">
                            {[1, 2, 3, 4, 5].map(pt => (
                              <button
                                key={pt}
                                type="button"
                                className="py-2 px-1 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors flex flex-col items-center gap-1 group"
                              >
                                <span className="text-xs font-bold">{pt}</span>
                                <span className="text-[10px] font-medium leading-tight line-clamp-2 text-slate-500 group-hover:text-white">
                                  {labels[pt - 1]}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Dichotomous preview */}
                    {q.type === 'dichotomous' && (
                      <div className="pl-5 flex items-center gap-2">
                        <button type="button" className="px-4 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-500 hover:text-white transition-colors">
                          {q.dichotomousLabels?.[0] || 'Yes'}
                        </button>
                        <button type="button" className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-600 hover:text-white transition-colors">
                          {q.dichotomousLabels?.[1] || 'No'}
                        </button>
                      </div>
                    )}

                    {/* Descriptive preview */}
                    {q.type === 'descriptive' && (
                      <div className="pl-5">
                        <textarea
                          rows={2}
                          placeholder={q.placeholder || 'Write response here…'}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
