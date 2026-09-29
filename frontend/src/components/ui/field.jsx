import { cn } from '@/lib/utils';
import { Label } from './label';

export function Field({ id, label, description, error, required, className, children }) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-error-text" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </Label>
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-strong">
          {description}
        </p>
      ) : null}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="text-sm text-error-text">
      {children}
    </p>
  );
}
