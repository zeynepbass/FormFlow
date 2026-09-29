import { Menu } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { buttonVariants } from '@/components/ui/button-variants';
import { marketingNav } from '@/config/site';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-strong hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Log in
          </Link>
          <Link href="/register" className={buttonVariants({ size: 'sm' })}>
            Get started
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary
            className={buttonVariants({
              variant: 'ghost',
              size: 'icon',
              className: 'list-none [&::-webkit-details-marker]:hidden',
            })}
            aria-label="Menu"
          >
            <Menu aria-hidden="true" />
          </summary>
          <nav
            aria-label="Mobile"
            className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-surface p-2 shadow-popover"
          >
            <ul className="space-y-1">
              {[...marketingNav, { href: '/login', label: 'Log in' }].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-soft-purple"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/register" className={buttonVariants({ className: 'mt-1 w-full' })}>
                  Get started
                </Link>
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
