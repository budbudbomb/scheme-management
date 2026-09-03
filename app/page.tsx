import { redirect } from 'next/navigation';
// Root route — middleware handles auth and redirects to role-specific dashboard.
// This is a fallback in case middleware doesn't catch it.
export default function RootPage() {
  redirect('/login');
}
