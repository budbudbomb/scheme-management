import AppShell from '@/components/layout/AppShell';

export default function PMLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="pm">{children}</AppShell>;
}
