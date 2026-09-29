import { cn } from '@/lib/utils';

export function Card({ className, as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn('rounded-lg border border-border bg-surface shadow-card', className)}
      {...props}
    />
  );
}
