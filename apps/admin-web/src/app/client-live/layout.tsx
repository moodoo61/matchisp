import type { Metadata } from 'next';
import './client-live-root.css';

export const metadata: Metadata = {
  title: 'ISP Live — البث المباشر | تجربة سينمائية فاخرة',
  description: 'مشاهدة قنوات البث المباشر بجودة سينمائية فاخرة',
};

/** تخطيط مستقل لواجهة البث العامة — الخط من الإعدادات العامة */
export default function ClientLiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
