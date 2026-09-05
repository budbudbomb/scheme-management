'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X, Warning, CheckCircle, UploadSimple, DownloadSimple,
  FileXls, XCircle, Info, Copy,
} from '@phosphor-icons/react';
import { usersApi } from '@/lib/api/users';
import type { Division, District, Block, GramPanchayat, Village, User } from '@/types/models';
import { cn } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import CustomSelect from '@/components/shared/CustomSelect';
import {
  BULK_COLUMNS,
  BULK_ROLE_LABEL,
  type BulkUserRole,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS,
  QUALIFICATION_OPTIONS,
  downloadUserTemplate,
  parseUserWorkbook,
  generateTempPassword,
  downloadCredentialsSheet,
  type CreatedCredential,
} from '@/lib/utils/userTemplates';

// ── Validation ──────────────────────────────────────────────
// Username/password are never entered by the admin — they're auto-generated on creation
// (from the info entered here, or from each row when uploaded via Excel).

const baseShape = {
  name: z.string().min(2, 'First name required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name required'),
  category: z.enum(['general', 'obc', 'sc', 'st', 'other']).optional(),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  fatherName: z.string().min(1, "Father's name required"),
  address: z.string().min(1, 'Address required'),
  phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Valid email required'),
  password: z.string().optional(),
  samagraId: z.string().regex(/^\d{7,12}$/, 'Enter a valid Samagra ID'),
  qualification: z.enum(['10th', '12th', 'iti_diploma', 'graduate', 'post_graduate', 'other'], {
    required_error: 'Qualification is required',
  }),
};

// Every role variant carries all five location keys (some required, some left optional) so
// react-hook-form's watch() can be called per-field with a uniform Path<FormData> type below.
const locationOptionalShape = {
  divisionId: z.string().optional(),
  districtId: z.string().optional(),
  blockId: z.string().optional(),
  gramPanchayatId: z.string().optional(),
  villageId: z.string().optional(),
};

const pcSchema = z.object({
  role: z.literal('pc'), ...baseShape, ...locationOptionalShape,
  divisionId: z.string().min(1, 'Division is required'),
});
const fellowSchema = z.object({
  role: z.literal('fellow'), ...baseShape, ...locationOptionalShape,
  districtId: z.string().min(1, 'District is required'),
});
const internSchema = z.object({
  role: z.literal('intern'), ...baseShape, ...locationOptionalShape,
  districtId: z.string().min(1, 'Select a district first'),
  blockId: z.string().min(1, 'Block is required'),
  gramPanchayatId: z.string().min(1, 'Gram Panchayat is required'),
  villageId: z.string().min(1, 'Village is required'),
});

const ROLE_SCHEMAS = { pc: pcSchema, fellow: fellowSchema, intern: internSchema };
const schema = z.discriminatedUnion('role', [pcSchema, fellowSchema, internSchema]);
type FormData = z.infer<typeof schema>;

const ROLES: { value: BulkUserRole; label: string }[] = [
  { value: 'intern', label: 'Intern (CMYIGGP)' },
  { value: 'fellow', label: 'Fellow (CMYPDP)' },
  { value: 'pc', label: 'Project Coordinator' },
];

interface LocationLists {
  divisions: Division[];
  districts: District[];
  blocks: Block[];
  gramPanchayats: GramPanchayat[];
  villages: Village[];
}

function findByName<T extends { name: string }>(list: T[], name: string): T | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return list.find((x) => x.name.trim().toLowerCase() === n);
}

function normalizeGender(input: string) {
  const v = input.trim().toLowerCase();
  return GENDER_OPTIONS.find((g) => g.value === v || g.label.toLowerCase() === v)?.value;
}

function normalizeCategory(input: string) {
  const v = input.trim().toLowerCase();
  return CATEGORY_OPTIONS.find((c) => c.value === v || c.label.toLowerCase() === v)?.value;
}

