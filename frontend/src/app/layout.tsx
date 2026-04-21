import type { Metadata } from 'next';
import './globals.css';
import { SupabaseProvider } from '@/lib/supabase/provider';

export const metadata: Metadata = {
  title: 'Email Scheduler System',
  description: 'Schedule and manage your emails efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
