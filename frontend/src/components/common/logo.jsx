import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ href = '/', className }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2 rounded-md', className)}>
      <Image src="/assets/icons/logo-mark.svg" alt="" width={28} height={28} priority />
      <span className="text-lg font-semibold tracking-tight">FormFlow</span>
    </Link>
  );
}
