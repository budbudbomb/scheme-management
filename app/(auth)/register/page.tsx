'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { Warning, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['fellow', 'intern'] as const),
});

type FormData = z.infer<typeof schema>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1"><Warning size={12} /> {msg}</p>;
}

function inputCls(hasError?: boolean) {
  return cn(
    'w-full px-3 py-2.5 text-sm rounded-[var(--radius)] border bg-white text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow',
    hasError ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'intern' },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await authApi.register(data);
      if (res.user.role === 'fellow') router.push('/fellow/pending');
      else router.push('/intern/pending');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <ShieldCheck size={28} weight="fill" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-slate-900">Join CMYP</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Register as a Fellow or Intern to participate in the program.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            
            {serverError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200 flex items-center gap-2">
                <Warning size={16} /> {serverError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Apply As</label>
              <select {...register('role')} className={inputCls(!!errors.role)}>
                <option value="intern">Intern (CMYIGGP)</option>
                <option value="fellow">Fellow (CMYPDP)</option>
              </select>
              <FieldError msg={errors.role?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" {...register('name')} placeholder="Your full name" className={inputCls(!!errors.name)} />
              <FieldError msg={errors.name?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" {...register('email')} placeholder="you@example.com" className={inputCls(!!errors.email)} />
              <FieldError msg={errors.email?.message} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number (optional)</label>
              <input type="tel" {...register('phone')} placeholder="+91 XXXXX XXXXX" className={inputCls(!!errors.phone)} />
              <FieldError msg={errors.phone?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" {...register('password')} placeholder="Min 8 characters" className={inputCls(!!errors.password)} />
              <FieldError msg={errors.password?.message} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-[var(--radius)] text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 btn-press disabled:opacity-60"
            >
              {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Register
            </button>
            
            <p className="mt-4 text-center text-sm text-slate-600">
              Already registered? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in instead</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
