'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeSlash,
  ArrowRight,
  Warning,
  Key,
  ShieldCheck,
  UserCheck,
  Sparkle
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/auth/context';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    role: 'Chief Program Manager',
    shortLabel: 'CPM',
    subtitle: 'Dr. Rajesh Verma • State PMU Lead',
    email: 'cpm@cmyp.mp.gov.in',
    pass: 'cpm123',
    color: 'bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-800 border-indigo-200 hover:border-indigo-300',
    badgeColor: 'bg-indigo-200/80 text-indigo-900',
  },
  {
    role: 'Senior Program Manager',
    shortLabel: 'SPM',
    subtitle: 'Pooja Sharma • Operations Lead',
    email: 'spm@cmyp.mp.gov.in',
    pass: 'spm123',
    color: 'bg-violet-50/90 hover:bg-violet-100/90 text-violet-800 border-violet-200 hover:border-violet-300',
    badgeColor: 'bg-violet-200/80 text-violet-900',
  },
  {
    role: 'PC',
    shortLabel: 'PC',
    subtitle: 'Anjali Verma • Bhopal District',
    email: 'pc.bhopal@cmyp.mp.gov.in',
    pass: 'pc123',
    color: 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200 hover:border-emerald-300',
    badgeColor: 'bg-emerald-200/80 text-emerald-900',
  },
  {
    role: 'Fellow',
    shortLabel: 'Fellow',
    subtitle: 'Vikram Singh • Indore District',
    email: 'fellow.indore@cmyp.mp.gov.in',
    pass: 'fellow123',
    color: 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border-amber-200 hover:border-amber-300',
    badgeColor: 'bg-amber-200/80 text-amber-900',
  },
  {
    role: 'Intern',
    shortLabel: 'Intern',
    subtitle: 'Priya Patel • Ujjain Block',
    email: 'intern.ujjain@cmyp.mp.gov.in',
    pass: 'intern123',
    color: 'bg-sky-50/90 hover:bg-sky-100/90 text-sky-800 border-sky-200 hover:border-sky-300',
    badgeColor: 'bg-sky-200/80 text-sky-900',
  },
];

export default function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setServerError(msg);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    login(email, pass).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setServerError(msg);
    });
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-slate-500 mt-1 text-sm">
          Sign in to access your role-based dashboard
        </p>
      </div>

      {/* Demo Quick Accounts Banner with CPM, SPM, PC, Fellow, Intern */}
      <div className="mb-6 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Key size={15} className="text-indigo-600" />
            <span>Demo Accounts (1-Click Login):</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
            Instant Access
          </span>
        </div>

        {/* Top Row: Chief Program Manager & Senior Program Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.slice(0, 2).map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleQuickLogin(acc.email, acc.pass)}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 text-left shadow-2xs hover:shadow-xs cursor-pointer',
                acc.color
              )}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="truncate">{acc.role}</span>
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded', acc.badgeColor)}>
                    {acc.shortLabel}
                  </span>
                </div>
                <div className="text-[10px] opacity-70 font-normal truncate mt-0.5">
                  {acc.subtitle}
                </div>
              </div>
              <span className="shrink-0 flex items-center gap-0.5 text-[11px] font-bold opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all whitespace-nowrap">
                Log in →
              </span>
            </button>
          ))}
        </div>

        {/* Bottom Row: PC, Fellow, Intern */}
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.slice(2).map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleQuickLogin(acc.email, acc.pass)}
              className={cn(
                'group flex flex-col justify-between p-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 text-left shadow-2xs hover:shadow-xs cursor-pointer',
                acc.color
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{acc.role}</span>
                <span className={cn('text-[9px] font-bold px-1 py-0.2 rounded', acc.badgeColor)}>
                  {acc.shortLabel}
                </span>
              </div>
              <div className="text-[10px] opacity-70 font-normal truncate mt-0.5">
                {acc.subtitle.split('•')[0]}
              </div>
              <div className="mt-2 text-[10px] font-bold opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-right">
                Log in →
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email address
          </label>
          <div className="relative">
            <EnvelopeSimple
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              weight="regular"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
                'border bg-white text-slate-900 placeholder:text-slate-400',
                'transition-shadow duration-150',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                errors.email
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <Warning size={12} />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKey
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              weight="regular"
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register('password')}
              className={cn(
                'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm',
                'border bg-white text-slate-900 placeholder:text-slate-400',
                'transition-shadow duration-150',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                errors.password
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <Warning size={12} />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
            <Warning className="text-rose-500 shrink-0 mt-0.5" size={16} weight="fill" />
            <p className="text-sm text-rose-700">{serverError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
            'text-white font-semibold text-sm',
            'py-3 rounded-xl shadow-sm',
            'transition-all duration-150 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100'
          )}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account? <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Apply here</Link>
      </p>
    </div>
  );
}
