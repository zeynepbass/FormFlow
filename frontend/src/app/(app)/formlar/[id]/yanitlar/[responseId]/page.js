import { ChevronLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOwnedForm } from '@/features/forms/queries';
import { DeleteResponseButton } from '@/features/responses/delete-response-button';
import { formatAnswer, isFileAnswer } from '@/features/responses/format-answer';
import { serverApi } from '@/lib/api/server';
import { formatBytes, formatDateTime } from '@/lib/format';

export const metadata = { title: 'Yanıt' };

async function getResponse(formId, responseId) {
  if (!/^[a-f0-9]{24}$/i.test(responseId)) notFound();
  try {
    const { data } = await serverApi(`/forms/${formId}/responses/${responseId}`);
    return data;
  } catch (error) {
    if (error.status === 404) notFound();
    throw error;
  }
}

function AnswerValue({ formId, responseId, value }) {
  if (isFileAnswer(value)) {
    return (
      <a
        href={`/api/forms/${formId}/responses/${responseId}/files/${value.fileId}`}
        download
        className="inline-flex items-center gap-2 font-medium text-primary-dark hover:underline"
      >
        <Paperclip className="size-4" aria-hidden="true" />
        {value.name}
        <span className="font-normal text-muted-strong">({formatBytes(value.size)})</span>
      </a>
    );
  }
  return <span className="break-words whitespace-pre-wrap">{formatAnswer(value)}</span>;
}

async function ResponseDetail({ params }) {
  const { id, responseId } = await params;
  const [form, response] = await Promise.all([getOwnedForm(id), getResponse(id, responseId)]);
  const knownIds = new Set(form.fields.map((field) => field.id));
  const removed = Object.keys(response.answers).filter((fieldId) => !knownIds.has(fieldId));

  return (
    <article>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Yanıt</h2>
          <p className="text-sm text-muted-strong">
            Gönderim:{' '}
            <time dateTime={response.createdAt}>{formatDateTime(response.createdAt)}</time>
          </p>
        </div>
        <DeleteResponseButton formId={form.id} responseId={response.id} />
      </header>

      <Card>
        <dl className="divide-y divide-border">
          {form.fields.map((field) => (
            <div key={field.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="text-sm font-medium text-muted-strong">{field.label}</dt>
              <dd>
                <AnswerValue
                  formId={form.id}
                  responseId={response.id}
                  value={response.answers[field.id]}
                />
              </dd>
            </div>
          ))}
          {removed.map((fieldId) => (
            <div key={fieldId} className="grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="text-sm font-medium text-muted-strong">Silinmiş alan</dt>
              <dd>
                <AnswerValue
                  formId={form.id}
                  responseId={response.id}
                  value={response.answers[fieldId]}
                />
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </article>
  );
}

export default async function ResponseDetailPage({ params }) {
  return (
    <>
      <Suspense fallback={<Skeleton className="mb-4 h-5 w-40" />}>
        <BackLink params={params} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ResponseDetail params={params} />
      </Suspense>
    </>
  );
}

async function BackLink({ params }) {
  const { id } = await params;
  return (
    <Link
      href={`/formlar/${id}/yanitlar`}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-strong hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      Tüm yanıtlar
    </Link>
  );
}
