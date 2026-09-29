'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod/mini';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { api, applyFieldErrors } from '@/lib/api/client';
import { requiredText } from '@/lib/validation';

const schema = z.object({
  slug: z
    .string()
    .check(
      z.trim(),
      z.toLowerCase(),
      z.minLength(3, 'En az 3 karakter kullan.'),
      z.maxLength(60, 'En fazla 60 karakter kullan.'),
      z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Küçük harf, rakam ve tek tire kullan.'),
    ),
  submitLabel: requiredText('Buton metnini gir.', 40),
  successMessage: requiredText('Bir mesaj gir.', 500),
  allowIndexing: z.boolean(),
});

export function FormSettings({ form }) {
  const router = useRouter();
  const [version, setVersion] = useState(form.version);
  const [status, setStatus] = useState({ error: '', success: '' });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: form.slug,
      submitLabel: form.settings.submitLabel,
      successMessage: form.settings.successMessage,
      allowIndexing: form.settings.allowIndexing,
    },
  });

  async function onSubmit({ slug, ...settings }) {
    setStatus({ error: '', success: '' });
    try {
      const { data } = await api(`/forms/${form.id}`, {
        method: 'PATCH',
        body: { version, slug, settings },
      });
      setVersion(data.version);
      reset({ slug: data.slug, ...data.settings });
      setStatus({ error: '', success: 'Ayarlar kaydedildi.' });
      router.refresh();
    } catch (error) {
      if (error.status === 409 && error.message.includes('adres')) {
        setError('slug', { message: error.message });
      } else if (!applyFieldErrors(error, setError, ['slug'])) {
        setStatus({ error: error.message, success: '' });
      }
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <FormStatus {...status} />

        <Field
          id="slug"
          label="Form adresi"
          description="Adresi değiştirirsen daha önce paylaştığın bağlantılar çalışmaz."
          error={errors.slug?.message}
        >
          {(props) => (
            <div className="flex items-stretch">
              <span className="flex items-center rounded-l-md border border-r-0 border-border bg-background px-3 text-sm text-muted-strong">
                /f/
              </span>
              <Input
                className="rounded-l-none"
                autoComplete="off"
                {...props}
                {...register('slug')}
              />
            </div>
          )}
        </Field>

        <Field id="submitLabel" label="Gönder butonu metni" error={errors.submitLabel?.message}>
          {(props) => <Input {...props} {...register('submitLabel')} />}
        </Field>

        <Field
          id="successMessage"
          label="Gönderim sonrası mesaj"
          error={errors.successMessage?.message}
        >
          {(props) => <Textarea rows={3} {...props} {...register('successMessage')} />}
        </Field>

        <div className="flex gap-3">
          <input
            id="allowIndexing"
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            aria-describedby="allowIndexing-description"
            {...register('allowIndexing')}
          />
          <div>
            <label htmlFor="allowIndexing" className="text-sm font-medium">
              Bu formun arama motorlarında görünmesine izin ver
            </label>
            <p id="allowIndexing-description" className="text-sm text-muted-strong">
              Varsayılan olarak kapalı. Özel ya da iç kullanım formları için kapalı bırak.
            </p>
          </div>
        </div>

        <SubmitButton
          pending={isSubmitting}
          disabled={!isDirty || isSubmitting}
          pendingText="Kaydediliyor…"
        >
          Ayarları kaydet
        </SubmitButton>
      </form>
    </Card>
  );
}
