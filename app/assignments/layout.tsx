'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
