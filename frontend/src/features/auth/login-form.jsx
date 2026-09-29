'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { loginSchema } from './schemas';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  async function onSubmit(values) {
    setFormError('');
    try {
      await api('/auth/login', { method: 'POST', body: values });
      router.replace(safeRedirectPath(searchParams.get('next')));
      router.refresh();
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormStatus error={formError} />
      <Field id="email" label="Email" error={errors.email?.message}>
        {(props) => <Input type="email" autoComplete="email" {...props} {...register('email')} />}
      </Field>
      <Field id="password" label="Password" error={errors.password?.message}>
        {(props) => (
          <Input
            type="password"
            autoComplete="current-password"
            {...props}
            {...register('password')}
          />
        )}
      </Field>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary-dark hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton pending={isSubmitting} pendingText="Signing in…" className="w-full">
        Log in
      </SubmitButton>
    </form>
  );
}