function normalizeQualification(input: string) {
  const v = input.trim().toLowerCase();
  return QUALIFICATION_OPTIONS.find((q) => q.value === v || q.label.toLowerCase() === v)?.value;
}

interface ResolvedRow {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
  candidate?: FormData;
  resolved: { division?: Division; district?: District; block?: Block; gramPanchayat?: GramPanchayat; village?: Village };
}

function resolveBulkRow(role: BulkUserRole, rowNumber: number, raw: Record<string, string>, loc: LocationLists): ResolvedRow {
  const columns = BULK_COLUMNS[role];
  const get = (key: string) => {
    const col = columns.find((c) => c.key === key);
    return col ? (raw[col.header] ?? '').trim() : '';
  };

  const errors: string[] = [];
  const genderRaw = get('gender');
  const gender = normalizeGender(genderRaw);
  if (genderRaw && !gender) errors.push(`Unrecognized gender "${genderRaw}"`);

  const categoryRaw = get('category');
  const category = normalizeCategory(categoryRaw);
  if (categoryRaw && !category) errors.push(`Unrecognized category "${categoryRaw}"`);

  const qualificationRaw = get('qualification');
  const qualification = normalizeQualification(qualificationRaw);
  if (qualificationRaw && !qualification) errors.push(`Unrecognized qualification "${qualificationRaw}"`);

  const candidateBase: Record<string, unknown> = {
    role,
    name: get('name'),
    middleName: get('middleName'),
    lastName: get('lastName'),
    category,
    gender,
    fatherName: get('fatherName'),
    address: get('address'),
    phone: get('phone').replace(/\D/g, ''),
    email: get('email'),
    samagraId: get('samagraId').replace(/\D/g, ''),
    qualification,
    password: generateTempPassword(),
  };

  const resolved: ResolvedRow['resolved'] = {};

  if (role === 'pc' || role === 'fellow') {
    const name = get('division');
    resolved.division = findByName(loc.divisions, name);
    if (name && !resolved.division) errors.push(`Division "${name}" not found`);
    candidateBase.divisionId = resolved.division?.id ?? '';
  }

  if (role === 'fellow' || role === 'intern') {
    const name = get('district');
    resolved.district = findByName(loc.districts, name);
    if (name && !resolved.district) errors.push(`District "${name}" not found`);
    candidateBase.districtId = resolved.district?.id ?? '';
  }

  if (role === 'intern') {
    const blockName = get('block');
    resolved.block = findByName(loc.blocks, blockName);
    if (blockName && !resolved.block) errors.push(`Block "${blockName}" not found`);
    candidateBase.blockId = resolved.block?.id ?? '';

    const gpName = get('gramPanchayat');
    resolved.gramPanchayat = findByName(loc.gramPanchayats, gpName);
    if (gpName && !resolved.gramPanchayat) errors.push(`Gram Panchayat "${gpName}" not found`);
    candidateBase.gramPanchayatId = resolved.gramPanchayat?.id ?? '';

    const villageName = get('village');
    resolved.village = findByName(loc.villages, villageName);
    if (villageName && !resolved.village) errors.push(`Village "${villageName}" not found`);
    candidateBase.villageId = resolved.village?.id ?? '';
  }

  const parsed = ROLE_SCHEMAS[role].safeParse(candidateBase);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (!errors.includes(issue.message)) errors.push(issue.message);
    }
  }

  return { rowNumber, raw, errors, resolved, candidate: parsed.success ? (parsed.data as FormData) : undefined };
}

