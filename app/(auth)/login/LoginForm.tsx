'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300',
    inactiveClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  {
    role: 'Senior Program Manager',
    email: 'spm@cmyp.mp.gov.in',
    pass: 'spm123',
    activeClass: 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300',
    inactiveClass: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
  },
];

const FIELD_ROLES = [
  {
    role: 'PC',
    email: 'pc.bhopal@cmyp.mp.gov.in',
    pass: 'pc123',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300',
    inactiveClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    role: 'Fellow',
    email: 'fellow.indore@cmyp.mp.gov.in',
    pass: 'fellow123',
    activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-300',
    inactiveClass: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    role: 'Intern',
    email: 'intern.ujjain@cmyp.mp.gov.in',
    pass: 'intern123',
    activeClass: 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-300',
    inactiveClass: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200',
  },
];

export default function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('Chief Program Manager');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'cpm@cmyp.mp.gov.in',
      password: 'cpm123',
    },
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

  const handleQuickSelect = (roleName: string, email: string, pass: string) => {
    setSelectedRole(roleName);
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div>
      {/* Top Floating Circular Logo Emblem as shown in user reference */}
      <div className="flex justify-center -mt-16 sm:-mt-18 mb-4">
        <div className="w-18 h-18 rounded-full bg-white shadow-lg border border-slate-100 p-2.5 flex items-center justify-center ring-4 ring-slate-50">
          <Image
            src="/logo.png"
            alt="CMYP Logo"
            width={52}
            height={52}
            unoptimized
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">
          Sign in to access your role-based dashboard
        </p>
      </div>

      {/* Role Picker ("I am a" section matching user reference) */}
      <div className="mb-5 space-y-2">
        <label className="block text-xs font-semibold text-slate-600">
          I am a
        </label>

        {/* Row 1: PMU Leadership Roles */}
        <div className="grid grid-cols-2 gap-2">
          {PMU_MANAGERS.map((acc) => {
            const isSelected = selectedRole === acc.role;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickSelect(acc.role, acc.email, acc.pass)}
                className={cn(
                  'py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer',
                  isSelected ? acc.activeClass : acc.inactiveClass
                )}
              >
                {acc.role}
              </button>
            );
          })}
        </div>

        {/* Row 2: Field Roles */}
        <div className="grid grid-cols-3 gap-2">
          {FIELD_ROLES.map((acc) => {
            const isSelected = selectedRole === acc.role;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickSelect(acc.role, acc.email, acc.pass)}
                className={cn(
                  'py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer',
                  isSelected ? acc.activeClass : acc.inactiveClass
                )}
              >
                {acc.role}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1">
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
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                errors.email
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <Warning size={12} />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                errors.password
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlash size={16} weight="regular" />
              ) : (
                <Eye size={16} weight="regular" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <Warning size={12} />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <Warning size={16} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Submit button with vibrant blue-indigo gradient */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full py-3 px-4 rounded-xl text-sm font-semibold text-white cursor-pointer',
            'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700',
            'shadow-md hover:shadow-lg shadow-blue-500/20 transition-all duration-150',
            'flex items-center justify-center gap-2',
            isSubmitting && 'opacity-70 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </button>
      </form>

      {/* Register redirect */}
      <p className="text-center text-xs text-slate-500 mt-5">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          Apply here
        </Link>
      </p>
    </div>
  );
}
