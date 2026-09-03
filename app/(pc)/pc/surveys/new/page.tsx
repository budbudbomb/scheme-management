'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Plus, Trash, DotsSixVertical, Warning,
  CheckSquare, RadioButton, Star, ToggleLeft, TextT,
  ArrowUp, ArrowDown, Eye, EyeSlash, CheckCircle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { surveysApi } from '@/lib/api/surveys';
import type { QuestionType, SurveyQuestion } from '@/types/models';
import { toast } from 'sonner';

// ── Question type config ────────────────────────────────────────────────────
const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ElementType; desc: string; hasOptions: boolean }[] = [
  { type: 'single_choice',   label: 'Single Choice',   icon: RadioButton,  desc: 'One answer from a list',          hasOptions: true  },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: CheckSquare,  desc: 'Many answers from a list',        hasOptions: true  },
  { type: 'rating_scale',    label: 'Rating Scale',    icon: Star,         desc: 'Numeric scale (e.g. 1–5)',         hasOptions: false },
  { type: 'dichotomous',     label: 'Yes / No',        icon: ToggleLeft,   desc: 'Binary yes or no question',       hasOptions: false },
  { type: 'descriptive',     label: 'Open Text',       icon: TextT,        desc: 'Free text response',              hasOptions: false },
];

// ── Form validation ─────────────────────────────────────────────────────────
const metaSchema = z.object({
  title:           z.string().min(3, 'Title must be at least 3 characters'),
  description:     z.string().optional(),
  allocateAsTask:  z.boolean().default(false),
});
type MetaFormData = z.infer<typeof metaSchema>;

// ── Local question state ────────────────────────────────────────────────────
function makeBlankQuestion(type: QuestionType): SurveyQuestion {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    question: '',
    options: type === 'single_choice' || type === 'multiple_choice'
      ? ['Option 1', 'Option 2']
      : type === 'dichotomous' ? ['Yes', 'No']
      : undefined,
    required: true,
  };
}

function inputCls(err?: boolean) {
  return cn(
    'w-full px-3 py-2.5 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow',
    err ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300',
  );
}

