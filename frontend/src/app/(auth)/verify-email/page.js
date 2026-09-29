import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/auth-card';
import { VerifyEmailPanel } from '@/features/auth/verify-email-panel';

export const metadata = {
  title: 'Confirm your email',
  description: 'Confirm the email address for your FormFlow account.',
};

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Confirm your email" description="One click and your account is verified.">
      <Suspense>
        <VerifyEmailPanel />
      </Suspense>
    </AuthCard>
  );
}
