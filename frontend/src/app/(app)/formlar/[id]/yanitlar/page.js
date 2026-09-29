import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getOwnedForm } from '@/features/forms/queries';
import { ResponseFilters } from '@/features/responses/response-filters';
import { ResponsesList } from '@/features/responses/responses-list';
import {
  CURSOR_PARAM,
  DIRECTION_PARAM,
  FILTER_PARAMS,
  PREVIOUS,
} from '@/features/responses/url-params';
import { serverApi } from '@/lib/api/server';

export const metadata = { title: 'Yanıtlar' };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readFilters(searchParams) {
  const text = (value) => (typeof value === 'string' ? value : '');
  const date = (value) => (DATE_PATTERN.test(text(value)) ? value : '');
  return {
    q: text(searchParams[FILTER_PARAMS.q]).trim().slice(0, 100),
    from: date(searchParams[FILTER_PARAMS.from]),
    to: date(searchParams[FILTER_PARAMS.to]),
  };
}

async function ResponsesContent({ params, searchParams }) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const form = await getOwnedForm(id);
  const filters = readFilters(rawSearchParams);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const cursor = rawSearchParams[CURSOR_PARAM];
  if (typeof cursor === 'string') query.set('cursor', cursor);
  if (rawSearchParams[DIRECTION_PARAM] === PREVIOUS) query.set('dir', 'prev');

  let result;
  try {
    result = await serverApi(`/forms/${id}/responses?${query}`);
  } catch (error) {
    if (error.status !== 400) throw error;
    return <Alert tone="error" title={error.message} />;
  }

  const hasFilters = Object.values(filters).some(Boolean);
  if (result.meta.total === 0 && !hasFilters) {
    return (
      <EmptyState
        illustration="/assets/illustrations/empty-responses.svg"
        title="Henüz yanıt yok"
        description={
          form.status === 'published'
            ? `/f/${form.slug} bağlantısını paylaş; yanıtlar geldikçe burada görünecek.`
            : 'Yanıt toplamaya başlamak için formu yayınla ve bağlantısını paylaş.'
        }
      />
    );
  }

  return (
    <>
      {result.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted-strong">
          Bu filtrelere uyan yanıt yok.
        </p>
      ) : (
        <ResponsesList form={form} responses={result.data} meta={result.meta} filters={filters} />
      )}
    </>
  );
}

function FiltersFallback() {
  return <Skeleton className="mb-6 h-[4.25rem]" />;
}

function ListFallback() {
  return (
    <div className="space-y-2" role="status" aria-busy="true" aria-label="Yanıtlar yükleniyor">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-72" />
    </div>
  );
}

async function Filters({ params }) {
  const { id } = await params;
  return <ResponseFilters formId={id} />;
}

export default function ResponsesPage({ params, searchParams }) {
  return (
    <>
      <h2 className="sr-only">Yanıtlar</h2>
      <Suspense fallback={<FiltersFallback />}>
        <Filters params={params} />
      </Suspense>
      <Suspense fallback={<ListFallback />}>
        <ResponsesContent params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
