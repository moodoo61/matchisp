import type { Metadata } from 'next';
import './more-root.css';

export const metadata: Metadata = {
  title: 'المزيد | ماتش لينك',
  description: 'تعرّف على المزيد عن خدماتنا ورؤيتنا وقصتنا',
};

/** تخطيط مستقل لصفحة المزيد العامة */
export default function MorePublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
