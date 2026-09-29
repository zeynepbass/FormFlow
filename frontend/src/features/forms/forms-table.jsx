import Link from 'next/link';
import { formatDate, formatNumber } from '@/lib/format';
import { FormActionsMenu } from './form-actions-menu';
import { StatusBadge } from './status-badge';

export function FormsTable({ forms }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {forms.map((form) => (
        <li key={form.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                href={`/forms/${form.id}`}
                className="truncate font-medium hover:text-primary-dark hover:underline"
              >
                {form.title}
              </Link>
              <StatusBadge status={form.status} />
            </div>
            <p className="mt-1 text-sm text-muted-strong">
              <Link href={`/forms/${form.id}/responses`} className="hover:underline">
                {formatNumber(form.responseCount)}{' '}
                {form.responseCount === 1 ? 'response' : 'responses'}
              </Link>
              <span aria-hidden="true"> · </span>
              {form.fieldCount} {form.fieldCount === 1 ? 'field' : 'fields'}
              <span aria-hidden="true"> · </span>
              Updated {formatDate(form.updatedAt)}
            </p>
          </div>
          <FormActionsMenu form={form} />
        </li>
      ))}
    </ul>
  );
}
