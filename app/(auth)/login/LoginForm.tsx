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
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/auth/context';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const PMU_MANAGERS = [
  {
    role: 'Chief Program Manager',
    email: 'cpm@cmyp.mp.gov.in',
    pass: 'cpm123',
    color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  {
    role: 'Senior Program Manager',
    email: 'spm@cmyp.mp.gov.in',
    pass: 'spm123',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
  },
];

const FIELD_ROLES = [
  {
    role: 'PC',
    email: 'pc.bhopal@cmyp.mp.gov.in',
    pass: 'pc123',
    color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    role: 'Fellow',
    email: 'fellow.indore@cmyp.mp.gov.in',
    pass: 'fellow123',
    color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    role: 'Intern',
    email: 'intern.ujjain@cmyp.mp.gov.in',
    pass: 'intern123',
    color: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200',
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
        <p className="text-slate-500 mt-1 text-sm">
          Sign in to access your role-based dashboard
        </p>
      </div>

      {/* Demo Quick Accounts Banner - Clean Roles Only without names */}
      <div className="mb-6 card p-3.5 bg-slate-50/80 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Key size={14} className="text-indigo-600" />
          <span>Demo Accounts (1-Click Login):</span>
        </div>

        {/* Row 1: Chief Program Manager & Senior Program Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PMU_MANAGERS.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleQuickLogin(acc.email, acc.pass)}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium border transition-colors btn-press cursor-pointer',
                acc.color
              )}
            >
              <span className="font-semibold">{acc.role}</span>
              <span className="opacity-60 text-[10px]">Log in →</span>
            </button>
          ))}
        </div>

        {/* Row 2: PC, Fellow, Intern */}
        <div className="grid grid-cols-3 gap-2">
          {FIELD_ROLES.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleQuickLogin(acc.email, acc.pass)}
              className={cn(
                'flex items-center justify-between px-2.5 py-2 rounded-[var(--radius-sm)] text-xs font-medium border transition-colors btn-press cursor-pointer',
                acc.color
              )}
            >
              <span className="font-semibold">{acc.role}</span>
              <span className="opacity-60 text-[10px]">Log in →</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                'w-full pl-10 pr-4 py-3 rounded-[var(--radius)] text-sm',
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
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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
                'w-full pl-10 pr-10 py-3 rounded-[var(--radius)] text-sm',
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
          <div className="flex items-start gap-2.5 rounded-[var(--radius)] bg-rose-50 border border-rose-200 px-4 py-3">
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
            'text-white font-medium text-sm',
            'py-3 rounded-[var(--radius)]',
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
        Don&apos;t have an account? <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Apply here</Link>
      </p>
    </div>
  );
}
