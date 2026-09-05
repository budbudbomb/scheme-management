'use client';

import { useSyncExternalStore } from 'react';

let isKeyboardOpen = false;
const listeners = new Set<() => void>();

function isEditableElement(el: unknown): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLInputElement) {
    const nonTextTypes = ['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color', 'hidden'];
    return !nonTextTypes.includes(el.type.toLowerCase());
  }
  return false;
}

function setKeyboardState(open: boolean) {
  if (isKeyboardOpen !== open) {
    isKeyboardOpen = open;
    if (typeof document !== 'undefined') {
      if (open) {
        document.documentElement.classList.add('keyboard-open');
      } else {
        document.documentElement.classList.remove('keyboard-open');
      }
    }
    listeners.forEach((l) => l());
  }
}

function checkKeyboard() {
  if (typeof window === 'undefined') return;
  if (window.innerWidth >= 1024) {
    setKeyboardState(false);
    return;
  }

  const activeEl = document.activeElement;
  const isInput = isEditableElement(activeEl);

  const vv = window.visualViewport;
  if (vv) {
    const heightDiff = window.innerHeight - vv.height;
    // On mobile, keyboard is at least 100px tall
    if (heightDiff > 100) {
      setKeyboardState(true);
      return;
    }
    // If viewport height is almost full (diff < 50) and no input is focused, keyboard is closed
    if (heightDiff < 50 && !isInput) {
      setKeyboardState(false);
      return;
    }
  }

  // If editable element is focused on mobile screen, keyboard is open/opening
  if (isInput) {
    setKeyboardState(true);
    return;
  }

  setKeyboardState(false);
}

// Initialize event listeners once in browser
if (typeof window !== 'undefined') {
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', checkKeyboard);
    vv.addEventListener('scroll', checkKeyboard);
  }
  window.addEventListener('resize', checkKeyboard);

  document.addEventListener('focusin', () => {
    checkKeyboard();
  });

  document.addEventListener('focusout', () => {
    // Delay to check if focus transferred to another input
    setTimeout(checkKeyboard, 50);
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return isKeyboardOpen;
}

function getServerSnapshot() {
  return false;
}

export function useVirtualKeyboard(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
