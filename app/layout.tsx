import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MTB Kruibeke — Mountainbike club in het Waasland',
  description:
    'MTB Kruibeke verenigt een groep mensen met een passie voor mountainbiken. Elke zondag toertocht, dinsdag training. MTB en gravel in het Waasland.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  const supabase = await createClient();
  const { data: wk2026 } = await supabase.from('wk2026_settings').select('active').single();
  const wk2026Active = wk2026?.active ?? false;

  return (
    <html lang="nl" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Header profile={current?.profile ?? null} wk2026Active={wk2026Active} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
