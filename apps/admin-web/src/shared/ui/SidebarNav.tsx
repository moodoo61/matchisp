'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { IconChevron } from './icons';

export type NavChild = {
  href: string;
  label: string;
};

export type NavItem = {
  href: string;
  label: string;
  children?: NavChild[];
};

type Props = {
  items: NavItem[];
};

export function SidebarNav({ items }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const initiallyOpen = useMemo(() => {
    const open = new Set<string>();
    for (const item of items) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        open.add(item.href);
      }
    }
    return open;
  }, [items, pathname]);

  const [openSections, setOpenSections] = useState<Set<string>>(initiallyOpen);

  useEffect(() => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (item.children?.some((c) => pathname.startsWith(c.href))) {
          next.add(item.href);
        }
      }
      return next;
    });
  }, [pathname, items]);

  function toggleSection(item: NavItem) {
    const firstChild = item.children?.[0];
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(item.href)) {
        next.delete(item.href);
      } else {
        next.add(item.href);
      }
      return next;
    });
    if (firstChild && !pathname.startsWith(item.href)) {
      router.push(firstChild.href);
    } else if (firstChild && pathname === item.href) {
      router.push(firstChild.href);
    } else if (firstChild && !item.children?.some((c) => pathname.startsWith(c.href))) {
      router.push(firstChild.href);
    }
  }

  return (
    <nav className="nav sidebar-nav">
      {items.map((item) => {
        if (!item.children?.length) {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'active' : undefined}
            >
              {item.label}
            </Link>
          );
        }

        const expanded = openSections.has(item.href);
        const sectionActive = item.children.some((c) =>
          pathname.startsWith(c.href),
        );

        return (
          <div
            key={item.href}
            className={`nav-group${expanded ? ' is-open' : ''}${sectionActive ? ' is-active' : ''}`}
          >
            <button
              type="button"
              className={`nav-parent${sectionActive ? ' active' : ''}`}
              onClick={() => toggleSection(item)}
              aria-expanded={expanded}
            >
              <span>{item.label}</span>
              <IconChevron
                style={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>
            {expanded ? (
              <div className="nav-children">
                {item.children.map((child) => {
                  const active =
                    pathname === child.href ||
                    pathname.startsWith(`${child.href}/`);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={active ? 'active' : undefined}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
