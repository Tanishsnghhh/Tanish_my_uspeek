'use client';

import { Sidebar } from './sidebar';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isAssignmentsPage = pathname.startsWith('/assignments') || pathname.startsWith('/employeeassignmnetpage');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className={`flex-1 p-6 ${isAssignmentsPage ? 'ml-64' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
}