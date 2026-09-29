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
  title: requiredText('Formuna bir başlık ver.', 120),
  description: z.string().check(z.trim(), z.maxLength(1000, 'En fazla 1000 karakter kullan.')),
});

export function CreateForm() {
  const router = useRouter();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { title: '', description: '' } });

  async function onSubmit(values) {
    setFormError('');
    try {
      const { data } = await api('/forms', { method: 'POST', body: values });
      router.push(`/formlar/${data.id}`);
    } catch (error) {
      if (!applyFieldErrors(error, setError, ['title', 'description'])) setFormError(error.message);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormStatus error={formError} />
        <Field id="title" label="Başlık" error={errors.title?.message} required>
          {(props) => (
            <Input
              placeholder="Müşteri geri bildirimi"
              autoFocus
              {...props}
              {...register('title')}
            />
          )}
        </Field>
        <Field
          id="description"
          label="Açıklama"
          description="Formda başlığın altında gösterilir. İsteğe bağlı."
          error={errors.description?.message}
        >
          {(props) => <Textarea rows={3} {...props} {...register('description')} />}
        </Field>
        <SubmitButton pending={isSubmitting} pendingText="Oluşturuluyor…">
          Oluştur ve alan ekle
        </SubmitButton>
      </form>
    </Card>
  );
}
