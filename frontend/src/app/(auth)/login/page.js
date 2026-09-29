import Link from 'next/link';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/auth-card';
import { LoginForm } from '@/features/auth/login-form';

export const metadata = {
  title: 'Log in',
  description: 'Log in to FormFlow to manage your forms and responses.',
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to manage your forms and responses."
      footer={
        <>
          New to FormFlow?{' '}
          <Link href="/register" className="font-medium text-primary-dark hover:underline">
            Create an account
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
