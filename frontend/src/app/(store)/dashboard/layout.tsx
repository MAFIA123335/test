import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
