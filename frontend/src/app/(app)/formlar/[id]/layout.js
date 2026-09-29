import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsMenu } from '@/features/forms/form-actions-menu';
import { FormTabs } from '@/features/forms/form-tabs';
import { getOwnedForm } from '@/features/forms/queries';
import { StatusBadge } from '@/features/forms/status-badge';

async function FormHeader({ params }) {
  const { id } = await params;
  const form = await getOwnedForm(id);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{form.title}</h1>
          <StatusBadge status={form.status} />
        </div>
        <p className="mt-1 truncate text-sm text-muted-strong">/f/{form.slug}</p>
      </div>
      <FormActionsMenu form={form} />
    </div>
  );
}

export default function FormLayout({ children, params }) {
  return (
    <>
      <Link
        href="/formlar"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-strong hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Tüm formlar
      </Link>
      <Suspense fallback={<Skeleton className="h-14 w-72" />}>
        <FormHeader params={params} />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<div className="mb-8 h-[2.6875rem] border-b border-border" />}>
          <FormTabs />
        </Suspense>
      </div>
      {children}
    </>
  );
}
