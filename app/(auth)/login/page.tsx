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
    <main className="min-h-[100dvh] flex flex-col lg:flex-row relative overflow-hidden bg-gradient-to-br from-[#1c3a74] via-[#162F5E] to-[#0e1f3f]">
      {/* Soft background ambient light patterns across desktop and mobile */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft radiant ambient glow matching #162F5E palette */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-200/10 blur-3xl pointer-events-none" />

      {/* Left — Corporate branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[54%] xl:w-[56%] relative flex-col justify-between p-8 xl:p-12 z-10 select-none">
        {/* Top Header with New Logo and Full Institute Name */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
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
              <div className="text-white font-bold text-sm sm:text-base leading-snug tracking-wide drop-shadow-sm max-w-sm">
                Atal Bihari Vajpayee Institute of Good Governance and Policy Analysis
              </div>
              <div className="text-blue-100/90 text-xs font-medium mt-0.5">Madhya Pradesh</div>
            </div>
          </div>
        </div>

        {/* Main Hero Content & Horizontal Stat Cards Grid */}
        <div className="relative z-10 py-6 max-w-xl">
          <div className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-wider mb-3.5">
            Chief Minister Youth Program
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
            Empowering Youth<br />
            Across Every Block
          </h1>
          <p className="mt-3.5 text-blue-50/90 text-sm xl:text-base leading-relaxed max-w-lg">
            A unified platform connecting Fellows, Interns, and Program Coordinators across 55 districts of Madhya Pradesh.
          </p>

          {/* 3 Stat Cards in requested sequence: 4695 Interns, 55 Fellows, 10 Program Coordinators */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            {[
              { label: 'Interns', value: '4,695' },
              { label: 'Fellows', value: '55' },
              { label: 'Program Coordinators', value: '10' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 xl:p-4 text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="text-2xl xl:text-3xl font-extrabold tracking-tight">{stat.value}</div>
                <div className="text-[11px] xl:text-xs text-blue-100/80 font-medium mt-1 leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Program badges with ample bottom clearance */}
        <div className="relative z-10 flex items-center gap-6 pt-2">
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

      {/* Right / Mobile — Login form container on unified #162F5E background */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-10 relative z-10 my-auto">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-7 sm:p-8 relative">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
