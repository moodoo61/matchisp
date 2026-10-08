import type { Metadata } from 'next';
import { UiFontApplicator } from '@/features/settings/general/components/UiFontApplicator';
import './globals.css';

export const metadata: Metadata = {
  title: 'ISP Admin',
  description: 'نظام إدارة مكتب خدمات إنترنت',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <UiFontApplicator />
        {children}
      </body>
    </html>
  );
}
