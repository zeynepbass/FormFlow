'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button-variants';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { resetPasswordSchema } from './schemas';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <Alert tone="error" title="Bu sıfırlama bağlantısı eksik.">
        E-postandaki bağlantıyı tekrar aç ya da yeni bir bağlantı iste.
      </Alert>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Şifren güncellendi.">
          Güvenliğin için tüm cihazlarda oturumun kapatıldı.
        </Alert>
        <Link href="/giris" className={buttonVariants({ className: 'w-full' })}>
          Giriş yap
        </Link>
      </div>
    );
  }

  async function onSubmit({ password }) {
    setFormError('');
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormStatus error={formError} />
      <Field id="password" label="Yeni şifre" error={errors.password?.message}>
        {(props) => (
          <Input type="password" autoComplete="new-password" {...props} {...register('password')} />
        )}
      </Field>
      <Field
        id="confirmPassword"
        label="Yeni şifre (tekrar)"
        error={errors.confirmPassword?.message}
      >
        {(props) => (
          <Input
            type="password"
            autoComplete="new-password"
            {...props}
            {...register('confirmPassword')}
          />
        )}
      </Field>
      <SubmitButton pending={isSubmitting} pendingText="Güncelleniyor…" className="w-full">
        Şifreyi güncelle
      </SubmitButton>
    </form>
  );
}
