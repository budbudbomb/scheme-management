'use client';

import { ShieldCheck, ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';

export default function PMUPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <ShieldCheck size={32} weight="fill" className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">PMU Dashboard</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          The Programme Management Unit (PMU) reporting dashboard is currently under development. 
          It will include state-wide analytics, program KPIs, and executive reports.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Coming Soon
        </div>
        <div className="card p-5 text-left space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Planned Features</p>
          {[
            'State-wide program KPI dashboard',
            'Division & district-level reports',
            'Cohort performance analytics',
            'Export to Excel / PDF',
            'Real-time attendance heatmap',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <Link href="/login" className="inline-flex items-center gap-2 mt-6 text-sm text-slate-500 hover:text-slate-700">
          <ArrowRight size={14} /> Back to Login
        </Link>
      </div>
    </div>
  );
}
