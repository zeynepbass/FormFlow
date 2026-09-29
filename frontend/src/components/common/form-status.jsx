import { Alert } from '@/components/ui/alert';

export function FormStatus({ error, success, className }) {
  return (
    <div role="status" aria-live="polite">
      {error ? <Alert tone="error" title={error} className={className} /> : null}
      {success ? <Alert tone="success" title={success} className={className} /> : null}
    </div>
  );
}
