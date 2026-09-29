import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-background text-muted-strong',
        primary: 'border-transparent bg-soft-purple text-primary-dark',
        success: 'border-border bg-surface text-success-text',
        warning: 'border-border bg-surface text-warning-text',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

const dotColors = {
  neutral: 'bg-muted',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
};

export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {dot ? (
        <span className={cn('size-1.5 rounded-full', dotColors[tone])} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
