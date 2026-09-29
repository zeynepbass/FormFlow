import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FormBuilder } from '@/features/form-builder/form-builder';
import { getOwnedForm } from '@/features/forms/queries';

export const metadata = { title: 'Form oluşturucu' };

async function Builder({ params }) {
  const { id } = await params;
  const form = await getOwnedForm(id);
  return <FormBuilder key={form.id} form={form} />;
}

function BuilderSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_13rem]"
      role="status"
      aria-busy="true"
      aria-label="Form oluşturucu yükleniyor"
    >
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function FormBuilderPage({ params }) {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <Builder params={params} />
    </Suspense>
  );
}
