import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth/context';
import HydrationFix from '@/components/shared/HydrationFix';
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
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Intercept console.error for extension-injected attributes (e.g. fdprocessedid from McAfee WebAdvisor)
                var origError = console.error;
                console.error = function() {
                  var args = Array.prototype.slice.call(arguments);
                  var text = args.map(function(a) { return typeof a === 'string' ? a : ((a && a.message) || ''); }).join(' ');
                  if (text.indexOf('fdprocessedid') !== -1) {
                    return;
                  }
                  return origError.apply(console, arguments);
                };

                // Strip extension-injected attributes as soon as they are added
                if (typeof MutationObserver !== 'undefined') {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'fdprocessedid' && m.target && m.target.removeAttribute) {
                        m.target.removeAttribute('fdprocessedid');
                      }
                    }
                  });
                  observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['fdprocessedid'] });
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <HydrationFix />
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
