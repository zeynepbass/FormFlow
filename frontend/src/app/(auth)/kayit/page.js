import Link from 'next/link';
import { AuthCard } from '@/features/auth/auth-card';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata = {
  title: 'Hesap oluştur',
  description: 'Ücretsiz FormFlow hesabı oluştur ve ilk formunu birkaç dakikada yayınla.',
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Hesabını oluştur"
      description="Ücretsiz. İlk formunu birkaç dakikada oluştur ve paylaş."
      footer={
        <>
          Zaten hesabın var mı?{' '}
          <Link href="/giris" className="font-medium text-primary-dark hover:underline">
            Giriş yap
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
