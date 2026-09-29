import { Logo } from '@/components/common/logo';
import { privatePageRobots } from '@/lib/metadata';

export const metadata = { robots: privatePageRobots };

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:py-16">
      <Logo />
      <main id="main" className="mt-8 w-full max-w-sm">
        {children}
      </main>
    </div>
  );
}
