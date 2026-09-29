import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/auth-card';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata = {
  title: 'Choose a new password',
  description: 'Choose a new password for your FormFlow account.',
};

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
