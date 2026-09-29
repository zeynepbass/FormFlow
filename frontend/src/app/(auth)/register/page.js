import Link from 'next/link';
import { AuthCard } from '@/features/auth/auth-card';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata = {
  title: 'Create an account',
  description: 'Create a free FormFlow account and publish your first form in minutes.',
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Free to use. Build and share your first form in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-dark hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
