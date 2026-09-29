'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api, applyFieldErrors } from '@/lib/api/client';
import { registerSchema } from './schemas';

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values) {
    setFormError('');
    try {
      await api('/auth/register', { method: 'POST', body: values });
      router.replace('/panel');
      router.refresh();
    } catch (error) {
      if (error.status === 409) {
        setError('email', { message: error.message });
      } else if (!applyFieldErrors(error, setError, ['name', 'email', 'password'])) {
        setFormError(error.message);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormStatus error={formError} />
      <Field id="name" label="Ad soyad" error={errors.name?.message}>
        {(props) => <Input autoComplete="name" {...props} {...register('name')} />}
      </Field>
      <Field id="email" label="E-posta" error={errors.email?.message}>
        {(props) => <Input type="email" autoComplete="email" {...props} {...register('email')} />}
      </Field>
      <Field
        id="password"
        label="Şifre"
        description="En az 8 karakter."
        error={errors.password?.message}
      >
        {(props) => (
          <Input type="password" autoComplete="new-password" {...props} {...register('password')} />
        )}
      </Field>
      <SubmitButton pending={isSubmitting} pendingText="Hesap oluşturuluyor…" className="w-full">
        Hesap oluştur
      </SubmitButton>
    </form>
  );
}
