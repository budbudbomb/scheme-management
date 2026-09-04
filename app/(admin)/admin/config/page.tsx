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
  Clipboard,
  ShieldCheck
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────
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

// ── Initial Seed Data ─────────────────────────────────────────────────
const INITIAL_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt1', name: 'Casual Leave' },
  { id: 'lt2', name: 'Medical Leave' },
  { id: 'lt3', name: 'Earned Leave' },
  { id: 'lt4', name: 'Special Leave' },
];

const INITIAL_POLICIES: LeavePolicy[] = [
  { id: 'p1', employeeType: 'Intern',                 leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p2', employeeType: 'CM Fellow',              leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p3', employeeType: 'Program Co-ordinator',   leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p4', employeeType: 'Program Manager',        leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p5', employeeType: 'Senior Program Manager', leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p6', employeeType: 'Chief Program Manager',  leaveTypeId: 'lt1', leavesAllowed: 12 },
  { id: 'p7', employeeType: 'CM Fellow',              leaveTypeId: 'lt2', leavesAllowed: 10 },
  { id: 'p8', employeeType: 'CM Fellow',              leaveTypeId: 'lt3', leavesAllowed: 15 },
  { id: 'p9', employeeType: 'Intern',                 leaveTypeId: 'lt2', leavesAllowed: 8 },
];

type PolicySubTab = 'leavetype' | 'policy';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function ConfigPage() {
  // ── Leave Types State ──
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(INITIAL_LEAVE_TYPES);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [typeSaved, setTypeSaved] = useState(false);

  // ── Policies State ──
  const [policies, setPolicies] = useState<LeavePolicy[]>(INITIAL_POLICIES);
  const [activeSubTab, setActiveSubTab] = useState<PolicySubTab>('leavetype');

  // Policy Form State
  const [employeeType, setEmployeeType] = useState(EMPLOYEE_TYPES[0]);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState(INITIAL_LEAVE_TYPES[0].id);
  const [leavesAllowed, setLeavesAllowed] = useState('12');
  const [editPolicy, setEditPolicy] = useState<LeavePolicy | null>(null);
  const [policySaved, setPolicySaved] = useState(false);

  // ── Handlers: Leave Types ──
  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (leaveTypes.some(lt => lt.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('A leave type with this name already exists');
      return;
    }
    const created: LeaveType = { id: `lt_${uid()}`, name: trimmed };
    setLeaveTypes(prev => [...prev, created]);
    setNewTypeName('');
    setTypeSaved(true);
    toast.success(`Added leave type: ${trimmed}`);
    setTimeout(() => setTypeSaved(false), 2000);
  };

  const startEditType = (lt: LeaveType) => {
    setEditingTypeId(lt.id);
    setEditingTypeName(lt.name);
  };

  const saveEditType = (id: string) => {
    const trimmed = editingTypeName.trim();
    if (!trimmed) return;
    setLeaveTypes(prev => prev.map(lt => lt.id === id ? { ...lt, name: trimmed } : lt));
    setEditingTypeId(null);
    toast.success('Leave type updated');
  };

  const handleDeleteType = (id: string) => {
    const lt = leaveTypes.find(l => l.id === id);
    if (!lt) return;
    if (policies.some(p => p.leaveTypeId === id)) {
      if (!confirm(`"${lt.name}" is used in one or more leave policies. Deleting it will also remove associated policies. Continue?`)) {
        return;
      }
      setPolicies(prev => prev.filter(p => p.leaveTypeId !== id));
    }
    setLeaveTypes(prev => prev.filter(l => l.id !== id));
    toast.info(`Deleted "${lt.name}"`);
  };

  // ── Handlers: Policies ──
  const existingForCombo = policies.find(
    p => p.employeeType === employeeType && p.leaveTypeId === selectedLeaveTypeId && p.id !== editPolicy?.id
  );

  const formValid = employeeType && selectedLeaveTypeId && leavesAllowed.trim() !== '' && !isNaN(Number(leavesAllowed)) && Number(leavesAllowed) >= 0;

  const handleSavePolicy = () => {
    if (!formValid) return;
    const count = Number(leavesAllowed);

    if (editPolicy) {
      setPolicies(prev => prev.map(p => p.id === editPolicy.id ? {
        ...p,
        employeeType,
        leaveTypeId: selectedLeaveTypeId,
        leavesAllowed: count,
      } : p));
      setEditPolicy(null);
      setPolicySaved(true);
      toast.success('Policy updated successfully');
      setTimeout(() => setPolicySaved(false), 2000);
    } else {
      if (existingForCombo) {
        setPolicies(prev => prev.map(p => p.id === existingForCombo.id ? { ...p, leavesAllowed: count } : p));
        toast.success(`Updated existing policy for ${employeeType}`);
      } else {
        const newP: LeavePolicy = {
          id: `p_${uid()}`,
          employeeType,
          leaveTypeId: selectedLeaveTypeId,
          leavesAllowed: count,
        };
        setPolicies(prev => [...prev, newP]);
        toast.success(`Policy saved for ${employeeType}`);
      }
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 2000);
    }
  };

  const startEditPolicy = (p: LeavePolicy) => {
    setEditPolicy(p);
    setEmployeeType(p.employeeType);
    setSelectedLeaveTypeId(p.leaveTypeId);
    setLeavesAllowed(String(p.leavesAllowed));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditPolicy = () => {
    setEditPolicy(null);
    setEmployeeType(EMPLOYEE_TYPES[0]);
    setSelectedLeaveTypeId(leaveTypes[0]?.id || '');
    setLeavesAllowed('12');
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
    toast.info('Leave policy removed');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Master Configuration</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure system-wide leave policies and employee quotas for the CMYP program</p>
      </div>

      {/* Primary Section Header: Leave Policy only (Task Priorities, Survey Types, Exit Certificate removed as requested) */}
      <div className="flex border-b border-slate-200">
        <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 -mb-px">
          <Clipboard size={17} weight="fill" />
          <span>Leave Policy</span>
        </div>
      </div>

      {/* Sub-tabs: Leave Type vs Leave Policy */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-2 rounded-xl py-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('leavetype')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer',
            activeSubTab === 'leavetype'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <ListBullets size={17} weight={activeSubTab === 'leavetype' ? 'bold' : 'regular'} />
          <span>Leave Type</span>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            activeSubTab === 'leavetype' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
          )}>
            {leaveTypes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('policy')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer',
            activeSubTab === 'policy'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <ClipboardText size={17} weight={activeSubTab === 'policy' ? 'bold' : 'regular'} />
          <span>Leave Policy</span>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            activeSubTab === 'policy' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
          )}>
            {policies.length}
          </span>
        </button>
      </div>

      {/* ── SUB-TAB 1: LEAVE TYPES ── */}
      {activeSubTab === 'leavetype' && (
        <div className="space-y-6">
          {/* Add Leave Type Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Add New Leave Type</h2>
            <form onSubmit={handleAddType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Leave Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Casual Leave, Medical Leave, Compensatory Off, Maternity Leave"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  className="w-full max-w-lg text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                <span>+ Add Leave Type</span>
              </button>
            </form>
          </div>

          {/* Configured Leave Types List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Configured Leave Types ({leaveTypes.length})
            </div>
            <div className="space-y-2.5 max-w-2xl">
              {leaveTypes.map((lt, idx) => (
                <div
                  key={lt.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {editingTypeId === lt.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTypeName}
                          onChange={e => setEditingTypeName(e.target.value)}
                          className="text-sm font-semibold text-slate-800 border border-indigo-400 rounded-lg px-2.5 py-1 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveEditType(lt.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-md"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTypeId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">{lt.name}</span>
                    )}
                  </div>
                  {editingTypeId !== lt.id && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditType(lt)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        title="Edit name"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteType(lt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        title="Delete leave type"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: LEAVE POLICY (QUOTAS PER DESIGNATION) ── */}
      {activeSubTab === 'policy' && (
        <div className="space-y-6">
          {/* Configure Leave Policy Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editPolicy ? 'Edit Leave Policy' : 'Configure Leave Policy'}
                </h2>
                <p className="text-xs text-slate-500">Assign annual leave quota to specific employee roles</p>
              </div>
              {editPolicy && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                  Editing Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Employee Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employee Type *
                </label>
                <select
                  value={employeeType}
                  onChange={e => setEmployeeType(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {EMPLOYEE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Leave Type *
                </label>
                <select
                  value={selectedLeaveTypeId}
                  onChange={e => setSelectedLeaveTypeId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </select>
              </div>

              {/* No. of Leaves Allowed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  No. of Leaves Allowed (Days / Year) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={leavesAllowed}
                  onChange={e => setLeavesAllowed(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={!formValid}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer',
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
                  type="button"
                  onClick={cancelEditPolicy}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Configured Policies Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Configured Policies ({policies.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">Employee Type</th>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Leaves Allowed</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.map((p, i) => {
                    const ltName = leaveTypes.find(lt => lt.id === p.leaveTypeId)?.name || 'Custom';
                    const isEditing = editPolicy?.id === p.id;
                    return (
                      <tr key={p.id} className={cn('transition-colors', isEditing ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60')}>
                        <td className="px-5 py-4 text-slate-400 text-xs">{i + 1}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{p.employeeType}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {ltName}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-base font-extrabold text-slate-900">{p.leavesAllowed}</span>
                          <span className="text-xs text-slate-500 ml-1">Days / Year</span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEditPolicy(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                              title="Edit policy"
                            >
                              <PencilSimple size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePolicy(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                              title="Delete policy"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
