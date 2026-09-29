import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { buttonVariants } from '@/components/ui/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/features/dashboard/stat-card';
import { VerifyEmailBanner } from '@/features/dashboard/verify-email-banner';
import { FormsTable } from '@/features/forms/forms-table';
import { serverApi } from '@/lib/api/server';
import { getCurrentUser } from '@/lib/auth';
import { formatNumber } from '@/lib/format';

export const metadata = { title: 'Panel' };

async function Greeting() {
  const user = await getCurrentUser();
  const firstName = user.name.split(' ')[0];
  return (
    <>
      <PageHeader
        title={`Merhaba, ${firstName}`}
        description="Formlarının son durumu burada."
        actions={
          <Link href="/formlar/yeni" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Yeni form
          </Link>
        }
      />
      {user.emailVerified ? null : <VerifyEmailBanner email={user.email} />}
    </>
  );
}

async function Overview() {
  const { data: forms } = await serverApi('/forms');
  const active = forms.filter((form) => form.status !== 'archived');
  const published = forms.filter((form) => form.status === 'published').length;
  const responses = forms.reduce((total, form) => total + form.responseCount, 0);

  if (forms.length === 0) {
    return (
      <EmptyState
        illustration="/assets/illustrations/empty-forms.svg"
        title="İlk formunu oluştur"
        description="Birkaç alan ekle, yayınla ve bağlantıyı paylaş. Yanıtlar burada görünecek."
        action={
          <Link href="/formlar/yeni" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Yeni form
          </Link>
        }
      />
    );
  }

  return (
    <>
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Genel bakış
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Formlar"
            value={formatNumber(active.length)}
            hint="Arşivlenenler hariç"
          />
          <StatCard label="Yayında" value={formatNumber(published)} hint="Yanıt kabul ediyor" />
          <StatCard label="Yanıtlar" value={formatNumber(responses)} hint="Tüm formlarda" />
        </dl>
      </section>

      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold">
            Son güncellenenler
          </h2>
          <Link
            href="/formlar"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline"
          >
            Tüm formlar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <FormsTable forms={active.slice(0, 5)} />
      </section>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Genel bakış yükleniyor">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-32" />
        ))}
      </div>
      <Skeleton className="mt-10 h-64" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="mb-8 h-16 w-72" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}
