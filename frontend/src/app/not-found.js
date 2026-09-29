import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { buttonVariants } from '@/components/ui/button-variants';

export const metadata = {
  title: 'Sayfa bulunamadı',
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
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Aradığın sayfayı bulamadık</h1>
      <p className="mt-3 max-w-md text-muted-strong">
        Bağlantı hatalı olabilir ya da form sahibi tarafından kaldırılmış olabilir.
      </p>
      <Link href="/" className={buttonVariants({ className: 'mt-8' })}>
        Ana sayfaya dön
      </Link>
    </main>
  );
}
