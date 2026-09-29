import { Badge } from '@/components/ui/badge';
import { FORM_STATUSES } from '@/types/form-status';

export function StatusBadge({ status }) {
  const { label, tone } = FORM_STATUSES[status] ?? FORM_STATUSES.draft;
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
