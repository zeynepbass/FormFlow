import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { buttonVariants } from '@/components/ui/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { FormsTable } from '@/features/forms/forms-table';
import { serverApi } from '@/lib/api/server';
import { cn } from '@/lib/utils';
import { FORM_STATUSES } from '@/types/form-status';

export const metadata = { title: 'Forms' };

const filters = [{ value: undefined, label: 'All' }].concat(
  Object.entries(FORM_STATUSES).map(([value, { label }]) => ({ value, label })),
);

async function FormsList({ searchParams }) {
  const { status: rawStatus } = await searchParams;
  const status = rawStatus in FORM_STATUSES ? rawStatus : undefined;
  const { data: forms } = await serverApi(`/forms${status ? `?status=${status}` : ''}`);

  return (
    <>
      <nav aria-label="Filter by status" className="-mx-1 mb-6 overflow-x-auto">
        <ul className="flex gap-1 px-1">
          {filters.map((filter) => {
            const active = filter.value === status;
            return (
              <li key={filter.label}>
                <Link
                  href={filter.value ? `/forms?status=${filter.value}` : '/forms'}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-block rounded-full px-3 py-1.5 text-sm font-medium text-muted-strong hover:text-foreground',
                    active && 'bg-soft-purple text-primary-dark hover:text-primary-dark',
                  )}
                >
                  {filter.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {forms.length > 0 ? (
        <FormsTable forms={forms} />
      ) : (
        <EmptyState
          illustration="/assets/illustrations/empty-forms.svg"
          title={status ? `No ${FORM_STATUSES[status].label.toLowerCase()} forms` : 'No forms yet'}
          description={
            status
              ? 'Forms with this status will show up here.'
              : 'Create your first form and share it in a few minutes.'
          }
          action={
            status ? null : (
              <Link href="/forms/create" className={buttonVariants()}>
                <Plus aria-hidden="true" />
                New form
              </Link>
            )
          }
        />
      )}
    </>
  );
}

function FormsListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading forms">
      <Skeleton className="h-9 w-80" />
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-20 w-full" />
      ))}
    </div>
  );
}

export default function FormsPage({ searchParams }) {
  return (
    <>
      <PageHeader
        title="Forms"
        description="Build, publish and manage your forms."
        actions={
          <Link href="/forms/create" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            New form
          </Link>
        }
      />
      <Suspense fallback={<FormsListSkeleton />}>
        <FormsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