// ── Question card component ─────────────────────────────────────────────────
function QuestionCard({
  q, index, total,
  onUpdate, onDelete, onMove,
}: {
  q: SurveyQuestion;
  index: number;
  total: number;
  onUpdate: (updated: SurveyQuestion) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
}) {
  const typeCfg = QUESTION_TYPES.find(t => t.type === q.type)!;
  const Icon = typeCfg.icon;

  const updateOption = (i: number, val: string) => {
    onUpdate({ ...q, options: q.options!.map((o, idx) => idx === i ? val : o) });
  };
  const addOption = () => {
    onUpdate({ ...q, options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`] });
  };
  const removeOption = (i: number) => {
    if ((q.options?.length ?? 0) <= 2) return; // Minimum 2 options
    onUpdate({ ...q, options: q.options!.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="card p-4 space-y-3 border-l-4 border-indigo-400">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1 mt-0.5">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
            title="Move up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={index === total - 1}
            className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
            title="Move down"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-indigo-50 shrink-0">
          <Icon size={13} className="text-indigo-600" weight="fill" />
          <span className="text-xs font-medium text-indigo-700">{typeCfg.label}</span>
        </div>

        <span className="text-xs text-slate-400 mt-1 shrink-0">Q{index + 1}</span>

        {/* Required toggle */}
        <button
          type="button"
          onClick={() => onUpdate({ ...q, required: !q.required })}
          className={cn(
            'ml-auto text-xs font-medium px-2 py-1 rounded-[var(--radius-sm)] border transition-colors shrink-0',
            q.required
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100',
          )}
        >
          {q.required ? 'Required' : 'Optional'}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          title="Delete question"
        >
          <Trash size={15} />
        </button>
      </div>

      {/* Question text */}
      <input
        type="text"
        value={q.question}
        onChange={e => onUpdate({ ...q, question: e.target.value })}
        placeholder="Enter your question…"
        className={inputCls(!q.question)}
      />
      {!q.question && (
        <p className="text-xs text-rose-500 flex items-center gap-1"><Warning size={11} /> Question text is required</p>
      )}

      {/* Options editor (single/multiple choice & dichotomous) */}
      {typeCfg.hasOptions && q.options && (
        <div className="space-y-2 pl-1">
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'w-4 h-4 rounded shrink-0 border-2 border-slate-300',
                q.type === 'single_choice' ? 'rounded-full' : '',
              )} />
              <input
                type="text"
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm rounded-[var(--radius-sm)] border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={`Option ${i + 1}`}
                disabled={q.type === 'dichotomous'}
              />
              {q.type !== 'dichotomous' && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={(q.options?.length ?? 0) <= 2}
                  className="p-1 text-slate-300 hover:text-rose-500 disabled:opacity-30 transition-colors"
                >
                  <Trash size={13} />
                </button>
              )}
            </div>
          ))}
          {q.type !== 'dichotomous' && (
            <button
              type="button"
              onClick={addOption}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 ml-6 mt-1"
            >
              <Plus size={12} /> Add option
            </button>
          )}
        </div>
      )}

      {/* Rating scale preview */}
      {q.type === 'rating_scale' && (
        <div className="flex items-center gap-2 pl-1">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-400">
              {n}
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-1">Scale 1–5</span>
        </div>
      )}

      {/* Descriptive preview */}
      {q.type === 'descriptive' && (
        <div className="pl-1">
          <div className="h-16 rounded-[var(--radius-sm)] border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
            <span className="text-xs text-slate-400">Open text area — respondent types answer here</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function CreateSurveyPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([makeBlankQuestion('single_choice')]);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: { allocateAsTask: false },
  });

  const addQuestion = (type: QuestionType) => {
    setQuestions(prev => [...prev, makeBlankQuestion(type)]);
    setQuestionsError(null);
  };

  const updateQuestion = (index: number, updated: SurveyQuestion) => {
    setQuestions(prev => prev.map((q, i) => i === index ? updated : q));
  };

  const deleteQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, dir: 'up' | 'down') => {
    setQuestions(prev => {
      const next = [...prev];
      const swap = dir === 'up' ? index - 1 : index + 1;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  };

  const onSubmit = async (meta: MetaFormData) => {
    // Validate questions
    if (questions.length === 0) {
      setQuestionsError('Add at least one question before publishing.');
      return;
    }
    const emptyQ = questions.find(q => !q.question.trim());
    if (emptyQ) {
      setQuestionsError('All questions must have text before publishing.');
      return;
    }
    setQuestionsError(null);
    setSubmitting(true);

    try {
      await surveysApi.create({
        title: meta.title,
        description: meta.description,
        questions,
      });
      setSuccess(true);
      toast.success('Survey published successfully!');
      setTimeout(() => router.push('/pc/surveys'), 1200);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish survey');
    } finally {
      setSubmitting(false);
    }
  };

  const title = watch('title');

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/pc/surveys" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Create Survey</h1>
          <p className="text-sm text-slate-500 mt-0.5">Build a survey to collect information from your Fellows and Interns</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(p => !p)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-[var(--radius)] hover:bg-slate-50 transition-colors"
        >
          {showPreview ? <EyeSlash size={16} /> : <Eye size={16} />}
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-[var(--radius)] bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle className="text-emerald-500 shrink-0" size={18} weight="fill" />
          <p className="text-sm text-emerald-700 font-medium">Survey published! Redirecting…</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Survey meta */}
        <div className="card p-5 space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Survey Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Block Livelihood Survey — Q3 2026"
              className={inputCls(!!errors.title)}
            />
            {errors.title && <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1"><Warning size={11} />{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Brief description of what this survey collects…"
              className={inputCls()}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register('allocateAsTask')}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Allocate as Task</span>
              <p className="text-xs text-slate-400 mt-0.5">Creates a mandatory task for each respondent to complete this survey</p>
            </div>
          </label>
        </div>

        {/* Questions */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Questions <span className="text-slate-400 font-normal text-sm">({questions.length})</span>
            </h2>
          </div>

          {questions.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-sm text-slate-500">No questions yet. Add your first question below.</p>
            </div>
          )}

          {!showPreview ? (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  total={questions.length}
                  onUpdate={updated => updateQuestion(i, updated)}
                  onDelete={() => deleteQuestion(i)}
                  onMove={dir => moveQuestion(i, dir)}
                />
              ))}
            </div>
          ) : (
            /* Preview mode */
            <div className="card p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{title || 'Survey Title'}</h2>
                {watch('description') && <p className="text-sm text-slate-500 mt-1">{watch('description')}</p>}
              </div>
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium text-slate-800">
                    {i + 1}. {q.question || <span className="text-slate-400 italic">Untitled question</span>}
                    {q.required && <span className="text-rose-500 ml-1">*</span>}
                  </p>
                  {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'dichotomous') && q.options?.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 ml-2">
                      <div className={cn('w-4 h-4 border-2 border-slate-300 shrink-0', q.type === 'single_choice' || q.type === 'dichotomous' ? 'rounded-full' : 'rounded')} />
                      <span className="text-sm text-slate-700">{opt}</span>
                    </div>
                  ))}
                  {q.type === 'rating_scale' && (
                    <div className="flex gap-2 ml-2">
                      {[1,2,3,4,5].map(n => <div key={n} className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-400">{n}</div>)}
                    </div>
                  )}
                  {q.type === 'descriptive' && (
                    <div className="ml-2 h-14 rounded-[var(--radius-sm)] border border-dashed border-slate-300 bg-slate-50" />
                  )}
                </div>
              ))}
            </div>
          )}

          {questionsError && (
            <p className="text-sm text-rose-600 flex items-center gap-1.5"><Warning size={14} />{questionsError}</p>
          )}
        </div>

        {/* Add question buttons */}
        {!showPreview && (
          <div className="card p-4 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Question</p>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addQuestion(type)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  <Icon size={14} weight="fill" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/pc/surveys"
            className="flex-1 text-center py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            id="publish-survey-btn"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press disabled:opacity-60 transition-all"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Publish Survey
          </button>
        </div>
      </form>
    </div>
  );
}
