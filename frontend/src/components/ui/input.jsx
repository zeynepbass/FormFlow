import { cn } from '@/lib/utils';

export const inputClassName =
  'block w-full rounded-md border border-border bg-surface px-3 text-base text-foreground placeholder:text-muted focus-visible:border-primary aria-[invalid=true]:border-error disabled:opacity-60';

export function Input({ className, ...props }) {
  return <input className={cn(inputClassName, 'h-11', className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }) {
  return <textarea rows={rows} className={cn(inputClassName, 'py-2.5', className)} {...props} />;
}

export function NativeSelect({ className, children, ...props }) {
  return (
    <select className={cn(inputClassName, 'h-11 pr-8', className)} {...props}>
      {children}
    </select>
  );
}
