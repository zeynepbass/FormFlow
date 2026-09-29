'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod/mini';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { newPassword, passwordsMatch } from '@/features/auth/schemas';
import { api, applyFieldErrors } from '@/lib/api/client';
import { requiredText } from '@/lib/validation';

const profileSchema = z.object({ name: requiredText('Adını gir.', 80) });

const passwordSchema = z
  .object({
    currentPassword: z.string().check(z.minLength(1, 'Mevcut şifreni gir.')),
    newPassword,
    confirmPassword: z.string(),
  })
  .check(passwordsMatch('newPassword'));

function Section({ id, title, description, children }) {
  return (
    <Card as="section" aria-labelledby={id} className="p-6">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-muted-strong">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function ProfileForm({ user }) {
  const router = useRouter();
  const [status, setStatus] = useState({ error: '', success: '' });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name } });

  async function onSubmit(values) {
    try {
      const { data } = await api('/users/me', { method: 'PATCH', body: values });
      reset({ name: data.name });
      setStatus({ error: '', success: 'Profil güncellendi.' });
      router.refresh();
    } catch (error) {
      setStatus({ error: error.message, success: '' });
    }
  }

  return (
    <Section id="profile-heading" title="Profil">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormStatus {...status} />
        <Field id="name" label="Ad soyad" error={errors.name?.message}>
          {(props) => <Input autoComplete="name" {...props} {...register('name')} />}
        </Field>
        <Field id="email" label="E-posta" description="E-posta adresi şimdilik değiştirilemiyor.">
          {(props) => <Input type="email" value={user.email} readOnly {...props} />}
        </Field>
        <SubmitButton
          pending={isSubmitting}
          disabled={!isDirty || isSubmitting}
          pendingText="Kaydediliyor…"
        >
          Profili kaydet
        </SubmitButton>
      </form>
    </Section>
  );
}

export function PasswordForm() {
  const [status, setStatus] = useState({ error: '', success: '' });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit({ currentPassword, newPassword: password }) {
    setStatus({ error: '', success: '' });
    try {
      await api('/users/me/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword: password },
      });
      reset();
      setStatus({
        error: '',
        success: 'Şifre değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.',
      });
    } catch (error) {
      if (!applyFieldErrors(error, setError, ['currentPassword', 'newPassword'])) {
        setStatus({ error: error.message, success: '' });
      }
    }
  }

  return (
    <Section
      id="password-heading"
      title="Şifre"
      description="Şifreni değiştirince diğer cihazlardaki oturumların kapanır."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormStatus {...status} />
        <Field id="currentPassword" label="Mevcut şifre" error={errors.currentPassword?.message}>
          {(props) => (
            <Input
              type="password"
              autoComplete="current-password"
              {...props}
              {...register('currentPassword')}
            />
          )}
        </Field>
        <Field id="newPassword" label="Yeni şifre" error={errors.newPassword?.message}>
          {(props) => (
            <Input
              type="password"
              autoComplete="new-password"
              {...props}
              {...register('newPassword')}
            />
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
        <SubmitButton pending={isSubmitting} pendingText="Güncelleniyor…">
          Şifreyi değiştir
        </SubmitButton>
      </form>
    </Section>
  );
}

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setPending(true);
    setError('');
    try {
      await api('/users/me', { method: 'DELETE', body: { password } });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <Section
      id="delete-heading"
      title="Hesabı sil"
      description="Hesabını, tüm formlarını, yanıtları ve yüklenen dosyaları kalıcı olarak sil."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (password) setOpen(true);
        }}
      >
        <FormStatus error={error} />
        <Field id="delete-password" label="Şifrenle onayla">
          {(props) => (
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              {...props}
            />
          )}
        </Field>
        <Button type="submit" variant="danger" disabled={!password || pending}>
          Hesabımı sil
        </Button>
      </form>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hesabın silinsin mi?"
        description="Her şey silinecek ve bu işlem geri alınamaz."
        confirmLabel="Hesabı sil"
        pending={pending}
        onConfirm={remove}
      />
    </Section>
  );
}
