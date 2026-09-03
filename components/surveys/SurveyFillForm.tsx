'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Warning,
  ClipboardText,
  User,
  Phone,
  CalendarBlank,
  FileText,
  Paperclip,
  CheckCircle,
  ArrowRight,
  Sparkle,
  Plus,
} from '@phosphor-icons/react';
import type { Survey, SurveyQuestion } from '@/types/models';
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

  // ── Section 1: Stakeholder Details ──
  const [stakeholderName, setStakeholderName] = useState('');
  const [stakeholderContact, setStakeholderContact] = useState('');
  const [stakeholderLocation, setStakeholderLocation] = useState('');
  const [stakeholderCategory, setStakeholderCategory] = useState('Beneficiary');
  const [stakeholderErrors, setStakeholderErrors] = useState<{ name?: string }>({});

  // ── Section 2: Survey Answers ──
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const questions = survey.questions || [];

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  const handleToggleMultipleChoice = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || [];
    const next = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    handleAnswerChange(questionId, next);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const errors: Record<string, string> = {};
    const sErrors: { name?: string } = {};

    // Validate Section 1: Stakeholder Details
    if (!stakeholderName.trim()) {
      sErrors.name = 'Stakeholder Full Name is required';
      isValid = false;
    }
    setStakeholderErrors(sErrors);

    // Validate Section 2: Questions
    questions.forEach((q, idx) => {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') {
          errors[q.id] = `Question ${idx + 1} is required`;
          isValid = false;
        } else if (Array.isArray(val) && val.length === 0) {
          errors[q.id] = `Please select at least one option for question ${idx + 1}`;
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please complete all required fields and questions');
      return;
    }

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

      toast.success('Survey response recorded successfully!');
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
    setValidationErrors({});
    setStakeholderErrors({});
    setSubmittedSuccess(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Success Celebration View
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 sm:pb-20">
      {/* ── Top Header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push(backHref);
            }
          }}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight truncate">
              {survey.title}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
              Survey
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {survey.description || 'Record field survey response for respondent'}
          </p>
        </div>
      </div>

      {/* Survey Info Meta Strip */}
      <div className="card p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 flex-wrap text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} className="text-slate-400" />
          <span>Active Window: {formatDate(survey.startDate || '')} – {formatDate(survey.endDate || '')}</span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <ClipboardText size={16} className="text-indigo-600" />
          <span>{questions.length} Question{questions.length !== 1 ? 's' : ''}</span>
          {survey.participantsRequired && (
            <span className="text-slate-400">• Target: {survey.participantsRequired}</span>
          )}
        </div>
      </div>

      {/* Supporting Documents if available */}
      {survey.documents && survey.documents.length > 0 && (
        <div className="card p-3.5 sm:p-4 bg-indigo-50/40 border border-indigo-100 space-y-2">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1: STAKEHOLDER DETAILS
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 sm:p-7 space-y-5 border border-slate-200/90 shadow-xs bg-white">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Stakeholder Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Capture the profile information of the respondent or community member
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
                  placeholder="e.g. Rajesh Kumar Sharma"
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

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2: THE SURVEY ITSELF
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="card p-4 sm:p-5 border border-slate-200/80 shadow-xs bg-slate-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Survey Questionnaire</h2>
                <p className="text-xs text-slate-500">
                  Please answer all {questions.filter(q => q.required).length} required questions
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
              {Object.keys(answers).length} / {questions.length} Answered
            </span>
          </div>

          {/* Question Cards */}
          {questions.map((q, idx) => {
            const hasError = !!validationErrors[q.id];
            const answer = answers[q.id];

            return (
              <div
                key={q.id}
                className={cn(
                  'card p-5 sm:p-6 space-y-4 border transition-all bg-white',
                  hasError
                    ? 'border-rose-300 ring-1 ring-rose-200 shadow-xs'
                    : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                )}
              >
                {/* Question Title & Number */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        {q.question || 'Untitled Question'}
                        {q.required && <span className="text-rose-500 ml-1">*</span>}
                      </h3>
                    </div>
                  </div>
                  {answer !== undefined && answer !== null && answer !== '' && (
                    <span className="text-emerald-600 shrink-0 mt-0.5">
                      <CheckCircle size={18} weight="fill" />
                    </span>
                  )}
                </div>

                {/* Question Input Renderers */}
                {/* 1. Single Choice (Radio) */}
                {q.type === 'single_choice' && (
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt, optIdx) => {
                      const isSelected = answer === opt;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleAnswerChange(q.id, opt)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all select-none',
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-300 font-semibold text-indigo-950 shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-700'
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                          )}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="flex-1">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 2. Multiple Choice (Checkboxes) */}
                {q.type === 'multiple_choice' && (
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt, optIdx) => {
                      const currentSelected = (answer as string[]) || [];
                      const isSelected = currentSelected.includes(opt);
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleToggleMultipleChoice(q.id, opt)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all select-none',
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-300 font-semibold text-indigo-950 shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-700'
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                          )}>
                            {isSelected && <Check size={11} weight="bold" />}
                          </div>
                          <span className="flex-1">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 3. Likert Scale (5-points) */}
                {q.type === 'likert_scale' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((point) => {
                        const isSelected = answer === point;
                        const defaultLabels = ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];
                        const pointLabel = q.likertConfig?.labels?.[point - 1] || defaultLabels[point - 1];

                        return (
                          <button
                            key={point}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, point)}
                            className={cn(
                              'p-2 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1',
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                                : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700'
                            )}
                          >
                            <span className="text-base sm:text-lg font-bold">{point}</span>
                            <span className={cn(
                              'text-[10px] leading-tight line-clamp-2',
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
                {q.type === 'dichotomous' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {['Yes', 'No'].map((opt) => {
                      const isSelected = answer === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, opt)}
                          className={cn(
                            'p-3.5 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          {opt === 'Yes' ? <Check size={16} weight="bold" /> : null}
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 5. Descriptive Text */}
                {q.type === 'descriptive' && (
                  <div className="pt-1">
                    <textarea
                      rows={3}
                      placeholder={q.placeholder || 'Enter detailed response or field notes…'}
                      value={answer || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none hover:border-slate-300"
                    />
                  </div>
                )}

                {/* Validation message */}
                {hasError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <Warning size={13} weight="bold" /> {validationErrors[q.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={backHref}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 cursor-pointer btn-press disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting…</span>
              </>
            ) : (
              <>
                <span>Submit Response</span>
                <Check size={16} weight="bold" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
