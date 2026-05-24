import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Communication Analytics Dashboard',
  description: 'Advanced video analysis platform for communication skills assessment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="hydrated">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}