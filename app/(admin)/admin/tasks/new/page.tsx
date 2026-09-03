'use client';

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Warning, Trash, ClipboardText, Checks, CheckCircle, CheckSquare } from '@phosphor-icons/react';
import { usersApi } from '@/lib/api/users';
import { tasksApi } from '@/lib/api/tasks';
import { surveysApi } from '@/lib/api/surveys';
import type { User, Survey } from '@/types/models';
import { cn, roleLabel } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Task name required'),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low'] as const),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  assignedToIds: z.array(z.string()).min(1, 'Assign to at least one user'),
  isSurveyTask: z.boolean().optional(),
  surveyId: z.string().optional(),
})
.refine(d => d.startDate <= d.endDate, { message: 'End date must be after start date', path: ['endDate'] })
.refine(d => !d.isSurveyTask || (d.isSurveyTask && !!d.surveyId), { message: 'Please select a survey', path: ['surveyId'] });

type FormData = z.infer<typeof schema>;

function inputCls(hasError?: boolean) {
  return cn(
    'w-full px-3.5 py-3 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow',
    hasError ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
  );
}

function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySurveyId = searchParams?.get('surveyId') || '';
  const querySurveyName = searchParams?.get('surveyName') || '';

  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'intern' | 'fellow' | 'pc'>('all');
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [isSurveyToggle, setIsSurveyToggle] = useState(false);
  const [surveyError, setSurveyError] = useState(false);
  const [cameFromSurvey, setCameFromSurvey] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', assignedToIds: [], isSurveyTask: false, surveyId: '' },
  });

  const isSurveyTask = watch('isSurveyTask');
  const watchPriority = watch('priority');
  const watchName = watch('name') || '';
  const watchDescription = watch('description') || '';
  const watchStartDate = watch('startDate') || '';
  const watchEndDate = watch('endDate') || '';
  const watchSurveyId = watch('surveyId') || '';

  useEffect(() => {
    usersApi.list({ limit: 100 }).then(res => setUsers(res.items)).catch(console.error);
    surveysApi.list({ limit: 100 }).then(res => setSurveys(res.items)).catch(console.error);
  }, []);

  // When coming directly from "Save & Allocate" in Survey: prefill & jump straight to Assignee step (Step 3)
  useEffect(() => {
    if (querySurveyId) {
      setCameFromSurvey(true);
      setIsSurveyToggle(true);
      setValue('isSurveyTask', true, { shouldValidate: true });
      setValue('surveyId', querySurveyId, { shouldValidate: true });
      if (querySurveyName) {
        setValue('name', querySurveyName, { shouldValidate: true });
      }

      const today = new Date().toISOString().split('T')[0];
      const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      setValue('startDate', today, { shouldValidate: true });
      setValue('endDate', twoWeeks, { shouldValidate: true });
      setValue('priority', 'medium', { shouldValidate: true });

      // Fetch survey details to populate exact name and survey timeline dates
      surveysApi.getById(querySurveyId).then(s => {
        if (s) {
          setValue('name', s.title, { shouldValidate: true });
          if (s.startDate) setValue('startDate', s.startDate, { shouldValidate: true });
          if (s.endDate) setValue('endDate', s.endDate, { shouldValidate: true });
        }
      }).catch(() => {});

      // DIRECTLY take the user to the last step: selecting assignee!
      setStep(3);
    }
  }, [querySurveyId, querySurveyName, setValue]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleUser = (user: User) => {
    const exists = selectedUsers.some(u => u.id === user.id);
    let updated: User[];
    if (exists) {
      updated = selectedUsers.filter(u => u.id !== user.id);
    } else {
      updated = [...selectedUsers, user];
    }
    setSelectedUsers(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const removeUser = (userId: string) => {
    const updated = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const selectAllByRole = (role: 'intern' | 'fellow' | 'pc' | 'all') => {
    const targetUsers = users.filter(u => role === 'all' || u.role === role);
    const existingIds = new Set(selectedUsers.map(u => u.id));
    const newUsers = targetUsers.filter(u => !existingIds.has(u.id));
    const updated = [...selectedUsers, ...newUsers];
    setSelectedUsers(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const handleNextFromStep1 = async () => {
    const isValid = await trigger(['name', 'isSurveyTask', 'surveyId']);
    if (isValid) setStep(2);
  };

  const handleNextFromStep2 = async () => {
    const isValid = await trigger(['startDate', 'endDate', 'priority']);
    if (isValid) setStep(3);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(cameFromSurvey ? 0 : 2);
    } else if (step === 2) {
      setStep(1);
    } else if (step === 1) {
      setStep(0);
    }
  };

  const handleNext = () => {
    if (step === 0) {
      if (isSurveyToggle) {
        if (!watchSurveyId) {
          setSurveyError(true);
          return;
        }
        setSurveyError(false);
        setCameFromSurvey(true);
        setValue('isSurveyTask', true, { shouldValidate: true });
        const s = surveys.find(item => item.id === watchSurveyId);
        if (s) {
          setValue('name', s.title, { shouldValidate: true });
        }
        if (!watchStartDate) {
          const today = new Date().toISOString().split('T')[0];
          const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
          setValue('startDate', today, { shouldValidate: true });
          setValue('endDate', twoWeeks, { shouldValidate: true });
        }
        setStep(3);
      } else {
        setCameFromSurvey(false);
        setValue('isSurveyTask', false, { shouldValidate: true });
        setValue('surveyId', '', { shouldValidate: true });
        setStep(1);
      }
    } else if (step === 1) {
      handleNextFromStep1();
    } else if (step === 2) {
      handleNextFromStep2();
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await tasksApi.create(data);
      toast.success('Task created and assigned successfully');
      router.push('/admin/tasks');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const renderRoleFiltersAndBulkActions = () => (
    <div className="space-y-3">
      {/* Role Filters */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600">Filter by Role</label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'intern', label: 'Interns' },
            { id: 'fellow', label: 'Fellows' },
            { id: 'pc', label: 'PCs' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleFilter(r.id as any)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                roleFilter === r.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Assign Actions */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-600">Bulk Assign</label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => selectAllByRole('intern')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center gap-1"
          >
            <Checks size={13} />
            + All Interns
          </button>
          <button
            type="button"
            onClick={() => selectAllByRole('fellow')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200 flex items-center gap-1"
          >
            <Checks size={13} />
            + All Fellows
          </button>
          <button
            type="button"
            onClick={() => selectAllByRole('pc')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200 flex items-center gap-1"
          >
            <Checks size={13} />
            + All PCs
          </button>
          {selectedUsers.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedUsers([]);
                setValue('assignedToIds', [], { shouldValidate: true });
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-36 lg:pb-12">
      {/* Header & Stepper Container */}
      <div className="sticky top-0 z-20 bg-[hsl(var(--color-bg))] backdrop-blur-md pt-1 pb-2.5 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:static lg:bg-transparent lg:p-0 lg:m-0 space-y-4 border-b border-slate-200/70 lg:border-none shadow-2xs lg:shadow-none">
        <div className="flex items-center gap-3">
          <Link
            href={cameFromSurvey ? '/admin/surveys' : '/admin/tasks'}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {cameFromSurvey ? 'Allocate Survey Task' : 'Create Task'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {cameFromSurvey
                ? `Deploy "${watchName || 'Survey'}" by selecting assignees below`
                : 'Assign a task to one or more users across the state'}
            </p>
          </div>
        </div>

        {/* Mobile Stepper UI - Frozen right under header */}
        <div className="block lg:hidden pt-0.5">
          <div className="flex items-center justify-between gap-1.5 px-0.5">
            {(cameFromSurvey || (step === 0 && isSurveyToggle)
              ? [{ key: 0 }, { key: 3 }]
              : [{ key: 0 }, { key: 1 }, { key: 2 }, { key: 3 }]
            ).map((s) => {
              const isCompleted = step > s.key || (cameFromSurvey && step === 3 && s.key === 0);
              const isActive = step === s.key;
              return (
                <div key={s.key} className="flex-1">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all duration-200',
                      isActive || isCompleted ? 'bg-indigo-600' : 'bg-slate-200'
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Stepper UI - Clean Segmented Cards matching Survey Builder */}
        <div
          className="hidden lg:grid gap-3"
          style={{
            gridTemplateColumns: (cameFromSurvey || (step === 0 && isSurveyToggle))
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(4, minmax(0, 1fr))'
          }}
        >
          {(cameFromSurvey || (step === 0 && isSurveyToggle)
            ? [
                { key: 0, num: 1, label: 'Survey Link', desc: watchName ? `Survey: ${watchName}` : 'Attach survey' },
                { key: 3, num: 2, label: 'Select Assignees', desc: `${selectedUsers.length} selected` },
              ]
            : [
                { key: 0, num: 1, label: 'Task Type', desc: isSurveyToggle ? 'Survey Task' : 'Standard Task' },
                { key: 1, num: 2, label: 'Task Details', desc: watchName || 'Name & context' },
                { key: 2, num: 3, label: 'Schedule', desc: watchStartDate && watchEndDate ? `${watchStartDate} – ${watchEndDate}` : 'Dates & priority' },
                { key: 3, num: 4, label: 'Select Assignees', desc: `${selectedUsers.length} selected` },
              ]
          ).map((s) => {
            const isCompleted = step > s.key || (cameFromSurvey && step === 3 && s.key === 0);
            const isActive = step === s.key;
            const isClickable = isCompleted || isActive;

            return (
              <button
                key={s.key}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) setStep(s.key as any);
                }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl text-left transition-all border shadow-xs',
                  isActive
                    ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold ring-1 ring-indigo-200'
                    : isCompleted
                    ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 cursor-pointer hover:bg-slate-50/50'
                    : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {isCompleted ? <Check size={14} weight="bold" /> : s.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate flex items-center gap-1.5 text-slate-900">
                    <span>{s.label}</span>
                    {isCompleted && <CheckCircle size={13} className="text-emerald-600 shrink-0" weight="fill" />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form id="create-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 0: Task Type */}
        {step === 0 && (
          <div className="card p-6 sm:p-8 space-y-6 border border-slate-200/80 shadow-xs bg-white animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Step 1: Task Type</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Choose whether this task requires field officers to complete a survey questionnaire, or is a standard task.
              </p>
            </div>

            {/* Type Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Standard Task Card */}
              <button
                type="button"
                onClick={() => {
                  setIsSurveyToggle(false);
                  setValue('isSurveyTask', false, { shouldValidate: true });
                  setValue('surveyId', '');
                  setSurveyError(false);
                }}
                className={cn(
                  'p-5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-4',
                  !isSurveyToggle
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  !isSurveyToggle ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                )}>
                  <CheckSquare size={22} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-sm">Standard Task</div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Create a regular field assignment, documentation, inspection, or review task.
                  </p>
                </div>
              </button>

              {/* Survey Task Card */}
              <button
                type="button"
                onClick={() => {
                  setIsSurveyToggle(true);
                  setValue('isSurveyTask', true, { shouldValidate: true });
                }}
                className={cn(
                  'p-5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-4',
                  isSurveyToggle
                    ? 'border-purple-600 bg-purple-50/40 shadow-xs ring-1 ring-purple-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  isSurveyToggle ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                )}>
                  <ClipboardText size={22} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-sm">Survey Task</div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Deploy an active survey questionnaire for respondents to fill and submit directly.
                  </p>
                </div>
              </button>
            </div>

            {/* If Survey Task is selected: Choose Survey dropdown */}
            {isSurveyToggle && (
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-3 animate-in fade-in duration-200">
                <label className="block text-sm font-bold text-purple-950">
                  Select Survey Questionnaire <span className="text-rose-500">*</span>
                </label>
                <select
                  value={watchSurveyId}
                  onChange={e => {
                    const val = e.target.value;
                    setValue('surveyId', val, { shouldValidate: true });
                    if (val) {
                      setSurveyError(false);
                      const found = surveys.find(s => s.id === val);
                      if (found) {
                        setValue('name', found.title, { shouldValidate: true });
                        if (found.startDate) setValue('startDate', found.startDate, { shouldValidate: true });
                        if (found.endDate) setValue('endDate', found.endDate, { shouldValidate: true });
                      }
                    }
                  }}
                  className={inputCls(surveyError)}
                >
                  <option value="">Choose an active survey to attach…</option>
                  {surveys.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                {surveyError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                    <Warning size={13} weight="bold" /> Please choose a survey to proceed
                  </p>
                )}
              </div>
            )}

            {/* Desktop Inline Action Bar */}
            <div className="hidden lg:flex items-center justify-between pt-5 border-t border-slate-100">
              <Link
                href={cameFromSurvey ? '/admin/surveys' : '/admin/tasks'}
                className="px-5 py-2.5 rounded-[var(--radius)] border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-[var(--radius)] bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 btn-press transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>{isSurveyToggle ? 'Next: Select Assignees' : 'Next: Task Details'}</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Task Details */}
        {step === 1 && (
          <div className="card p-6 sm:p-8 space-y-6 border border-slate-200/80 shadow-xs bg-white animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Step 2: Task Details</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Provide a clear task title and contextual instructions for assignees</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Task Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. District Field Survey Q3"
                value={watchName}
                onChange={e => setValue('name', e.target.value, { shouldValidate: true })}
                className={inputCls(!!errors.name)}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <Warning size={12} weight="bold" /> {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description (optional)
              </label>
              <textarea
                rows={4}
                placeholder="Add detailed task instructions, target requirements, or field directions…"
                value={watchDescription}
                onChange={e => setValue('description', e.target.value, { shouldValidate: true })}
                className={cn(inputCls(), 'resize-none')}
              />
            </div>

            {/* Desktop Inline Action Bar */}
            <div className="hidden lg:flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-[var(--radius)] border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-[var(--radius)] bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 btn-press transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Next: Schedule &amp; Priority</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Timeline & Priority */}
        {step === 2 && (
          <div className="card p-6 sm:p-8 space-y-6 border border-slate-200/80 shadow-xs bg-white animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Step 3: Schedule &amp; Priority</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Define the active timeline window and urgency level for completion</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  value={watchPriority}
                  onChange={e => setValue('priority', e.target.value as any, { shouldValidate: true })}
                  className={inputCls()}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={watchStartDate}
                  onChange={e => setValue('startDate', e.target.value, { shouldValidate: true })}
                  className={inputCls(!!errors.startDate)}
                />
                {errors.startDate && <p className="mt-1 text-xs text-rose-600">{errors.startDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={watchEndDate}
                  onChange={e => setValue('endDate', e.target.value, { shouldValidate: true })}
                  className={inputCls(!!errors.endDate)}
                />
                {errors.endDate && <p className="mt-1 text-xs text-rose-600">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Desktop Inline Action Bar */}
            <div className="hidden lg:flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-[var(--radius)] border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-[var(--radius)] bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 btn-press transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Next: Select Assignees</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ASSIGN USERS */}
        {step === 3 && (
          <div className="card p-6 sm:p-8 space-y-6 border border-slate-200/80 shadow-xs bg-white animate-in fade-in duration-200">

            <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {cameFromSurvey || isSurveyTask ? 'Step 2: Select Assignees' : 'Step 4: Select Assignees'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Assign this task to Interns, Fellows, or Program Coordinators across districts
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {selectedUsers.length} Selected
              </span>
            </div>

            {selectedUsers.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Users ({selectedUsers.length})</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedUsers.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-800 text-xs font-semibold shadow-2xs">
                      {u.name}
                      <button type="button" onClick={() => removeUser(u.id)} className="text-indigo-400 hover:text-rose-600 transition-colors cursor-pointer">
                        <Trash size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {renderRoleFiltersAndBulkActions()}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Search Assignees</label>
              <input
                type="search"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className={inputCls()}
              />
            </div>

            {/* Assignee list with Checkboxes */}
            <div className="max-h-[340px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              {filteredUsers.slice(0, 50).map(u => {
                const isAdded = !!selectedUsers.find(s => s.id === u.id);
                return (
                  <label
                    key={u.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors cursor-pointer select-none',
                      isAdded ? 'bg-indigo-50/70 text-indigo-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isAdded}
                      onChange={() => toggleUser(u)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-400">{roleLabel(u.role)}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {errors.assignedToIds && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <Warning size={13} weight="bold" /> {errors.assignedToIds.message}
              </p>
            )}

            {/* Desktop Inline Action Bar */}
            <div className="hidden lg:flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-[var(--radius)] border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-[var(--radius)] bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 btn-press transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>{cameFromSurvey || isSurveyTask ? 'Deploy Survey Task' : 'Create & Assign Task'}</span>
                <Check size={16} weight="bold" />
              </button>
            </div>
          </div>
        )}

        {/* Frozen Bottom Navigation on Mobile (Always visible) */}
        {mounted && createPortal(
          <div className="lg:hidden fixed bottom-[calc(52px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 shadow-lg">
            <div className="flex items-center gap-2.5 max-w-lg mx-auto">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-11 h-11 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center shrink-0 shadow-xs hover:bg-slate-50 cursor-pointer active:scale-95 transition-transform"
                  aria-label="Previous step"
                >
                  <ArrowLeft size={18} weight="bold" />
                </button>
              )}

              {step === 3 ? (
                <button
                  type="submit"
                  form="create-task-form"
                  id="mobile-create-task-submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 px-6 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-indigo-700 btn-press transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : cameFromSurvey || isSurveyTask ? 'Deploy Survey Task' : 'Save & Assign Task'}
                  <Check size={16} weight="bold" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-11 px-6 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-indigo-700 btn-press transition-colors cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
      </form>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-8 text-center text-slate-400">Loading task assignment...</div>}>
      <NewTaskForm />
    </Suspense>
  );
}
