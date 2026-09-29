import { Suspense } from 'react';
import { Logo } from '@/components/common/logo';
import { AppNavLinks, NavList } from '@/components/layout/app-nav-links';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserMenu } from '@/components/layout/user-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/auth';
import { privatePageRobots } from '@/lib/metadata';

export const metadata = {
  title: { template: '%s · FormFlow', default: 'FormFlow' },
  robots: privatePageRobots,
};

async function CurrentUserMenu() {
  const user = await getCurrentUser();
  return <UserMenu user={user} />;
}

export default function AppLayout({ children }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-border bg-surface px-4 py-5 lg:block">
        <div className="sticky top-5">
          <Logo href="/panel" className="px-2" />
          <nav aria-label="Çalışma alanı" className="mt-8">
            <Suspense fallback={<NavList />}>
              <AppNavLinks />
            </Suspense>
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <MobileNav />
            <Logo href="/panel" />
          </div>
          <Suspense fallback={<Skeleton className="size-10 rounded-full" />}>
            <CurrentUserMenu />
          </Suspense>
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
