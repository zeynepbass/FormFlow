import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { marketingNav, siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-strong">{siteConfig.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              ...marketingNav,
              { href: '/login', label: 'Log in' },
              { href: '/register', label: 'Sign up' },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted-strong hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
