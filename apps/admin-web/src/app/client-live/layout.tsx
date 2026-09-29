import type { Metadata } from 'next';
import { El_Messiri, Tajawal } from 'next/font/google';
import './client-live-root.css';

const brandFont = El_Messiri({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--cl-font-brand',
  display: 'swap',
});

const bodyFont = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--cl-font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ISP Live — البث المباشر | تجربة سينمائية فاخرة',
  description: 'مشاهدة قنوات البث المباشر بجودة سينمائية فاخرة',
};

/** تخطيط مستقل لواجهة البث العامة — هوية Obsidian Royale */
export default function ClientLiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${brandFont.variable} ${bodyFont.variable}`}>
      {children}
    </div>
  );
}
