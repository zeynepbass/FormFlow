'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { segment: '', label: 'Build' },
  { segment: '/responses', label: 'Responses' },
  { segment: '/analytics', label: 'Analytics' },
  { segment: '/settings', label: 'Settings' },
];

export function FormTabs() {
  const { id } = useParams();
  const pathname = usePathname();
  const base = `/forms/${id}`;

  return (
    <nav aria-label="Form sections" className="-mx-1 mb-8 overflow-x-auto border-b border-border">
      <ul className="flex gap-1 px-1">
        {tabs.map((tab) => {
          const href = `${base}${tab.segment}`;
          const active = tab.segment ? pathname.startsWith(href) : pathname === base;
          return (
            <li key={tab.label}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-block border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-strong hover:text-foreground',
                  active && 'border-primary text-foreground',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
