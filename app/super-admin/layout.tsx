import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Super Admin - USpeek Analytics',
  description: 'Super Admin Dashboard for USpeek Platform',
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="super-admin-app">
      {children}
    </div>
  )
}