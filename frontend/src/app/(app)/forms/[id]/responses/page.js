import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getOwnedForm } from '@/features/forms/queries';
import { ResponseFilters } from '@/features/responses/response-filters';
import { ResponsesList } from '@/features/responses/responses-list';
import { serverApi } from '@/lib/api/server';

export const metadata = { title: 'Responses' };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readFilters(searchParams) {
  const text = (value) => (typeof value === 'string' ? value : '');
  const date = (value) => (DATE_PATTERN.test(text(value)) ? value : '');
  return {
    q: text(searchParams.q).trim().slice(0, 100),
    from: date(searchParams.from),
    to: date(searchParams.to),
  };
}

async function ResponsesContent({ params, searchParams }) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const form = await getOwnedForm(id);
  const filters = readFilters(rawSearchParams);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  if (typeof rawSearchParams.cursor === 'string') query.set('cursor', rawSearchParams.cursor);
  if (rawSearchParams.dir === 'prev') query.set('dir', 'prev');

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
        title="No responses yet"
        description={
          form.status === 'published'
            ? `Share /f/${form.slug} and responses will appear here as they arrive.`
            : 'Publish the form and share its link to start collecting responses.'
        }
      />
    );
  }

  return (
    <>
      {result.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted-strong">
          No responses match these filters.
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
    <div className="space-y-2" role="status" aria-busy="true" aria-label="Loading responses">
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
      <h2 className="sr-only">Responses</h2>
      <Suspense fallback={<FiltersFallback />}>
        <Filters params={params} />
      </Suspense>
      <Suspense fallback={<ListFallback />}>
        <ResponsesContent params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
