import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextAuthProvider } from '@/components/auth-provider';
import { SWRProvider } from '@/components/swr-provider';
import { ServiceWorkerProvider } from '@/components/service-worker-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project Management',
  description: 'Enterprise Project Management System',
  generator: 'v0.dev',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <SWRProvider>
            <ServiceWorkerProvider>
              {children}
              <Toaster />
            </ServiceWorkerProvider>
          </SWRProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
