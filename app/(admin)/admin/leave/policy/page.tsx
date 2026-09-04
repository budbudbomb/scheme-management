'use client';

import { useState } from 'react';
import {
  ClipboardText,
  ListBullets,
  Plus,
  Trash,
  FloppyDisk,
  CheckCircle,
  PencilSimple,
  X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';

// ─── Types ────────────────────────────────────────────────────
interface LeaveType {
  id: string;
  name: string;
}

interface LeavePolicy {
  id: string;
  employeeType: string;
  leaveTypeId: string;
  leavesAllowed: number;
}

const EMPLOYEE_TYPES = [
  'Intern',
  'CM Fellow',
  'Program Co-ordinator',
  'Program Manager',
  'Senior Program Manager',
  'Chief Program Manager',
];

// ─── Initial seed data ────────────────────────────────────────
const INITIAL_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt1', name: 'Casual Leave' },
];

const INITIAL_POLICIES: LeavePolicy[] = [
  { id: 'p1', employeeType: 'Intern',                 leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p2', employeeType: 'CM Fellow',              leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p3', employeeType: 'Program Co-ordinator',   leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p4', employeeType: 'Program Manager',        leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p5', employeeType: 'Senior Program Manager', leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p6', employeeType: 'Chief Program Manager',  leaveTypeId: 'lt1', leavesAllowed: 12 },
];

type Tab = 'leavetype' | 'policy';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
}) {
  return (
    <input
      type={type}
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
    />
  );
}

function SelectInput({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full text-sm rounded-[var(--radius)] border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 disabled:opacity-50 disabled:bg-slate-50 transition"
    >
      {children}
    </select>
  );
}

