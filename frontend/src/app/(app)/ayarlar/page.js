import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteAccount, PasswordForm, ProfileForm } from '@/features/account/account-forms';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Ayarlar' };

async function Profile() {
  const user = await getCurrentUser();
  return <ProfileForm user={user} />;
}

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Ayarlar" description="Profilini ve hesap güvenliğini yönet." />
      <div className="space-y-6">
        <Suspense fallback={<Skeleton className="h-72" />}>
          <Profile />
        </Suspense>
        <PasswordForm />
        <DeleteAccount />
      </div>
    </div>
  );
}
