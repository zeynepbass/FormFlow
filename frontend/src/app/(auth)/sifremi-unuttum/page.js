import Link from 'next/link';
import { AuthCard } from '@/features/auth/auth-card';
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export const metadata = {
  title: 'Şifreni sıfırla',
  description: 'FormFlow şifreni sıfırlamak için bağlantı iste.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Şifreni sıfırla"
      description="E-posta adresini gir, yeni şifre belirlemen için sana bir bağlantı gönderelim."
      footer={
        <Link href="/giris" className="font-medium text-primary-dark hover:underline">
          Girişe dön
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