export default function LeavePolicyMasterPage() {
  const [tab, setTab] = useState<Tab>('leavetype');

  // ── Leave Type state ──────────────────────────────────────────
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(INITIAL_LEAVE_TYPES);
  const [newLTName, setNewLTName] = useState('');
  const [editLT, setEditLT] = useState<LeaveType | null>(null);
  const [ltSaved, setLtSaved] = useState(false);

  // ── Leave Policy state ────────────────────────────────────────
  const [policies, setPolicies] = useState<LeavePolicy[]>(INITIAL_POLICIES);
  const [empType, setEmpType] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [leavesAllowed, setLeavesAllowed] = useState('');
  const [editPolicy, setEditPolicy] = useState<LeavePolicy | null>(null);
  const [policySaved, setPolicySaved] = useState(false);

  // ── Leave Type handlers ───────────────────────────────────────
  const handleSaveLT = () => {
    const trimmed = (editLT ? editLT.name : newLTName).trim();
    if (!trimmed) return;

    if (editLT) {
      setLeaveTypes((prev) =>
        prev.map((item) => (item.id === editLT.id ? { ...item, name: trimmed } : item))
      );
      setEditLT(null);
    } else {
      setLeaveTypes((prev) => [...prev, { id: uid(), name: trimmed }]);
      setNewLTName('');
    }
    setLtSaved(true);
    setTimeout(() => setLtSaved(false), 2000);
  };

  const handleDeleteLT = (id: string) => {
    setLeaveTypes((prev) => prev.filter((item) => item.id !== id));
    setPolicies((prev) => prev.filter((p) => p.leaveTypeId !== id));
    if (editLT?.id === id) setEditLT(null);
  };

  // ── Leave Policy handlers ─────────────────────────────────────
  const handleSavePolicy = () => {
    if (!empType || !leaveTypeId || !leavesAllowed) return;
    const num = parseInt(leavesAllowed, 10);
    if (isNaN(num) || num < 0) return;

    if (editPolicy) {
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === editPolicy.id
            ? { ...p, employeeType: empType, leaveTypeId, leavesAllowed: num }
            : p
        )
      );
      setEditPolicy(null);
    } else {
      // If policy already exists for this employee + leaveType combination, update it
      const existing = policies.find(
        (p) => p.employeeType === empType && p.leaveTypeId === leaveTypeId
      );
      if (existing) {
        setPolicies((prev) =>
          prev.map((p) => (p.id === existing.id ? { ...p, leavesAllowed: num } : p))
        );
      } else {
        setPolicies((prev) => [
          ...prev,
          { id: uid(), employeeType: empType, leaveTypeId, leavesAllowed: num },
        ]);
      }
    }

    setEmpType('');
    setLeaveTypeId('');
    setLeavesAllowed('');
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2000);
  };

  const startEditPolicy = (p: LeavePolicy) => {
    setEditPolicy(p);
    setEmpType(p.employeeType);
    setLeaveTypeId(p.leaveTypeId);
    setLeavesAllowed(String(p.leavesAllowed));
  };

  const cancelEditPolicy = () => {
    setEditPolicy(null);
    setEmpType('');
    setLeaveTypeId('');
    setLeavesAllowed('');
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    if (editPolicy?.id === id) cancelEditPolicy();
  };

  const formValid = Boolean(empType && leaveTypeId && leavesAllowed !== '');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Leave Policy Master
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure leave types and policy quotas per employee designation
          </p>
        </div>
      </div>

      {/* ── Master Tabs ────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-1">
        <button
          onClick={() => setTab('leavetype')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
            tab === 'leavetype'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <ListBullets size={17} weight={tab === 'leavetype' ? 'bold' : 'regular'} />
          Leave Type
          <span
            className={cn(
              'ml-1 text-xs px-2 py-0.5 rounded-full font-bold',
              tab === 'leavetype'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {leaveTypes.length}
          </span>
        </button>

        <button
          onClick={() => setTab('policy')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
            tab === 'policy'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <ClipboardText size={17} weight={tab === 'policy' ? 'bold' : 'regular'} />
          Leave Policy
          <span
            className={cn(
              'ml-1 text-xs px-2 py-0.5 rounded-full font-bold',
              tab === 'policy'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {policies.length}
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════════
          TAB 1 — LEAVE TYPE
      ════════════════════════════════════════════ */}
      {tab === 'leavetype' && (
        <div className="space-y-5">
          {/* Form */}
          <div className={cn('card p-5', editLT && 'border-indigo-200 bg-indigo-50/30')}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-900">
                {editLT ? 'Edit Leave Type' : 'Add New Leave Type'}
              </div>
              {editLT && (
                <button
                  onClick={() => setEditLT(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="max-w-md space-y-4">
              <div>
                <FieldLabel>Leave Type Name</FieldLabel>
                <TextInput
                  value={editLT ? editLT.name : newLTName}
                  onChange={(val) => {
                    if (editLT) setEditLT({ ...editLT, name: val });
                    else setNewLTName(val);
                  }}
                  placeholder="e.g. Casual Leave, Medical Leave, Compensatory Off"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveLT}
                  disabled={!(editLT ? editLT.name.trim() : newLTName.trim())}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius)] text-sm font-semibold transition-all',
                    (editLT ? editLT.name.trim() : newLTName.trim())
                      ? ltSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {ltSaved ? (
                    <>
                      <CheckCircle size={16} weight="bold" />
                      Saved!
                    </>
                  ) : editLT ? (
                    <>
                      <FloppyDisk size={16} weight="bold" />
                      Update Leave Type
                    </>
                  ) : (
                    <>
                      <Plus size={16} weight="bold" />
                      Add Leave Type
                    </>
                  )}
                </button>
                {editLT && (
                  <button
                    onClick={() => setEditLT(null)}
                    className="px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Configured Leave Types ({leaveTypes.length})
              </span>
            </div>
            {leaveTypes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No leave types configured yet. Add one above.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {leaveTypes.map((lt, i) => (
                  <div
                    key={lt.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 text-sm font-medium text-slate-900">{lt.name}</div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditLT(lt)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteLT(lt.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB 2 — LEAVE POLICY
      ════════════════════════════════════════════ */}
      {tab === 'policy' && (
        <div className="space-y-5">
          {/* Form */}
          <div className={cn('card p-5', editPolicy && 'border-indigo-200 bg-indigo-50/30')}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-900">
                {editPolicy ? 'Edit Leave Policy' : 'Add Leave Policy'}
              </div>
              {editPolicy && (
                <button
                  onClick={cancelEditPolicy}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Field 1 — Employee Type */}
              <div>
                <FieldLabel>Choose Employee</FieldLabel>
                <SelectInput value={empType} onChange={setEmpType}>
                  <option value="">-- Select Employee Type --</option>
                  {EMPLOYEE_TYPES.map((et) => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </SelectInput>
              </div>

              {/* Field 2 — Leave Type */}
              <div>
                <FieldLabel>Leave Type</FieldLabel>
                <SelectInput
                  value={leaveTypeId}
                  onChange={setLeaveTypeId}
                  disabled={leaveTypes.length === 0}
                >
                  <option value="">-- Select Leave Type --</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </SelectInput>
                {leaveTypes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Add leave types in the &quot;Leave Type&quot; tab first.
                  </p>
                )}
              </div>

              {/* Field 3 — No of Leaves Allowed */}
              <div>
                <FieldLabel>No. of Leaves Allowed</FieldLabel>
                <TextInput
                  type="number"
                  min={0}
                  value={leavesAllowed}
                  onChange={(v) => {
                    if (/^\d*$/.test(v)) setLeavesAllowed(v);
                  }}
                  placeholder="e.g. 12"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleSavePolicy}
                disabled={!formValid}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius)] text-sm font-semibold transition-all',
                  formValid
                    ? policySaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                {policySaved ? (
                  <>
                    <CheckCircle size={16} weight="bold" />
                    Saved!
                  </>
                ) : editPolicy ? (
                  <>
                    <FloppyDisk size={16} weight="bold" />
                    Update Policy
                  </>
                ) : (
                  <>
                    <Plus size={16} weight="bold" />
                    Save Policy
                  </>
                )}
              </button>
              {editPolicy && (
                <button
                  onClick={cancelEditPolicy}
                  className="px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Table of policies */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Configured Policies ({policies.length})
              </span>
            </div>
            {policies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No leave policies configured yet. Configure one above.
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30">
                        {['#', 'Employee Type', 'Leave Type', 'Leaves Allowed', 'Actions'].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {policies.map((p, i) => {
                        const ltName = leaveTypes.find((lt) => lt.id === p.leaveTypeId)?.name ?? '—';
                        const isEditing = editPolicy?.id === p.id;
                        return (
                          <tr
                            key={p.id}
                            className={cn(
                              'transition-colors',
                              isEditing ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'
                            )}
                          >
                            <td className="px-5 py-3.5 text-slate-400 text-xs">{i + 1}</td>
                            <td className="px-5 py-3.5 font-medium text-slate-900">{p.employeeType}</td>
                            <td className="px-5 py-3.5">
                              <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {ltName}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-slate-900 text-base">{p.leavesAllowed}</span>
                              <span className="text-slate-400 text-xs ml-1">days / year</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEditPolicy(p)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Edit"
                                >
                                  <PencilSimple size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeletePolicy(p.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-slate-50">
                  {policies.map((p) => {
                    const ltName = leaveTypes.find((lt) => lt.id === p.leaveTypeId)?.name ?? '—';
                    return (
                      <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 text-sm truncate">{p.employeeType}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {ltName} · <span className="font-semibold text-slate-700">{p.leavesAllowed} days / year</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => startEditPolicy(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <PencilSimple size={15} />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(p.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
