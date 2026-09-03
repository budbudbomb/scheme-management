import AppShell from '@/components/layout/AppShell';

export default function InternLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="intern">{children}</AppShell>;
}
