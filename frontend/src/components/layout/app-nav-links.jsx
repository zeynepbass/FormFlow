'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appNav } from '@/config/app-nav';
import { cn } from '@/lib/utils';

export function AppNavLinks({ onNavigate }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

export function NavList({ pathname, onNavigate }) {
  return (
    <ul className="space-y-1">
      {appNav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || Boolean(pathname?.startsWith(`${href}/`));
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-strong hover:bg-background hover:text-foreground',
                active &&
                  'bg-soft-purple text-primary-dark hover:bg-soft-purple hover:text-primary-dark',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
