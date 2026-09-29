import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/auth-card';
import { VerifyEmailPanel } from '@/features/auth/verify-email-panel';

export const metadata = {
  title: 'E-postanı doğrula',
  description: 'FormFlow hesabının e-posta adresini doğrula.',
};

export default function VerifyEmailPage() {
  return (
    <AuthCard title="E-postanı doğrula" description="Tek tıkla hesabın doğrulanır.">
      <Suspense>
        <VerifyEmailPanel />
      </Suspense>
    </AuthCard>
  );
}
