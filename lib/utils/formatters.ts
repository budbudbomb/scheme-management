import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { TaskStatus, TaskPriority, LeaveStatus, ExitStatus, Gender, Qualification, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types/models';

/** Tailwind class merge utility */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO date string to readable display */
export function formatDate(date: string, fmt = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(date), fmt);
  } catch {
    return date;
  }
}

/** "2 hours ago" style */
export function timeAgo(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
}

/** Format month/year label */
export function formatMonth(month: number, year: number): string {
  return format(new Date(year, month - 1), 'MMMM yyyy');
}

// ──────────────────────────────────────────────
// Status → display label + color class
// ──────────────────────────────────────────────

export function taskStatusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };
  return map[status] ?? status;
}

export function taskStatusColor(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    in_progress: 'bg-sky-100 text-sky-800 border-sky-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    overdue: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export function taskPriorityLabel(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return map[priority] ?? priority;
}

export function taskPriorityColor(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    high: 'bg-rose-100 text-rose-800 border-rose-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[priority] ?? 'bg-slate-100 text-slate-600';
}

export function leaveStatusLabel(status: LeaveStatus): string {
  const map: Record<LeaveStatus, string> = {
    applied: 'Applied',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return map[status] ?? status;
}

export function leaveStatusColor(status: LeaveStatus): string {
  const map: Record<LeaveStatus, string> = {
    applied: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export function exitStatusLabel(status: ExitStatus): string {
  const map: Record<ExitStatus, string> = {
    pending: 'Pending',
    pending_pc_review: 'Under PC Review',
    pending_pm_review: 'Under PM Review',
    approved: 'Approved',
    rejected: 'Rejected',
    force_approved: 'Force Approved',
  };
  return map[status] ?? status;
}

export function exitStatusColor(status: ExitStatus): string {
  const map: Record<ExitStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    pending_pc_review: 'bg-amber-100 text-amber-800 border-amber-200',
    pending_pm_review: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    force_approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

/** Role display names */
export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    pc: 'Program Coordinator',
    fellow: 'Fellow',
    intern: 'Intern',
    pmu: 'PMU',
    pm: 'Program Manager (HR)',
    spm_cpm: 'Senior Program Manager',
  };
  return map[role] ?? role;
}

/** Gender display names */
export function genderLabel(gender?: Gender | string): string {
  const map: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };
  return gender ? (map[gender] ?? gender) : '—';
}

/** Educational qualification display names */
export function qualificationLabel(qualification?: Qualification | string): string {
  const map: Record<string, string> = {
    '10th': '10th Pass',
    '12th': '12th Pass',
    iti_diploma: 'ITI / Diploma',
    graduate: 'Graduate',
    post_graduate: 'Post Graduate',
    other: 'Other',
  };
  return qualification ? (map[qualification] ?? qualification) : '—';
}

/** Truncate long strings */
export function truncate(str: string, maxLen = 60): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/** Convert a Blob to a download */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Complaint Formatters ────────────────────────────────────

export function complaintCategoryLabel(category: ComplaintCategory): string {
  const map: Record<ComplaintCategory, string> = {
    stipend: 'Stipend & Allowances',
    field_travel: 'Field & Travel Logistics',
    workload_tasks: 'Workload & Assignments',
    infrastructure: 'Device, SIM & Portal',
    interpersonal: 'Interpersonal Grievance',
    other: 'Other Inquiry / Issue',
  };
  return map[category] ?? category;
}

export function complaintStatusLabel(status: ComplaintStatus): string {
  const map: Record<ComplaintStatus, string> = {
    pending: 'Pending Review',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };
  return map[status] ?? status;
}

export function complaintStatusColor(status: ComplaintStatus): string {
  const map: Record<ComplaintStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export function complaintPriorityLabel(priority: ComplaintPriority): string {
  const map: Record<ComplaintPriority, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return map[priority] ?? priority;
}

export function complaintPriorityColor(priority: ComplaintPriority): string {
  const map: Record<ComplaintPriority, string> = {
    urgent: 'bg-rose-100 text-rose-800 border-rose-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-sky-100 text-sky-800 border-sky-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return map[priority] ?? 'bg-slate-100 text-slate-700';
}
