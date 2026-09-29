import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { buttonVariants } from '@/components/ui/button-variants';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center px-4 text-center"
    >
      <Logo />
      <p className="mt-10 text-sm font-semibold text-primary-dark">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-muted-strong">
        The link may be broken, or the form may have been removed by its owner.
      </p>
      <Link href="/" className={buttonVariants({ className: 'mt-8' })}>
        Back to home
      </Link>
    </main>
  );
}
