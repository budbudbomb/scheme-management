'use client';

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Warning, Trash, ClipboardText, Checks, CheckCircle, CheckSquare, MagnifyingGlass, X, FunnelSimple, MapPin, CaretRight, UsersThree } from '@phosphor-icons/react';
import { usersApi } from '@/lib/api/users';
import { tasksApi } from '@/lib/api/tasks';
import { surveysApi } from '@/lib/api/surveys';
import type { User, Survey, Division, District, Block, GramPanchayat } from '@/types/models';
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

  // Location Hierarchy lists & filters
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [gramPanchayats, setGramPanchayats] = useState<GramPanchayat[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedGP, setSelectedGP] = useState<string>('');
  const [activeGroup, setActiveGroup] = useState<'intern' | 'fellow' | 'pc' | 'area' | null>(null);
  const [areaStep, setAreaStep] = useState<'division' | 'district' | 'block' | 'gp' | 'completed'>('division');

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
    usersApi.getDivisions().then(setDivisions).catch(console.error);
    usersApi.getDistricts().then(setDistricts).catch(console.error);
    usersApi.getBlocks().then(setBlocks).catch(console.error);
    usersApi.getGramPanchayats().then(setGramPanchayats).catch(console.error);
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

  // Cascading location options for Area drill-down
  const currentDivisionDistricts = selectedDivision
    ? districts.filter(d => d.divisionId === selectedDivision)
    : [];

  const currentDistrictBlocks = selectedDistrict
    ? blocks.filter(b => b.districtId === selectedDistrict)
    : [];

  const currentBlockGPs = selectedBlock
    ? gramPanchayats.filter(gp => gp.blockId === selectedBlock)
    : [];

  const handleSelectEntireDivision = (d: Division) => {
    setSelectedDivision(d.id);
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedGP('');
    setAreaStep('completed');
  };

  const handleDrillDownDivision = (d: Division) => {
    setSelectedDivision(d.id);
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedGP('');
    setAreaStep('district');
  };

  const handleSelectEntireDistrict = (dst: District) => {
    setSelectedDistrict(dst.id);
    setSelectedBlock('');
    setSelectedGP('');
    setAreaStep('completed');
  };

  const handleDrillDownDistrict = (dst: District) => {
    setSelectedDistrict(dst.id);
    setSelectedBlock('');
    setSelectedGP('');
    setAreaStep('block');
  };

  const handleSelectEntireBlock = (blk: Block) => {
    setSelectedBlock(blk.id);
    setSelectedGP('');
    setAreaStep('completed');
  };

  const handleDrillDownBlock = (blk: Block) => {
    setSelectedBlock(blk.id);
    setSelectedGP('');
    setAreaStep('gp');
  };

  const handleSelectGP = (gp: GramPanchayat) => {
    setSelectedGP(gp.id);
    setAreaStep('completed');
  };

  const resetAreaSelection = () => {
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedGP('');
    setAreaStep('division');
  };

  const getHierarchyBreadcrumb = (): string => {
    const parts: string[] = [];
    if (selectedDivision) {
      const d = divisions.find(item => item.id === selectedDivision);
      if (d) parts.push(d.name.replace(/\s+Division$/i, ''));
    }
    if (selectedDistrict) {
      const dst = districts.find(item => item.id === selectedDistrict);
      if (dst) parts.push(dst.name);
    }
    if (selectedBlock) {
      const b = blocks.find(item => item.id === selectedBlock);
      if (b) parts.push(b.name);
    }
    if (selectedGP) {
      const gp = gramPanchayats.find(item => item.id === selectedGP);
      if (gp) parts.push(gp.name);
    }
    return parts.join(' > ');
  };

  const userMatchesLocation = (u: User) => {
    if (!selectedDivision && !selectedDistrict && !selectedBlock && !selectedGP) {
      return true;
    }
    if (selectedGP) {
      return u.gramPanchayat?.id === selectedGP;
    }
    if (selectedBlock) {
      return u.block?.id === selectedBlock || u.gramPanchayat?.blockId === selectedBlock;
    }
    if (selectedDistrict) {
      return (
        u.district?.id === selectedDistrict ||
        u.block?.districtId === selectedDistrict
      );
    }
    if (selectedDivision) {
      const divDistrictIds = new Set(districts.filter(d => d.divisionId === selectedDivision).map(d => d.id));
      return (
        u.division?.id === selectedDivision ||
        (u.district?.divisionId && u.district.divisionId === selectedDivision) ||
        (u.district?.id && divDistrictIds.has(u.district.id)) ||
        (u.block?.districtId && divDistrictIds.has(u.block.districtId))
      );
    }
    return true;
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      !userSearch.trim() ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole =
      roleFilter === 'all'
        ? (activeGroup === 'intern'
            ? u.role === 'intern'
            : activeGroup === 'fellow'
            ? u.role === 'fellow'
            : activeGroup === 'pc'
            ? u.role === 'pc'
            : true)
        : u.role === roleFilter;

    const matchesLocation = userMatchesLocation(u);
    return matchesSearch && matchesRole && matchesLocation;
  });

  const hasActiveLocation = !!(selectedDivision || selectedDistrict || selectedBlock || selectedGP);

  const selectAllCurrentGroup = () => {
    const existingIds = new Set(selectedUsers.map(u => u.id));
    const newUsers = filteredUsers.filter(u => !existingIds.has(u.id));
    const updated = [...selectedUsers, ...newUsers];
    setSelectedUsers(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
    toast.success(`Added ${newUsers.length} assignees to selection`);
  };

  const isAllCurrentGroupSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every(u => selectedUsers.some(s => s.id === u.id));

  const deselectCurrentGroup = () => {
    const currentIds = new Set(filteredUsers.map(u => u.id));
    const updated = selectedUsers.filter(u => !currentIds.has(u.id));
    setSelectedUsers(updated);
    setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
  };

  const getUserLocationText = (u: User): string => {
    const parts: string[] = [];
    if (u.gramPanchayat?.name) {
      parts.push(`${u.gramPanchayat.name} GP`);
    }
    if (u.block?.name) {
      parts.push(`${u.block.name} Block`);
    }
    if (u.district?.name) {
      parts.push(u.district.name);
    } else if (u.block?.districtName) {
      parts.push(u.block.districtName);
    }
    if (u.division?.name) {
      parts.push(u.division.name);
    } else if (u.district?.divisionName) {
      parts.push(u.district.divisionName);
    }
    return parts.length > 0 ? parts.join(' · ') : 'State-wide / Unassigned';
  };

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

  const internCount = users.filter(u => u.role === 'intern').length;
  const fellowCount = users.filter(u => u.role === 'fellow').length;
  const pcCount = users.filter(u => u.role === 'pc').length;


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

            <div className="space-y-4 sm:space-y-5">
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

              {/* Start Date and End Date side by side */}
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 truncate">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={watchStartDate}
                    onChange={e => setValue('startDate', e.target.value, { shouldValidate: true })}
                    className={inputCls(!!errors.startDate)}
                  />
                  {errors.startDate && <p className="mt-1 text-[11px] text-rose-600">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 truncate">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={watchEndDate}
                    onChange={e => setValue('endDate', e.target.value, { shouldValidate: true })}
                    className={inputCls(!!errors.endDate)}
                  />
                  {errors.endDate && <p className="mt-1 text-[11px] text-rose-600">{errors.endDate.message}</p>}
                </div>
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
          <div className="card p-4 sm:p-8 space-y-4 sm:space-y-6 border border-slate-200/80 shadow-xs bg-white animate-in fade-in duration-200">

            <div className="border-b border-slate-100 pb-2.5 sm:pb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {cameFromSurvey || isSurveyTask ? 'Step 2: Select Assignees' : 'Step 4: Select Assignees'}
                </h2>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
                  Assign this task to Interns, Fellows, or Program Coordinators across districts
                </p>
              </div>
              <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {selectedUsers.length} Selected
              </span>
            </div>

            {/* ── Compact Assignee Controls: Bulk Add Buttons + Search & Filter Dropdown ── */}
            <div className="space-y-2.5 pt-0.5">
              {/* Row 1: Glowing Category & Area Buttons (Horizontal scrollable track on mobile) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1">
                <span className="text-xs font-semibold text-slate-500 shrink-0 hidden sm:inline">Select:</span>
                
                {/* All Interns Button */}
                <button
                  type="button"
                  onClick={() => setActiveGroup(prev => prev === 'intern' ? null : 'intern')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95',
                    activeGroup === 'intern'
                      ? 'bg-indigo-600 text-white border border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.55)] ring-2 ring-indigo-400 ring-offset-1 font-bold scale-[1.02]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-semibold'
                  )}
                >
                  <Checks size={14} className={activeGroup === 'intern' ? 'text-white' : 'text-indigo-600'} weight="bold" />
                  <span>All Interns</span>
                </button>

                {/* All Fellows Button */}
                <button
                  type="button"
                  onClick={() => setActiveGroup(prev => prev === 'fellow' ? null : 'fellow')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95',
                    activeGroup === 'fellow'
                      ? 'bg-purple-600 text-white border border-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.55)] ring-2 ring-purple-400 ring-offset-1 font-bold scale-[1.02]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-semibold'
                  )}
                >
                  <Checks size={14} className={activeGroup === 'fellow' ? 'text-white' : 'text-purple-600'} weight="bold" />
                  <span>All Fellows</span>
                </button>

                {/* All PCs Button */}
                <button
                  type="button"
                  onClick={() => setActiveGroup(prev => prev === 'pc' ? null : 'pc')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95',
                    activeGroup === 'pc'
                      ? 'bg-amber-600 text-white border border-amber-500 shadow-[0_0_16px_rgba(217,119,6,0.55)] ring-2 ring-amber-400 ring-offset-1 font-bold scale-[1.02]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-semibold'
                  )}
                >
                  <Checks size={14} className={activeGroup === 'pc' ? 'text-white' : 'text-amber-600'} weight="bold" />
                  <span>All PCs</span>
                </button>

                {/* Single Area Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (activeGroup === 'area') {
                      setActiveGroup(null);
                    } else {
                      setActiveGroup('area');
                      if (!selectedDivision && !selectedDistrict && !selectedBlock && !selectedGP) {
                        setAreaStep('division');
                      }
                    }
                  }}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95',
                    activeGroup === 'area'
                      ? 'bg-emerald-600 text-white border border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.55)] ring-2 ring-emerald-400 ring-offset-1 font-bold scale-[1.02]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-semibold'
                  )}
                >
                  <MapPin size={14} className={activeGroup === 'area' ? 'text-white' : 'text-emerald-600'} weight="bold" />
                  <span>Area</span>
                </button>

                {/* Clear Selection Button */}
                {selectedUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUsers([]);
                      setValue('assignedToIds', [], { shouldValidate: true });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shrink-0 active:scale-95 ml-auto sm:ml-0"
                  >
                    Clear ({selectedUsers.length})
                  </button>
                )}
              </div>

              {/* Row 2: Expanded Search Bar + Icon-Only Filter Dropdown */}
              <div className="flex items-center gap-2">
                {/* Search Input (Expanded length) */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MagnifyingGlass size={16} weight="bold" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search assignees by name or email…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className={cn(inputCls(), 'pl-10 h-10 text-xs sm:text-sm bg-white w-full shadow-2xs')}
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  )}
                </div>

                {/* Filter Button (Icon-Only) with Native Select Overlay */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-[var(--radius)] border flex items-center justify-center transition-colors shadow-2xs',
                      roleFilter !== 'all'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <FunnelSimple size={18} weight={roleFilter !== 'all' ? 'bold' : 'regular'} />
                    {roleFilter !== 'all' && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                    )}
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    aria-label="Filter assignees by role"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    <option value="intern">Interns ({internCount})</option>
                    <option value="fellow">Fellows ({fellowCount})</option>
                    <option value="pc">PCs ({pcCount})</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── CONDITIONAL CONTENT ── */}

            {/* CASE 1: Area Hierarchy Drill-Down Navigation (Division -> District -> Block -> GP) */}
            {activeGroup === 'area' && areaStep !== 'completed' && (
              <div className="border border-emerald-200 rounded-xl bg-white shadow-2xs overflow-hidden animate-in fade-in duration-200">
                {/* Navigation & Breadcrumb Header */}
                <div className="p-3 sm:p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border-b border-emerald-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    {areaStep !== 'division' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (areaStep === 'district') {
                            setAreaStep('division');
                            setSelectedDivision('');
                          } else if (areaStep === 'block') {
                            setAreaStep('district');
                            setSelectedDistrict('');
                          } else if (areaStep === 'gp') {
                            setAreaStep('block');
                            setSelectedGP('');
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-emerald-200/70 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold shrink-0"
                      >
                        <ArrowLeft size={13} weight="bold" />
                        <span className="hidden sm:inline">Back</span>
                      </button>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold truncate">
                        <span>Area</span>
                        {selectedDivision && (
                          <>
                            <CaretRight size={11} className="text-slate-400 shrink-0" weight="bold" />
                            <span className="text-slate-700 truncate">{divisions.find(d => d.id === selectedDivision)?.name.replace(/\s+Division$/i, '')}</span>
                          </>
                        )}
                        {selectedDistrict && (
                          <>
                            <CaretRight size={11} className="text-slate-400 shrink-0" weight="bold" />
                            <span className="text-slate-700 truncate">{districts.find(d => d.id === selectedDistrict)?.name}</span>
                          </>
                        )}
                        {selectedBlock && (
                          <>
                            <CaretRight size={11} className="text-slate-400 shrink-0" weight="bold" />
                            <span className="text-slate-700 truncate">{blocks.find(b => b.id === selectedBlock)?.name}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                        {areaStep === 'division' && 'Select Division'}
                        {areaStep === 'district' && `Select District in ${divisions.find(d => d.id === selectedDivision)?.name}`}
                        {areaStep === 'block' && `Select Block in ${districts.find(d => d.id === selectedDistrict)?.name}`}
                        {areaStep === 'gp' && `Select Gram Panchayat in ${blocks.find(b => b.id === selectedBlock)?.name}`}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200 shrink-0">
                    {areaStep === 'division' && `${divisions.length} Divisions`}
                    {areaStep === 'district' && `${currentDivisionDistricts.length} Districts`}
                    {areaStep === 'block' && `${currentDistrictBlocks.length} Blocks`}
                    {areaStep === 'gp' && `${currentBlockGPs.length} Gram Panchayats`}
                  </span>
                </div>

                {/* Hierarchy List Body */}
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                  {/* Level 1: Divisions */}
                  {areaStep === 'division' && divisions.map(d => (
                    <div key={d.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                          {d.code || d.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{d.name}</div>
                          <div className="text-[11px] text-slate-400">Division Level</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectEntireDivision(d)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
                        >
                          Entire Division
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDrillDownDivision(d)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs active:scale-95"
                        >
                          <span>Select District</span>
                          <CaretRight size={12} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Level 2: Districts */}
                  {areaStep === 'district' && (
                    currentDivisionDistricts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No districts configured for this division.
                      </div>
                    ) : (
                      currentDivisionDistricts.map(dst => (
                        <div key={dst.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100">
                              DST
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{dst.name}</div>
                              <div className="text-[11px] text-slate-400">District</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectEntireDistrict(dst)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
                            >
                              Entire District
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDrillDownDistrict(dst)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs active:scale-95"
                            >
                              <span>Select Block</span>
                              <CaretRight size={12} weight="bold" />
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {/* Level 3: Blocks */}
                  {areaStep === 'block' && (
                    currentDistrictBlocks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No blocks configured for this district.
                      </div>
                    ) : (
                      currentDistrictBlocks.map(blk => (
                        <div key={blk.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                              BLK
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{blk.name}</div>
                              <div className="text-[11px] text-slate-400">Block</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectEntireBlock(blk)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
                            >
                              Entire Block
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDrillDownBlock(blk)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer shadow-2xs active:scale-95"
                            >
                              <span>Select GP</span>
                              <CaretRight size={12} weight="bold" />
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {/* Level 4: Gram Panchayats */}
                  {areaStep === 'gp' && (
                    currentBlockGPs.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No Gram Panchayats configured for this block.
                      </div>
                    ) : (
                      currentBlockGPs.map(gp => (
                        <div key={gp.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 border border-violet-100">
                              GP
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{gp.name}</div>
                              <div className="text-[11px] text-slate-400">Gram Panchayat</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectGP(gp)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs active:scale-95"
                          >
                            Select GP
                          </button>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}

            {/* CASE 2: Active Assignees Display (When a category is active OR area selection is complete OR search is active) */}
            {((activeGroup && (activeGroup !== 'area' || areaStep === 'completed')) || userSearch.trim()) ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Header Banner for Completed Area */}
                {activeGroup === 'area' && areaStep === 'completed' && (
                  <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/50 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <MapPin size={18} weight="bold" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Selected Area Hierarchy</span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {getHierarchyBreadcrumb()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={resetAreaSelection}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
                      >
                        Change Area
                      </button>
                      {filteredUsers.length > 0 && (
                        <button
                          type="button"
                          onClick={isAllCurrentGroupSelected ? deselectCurrentGroup : selectAllCurrentGroup}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer active:scale-95"
                        >
                          {isAllCurrentGroupSelected ? `Deselect All (${filteredUsers.length})` : `+ Assign All in Area (${filteredUsers.length})`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Header Banner for Role Selection (Intern / Fellow / PC) */}
                {activeGroup && activeGroup !== 'area' && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700">
                      Showing {filteredUsers.length} {activeGroup === 'intern' ? 'Interns' : activeGroup === 'fellow' ? 'Fellows' : 'Program Coordinators'}
                    </span>
                    {filteredUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={isAllCurrentGroupSelected ? deselectCurrentGroup : selectAllCurrentGroup}
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs active:scale-95"
                      >
                        {isAllCurrentGroupSelected ? `Deselect All (${filteredUsers.length})` : `+ Assign All (${filteredUsers.length})`}
                      </button>
                    )}
                  </div>
                )}

                {/* Header Banner when only search is active */}
                {!activeGroup && userSearch.trim() && (
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-600 font-medium">
                    Found <span className="font-bold text-slate-900">{filteredUsers.length}</span> assignees matching &ldquo;{userSearch}&rdquo;
                  </div>
                )}

                {/* Assignee list with Checkboxes */}
                <div className="max-h-[340px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No assignees match your current selection or search filter
                    </div>
                  ) : (
                    filteredUsers.slice(0, 50).map(u => {
                      const isAdded = !!selectedUsers.find(s => s.id === u.id);
                      return (
                        <label
                          key={u.id}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors cursor-pointer select-none',
                            isAdded ? 'bg-indigo-50/70 text-indigo-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isAdded}
                            onChange={() => toggleUser(u)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            isAdded ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                          )}>
                            {u.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate text-slate-900 leading-snug">{u.name}</div>
                            <div className="text-xs text-slate-400 truncate">{u.email}</div>
                            {/* Display location details */}
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                              <MapPin size={11} className="text-indigo-500 shrink-0" weight="bold" />
                              <span className="truncate">{getUserLocationText(u)}</span>
                            </div>
                          </div>
                          <span className={cn(
                            'px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border capitalize',
                            u.role === 'intern'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : u.role === 'fellow'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'pc'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          )}>
                            {roleLabel(u.role)}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* CASE 3: Default State — List does NOT show up until a button is clicked or search is entered */
              activeGroup !== 'area' && (
                <div className="p-8 sm:p-12 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-2xs ring-4 ring-indigo-50/50">
                    <UsersThree size={24} weight="duotone" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Select an Assignee Category or Area</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                    Click <strong>All Interns</strong>, <strong>All Fellows</strong>, <strong>All PCs</strong>, or <strong>Area</strong> above to view and assign candidates.
                  </p>
                </div>
              )
            )}

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

        {/* Frozen Floating Bottom Navigation on Mobile (Above Floating Tab Bar) */}
        {mounted && createPortal(
          <div className="lg:hidden fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] left-3 right-3 max-w-lg mx-auto z-50 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2.5 shadow-xl">
            <div className="flex items-center gap-2.5">
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
