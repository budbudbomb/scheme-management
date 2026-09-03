import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to the CMYP Portal',
};

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] flex">
      {/* Left — Branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-[hsl(222,47%,11%)] flex-col justify-between p-12">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-indigo-900/30" />

        {/* Floating stat cards */}
        <div className="absolute top-1/2 -translate-y-1/2 right-8 space-y-4 opacity-80">
          {[
            { label: 'Districts Covered', value: '55' },
            { label: 'Total Interns', value: '4,695' },
            { label: 'Program Coordinators', value: '10' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4 text-white"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-white/60 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo mark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-white">
                <path d="M11 2L3 6v5c0 4.42 3.4 8.56 8 9.56C16.6 19.56 20 15.42 20 11V6l-9-4z" fill="currentColor" opacity="0.3"/>
                <path d="M11 4.18L5 7.3V11c0 3.48 2.64 6.74 6 7.56V4.18z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">CMYP Portal</div>
              <div className="text-white/50 text-xs">Madhya Pradesh</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="text-white/40 text-xs font-medium uppercase tracking-widest mb-4">
            Chief Minister Youth Program
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
            Empowering Youth<br />
            Across Every Block
          </h1>
          <p className="mt-4 text-white/60 text-base max-w-[340px] leading-relaxed">
            A unified platform connecting Fellows, Interns, and Program Coordinators across 55 districts of Madhya Pradesh.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="text-center">
            <div className="text-white font-bold text-lg">CMYPDP</div>
            <div className="text-white/40 text-xs">Fellow Program</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-white font-bold text-lg">CMYIGGP</div>
            <div className="text-white/40 text-xs">Intern Program</div>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" className="text-white">
                <path d="M11 2L3 6v5c0 4.42 3.4 8.56 8 9.56C16.6 19.56 20 15.42 20 11V6l-9-4z" fill="currentColor" opacity="0.3"/>
                <path d="M11 4.18L5 7.3V11c0 3.48 2.64 6.74 6 7.56V4.18z" fill="currentColor"/>
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm">CMYP Portal</span>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
