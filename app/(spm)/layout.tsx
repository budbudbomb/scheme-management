import AppShell from '@/components/layout/AppShell';

export default function SPMLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="spm">{children}</AppShell>;
}

