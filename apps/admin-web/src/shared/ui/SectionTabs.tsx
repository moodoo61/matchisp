'use client';

import Link from 'next/link';

export type SectionTab = {
  href: string;
  label: string;
  active?: boolean;
};

type Props = {
  tabs: SectionTab[];
};

/** تبويبات أقسام أعلى الصفحة */
export function SectionTabs({ tabs }: Props) {
  return (
    <nav className="section-tabs" aria-label="أقسام الصفحة">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`section-tab${tab.active ? ' active' : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