function buildCreatePayload(values: FormData, resolved: ResolvedRow['resolved'], password: string): Partial<User> & { password?: string } {
  return {
    role: values.role,
    name: values.name,
    middleName: values.middleName,
    lastName: values.lastName,
    category: values.category,
    gender: values.gender,
    fatherName: values.fatherName,
    address: values.address,
    phone: values.phone,
    email: values.email,
    password,
    samagraId: values.samagraId,
    qualification: values.qualification,
    ...(resolved.division ? { division: resolved.division } : {}),
    ...(resolved.district ? { district: resolved.district } : {}),
    ...(resolved.block ? { block: resolved.block } : {}),
    ...(resolved.gramPanchayat ? { gramPanchayat: resolved.gramPanchayat } : {}),
    ...(resolved.village ? { village: resolved.village } : {}),
  };
}

// ── UI helpers ──────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
      <Warning size={12} /> {msg}
    </p>
  );
}

function inputCls(hasError?: boolean) {
  return cn(
    'w-full px-3 py-2.5 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow',
    hasError ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
  );
}

interface AddUserModalProps {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onCreated: () => void;
  onUpdated?: (user: Partial<User>) => void;
}

export default function AddUserModal({ open, user, onClose, onCreated, onUpdated }: AddUserModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [locations, setLocations] = useState<LocationLists>({ divisions: [], districts: [], blocks: [], gramPanchayats: [], villages: [] });
  const [locationsReady, setLocationsReady] = useState(false);
  const [singleCredential, setSingleCredential] = useState<CreatedCredential | null>(null);

  useEffect(() => {
    if (!open) return;
    setLocationsReady(false);
    Promise.all([
      usersApi.getDivisions(),
      usersApi.getDistricts(),
      usersApi.getBlocks(),
      usersApi.getGramPanchayats(),
      usersApi.getVillages(),
    ])
      .then(([divisions, districts, blocks, gramPanchayats, villages]) => {
        setLocations({ divisions, districts, blocks, gramPanchayats, villages });
      })
      .catch(console.error)
      .finally(() => setLocationsReady(true));
  }, [open]);

  // ── Single entry form ──
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'intern' } as FormData,
  });

  const role = watch('role');
  const districtId = watch('districtId');
  const blockId = watch('blockId');
  const gramPanchayatId = watch('gramPanchayatId');

  const filteredBlocks = useMemo(
    () => locations.blocks.filter((b) => !districtId || b.districtId === districtId),
    [locations.blocks, districtId]
  );
  const filteredGramPanchayats = useMemo(
    () => locations.gramPanchayats.filter((gp) => !blockId || gp.blockId === blockId),
    [locations.gramPanchayats, blockId]
  );
  const filteredVillages = useMemo(
    () => locations.villages.filter((v) => !gramPanchayatId || v.gramPanchayatId === gramPanchayatId),
    [locations.villages, gramPanchayatId]
  );

  // Reset all local state whenever the modal is (re)opened
  useEffect(() => {
    if (open) {
      setMode('single');
      setSingleCredential(null);
      if (user) {
        const u = user as any;
        reset({
          ...user,
          divisionId: user.division?.id || u.divisionId || '',
          districtId: user.district?.id || u.districtId || '',
          blockId: user.block?.id || u.blockId || '',
          gramPanchayatId: user.gramPanchayat?.id || u.gramPanchayatId || '',
          villageId: user.village?.id || u.villageId || '',
        } as FormData);
      } else {
        reset({ role: 'intern' } as FormData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const onSubmit = async (data: FormData) => {
    try {
      const resolved: ResolvedRow['resolved'] = {
        division: data.role === 'pc' ? locations.divisions.find((d) => d.id === data.divisionId) : undefined,
        district:
          data.role === 'fellow' || data.role === 'intern'
            ? locations.districts.find((d) => d.id === data.districtId)
            : undefined,
        block: data.role === 'intern' ? locations.blocks.find((b) => b.id === data.blockId) : undefined,
        gramPanchayat: data.role === 'intern' ? locations.gramPanchayats.find((g) => g.id === data.gramPanchayatId) : undefined,
        village: data.role === 'intern' ? locations.villages.find((v) => v.id === data.villageId) : undefined,
      };
      
      if (user && onUpdated) {
        onUpdated(buildCreatePayload(data, resolved, (user as any).password || ''));
        return;
      }
      
      const password = generateTempPassword();
      const created = await usersApi.create(buildCreatePayload(data, resolved, password));
      toast.success(`User "${created.name}" created!`);
      setSingleCredential({ name: created.name, email: created.email, password, role: data.role });
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(msg);
    }
  };

  const errs = errors as Record<string, { message?: string }>;

  const copyCredential = () => {
    if (!singleCredential) return;
    navigator.clipboard
      .writeText(`Email: ${singleCredential.email}\nTemporary Password: ${singleCredential.password}`)
      .then(() => toast.success('Credentials copied to clipboard'))
      .catch(() => toast.error('Could not copy to clipboard'));
  };

  // ── Bulk upload ──
  const [bulkRole, setBulkRole] = useState<BulkUserRole>('intern');
  const [bulkRows, setBulkRows] = useState<ResolvedRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkCredentials, setBulkCredentials] = useState<CreatedCredential[] | null>(null);

  const invalidCount = bulkRows.filter((r) => r.errors.length > 0).length;
  const validCount = bulkRows.length - invalidCount;

  const handleBulkFile = async (file: File) => {
    if (!locationsReady) {
      toast.error('Still loading location data — please try again in a moment');
      return;
    }
    setBulkCredentials(null);
    setBulkFileName(file.name);
    try {
      const rawRows = await parseUserWorkbook(file);
      if (rawRows.length === 0) {
        toast.error('No data rows found in the uploaded file');
        setBulkRows([]);
        return;
      }
      const resolvedRows = rawRows.map((raw, i) => resolveBulkRow(bulkRole, i + 2, raw, locations));
      setBulkRows(resolvedRows);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to read the uploaded file');
      setBulkRows([]);
    }
  };

  const handleBulkConfirm = async () => {
    if (bulkRows.length === 0 || invalidCount > 0) return;
    setBulkSubmitting(true);
    try {
      const payloads = bulkRows.map((r) => buildCreatePayload(r.candidate!, r.resolved, r.candidate!.password ?? generateTempPassword()));
      const { created, failed } = await usersApi.createMany(payloads);

      const credentials: CreatedCredential[] = created.map((u) => {
        const original = payloads.find((p) => p.email === u.email);
        return { name: u.name, email: u.email, password: original?.password ?? '', role: bulkRole };
      });
      setBulkCredentials(credentials);

      if (failed.length === 0) {
        toast.success(`${created.length} user(s) created successfully`);
      } else {
        toast.warning(`${created.length} created, ${failed.length} failed`);
      }
      setBulkRows([]);
      setBulkFileName(null);
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bulk upload failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div id="add-user-modal" role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Frozen Header (Title + Mode toggle tabs) */}
        <div className="px-6 pt-6 pb-0 border-b border-slate-100 bg-white shrink-0 z-10">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user ? 'Edit User' : 'Add New User'}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {user ? 'Update user details' : 'Register an Intern, Fellow, or Project Coordinator — one at a time or in bulk'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode toggle tabs */}
          {!user && (
            <div className="border-t border-slate-100">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {[
                  { value: 'single', label: 'Single Entry' },
                  { value: 'bulk', label: 'Bulk Upload' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setMode(tab.value as 'single' | 'bulk')}
                    className={cn(
                      'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                      mode === tab.value
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {mode === 'single' && (
            <>
              {singleCredential ? (
                <div className="p-6 space-y-5 overflow-y-auto">
                  <div className="flex items-center gap-2.5 rounded-[var(--radius)] bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <CheckCircle className="text-emerald-500 shrink-0" size={18} weight="fill" />
                    <p className="text-sm text-emerald-700 font-medium">
                      {singleCredential.name} was created. Share these login credentials with them.
                    </p>
                  </div>

                  <div className="card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Username (Email)</div>
                      <div className="text-sm font-medium text-slate-900 break-all">{singleCredential.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Temporary Password</div>
                      <div className="text-sm font-mono font-medium text-slate-900">{singleCredential.password}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Role</div>
                      <div className="text-sm font-medium text-slate-900">{BULK_ROLE_LABEL[singleCredential.role]}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={copyCredential}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Copy size={16} />
                      Copy Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCredentialsSheet([singleCredential]).catch(() => toast.error('Failed to generate credentials sheet'))}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <DownloadSimple size={16} />
                      Download Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSingleCredential(null); reset({ role: 'intern' } as FormData); }}
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      Add Another
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="ml-auto px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
                  {/* Scrollable Form Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    {/* Role / User Type Buttons */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">User Type <span className="text-rose-500">*</span></label>
                      <div className="flex flex-wrap gap-2.5">
                        {ROLES.map((r) => {
                          const isSelected = role === r.value;
                          return (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => setValue('role', r.value as any, { shouldValidate: true })}
                              className={cn(
                                'px-4 py-2 text-sm font-medium rounded-[var(--radius)] border transition-all',
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              )}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  {/* ── Personal details ── */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Personal Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name <span className="text-rose-500">*</span></label>
                        <input type="text" {...register('name')} placeholder="First name" className={inputCls(!!errs.name)} />
                        <FieldError msg={errs.name?.message} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Middle Name</label>
                        <input type="text" {...register('middleName')} placeholder="Middle name (optional)" className={inputCls(!!errs.middleName)} />
                        <FieldError msg={errs.middleName?.message} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name <span className="text-rose-500">*</span></label>
                        <input type="text" {...register('lastName')} placeholder="Last name" className={inputCls(!!errs.lastName)} />
                        <FieldError msg={errs.lastName?.message} />
                      </div>

                      <div>
                        <CustomSelect
                          label="Gender"
                          required
                          options={GENDER_OPTIONS}
                          value={watch('gender')}
                          onChange={(val) => setValue('gender', val as any, { shouldValidate: true })}
                          hasError={!!errs.gender}
                          errorMessage={errs.gender?.message}
                          placeholder="Select gender…"
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Category"
                          options={CATEGORY_OPTIONS}
                          value={watch('category') || ''}
                          onChange={(val) => setValue('category', val as any, { shouldValidate: true })}
                          hasError={!!errs.category}
                          errorMessage={errs.category?.message}
                          placeholder="Select category…"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Father&apos;s Name <span className="text-rose-500">*</span></label>
                        <input type="text" {...register('fatherName')} placeholder="Father's name" className={inputCls(!!errs.fatherName)} />
                        <FieldError msg={errs.fatherName?.message} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile No <span className="text-rose-500">*</span></label>
                        <input type="tel" {...register('phone')} placeholder="10-digit mobile number" className={inputCls(!!errs.phone)} />
                        <FieldError msg={errs.phone?.message} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-rose-500">*</span></label>
                        <input type="email" {...register('email')} placeholder="user@cmyp.mp.gov.in" className={inputCls(!!errs.email)} />
                        <FieldError msg={errs.email?.message} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Samagra ID <span className="text-rose-500">*</span></label>
                        <input type="text" {...register('samagraId')} placeholder="e.g. 123456789" className={inputCls(!!errs.samagraId)} />
                        <FieldError msg={errs.samagraId?.message} />
                      </div>

                      <div>
                        <CustomSelect
                          label="Qualification"
                          required
                          options={QUALIFICATION_OPTIONS}
                          value={watch('qualification')}
                          onChange={(val) => setValue('qualification', val as any, { shouldValidate: true })}
                          hasError={!!errs.qualification}
                          errorMessage={errs.qualification?.message}
                          placeholder="Select qualification…"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Address <span className="text-rose-500">*</span></label>
                        <textarea {...register('address')} rows={1} placeholder="Full address" className={inputCls(!!errs.address)} />
                        <FieldError msg={errs.address?.message} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Samagra ID is locked after creation — only Admin can edit it later</p>
                  </div>

                  {/* ── Location of appointment ── */}
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Location of Appointment</h3>
                    <p className="text-xs text-slate-400 mb-3">State: Madhya Pradesh · Locked after creation — only Admin can edit later</p>

                    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', role === 'intern' && 'lg:grid-cols-4')}>
                      {role === 'pc' && (
                        <div>
                          <CustomSelect
                            label="Division"
                            required
                            options={locations.divisions.map((d) => ({ value: d.id, label: d.name }))}
                            value={watch('divisionId')}
                            onChange={(val) => setValue('divisionId', val, { shouldValidate: true })}
                            hasError={!!errs.divisionId}
                            errorMessage={errs.divisionId?.message}
                            placeholder="Select division…"
                          />
                        </div>
                      )}

                      {role === 'fellow' && (
                        <div>
                          <CustomSelect
                            label="District"
                            required
                            options={locations.districts.map((d) => ({ value: d.id, label: `${d.name} (${d.divisionName})` }))}
                            value={watch('districtId')}
                            onChange={(val) => setValue('districtId', val, { shouldValidate: true })}
                            hasError={!!errs.districtId}
                            errorMessage={errs.districtId?.message}
                            placeholder="Select district…"
                          />
                        </div>
                      )}

                      {role === 'intern' && (
                        <>
                          <div>
                            <CustomSelect
                              label="District"
                              required
                              options={locations.districts.map((d) => ({ value: d.id, label: d.name }))}
                              value={watch('districtId')}
                              onChange={(val) => {
                                setValue('districtId', val, { shouldValidate: true });
                                setValue('blockId', '');
                                setValue('gramPanchayatId', '');
                                setValue('villageId', '');
                              }}
                              hasError={!!errs.districtId}
                              errorMessage={errs.districtId?.message}
                              placeholder="Select district…"
                            />
                          </div>
                          <div>
                            <CustomSelect
                              label="Block"
                              required
                              disabled={!districtId}
                              options={filteredBlocks.map((b) => ({ value: b.id, label: b.name }))}
                              value={watch('blockId')}
                              onChange={(val) => {
                                setValue('blockId', val, { shouldValidate: true });
                                setValue('gramPanchayatId', '');
                                setValue('villageId', '');
                              }}
                              hasError={!!errs.blockId}
                              errorMessage={errs.blockId?.message}
                              placeholder={!districtId ? 'Select district first…' : 'Select block…'}
                            />
                          </div>
                          <div>
                            <CustomSelect
                              label="Gram Panchayat"
                              required
                              disabled={!blockId}
                              options={filteredGramPanchayats.map((g) => ({ value: g.id, label: g.name }))}
                              value={watch('gramPanchayatId')}
                              onChange={(val) => {
                                setValue('gramPanchayatId', val, { shouldValidate: true });
                                setValue('villageId', '');
                              }}
                              hasError={!!errs.gramPanchayatId}
                              errorMessage={errs.gramPanchayatId?.message}
                              placeholder={!blockId ? 'Select block first…' : 'Select gram panchayat…'}
                            />
                          </div>
                          <div>
                            <CustomSelect
                              label="Village"
                              required
                              disabled={!gramPanchayatId}
                              options={filteredVillages.map((v) => ({ value: v.id, label: v.name }))}
                              value={watch('villageId')}
                              onChange={(val) => setValue('villageId', val, { shouldValidate: true })}
                              hasError={!!errs.villageId}
                              errorMessage={errs.villageId?.message}
                              placeholder={!gramPanchayatId ? 'Select GP first…' : 'Select village…'}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                    <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1.5">
                      <Info size={13} className="shrink-0" />
                      Username and a temporary password are generated automatically once the user is created.
                    </p>
                  </div>

                  {/* Frozen Footer (Cancel & Submit Buttons) */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3 z-10">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="create-user-submit"
                      disabled={isSubmitting}
                      className="px-6 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press disabled:opacity-60 transition-all"
                    >
                      {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {user ? 'Save Changes' : 'Create User'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {mode === 'bulk' && !user && (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">User Type <span className="text-rose-500">*</span></label>
                  <div className="flex flex-wrap gap-2.5">
                    {ROLES.map((r) => {
                      const isSelected = bulkRole === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => { setBulkRole(r.value as BulkUserRole); setBulkRows([]); setBulkFileName(null); setBulkCredentials(null); }}
                          className={cn(
                            'px-4 py-2 text-sm font-medium rounded-[var(--radius)] border transition-all',
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-slate-400 sm:pb-2.5">
                  Each upload contains only one user type — download the matching template, fill it in, then upload it. Username and passwords are generated automatically.
                </p>

                <button
                  type="button"
                  onClick={() => downloadUserTemplate(bulkRole).catch(() => toast.error('Failed to generate template'))}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <DownloadSimple size={16} />
                  Download {BULK_ROLE_LABEL[bulkRole]} Template
                </button>

                <label
                  className={cn(
                    'flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-colors',
                    locationsReady
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 btn-press cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <UploadSimple size={16} />
                  {locationsReady ? 'Upload Filled Template' : 'Loading location data…'}
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    disabled={!locationsReady}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBulkFile(f); e.target.value = ''; }}
                  />
                </label>

                {bulkFileName && (
                  <div className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-[var(--radius)] px-3 py-2">
                    <FileXls size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate">{bulkFileName}</span>
                    <span className="text-slate-400 ml-auto shrink-0">{bulkRows.length} row(s) read</span>
                  </div>
                )}
              </div>

              {bulkRows.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="badge bg-emerald-100 text-emerald-700 border-emerald-200">{validCount} valid</span>
                      {invalidCount > 0 && <span className="badge bg-rose-100 text-rose-700 border-rose-200">{invalidCount} invalid</span>}
                    </div>
                    {invalidCount > 0 && (
                      <span className="text-xs text-rose-600 flex items-center gap-1">
                        <Info size={13} /> Fix invalid rows in the file and re-upload before confirming
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Row</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {bulkRows.map((row) => (
                          <tr key={row.rowNumber}>
                            <td className="px-4 py-3 text-slate-500">{row.rowNumber}</td>
                            <td className="px-4 py-3 text-slate-900 font-medium">{row.raw['Name'] || '—'}</td>
                            <td className="px-4 py-3 text-slate-500">{row.raw['Email'] || '—'}</td>
                            <td className="px-4 py-3">
                              {row.errors.length === 0 ? (
                                <span className="badge bg-emerald-100 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle size={12} weight="fill" /> Valid
                                </span>
                              ) : (
                                <div className="flex items-start gap-1.5">
                                  <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" weight="fill" />
                                  <span className="text-xs text-rose-600">{row.errors.join('; ')}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setBulkRows([]); setBulkFileName(null); }}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkConfirm}
                      disabled={bulkSubmitting || invalidCount > 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press disabled:opacity-60"
                    >
                      {bulkSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Confirm &amp; Create {bulkRows.length} User(s)
                    </button>
                  </div>
                </div>
              )}

              {bulkCredentials && bulkCredentials.length > 0 && (
                <div className="card p-5 flex flex-wrap items-center justify-between gap-4 bg-emerald-50/50 border-emerald-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="text-emerald-500 shrink-0" size={18} weight="fill" />
                    <p className="text-sm text-emerald-800">
                      {bulkCredentials.length} user(s) created. Download their temporary login credentials below.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => downloadCredentialsSheet(bulkCredentials).catch(() => toast.error('Failed to generate credentials sheet'))}
                      className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press transition-colors shrink-0"
                    >
                      <DownloadSimple size={16} />
                      Download Credentials
                    </button>
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
