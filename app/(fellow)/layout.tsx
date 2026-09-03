import AppShell from '@/components/layout/AppShell';

export default function FellowLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="fellow">{children}</AppShell>;
}
