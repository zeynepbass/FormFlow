import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SubmitButton({ pending, children, pendingText, ...props }) {
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
      {pending ? (pendingText ?? children) : children}
    </Button>
  );
}
