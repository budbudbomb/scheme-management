import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth/context';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CMYP Portal — Madhya Pradesh Youth Program',
    template: '%s | CMYP Portal',
  },
  description:
    'Chief Minister Youth Program portal for CMYPDP Fellow Program and CMYIGGP Intern Program management across Madhya Pradesh.',
  keywords: ['CMYPDP', 'CMYIGGP', 'youth program', 'Madhya Pradesh', 'government portal'],
  robots: 'noindex, nofollow', // Internal government portal
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '0.875rem',
            },
            classNames: {
              success: 'border-emerald-200 bg-emerald-50',
              error:   'border-rose-200 bg-rose-50',
              warning: 'border-amber-200 bg-amber-50',
              info:    'border-sky-200 bg-sky-50',
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
