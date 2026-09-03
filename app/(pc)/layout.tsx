import AppShell from '@/components/layout/AppShell';

export default function PCLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="pc">{children}</AppShell>;
}
