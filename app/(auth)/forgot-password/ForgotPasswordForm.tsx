'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EnvelopeSimple, CheckCircle, Warning } from '@phosphor-icons/react';
import { authApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils/formatters';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-emerald-600" size={24} weight="fill" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">Check your email</h3>
        <p className="text-sm text-slate-500">
          We sent a password reset link to{' '}
          <span className="font-medium text-slate-700">{getValues('email')}</span>
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Did not receive it? Check your spam folder or contact your admin.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email address
        </label>
        <div className="relative">
          <EnvelopeSimple
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-[var(--radius)] text-sm border bg-white',
              'text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              errors.email ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
            )}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
            <Warning size={12} /> {errors.email.message}
          </p>
        )}
      </div>

      {serverError && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-[var(--radius)] px-4 py-3">
          <Warning className="text-rose-500 shrink-0 mt-0.5" size={16} weight="fill" />
          <p className="text-sm text-rose-700">{serverError}</p>
        </div>
      )}

      <button
        id="forgot-submit"
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full flex items-center justify-center gap-2',
          'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
          'text-white font-medium text-sm py-3 rounded-[var(--radius)]',
          'transition-all duration-150',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending…
          </>
        ) : (
          'Send reset link'
        )}
      </button>
    </form>
  );
}
