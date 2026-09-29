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
      z.minLength(3, 'Use at least 3 characters.'),
      z.maxLength(60, 'Use at most 60 characters.'),
      z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single dashes.'),
    ),
  submitLabel: requiredText('Enter a button label.', 40),
  successMessage: requiredText('Enter a message.', 500),
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
      setStatus({ error: '', success: 'Settings saved.' });
      router.refresh();
    } catch (error) {
      if (error.status === 409 && error.message.includes('address')) {
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
          label="Form address"
          description="Changing the address breaks links you have already shared."
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

        <Field id="submitLabel" label="Submit button label" error={errors.submitLabel?.message}>
          {(props) => <Input {...props} {...register('submitLabel')} />}
        </Field>

        <Field
          id="successMessage"
          label="Message after submitting"
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
              Allow search engines to index this form
            </label>
            <p id="allowIndexing-description" className="text-sm text-muted-strong">
              Off by default. Leave it off for private or internal forms.
            </p>
          </div>
        </div>

        <SubmitButton
          pending={isSubmitting}
          disabled={!isDirty || isSubmitting}
          pendingText="Saving…"
        >
          Save settings
        </SubmitButton>
      </form>
    </Card>
  );
}
