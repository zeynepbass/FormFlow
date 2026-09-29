import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { formatDateTime, formatNumber } from '@/lib/format';
import { formatAnswer } from './format-answer';
import { CURSOR_PARAM, DIRECTION_PARAM, FILTER_PARAMS, PREVIOUS } from './url-params';

const PREVIEW_FIELDS = 3;

function pageHref(formId, filters, cursor, dir) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value) params.set(FILTER_PARAMS[key], value);
  params.set(CURSOR_PARAM, cursor);
  if (dir === 'prev') params.set(DIRECTION_PARAM, PREVIOUS);
  return `/formlar/${formId}/yanitlar?${params}`;
}

export function ResponsesList({ form, responses, meta, filters }) {
  const columns = form.fields.filter((field) => field.type !== 'file').slice(0, PREVIEW_FIELDS);
  const detailHref = (response) => `/formlar/${form.id}/yanitlar/${response.id}`;

  return (
    <>
      <p className="mb-3 text-sm text-muted-strong" aria-live="polite">
        {formatNumber(meta.total)} yanıt
      </p>

      <ul className="space-y-3 md:hidden">
        {responses.map((response) => (
          <li key={response.id}>
            <Link
              href={detailHref(response)}
              className="block rounded-lg border border-border bg-surface p-4 hover:border-primary"
            >
              <p className="text-sm font-medium">{formatDateTime(response.createdAt)}</p>
              <dl className="mt-2 space-y-1 text-sm">
                {columns.map((field) => (
                  <div key={field.id} className="flex gap-2">
                    <dt className="shrink-0 text-muted-strong">{field.label}:</dt>
                    <dd className="truncate">{formatAnswer(response.answers[field.id])}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{form.title} yanıtları</caption>
          <thead className="border-b border-border text-muted-strong">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                Gönderim
              </th>
              {columns.map((field) => (
                <th key={field.id} scope="col" className="max-w-48 truncate px-4 py-3 font-medium">
                  {field.label}
                </th>
              ))}
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Ayrıntılar</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {responses.map((response) => (
              <tr key={response.id} className="hover:bg-background">
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDateTime(response.createdAt)}
                </td>
                {columns.map((field) => (
                  <td key={field.id} className="max-w-56 truncate px-4 py-3">
                    {formatAnswer(response.answers[field.id])}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <Link
                    href={detailHref(response)}
                    className="font-medium text-primary-dark hover:underline"
                  >
                    Görüntüle
                    <span className="sr-only">
                      {' '}
                      {formatDateTime(response.createdAt)} tarihli yanıt
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.prevCursor || meta.nextCursor ? (
        <nav aria-label="Sayfalama" className="mt-6 flex justify-between gap-3">
          {meta.prevCursor ? (
            <Link
              href={pageHref(form.id, filters, meta.prevCursor, 'prev')}
              className={buttonVariants({ variant: 'secondary' })}
            >
              <ChevronLeft aria-hidden="true" />
              Daha yeni
            </Link>
          ) : (
            <span />
          )}
          {meta.nextCursor ? (
            <Link
              href={pageHref(form.id, filters, meta.nextCursor, 'next')}
              className={buttonVariants({ variant: 'secondary' })}
            >
              Daha eski
              <ChevronRight aria-hidden="true" />
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
