import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
  info: {
    icon: Info,
    className: 'border-border bg-soft-purple text-foreground',
    iconClass: 'text-primary-dark',
  },
  success: {
    icon: CircleCheck,
    className: 'border-border bg-surface text-foreground',
    iconClass: 'text-success',
  },
  error: {
    icon: CircleAlert,
    className: 'border-error/40 bg-surface text-foreground',
    iconClass: 'text-error',
  },
};

export function Alert({ tone = 'info', title, children, className, ...props }) {
  const { icon: Icon, className: toneClass, iconClass } = tones[tone];
  return (
    <div
      className={cn('flex gap-3 rounded-md border p-3 text-sm', toneClass, className)}
      {...props}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', iconClass)} aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-muted-strong">{children}</div> : null}
      </div>
    </div>
  );
}
