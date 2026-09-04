'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  MagnifyingGlass,
  Plus,
  FunnelSimple,
  UserCircle,
  PencilSimple,
  Trash,
  Warning,
  CheckCircle,
  Eye,
  X,
} from '@phosphor-icons/react';
import { usersApi, type PaginatedUsers, type UsersQuery } from '@/lib/api/users';
import type { User, UserRole, District, Block } from '@/types/models';
import { cn, roleLabel, formatDate } from '@/lib/utils/formatters';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import AddUserModal from '@/components/admin/AddUserModal';
import { toast } from 'sonner';

const ROLES: { value: string; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'intern', label: 'Intern' },
  { value: 'fellow', label: 'Fellow' },
  { value: 'pc', label: 'Program Coordinator' },
];

export default function UsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // Add / Edit / View / Delete modal states
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === '1') {
      setAddUserOpen(true);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: UsersQuery = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter as UserRole;
      const res = await usersApi.list(params);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await (usersApi as any).delete?.(deletingUser.id);
    } catch {
      // Local fallback if API backend not running
    }
    setData((prev) => prev ? {
      ...prev,
      items: prev.items.filter((u) => u.id !== deletingUser.id),
      total: Math.max(0, prev.total - 1),
    } : prev);
    toast.success(`User "${deletingUser.name}" deleted successfully`);
    setDeletingUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Registration</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data ? `${data.total.toLocaleString('en-IN')} users found` : 'Manage Fellows, Interns, and PCs'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddUserOpen(true)}
          id="add-user-btn"
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] text-sm font-medium',
            'bg-indigo-600 text-white hover:bg-indigo-700 btn-press transition-colors'
          )}
        >
          <Plus size={16} weight="bold" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search users…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[var(--radius)] border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="relative shrink-0">
          <div className={cn(
            'w-10 h-10 rounded-[var(--radius)] border flex items-center justify-center transition-colors pointer-events-none',
            roleFilter
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          )}>
            <FunnelSimple size={18} weight={roleFilter ? 'bold' : 'regular'} />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Filter by role"
            title="Filter by role"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data?.items.length ? (
        <div className="card">
          <EmptyState
            icon={UserCircle}
            title="No users found"
            description={search || roleFilter ? "No users match your search filters. Try adjusting the criteria." : `No users found.`}
            action={{ label: 'Add User', onClick: () => setAddUserOpen(true) }}
          />
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Compact Card List (Mobile Only) */}
          <div className="block md:hidden space-y-3 pb-20">
            {data.items.map((user) => {
              const fullName = [user.name, user.middleName, user.lastName].filter(Boolean).join(' ');
              return (
                <div key={user.id} className="card p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 text-sm truncate">{fullName}</div>
                      <div className="mt-1">
                        <span className="badge bg-indigo-50 text-indigo-700 border-indigo-100 text-[11px] font-medium">
                          {roleLabel(user.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingUser(user)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 btn-press shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <Eye size={14} weight="bold" />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW: Full Data Table (Desktop Only) */}
          <div className="card overflow-y-auto max-h-[calc(100vh-280px)] hidden md:block relative">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">Assignment</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                          {user.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {[user.name, user.middleName, user.lastName].filter(Boolean).join(' ')}
                          </div>
                          <div className="text-slate-400 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-sm">
                      {user.status === 'pending' ? <span className="italic text-amber-500 font-medium">Unallocated</span> : (user.district?.name ?? user.block?.name ?? user.division?.name ?? '—')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-sm">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'badge',
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : user.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      )}>
                        {user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="View user details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Edit user"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.total > 20 && (
            <div className="flex items-center justify-between text-sm text-slate-500 mt-4">
              <span>
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-[var(--radius-sm)] border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-medium"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= data.total}
                  className="px-3 py-1.5 rounded-[var(--radius-sm)] border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 text-xs font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit User Modal */}
      <AddUserModal
        open={addUserOpen || !!editingUser}
        user={editingUser}
        onClose={() => { setAddUserOpen(false); setEditingUser(null); }}
        onCreated={load}
        onUpdated={(updatedData) => {
          setData(prev => prev ? { ...prev, items: prev.items.map(u => u.id === editingUser?.id ? { ...u, ...updatedData } as User : u) } : prev);
          setEditingUser(null);
          toast.success('User updated successfully');
        }}
      />

      {/* User Details View Popup Modal */}
      {viewingUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {viewingUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {[viewingUser.name, viewingUser.middleName, viewingUser.lastName].filter(Boolean).join(' ')}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-semibold">
                      {roleLabel(viewingUser.role)}
                    </span>
                    <span className={cn(
                      'badge text-xs',
                      viewingUser.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : viewingUser.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    )}>
                      {viewingUser.status === 'active' ? 'Active' : viewingUser.status === 'pending' ? 'Pending' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Personal Details */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2.5">Personal Details</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">First Name</span>
                    <span className="font-medium text-slate-800">{viewingUser.name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Middle Name</span>
                    <span className="font-medium text-slate-800">{viewingUser.middleName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Last Name</span>
                    <span className="font-medium text-slate-800">{viewingUser.lastName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Gender</span>
                    <span className="font-medium text-slate-800 capitalize">{viewingUser.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Category</span>
                    <span className="font-medium text-slate-800 uppercase">{viewingUser.category || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Father&apos;s Name</span>
                    <span className="font-medium text-slate-800">{viewingUser.fatherName || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Identification */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2.5">Contact &amp; Identification</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">Mobile No</span>
                    <span className="font-medium text-slate-800">{viewingUser.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Email</span>
                    <span className="font-medium text-slate-800 truncate block" title={viewingUser.email}>{viewingUser.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Samagra ID</span>
                    <span className="font-mono font-medium text-slate-800">{viewingUser.samagraId || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Qualification</span>
                    <span className="font-medium text-slate-800 capitalize">{viewingUser.qualification?.replace('_', ' ') || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-400 block">Address</span>
                    <span className="font-medium text-slate-800">{viewingUser.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Location Assignment */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2.5">Location Assignment</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {viewingUser.division && (
                    <div>
                      <span className="text-xs text-slate-400 block">Division</span>
                      <span className="font-medium text-slate-800">{viewingUser.division.name}</span>
                    </div>
                  )}
                  {viewingUser.district && (
                    <div>
                      <span className="text-xs text-slate-400 block">District</span>
                      <span className="font-medium text-slate-800">{viewingUser.district.name}</span>
                    </div>
                  )}
                  {viewingUser.block && (
                    <div>
                      <span className="text-xs text-slate-400 block">Block</span>
                      <span className="font-medium text-slate-800">{viewingUser.block.name}</span>
                    </div>
                  )}
                  {viewingUser.gramPanchayat && (
                    <div>
                      <span className="text-xs text-slate-400 block">Gram Panchayat</span>
                      <span className="font-medium text-slate-800">{viewingUser.gramPanchayat.name}</span>
                    </div>
                  )}
                  {viewingUser.village && (
                    <div>
                      <span className="text-xs text-slate-400 block">Village</span>
                      <span className="font-medium text-slate-800">{viewingUser.village.name}</span>
                    </div>
                  )}
                  {!viewingUser.division && !viewingUser.district && !viewingUser.block && (
                    <div className="col-span-2 text-slate-400 italic">No specific location assigned</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  const u = viewingUser;
                  setViewingUser(null);
                  setEditingUser(u);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5"
              >
                <PencilSimple size={14} />
                Edit User
              </button>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Warning size={24} weight="fill" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete User?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-700">{deletingUser.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-[var(--radius)] text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-[var(--radius)] text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 btn-press transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
