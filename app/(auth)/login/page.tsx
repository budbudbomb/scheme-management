import type { Metadata } from 'next';
import Image from 'next/image';
import LoginForm from './LoginForm';
import { LOGO_DATA_URL } from '@/lib/constants/logo';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to the CMYP Portal',
};

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] flex bg-slate-50">
      {/* Left — Lighter, vibrant corporate gradient branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-600 flex-col justify-between p-12 select-none">
        {/* Soft background ambient light patterns */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Lighter radiant glowing orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-300/25 blur-3xl pointer-events-none" />

        {/* Top Header with New Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_DATA_URL}
                alt="Good Governance Logo"
                width={42}
                height={42}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-wide drop-shadow-sm">CMYP Portal</div>
              <div className="text-blue-100/90 text-xs font-medium">Madhya Pradesh</div>
            </div>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="absolute top-1/2 -translate-y-1/2 right-8 space-y-3.5 z-10">
          {[
            { label: 'Districts Covered', value: '55' },
            { label: 'Total Interns', value: '4,695' },
            { label: 'Programs', value: '10' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-5 py-3.5 text-white shadow-lg"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="text-2xl font-extrabold tracking-tight">{stat.value}</div>
              <div className="text-xs text-blue-100/80 font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 max-w-md">
          <div className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-4">
            Chief Minister Youth Program
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
            Empowering Youth<br />
            Across Every Block
          </h1>
          <p className="mt-4 text-blue-50/90 text-sm xl:text-base leading-relaxed max-w-sm">
            A unified platform connecting Fellows, Interns, and Program Coordinators across 55 districts of Madhya Pradesh.
          </p>
        </div>

        {/* Bottom Program badges */}
        <div className="relative z-10 flex items-center gap-6">
          <div className="text-left">
            <div className="text-white font-bold text-base">CMYPDP</div>
            <div className="text-blue-100/70 text-xs">Fellow Program</div>
          </div>
          <div className="w-px h-7 bg-white/25" />
          <div className="text-left">
            <div className="text-white font-bold text-base">CMYIGGP</div>
            <div className="text-blue-100/70 text-xs">Intern Program</div>
          </div>
        </div>
      </div>

      {/* Right — Login form container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50/90 pt-20 sm:pt-10">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-3xl shadow-[0_10px_35px_-5px_rgba(15,23,42,0.08)] border border-slate-100 p-7 sm:p-9 relative">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
