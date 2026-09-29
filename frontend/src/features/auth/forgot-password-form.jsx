'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { forgotPasswordSchema } from './schemas';

export function ForgotPasswordForm() {
  const [status, setStatus] = useState({ error: '', success: '' });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  async function onSubmit(values) {
    try {
      const { data } = await api('/auth/forgot-password', { method: 'POST', body: values });
      setStatus({ error: '', success: data.message });
    } catch (error) {
      setStatus({ error: error.message, success: '' });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormStatus {...status} />
      <Field id="email" label="E-posta" error={errors.email?.message}>
        {(props) => <Input type="email" autoComplete="email" {...props} {...register('email')} />}
      </Field>
      <SubmitButton pending={isSubmitting} pendingText="Gönderiliyor…" className="w-full">
        Sıfırlama bağlantısı gönder
      </SubmitButton>
    </form>
  );
}
