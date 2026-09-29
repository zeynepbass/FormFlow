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
import { FORM_STATUSES, statusFromParam } from '@/types/form-status';

export const metadata = { title: 'Formlar' };

const filters = [{ value: undefined, label: 'Tümü' }].concat(
  Object.entries(FORM_STATUSES).map(([value, { label, param }]) => ({ value, label, param })),
);

async function FormsList({ searchParams }) {
  const { durum } = await searchParams;
  const status = statusFromParam(durum);
  const { data: forms } = await serverApi(`/forms${status ? `?status=${status}` : ''}`);

  return (
    <>
      <nav aria-label="Duruma göre filtrele" className="-mx-1 mb-6 overflow-x-auto">
        <ul className="flex gap-1 px-1">
          {filters.map((filter) => {
            const active = filter.value === status;
            return (
              <li key={filter.label}>
                <Link
                  href={filter.param ? `/formlar?durum=${filter.param}` : '/formlar'}
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
          title={
            status ? `“${FORM_STATUSES[status].label}” durumunda form yok` : 'Henüz formun yok'
          }
          description={
            status
              ? 'Bu durumdaki formlar burada görünecek.'
              : 'İlk formunu oluştur ve birkaç dakikada paylaş.'
          }
          action={
            status ? null : (
              <Link href="/formlar/yeni" className={buttonVariants()}>
                <Plus aria-hidden="true" />
                Yeni form
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
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Formlar yükleniyor">
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
        title="Formlar"
        description="Formlarını oluştur, yayınla ve yönet."
        actions={
          <Link href="/formlar/yeni" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Yeni form
          </Link>
        }
      />
      <Suspense fallback={<FormsListSkeleton />}>
        <FormsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
