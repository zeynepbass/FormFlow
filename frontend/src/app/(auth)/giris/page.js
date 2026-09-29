import Link from 'next/link';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/auth-card';
import { LoginForm } from '@/features/auth/login-form';

export const metadata = {
  title: 'Giriş yap',
  description: 'Formlarını ve yanıtlarını yönetmek için FormFlow hesabına giriş yap.',
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Tekrar hoş geldin"
      description="Formlarını ve yanıtlarını yönetmek için giriş yap."
      footer={
        <>
          FormFlow’da yeni misin?{' '}
          <Link href="/kayit" className="font-medium text-primary-dark hover:underline">
            Hesap oluştur
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
