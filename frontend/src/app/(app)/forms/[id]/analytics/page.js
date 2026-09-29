import Link from 'next/link';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyChart, DailyTable } from '@/features/analytics/daily-chart';
import { StatCard } from '@/features/dashboard/stat-card';
import { serverApi } from '@/lib/api/server';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Analytics' };

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

async function AnalyticsContent({ params, searchParams }) {
  const [{ id }, { range: rawRange }] = await Promise.all([params, searchParams]);
  const range = RANGES.some((item) => item.value === rawRange) ? rawRange : '30d';
  const { data } = await serverApi(`/forms/${id}/analytics?range=${range}`);
  const { totals } = data;

  return (
    <>
      <nav aria-label="Time range" className="mb-6">
        <ul className="inline-flex rounded-md border border-border bg-surface p-1">
          {RANGES.map((item) => {
            const active = item.value === range;
            return (
              <li key={item.value}>
                <Link
                  href={`/forms/${id}/analytics?range=${item.value}`}
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
        <StatCard label="Views" value={formatNumber(totals.views)} />
        <StatCard label="Starts" value={formatNumber(totals.starts)} />
        <StatCard label="Submissions" value={formatNumber(totals.submissions)} />
        <StatCard
          label="Completion rate"
          value={`${totals.completionRate}%`}
          hint="Submissions per start"
        />
      </dl>

      <Card as="section" aria-labelledby="daily-heading" className="mt-6 p-5">
        <h3 id="daily-heading" className="mb-4 font-semibold">
          Submissions per day
        </h3>
        <DailyChart daily={data.daily} />
        <DailyTable daily={data.daily} />
      </Card>

      <p className="mt-4 text-sm text-muted-strong">
        Views and starts are counted once per browser session. Dates are in UTC.
      </p>
    </>
  );
}

function AnalyticsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading analytics">
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
      <h2 className="sr-only">Analytics</h2>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
