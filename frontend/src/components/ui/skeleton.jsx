import { cn } from '@/lib/utils';

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-border/60', className)} aria-hidden="true" />
  );
}
