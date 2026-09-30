import Link from 'next/link';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyChart, DailyTable } from '@/features/analytics/daily-chart';
import { StatCard } from '@/features/dashboard/stat-card';
import { serverApi } from '@/lib/api/server';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Analiz' };

const RANGES = [
  { value: '7d', param: '7', label: '7 gün' },
  { value: '30d', param: '30', label: '30 gün' },
  { value: '90d', param: '90', label: '90 gün' },
];

async function AnalyticsContent({ params, searchParams }) {
  const [{ id }, { aralik }] = await Promise.all([params, searchParams]);
  const range = RANGES.find((item) => item.param === aralik)?.value ?? '30d';
  const { data } = await serverApi(`/forms/${id}/analytics?range=${range}`);
  const { totals } = data;

  return (
    <>
      <nav aria-label="Zaman aralığı" className="mb-6">
        <ul className="inline-flex rounded-md border border-border bg-surface p-1">
          {RANGES.map((item) => {
            const active = item.value === range;
            return (
              <li key={item.value}>
                <Link
                  href={`/formlar/${id}/analiz?aralik=${item.param}`}
                  aria-current={active ? 'page' : undefined}
                  scroll={false}
                  className={cn(
                    'inline-block rounded-sm px-3 py-1.5 text-sm font-medium text-muted-strong hover:text-foreground',
                    active && 'bg-soft-purple text-primary-dark hover:text-primary-dark',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Görüntülenme" value={formatNumber(totals.views)} />
        <StatCard label="Başlama" value={formatNumber(totals.starts)} />
        <StatCard label="Gönderim" value={formatNumber(totals.submissions)} />
        <StatCard
          label="Tamamlama oranı"
          value={`%${totals.completionRate.toLocaleString('tr-TR')}`}
          hint="Başlayanların gönderim oranı"
        />
      </dl>

      <Card as="section" aria-labelledby="daily-heading" className="mt-6 p-5">
        <h3 id="daily-heading" className="mb-4 font-semibold">
          Günlük gönderimler
        </h3>
        <div className="-mx-1 overflow-x-auto px-1">
          <DailyChart daily={data.daily} />
        </div>
        <DailyTable daily={data.daily} />
      </Card>

      <p className="mt-4 text-sm text-muted-strong">
        Görüntülenme ve başlama her tarayıcı oturumunda bir kez sayılır. Tarihler UTC’ye göredir.
      </p>
    </>
  );
}

function AnalyticsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Analiz yükleniyor">
      <Skeleton className="mb-6 h-10 w-64" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80" />
    </div>
  );
}

export default function AnalyticsPage({ params, searchParams }) {
  return (
    <>
      <h2 className="sr-only">Analiz</h2>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
