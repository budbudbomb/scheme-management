'use client';

import { useState } from 'react';
import { GearSix, Clipboard, Tag, Question, File } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const TABS = [
  { id: 'leave', label: 'Leave Policy', icon: Clipboard },
  { id: 'priorities', label: 'Task Priorities', icon: Tag },
  { id: 'survey', label: 'Survey Types', icon: Question },
  { id: 'certificate', label: 'Exit Certificate', icon: File },
];

const SURVEY_TYPES = [
  { id: 'single_choice', label: 'Single Choice', desc: 'Respondent selects one option from a list.' },
  { id: 'multiple_choice', label: 'Multiple Choice', desc: 'Respondent selects multiple options.' },
  { id: 'rating_scale', label: 'Rating Scale', desc: 'Numeric scale rating (e.g. 1–5 or 1–10).' },
  { id: 'dichotomous', label: 'Dichotomous', desc: 'Yes/No or True/False binary response.' },
  { id: 'descriptive', label: 'Descriptive', desc: 'Open-ended text or media response.' },
];

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState('leave');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Master Configuration</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure system-wide settings for the CMYP program</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scroll-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`config-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              activeTab === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon size={16} weight={activeTab === id ? 'fill' : 'regular'} />
            {label}
          </button>
        ))}
      </div>

      {/* Leave Policy */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {(['fellow', 'intern'] as const).map((role) => (
            <div key={role} className="card p-6">
              <h2 className="font-semibold text-slate-900 capitalize mb-4">{role} Leave Policy</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'casualLeavePerMonth', label: 'Casual Leave / Month', fixed: true, value: 1 },
                  { key: 'earnedLeavePerYear', label: 'Earned Leave / Year', fixed: false, value: role === 'fellow' ? 15 : 12 },
                  { key: 'medicalLeavePerYear', label: 'Medical Leave / Year', fixed: false, value: role === 'fellow' ? 10 : 8 },
                  { key: 'specialLeavePerYear', label: 'Special Leave / Year', fixed: false, value: role === 'fellow' ? 5 : 3 },
                ].map(({ key, label, fixed, value }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={value}
                        min={0}
                        max={365}
                        readOnly={fixed}
                        className={cn(
                          'w-20 px-3 py-2 text-sm rounded-[var(--radius)] border text-slate-900',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-400',
                          fixed ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200'
                        )}
                      />
                      {fixed && <span className="text-xs text-slate-400">Fixed by policy</span>}
                    </div>
                  </div>
                ))}
              </div>
              {!true && (
                <button
                  onClick={() => toast.success('Leave policy saved')}
                  className="mt-4 px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press"
                >
                  Save Policy
                </button>
              )}
              <button
                onClick={() => toast.success(`${role} leave policy saved`)}
                className="mt-5 px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press"
              >
                Save Changes
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task Priorities */}
      {activeTab === 'priorities' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Task Priority Levels</h2>
          <div className="space-y-3">
            {[
              { value: 'high', label: 'High', color: 'rose', desc: 'Urgent tasks requiring immediate attention' },
              { value: 'medium', label: 'Medium', color: 'amber', desc: 'Standard priority tasks' },
              { value: 'low', label: 'Low', color: 'slate', desc: 'Non-urgent background tasks' },
            ].map(({ value, label, color, desc }) => (
              <div key={value} className="flex items-center gap-4 p-4 rounded-[var(--radius)] border border-slate-200">
                <span className={`badge bg-${color}-100 text-${color}-700 border-${color}-200 shrink-0`}>{label}</span>
                <div className="flex-1">
                  <input
                    type="text"
                    defaultValue={label}
                    className="w-32 px-2 py-1 text-sm rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Survey Question Types */}
      {activeTab === 'survey' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Survey Question Types</h2>
          <p className="text-sm text-slate-500 mb-4">Reference list — these types are available when creating surveys</p>
          <div className="space-y-3">
            {SURVEY_TYPES.map(({ id, label, desc }) => (
              <div key={id} className="flex items-start gap-3 p-4 rounded-[var(--radius)] border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Question size={16} className="text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">{label}</div>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exit Certificate */}
      {activeTab === 'certificate' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Exit Certificate Template</h2>
          <div className="border-2 border-dashed border-slate-300 rounded-[var(--radius-lg)] p-8 text-center">
            <File size={32} className="text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium mb-1">Upload certificate template</p>
            <p className="text-xs text-slate-400 mb-4">PDF or DOCX format, max 5MB</p>
            {/* TODO: Wire to backend file upload endpoint */}
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer btn-press">
              <input type="file" accept=".pdf,.docx" className="sr-only" onChange={() => toast.info('File upload wired to backend')} />
              Choose File
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
