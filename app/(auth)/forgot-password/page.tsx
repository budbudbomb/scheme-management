import type { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Forgot Password',
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-[400px]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <div className="card p-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-600">
              <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" fill="currentColor"/>
            </svg>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-1">Reset your password</h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Enter your registered email address and we will send you a link to reset your password.
          </p>

          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
