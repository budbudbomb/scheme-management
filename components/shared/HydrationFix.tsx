'use client';

import { useEffect } from 'react';

/**
 * HydrationFix:
 * Neutralizes browser-extension-induced attribute mutations (such as `fdprocessedid`
 * injected by McAfee WebAdvisor or password managers on buttons/inputs) that trigger
 * React 19 / Next.js hydration mismatch overlays.
 */
export default function HydrationFix() {
  useEffect(() => {
    // Strip any lingering extension-injected attributes from the DOM
    const elements = document.querySelectorAll('[fdprocessedid]');
    elements.forEach((el) => el.removeAttribute('fdprocessedid'));

    // Intercept console.error to prevent extension-injected warnings from surfacing dev overlays
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const combined = args
        .map((a) => (typeof a === 'string' ? a : (a as Error)?.message || ''))
        .join(' ');
      if (combined.includes('fdprocessedid')) {
        return;
      }
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
