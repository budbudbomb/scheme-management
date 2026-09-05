'use client';

import { useSyncExternalStore } from 'react';

let isKeyboardOpen = false;
const listeners = new Set<() => void>();

function isEditableElement(el: unknown): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  // Elements explicitly marked to not trigger keyboard behavior
  if (el.closest('[data-no-keyboard="true"], [data-picker="true"], [data-dropdown="true"]')) return false;
  if (el.classList.contains('no-virtual-keyboard')) return false;

  // Native select elements open picker wheels/menus, not text keypads
  if (el instanceof HTMLSelectElement) return false;

  if (el instanceof HTMLTextAreaElement) return true;
  if (el.isContentEditable) return true;

  if (el instanceof HTMLInputElement) {
    // Exclude all non-text types including date, time, select, buttons, pickers
    const nonTextTypes = [
      'checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color', 'hidden',
      'date', 'datetime-local', 'time', 'month', 'week'
    ];
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

  // 1. If focus is inside a date picker, select, or dropdown, it is NOT an on-screen text keyboard
  const isPickerOrDropdown =
    activeEl instanceof HTMLSelectElement ||
    (activeEl instanceof HTMLInputElement &&
      ['date', 'datetime-local', 'time', 'month', 'week', 'color', 'file', 'checkbox', 'radio', 'range', 'button', 'submit'].includes(activeEl.type.toLowerCase())) ||
    !!activeEl?.closest('[data-no-keyboard="true"], [data-picker="true"], [data-dropdown="true"]');

  if (isPickerOrDropdown) {
    setKeyboardState(false);
    return;
  }

  // 2. If user is focused on an editable input or textarea on mobile, they are actively typing -> hide buttons/tab bar
  const isTyping = isEditableElement(activeEl);
  if (isTyping) {
    setKeyboardState(true);
    return;
  }

  // 3. Otherwise, not typing -> show buttons/tab bar
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
