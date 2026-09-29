import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FormSettings } from '@/features/forms/form-settings';
import { getOwnedForm } from '@/features/forms/queries';

export const metadata = { title: 'Form ayarları' };

async function SettingsLoader({ params }) {
  const { id } = await params;
  const form = await getOwnedForm(id);
  return <FormSettings key={form.version} form={form} />;
}

export default function FormSettingsPage({ params }) {
  return (
    <div className="max-w-2xl">
      <h2 className="sr-only">Ayarlar</h2>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <SettingsLoader params={params} />
      </Suspense>
    </div>
  );
}
