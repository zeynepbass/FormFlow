import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/auth-card';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata = {
  title: 'Yeni şifre belirle',
  description: 'FormFlow hesabın için yeni bir şifre belirle.',
};

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Yeni şifre belirle">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
