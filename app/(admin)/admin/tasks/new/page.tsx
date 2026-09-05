'use client';

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Warning, Trash, ClipboardText, Checks, CheckCircle, CheckSquare, MagnifyingGlass, X, FunnelSimple, MapPin, CaretRight, UsersThree, Users, UserCheck } from '@phosphor-icons/react';
import { usersApi } from '@/lib/api/users';
import { tasksApi } from '@/lib/api/tasks';
import { surveysApi } from '@/lib/api/surveys';
import type { User, Survey, Division, District, Block, GramPanchayat, Village } from '@/types/models';
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

  const [step, setStep] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isSurveyToggle, setIsSurveyToggle] = useState<boolean>(false);
  const [surveyError, setSurveyError] = useState<boolean>(false);
  const [cameFromSurvey, setCameFromSurvey] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'intern' | 'fellow' | 'pc'>('all');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [gramPanchayats, setGramPanchayats] = useState<GramPanchayat[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedGP, setSelectedGP] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'role' | 'area'>('role');
  const [roleGroup, setRoleGroup] = useState<'intern' | 'fellow' | 'pc' | null>('intern');
  const [areaStep, setAreaStep] = useState<'division' | 'district' | 'block' | 'gp' | 'village' | 'person' | 'completed'>('division');
  const [stoppedLevelName, setStoppedLevelName] = useState<string>('');
  const [checkedAreaItem, setCheckedAreaItem] = useState<string | null>(null);

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
    usersApi.getVillages().then(setVillages).catch(console.error);
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

  const currentGPVillages = selectedGP
    ? villages.filter(v => v.gramPanchayatId === selectedGP)
    : [];

  // Stop at Division Level
  const handleSelectEntireDivision = (d: Division) => {
    setSelectedDivision(d.id);
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedGP('');
    setSelectedVillage('');
    setStoppedLevelName(`Division: ${d.name}`);
    setCheckedAreaItem(null);

    const divDistrictIds = new Set(districts.filter(dist => dist.divisionId === d.id).map(dist => dist.id));
    const matched = users.filter(u =>
      u.division?.id === d.id ||
      (u.district && divDistrictIds.has(u.district.id)) ||
      (u.block && districts.some(dist => dist.id === u.block?.districtId && dist.divisionId === d.id))
    );
    if (matched.length > 0) {
      setSelectedUsers(matched);
      setValue('assignedToIds', matched.map(m => m.id), { shouldValidate: true });
    }
    setAreaStep('completed');
  };

  const handleDrillDownDivision = (d: Division) => {
    setSelectedDivision(d.id);
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedGP('');
    setSelectedVillage('');
    setCheckedAreaItem(null);
    setAreaStep('district');
  };

  // Stop at District Level
  const handleSelectEntireDistrict = (dst: District) => {
    setSelectedDistrict(dst.id);
    setSelectedBlock('');
    setSelectedGP('');
    setSelectedVillage('');
    setStoppedLevelName(`District: ${dst.name}`);
    setCheckedAreaItem(null);

    const matched = users.filter(u =>
      u.district?.id === dst.id ||
      u.block?.districtId === dst.id
    );
    if (matched.length > 0) {
      setSelectedUsers(matched);
      setValue('assignedToIds', matched.map(m => m.id), { shouldValidate: true });
    }
    setAreaStep('completed');
  };

  const handleDrillDownDistrict = (dst: District) => {
    setSelectedDistrict(dst.id);
    setSelectedBlock('');
    setSelectedGP('');
    setSelectedVillage('');
    setCheckedAreaItem(null);
    setAreaStep('block');
  };

  // Stop at Block Level
  const handleSelectEntireBlock = (blk: Block) => {
    setSelectedBlock(blk.id);
    setSelectedGP('');
    setSelectedVillage('');
    setStoppedLevelName(`Block: ${blk.name}`);
    setCheckedAreaItem(null);

    const matched = users.filter(u =>
      u.block?.id === blk.id ||
      u.gramPanchayat?.blockId === blk.id ||
      u.village?.blockId === blk.id
    );
    if (matched.length > 0) {
      setSelectedUsers(matched);
      setValue('assignedToIds', matched.map(m => m.id), { shouldValidate: true });
    }
    setAreaStep('completed');
  };

  const handleDrillDownBlock = (blk: Block) => {
    setSelectedBlock(blk.id);
    setSelectedGP('');
    setSelectedVillage('');
    setCheckedAreaItem(null);
    setAreaStep('gp');
  };

  // Stop at Gram Panchayat Level
  const handleSelectEntireGP = (gp: GramPanchayat) => {
    setSelectedGP(gp.id);
    setSelectedVillage('');
    setStoppedLevelName(`Gram Panchayat: ${gp.name}`);
    setCheckedAreaItem(null);

    const matched = users.filter(u =>
      u.gramPanchayat?.id === gp.id ||
      u.village?.gramPanchayatId === gp.id
    );
    if (matched.length > 0) {
      setSelectedUsers(matched);
      setValue('assignedToIds', matched.map(m => m.id), { shouldValidate: true });
    }
    setAreaStep('completed');
  };

  const handleDrillDownGP = (gp: GramPanchayat) => {
    setSelectedGP(gp.id);
    setSelectedVillage('');
    setCheckedAreaItem(null);
    setAreaStep('village');
  };

  // Stop at Village Level
  const handleSelectEntireVillage = (v: Village) => {
    setSelectedVillage(v.id);
    setStoppedLevelName(`Village: ${v.name}`);
    setCheckedAreaItem(null);

    const matched = users.filter(u => u.village?.id === v.id);
    if (matched.length > 0) {
      setSelectedUsers(matched);
      setValue('assignedToIds', matched.map(m => m.id), { shouldValidate: true });
    }
    setAreaStep('completed');
  };

  const handleDrillDownVillage = (v: Village) => {
    setSelectedVillage(v.id);
    setStoppedLevelName(`Person in ${v.name}`);
    setCheckedAreaItem(null);
    setAreaStep('person');
  };

  const handleSelectPerson = (person: User) => {
    setCheckedAreaItem(null);
    setStoppedLevelName(`Person: ${person.name}`);
    const exists = selectedUsers.some(u => u.id === person.id);
    if (!exists) {
      const updated = [...selectedUsers, person];
      setSelectedUsers(updated);
      setValue('assignedToIds', updated.map(u => u.id), { shouldValidate: true });
    }
    setAreaStep('completed');
  };

  const resetAreaSelection = () => {
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedGP('');
    setSelectedVillage('');
    setStoppedLevelName('');
    setCheckedAreaItem(null);
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
    if (selectedVillage) {
      const v = villages.find(item => item.id === selectedVillage);
      if (v) parts.push(v.name);
    }
    return parts.join(' > ');
  };

  const userMatchesLocation = (u: User) => {
    if (!selectedDivision && !selectedDistrict && !selectedBlock && !selectedGP && !selectedVillage) {
      return true;
    }
    if (selectedVillage) {
      return u.village?.id === selectedVillage;
    }
    if (selectedGP) {
      return u.gramPanchayat?.id === selectedGP || u.village?.gramPanchayatId === selectedGP;
    }
    if (selectedBlock) {
      return (
        u.block?.id === selectedBlock ||
        u.gramPanchayat?.blockId === selectedBlock ||
        u.village?.blockId === selectedBlock
      );
    }
    if (selectedDistrict) {
      return (
        u.district?.id === selectedDistrict ||
        u.block?.districtId === selectedDistrict ||
        (u.division && districts.some(d => d.id === selectedDistrict && d.divisionId === u.division?.id))
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
      assignmentMode === 'role'
        ? (roleFilter !== 'all'
            ? u.role === roleFilter
            : (roleGroup === 'intern'
                ? u.role === 'intern'
                : roleGroup === 'fellow'
                ? u.role === 'fellow'
                : roleGroup === 'pc'
                ? u.role === 'pc'
                : true))
        : true;

    const matchesLocation = assignmentMode === 'area' ? userMatchesLocation(u) : true;
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
    if (u.village?.name) {
      parts.push(`${u.village.name} Village`);
    }
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


  return (    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6 pb-36 lg:pb-12">
      {/* Header Container */}
      <div className="sticky top-0 z-20 bg-[hsl(var(--color-bg))] backdrop-blur-md pt-0.5 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:static lg:bg-transparent lg:p-0 lg:m-0 border-b border-slate-200/70 lg:border-none shadow-2xs lg:shadow-none">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href={cameFromSurvey ? '/admin/surveys' : '/admin/tasks'}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight truncate">
              {cameFromSurvey ? 'Allocate Survey Task' : 'Create Task'}
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 truncate">
              {cameFromSurvey
                ? `Deploy "${watchName || 'Survey'}" by selecting assignees below`
                : 'Assign a task to one or more users across the state'}
            </p>
          </div>
        </div>

        {/* Mobile Stepper UI - Frozen right under header */}
        <div className="block lg:hidden pt-1.5 sm:pt-2">
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
      </div>

      {/* Desktop Stepper UI - Clean Segmented Cards with distinct gap */}
      <div
        className="hidden lg:grid gap-3.5 mb-8"
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

      <form id="create-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* STEP 0: Task Type */}
        {step === 0 && (
          <div className="card p-3.5 sm:p-8 space-y-3 sm:space-y-6 border border-slate-200/80 shadow-xs bg-white animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-2.5 sm:pb-4">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900">Step 1: Task Type</h2>
              <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">
                <span className="sm:hidden">Select the type of assignment for field officers</span>
                <span className="hidden sm:inline">Choose whether this task requires field officers to complete a survey questionnaire, or is a standard task.</span>
              </p>
            </div>

            {/* Type Selection Cards */}
            <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
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
                  'w-full p-3 sm:p-5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center sm:items-start gap-3 sm:gap-4',
                  !isSurveyToggle
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  !isSurveyToggle ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                )}>
                  <CheckSquare size={20} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">Standard Task</span>
                    <div className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 sm:hidden',
                      !isSurveyToggle ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    )}>
                      {!isSurveyToggle && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                    <span className="sm:hidden">Field assignment, documentation & review</span>
                    <span className="hidden sm:inline">Create a regular field assignment, documentation, inspection, or review task.</span>
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
                  'w-full p-3 sm:p-5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center sm:items-start gap-3 sm:gap-4',
                  isSurveyToggle
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  isSurveyToggle ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                )}>
                  <ClipboardText size={20} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">Survey Task</span>
                    <div className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 sm:hidden',
                      isSurveyToggle ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                    )}>
                      {isSurveyToggle && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                    <span className="sm:hidden">Deploy questionnaires for field responses</span>
                    <span className="hidden sm:inline">Deploy an active survey questionnaire for respondents to fill and submit directly.</span>
                  </p>
                </div>
              </button>
            </div>

            {/* If Survey Task is selected: Choose Survey dropdown */}
            {isSurveyToggle && (
              <div className="p-3 sm:p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-2 sm:space-y-3 animate-in fade-in duration-200">
                <label className="block text-xs sm:text-sm font-bold text-purple-950">
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
                  className={cn(inputCls(surveyError), 'text-xs sm:text-sm py-2')}
                >
                  <option value="">Choose an active survey to attach…</option>
                  {surveys.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                {surveyError && (
                  <p className="text-[11px] sm:text-xs text-rose-600 mt-1 flex items-center gap-1 font-semibold">
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
          <div className="space-y-3 sm:space-y-6 sm:card sm:p-8 sm:border sm:border-slate-200/80 sm:shadow-xs sm:bg-white animate-in fade-in duration-200 pb-28 sm:pb-8">

            <div className="border-b border-slate-200/80 sm:border-slate-100 pb-2 sm:pb-4 flex items-center justify-between flex-wrap gap-2 px-0.5 sm:px-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {cameFromSurvey || isSurveyTask ? 'Step 2: Select Assignees' : 'Step 4: Select Assignees'}
                </h2>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
                  Assign this task role-wise or geographically by division, district, block, gram panchayat, village, or a specific person
                </p>
              </div>
              <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                {selectedUsers.length} Selected
              </span>
            </div>

            {/* ── CARD 1 (MOBILE): FILTERS CARD ── */}
            <div className="card p-3 sm:p-0 sm:border-0 sm:shadow-none sm:bg-transparent bg-white border border-slate-200/80 shadow-xs rounded-2xl space-y-3 sm:space-y-4">
              {/* Assignment Mode Selector: Role-Wise vs Area-Wise */}
              <div className="bg-slate-100/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/90 grid grid-cols-2 gap-1.5">
                {/* Tab 1: Role-Wise */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode('role');
                    if (!roleGroup) setRoleGroup('intern');
                  }}
                  className={cn(
                    'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none',
                    assignmentMode === 'role'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 ring-1 ring-slate-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                    assignmentMode === 'role' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
                  )}>
                    <Users size={14} weight="bold" />
                  </div>
                  <span>Role-Wise</span>
                </button>

                {/* Tab 2: Area-Wise */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode('area');
                    if (areaStep !== 'completed' && !selectedDivision) {
                      setAreaStep('division');
                      setCheckedAreaItem(null);
                    }
                  }}
                  className={cn(
                    'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none',
                    assignmentMode === 'area'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 ring-1 ring-slate-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                    assignmentMode === 'area' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
                  )}>
                    <MapPin size={14} weight="bold" />
                  </div>
                  <span>Area-Wise</span>
                </button>
              </div>

              {/* Role Filter Pills (Interns, Fellows, PCs) - when Role-Wise */}
              {assignmentMode === 'role' && (
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                  {/* Interns Button */}
                  <button
                    type="button"
                    onClick={() => setRoleGroup(prev => prev === 'intern' ? null : 'intern')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95',
                      roleGroup === 'intern'
                        ? 'bg-indigo-600 text-white border border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.55)] ring-2 ring-indigo-400 ring-offset-1 font-bold scale-[1.02]'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-semibold'
                    )}
                  >
                    <Checks size={14} className={roleGroup === 'intern' ? 'text-white' : 'text-indigo-600'} weight="bold" />
                    <span>Interns</span>
                  </button>

                  {/* Fellows Button */}
                  <button
                    type="button"
                    onClick={() => setRoleGroup(prev => prev === 'fellow' ? null : 'fellow')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95',
                      roleGroup === 'fellow'
                        ? 'bg-purple-600 text-white border border-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.55)] ring-2 ring-purple-400 ring-offset-1 font-bold scale-[1.02]'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-semibold'
                    )}
                  >
                    <Checks size={14} className={roleGroup === 'fellow' ? 'text-white' : 'text-purple-600'} weight="bold" />
                    <span>Fellows</span>
                  </button>

                  {/* PCs Button */}
                  <button
                    type="button"
                    onClick={() => setRoleGroup(prev => prev === 'pc' ? null : 'pc')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95',
                      roleGroup === 'pc'
                        ? 'bg-amber-600 text-white border border-amber-500 shadow-[0_0_16px_rgba(217,119,6,0.55)] ring-2 ring-amber-400 ring-offset-1 font-bold scale-[1.02]'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-semibold'
                    )}
                  >
                    <Checks size={14} className={roleGroup === 'pc' ? 'text-white' : 'text-amber-600'} weight="bold" />
                    <span>PCs</span>
                  </button>

                  {/* Clear Selection Button */}
                  {selectedUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUsers([]);
                        setValue('assignedToIds', [], { shouldValidate: true });
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      Clear ({selectedUsers.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── CARD 2 (MOBILE): SEARCH BAR CARD ── */}
            {assignmentMode === 'role' && (
              <div className="card p-2.5 sm:p-0 sm:border-0 sm:shadow-none sm:bg-transparent bg-white border border-slate-200/80 shadow-xs rounded-2xl">
                <div className="flex items-center gap-2">
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
            )}

            {/* ── CARD 3 (MOBILE): CANDIDATES LIST CARD ── */}
            {assignmentMode === 'role' && (
              <div className="card p-2.5 sm:p-0 sm:border-0 sm:shadow-none sm:bg-transparent bg-white border border-slate-200/80 shadow-xs rounded-2xl space-y-2.5 sm:space-y-3">
                {/* Role Group Candidates List Banner */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">
                    Showing {filteredUsers.length} {roleGroup === 'intern' ? 'Interns' : roleGroup === 'fellow' ? 'Fellows' : roleGroup === 'pc' ? 'Program Coordinators' : 'Candidates'}
                  </span>
                  {filteredUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={isAllCurrentGroupSelected ? deselectCurrentGroup : selectAllCurrentGroup}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs active:scale-95"
                    >
                      {isAllCurrentGroupSelected
                        ? `Deselect (${filteredUsers.length})`
                        : `+ Assign ${roleGroup === 'intern' ? 'Interns' : roleGroup === 'fellow' ? 'Fellows' : roleGroup === 'pc' ? 'PCs' : 'All'} (${filteredUsers.length})`}
                    </button>
                  )}
                </div>

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
            )}

            {/* ── MODE 2: AREA-WISE CONTROLS (Hierarchy Drill-down & Stop at Any Level) ── */}
            {assignmentMode === 'area' && (
              <div className="space-y-3 pt-0.5 animate-in fade-in duration-200">
                {/* If still exploring hierarchy */}
                {areaStep !== 'completed' && (
                  <div className="border border-emerald-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                    {/* Navigation, Breadcrumb & Action Buttons Header */}
                    <div className="p-3 sm:p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Back button & Breadcrumb Info */}
                      <div className="flex items-center gap-2 min-w-0">
                        {areaStep !== 'division' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCheckedAreaItem(null);
                              if (areaStep === 'district') {
                                setAreaStep('division');
                                setSelectedDivision('');
                              } else if (areaStep === 'block') {
                                setAreaStep('district');
                                setSelectedDistrict('');
                              } else if (areaStep === 'gp') {
                                setAreaStep('block');
                                setSelectedBlock('');
                              } else if (areaStep === 'village') {
                                setAreaStep('gp');
                                setSelectedGP('');
                              } else if (areaStep === 'person') {
                                setAreaStep('village');
                                setSelectedVillage('');
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
                            {selectedGP && (
                              <>
                                <CaretRight size={11} className="text-slate-400 shrink-0" weight="bold" />
                                <span className="text-slate-700 truncate">{gramPanchayats.find(g => g.id === selectedGP)?.name}</span>
                              </>
                            )}
                            {selectedVillage && (
                              <>
                                <CaretRight size={11} className="text-slate-400 shrink-0" weight="bold" />
                                <span className="text-slate-700 truncate">{villages.find(v => v.id === selectedVillage)?.name}</span>
                              </>
                            )}
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                            {areaStep === 'division' && 'Select Division'}
                            {areaStep === 'district' && `Select District in ${divisions.find(d => d.id === selectedDivision)?.name}`}
                            {areaStep === 'block' && `Select Block in ${districts.find(d => d.id === selectedDistrict)?.name}`}
                            {areaStep === 'gp' && `Select Gram Panchayat in ${blocks.find(b => b.id === selectedBlock)?.name}`}
                            {areaStep === 'village' && `Select Village in ${gramPanchayats.find(g => g.id === selectedGP)?.name}`}
                            {areaStep === 'person' && `Select Person in ${villages.find(v => v.id === selectedVillage)?.name}`}
                          </h3>
                        </div>
                      </div>

                      {/* Right: Action Buttons in the Header (enabled when an item checkbox is checked) */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {areaStep === 'division' && (
                          <>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const d = divisions.find(item => item.id === checkedAreaItem);
                                if (d) handleSelectEntireDivision(d);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 active:scale-95'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              )}
                            >
                              Entire Division
                            </button>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const d = divisions.find(item => item.id === checkedAreaItem);
                                if (d) handleDrillDownDivision(d);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95'
                                  : 'bg-emerald-200 text-white/90 cursor-not-allowed opacity-60'
                              )}
                            >
                              <span>Select District</span>
                              <CaretRight size={12} weight="bold" />
                            </button>
                          </>
                        )}

                        {areaStep === 'district' && (
                          <>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const dst = currentDivisionDistricts.find(item => item.id === checkedAreaItem);
                                if (dst) handleSelectEntireDistrict(dst);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 active:scale-95'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              )}
                            >
                              Entire District
                            </button>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const dst = currentDivisionDistricts.find(item => item.id === checkedAreaItem);
                                if (dst) handleDrillDownDistrict(dst);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95'
                                  : 'bg-emerald-200 text-white/90 cursor-not-allowed opacity-60'
                              )}
                            >
                              <span>Select Block</span>
                              <CaretRight size={12} weight="bold" />
                            </button>
                          </>
                        )}

                        {areaStep === 'block' && (
                          <>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const blk = currentDistrictBlocks.find(item => item.id === checkedAreaItem);
                                if (blk) handleSelectEntireBlock(blk);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 active:scale-95'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              )}
                            >
                              Entire Block
                            </button>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const blk = currentDistrictBlocks.find(item => item.id === checkedAreaItem);
                                if (blk) handleDrillDownBlock(blk);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95'
                                  : 'bg-emerald-200 text-white/90 cursor-not-allowed opacity-60'
                              )}
                            >
                              <span>Select GP</span>
                              <CaretRight size={12} weight="bold" />
                            </button>
                          </>
                        )}

                        {areaStep === 'gp' && (
                          <>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const gp = currentBlockGPs.find(item => item.id === checkedAreaItem);
                                if (gp) handleSelectEntireGP(gp);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 active:scale-95'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              )}
                            >
                              Entire GP
                            </button>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const gp = currentBlockGPs.find(item => item.id === checkedAreaItem);
                                if (gp) handleDrillDownGP(gp);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95'
                                  : 'bg-emerald-200 text-white/90 cursor-not-allowed opacity-60'
                              )}
                            >
                              <span>Select Village</span>
                              <CaretRight size={12} weight="bold" />
                            </button>
                          </>
                        )}

                        {areaStep === 'village' && (
                          <>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const v = currentGPVillages.find(item => item.id === checkedAreaItem);
                                if (v) handleSelectEntireVillage(v);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 active:scale-95'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              )}
                            >
                              Entire Village
                            </button>
                            <button
                              type="button"
                              disabled={!checkedAreaItem}
                              onClick={() => {
                                const v = currentGPVillages.find(item => item.id === checkedAreaItem);
                                if (v) handleDrillDownVillage(v);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                                checkedAreaItem
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95'
                                  : 'bg-emerald-200 text-white/90 cursor-not-allowed opacity-60'
                              )}
                            >
                              <span>Select Person</span>
                              <CaretRight size={12} weight="bold" />
                            </button>
                          </>
                        )}

                        {areaStep === 'person' && (
                          <button
                            type="button"
                            disabled={!checkedAreaItem}
                            onClick={() => {
                              const p = users.find(item => item.id === checkedAreaItem);
                              if (p) handleSelectPerson(p);
                            }}
                            className={cn(
                              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1',
                              checkedAreaItem
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95'
                                : 'bg-emerald-200 text-white/90 cursor-not-allowed opacity-60'
                            )}
                          >
                            <UserCheck size={14} weight="bold" />
                            <span>Assign Person</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hierarchy List Body: Clean rows with checkboxes ONLY */}
                    <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                      {/* Level 1: Divisions */}
                      {areaStep === 'division' && divisions.map(d => {
                        const isChecked = checkedAreaItem === d.id;
                        return (
                          <div
                            key={d.id}
                            onClick={() => setCheckedAreaItem(prev => prev === d.id ? null : d.id)}
                            className={cn(
                              'p-3 sm:p-3.5 flex items-center gap-3 transition-colors cursor-pointer select-none',
                              isChecked ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-colors',
                              isChecked ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            )}>
                              {d.code || d.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{d.name}</div>
                              <div className="text-[11px] text-slate-400">Division Level</div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Level 2: Districts */}
                      {areaStep === 'district' && (
                        currentDivisionDistricts.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No districts configured for this division.
                          </div>
                        ) : (
                          currentDivisionDistricts.map(dst => {
                            const isChecked = checkedAreaItem === dst.id;
                            return (
                              <div
                                key={dst.id}
                                onClick={() => setCheckedAreaItem(prev => prev === dst.id ? null : dst.id)}
                                className={cn(
                                  'p-3 sm:p-3.5 flex items-center gap-3 transition-colors cursor-pointer select-none',
                                  isChecked ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <div className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-colors',
                                  isChecked ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-teal-50 text-teal-700 border-teal-100'
                                )}>
                                  DST
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{dst.name}</div>
                                  <div className="text-[11px] text-slate-400">District</div>
                                </div>
                              </div>
                            );
                          })
                        )
                      )}

                      {/* Level 3: Blocks */}
                      {areaStep === 'block' && (
                        currentDistrictBlocks.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No blocks configured for this district.
                          </div>
                        ) : (
                          currentDistrictBlocks.map(blk => {
                            const isChecked = checkedAreaItem === blk.id;
                            return (
                              <div
                                key={blk.id}
                                onClick={() => setCheckedAreaItem(prev => prev === blk.id ? null : blk.id)}
                                className={cn(
                                  'p-3 sm:p-3.5 flex items-center gap-3 transition-colors cursor-pointer select-none',
                                  isChecked ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <div className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-colors',
                                  isChecked ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                )}>
                                  BLK
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{blk.name}</div>
                                  <div className="text-[11px] text-slate-400">Block</div>
                                </div>
                              </div>
                            );
                          })
                        )
                      )}

                      {/* Level 4: Gram Panchayats */}
                      {areaStep === 'gp' && (
                        currentBlockGPs.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No Gram Panchayats configured for this block.
                          </div>
                        ) : (
                          currentBlockGPs.map(gp => {
                            const isChecked = checkedAreaItem === gp.id;
                            return (
                              <div
                                key={gp.id}
                                onClick={() => setCheckedAreaItem(prev => prev === gp.id ? null : gp.id)}
                                className={cn(
                                  'p-3 sm:p-3.5 flex items-center gap-3 transition-colors cursor-pointer select-none',
                                  isChecked ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <div className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-colors',
                                  isChecked ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-violet-50 text-violet-700 border-violet-100'
                                )}>
                                  GP
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{gp.name}</div>
                                  <div className="text-[11px] text-slate-400">Gram Panchayat</div>
                                </div>
                              </div>
                            );
                          })
                        )
                      )}

                      {/* Level 5: Villages */}
                      {areaStep === 'village' && (
                        currentGPVillages.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No villages configured for this Gram Panchayat.
                          </div>
                        ) : (
                          currentGPVillages.map(v => {
                            const isChecked = checkedAreaItem === v.id;
                            return (
                              <div
                                key={v.id}
                                onClick={() => setCheckedAreaItem(prev => prev === v.id ? null : v.id)}
                                className={cn(
                                  'p-3 sm:p-3.5 flex items-center gap-3 transition-colors cursor-pointer select-none',
                                  isChecked ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <div className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-colors',
                                  isChecked ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                )}>
                                  VLG
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{v.name}</div>
                                  <div className="text-[11px] text-slate-400">Village</div>
                                </div>
                              </div>
                            );
                          })
                        )
                      )}

                      {/* Level 6: Person in Village */}
                      {areaStep === 'person' && (
                        filteredUsers.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No field personnel currently assigned directly to this village.
                          </div>
                        ) : (
                          filteredUsers.map(u => {
                            const isChecked = checkedAreaItem === u.id;
                            return (
                              <div
                                key={u.id}
                                onClick={() => setCheckedAreaItem(prev => prev === u.id ? null : u.id)}
                                className={cn(
                                  'p-3 sm:p-3.5 flex items-center gap-3 transition-colors cursor-pointer select-none',
                                  isChecked ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                />
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                  isChecked ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                                )}>
                                  {u.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{u.name}</div>
                                  <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                                </div>
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border capitalize',
                                  u.role === 'intern' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                                )}>
                                  {roleLabel(u.role)}
                                </span>
                              </div>
                            );
                          })
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Completed Area Display (When scope is finalized at ANY level: Division, District, Block, GP, Village, or Person) */}
                {areaStep === 'completed' && (
                  <div className="space-y-3">
                    {/* Header Banner for Selected Hierarchy */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/50 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <MapPin size={20} weight="bold" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100/70 border border-emerald-200 shrink-0">
                              {stoppedLevelName || 'Selected Scope'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                            {getHierarchyBreadcrumb() || 'Entire State / All Areas'}
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
                            {isAllCurrentGroupSelected ? `Deselect (${filteredUsers.length})` : `+ Assign in Area (${filteredUsers.length})`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Personnel Matching this Location */}
                    <div className="max-h-[340px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                      {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No personnel assigned directly to this location yet. The survey is registered for this area.
                        </div>
                      ) : (
                        filteredUsers.map(u => {
                          const isAdded = !!selectedUsers.find(s => s.id === u.id);
                          return (
                            <label
                              key={u.id}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors cursor-pointer select-none',
                                isAdded ? 'bg-emerald-50/70 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isAdded}
                                onChange={() => toggleUser(u)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                              />
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                isAdded ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                              )}>
                                {u.name.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold truncate text-slate-900 leading-snug">{u.name}</div>
                                <div className="text-xs text-slate-400 truncate">{u.email}</div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                                  <MapPin size={11} className="text-emerald-500 shrink-0" weight="bold" />
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
                )}
              </div>
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
          <div className="lg:hidden fixed bottom-[calc(86px+env(safe-area-inset-bottom,0px))] left-4 right-4 max-w-lg mx-auto z-50 pointer-events-none">
            <div className="flex items-center gap-2.5 pointer-events-auto">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-12 h-12 rounded-full border border-slate-200/90 bg-white text-slate-700 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10 hover:bg-slate-50 cursor-pointer active:scale-95 transition-transform"
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
                  className="flex-1 h-12 px-6 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/35 hover:bg-indigo-700 btn-press transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : cameFromSurvey || isSurveyTask ? 'Deploy Survey Task' : 'Save & Assign Task'}
                  <Check size={16} weight="bold" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12 px-6 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/35 hover:bg-indigo-700 btn-press transition-all cursor-pointer"
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
