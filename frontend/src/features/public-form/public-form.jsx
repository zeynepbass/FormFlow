'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormStatus } from '@/components/common/form-status';
import { SubmitButton } from '@/components/common/submit-button';
import { FieldError } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api/api-error';
import { ACCEPTED_FILES, MAX_FILE_SIZE } from '@/types/field-types';
import { buildAnswerSchema } from './answer-schema';
import { getVisitorId, sendFormEvent } from './visitor';

const INPUT_TYPES = {
  short_text: { type: 'text' },
  email: { type: 'email', autoComplete: 'email', inputMode: 'email' },
  number: { type: 'number', inputMode: 'decimal' },
  phone: { type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  url: { type: 'url', inputMode: 'url' },
  date: { type: 'date' },
};

function describedBy(field, error) {
  return (
    [field.description && `${field.id}-description`, error && `${field.id}-error`]
      .filter(Boolean)
      .join(' ') || undefined
  );
}

function RequiredMark({ required }) {
  return required ? (
    <span className="text-error-text" aria-hidden="true">
      {' '}
      *
    </span>
  ) : null;
}

function Description({ field }) {
  return field.description ? (
    <p id={`${field.id}-description`} className="text-sm text-muted-strong">
      {field.description}
    </p>
  ) : null;
}

function ChoiceGroup({ field, register, error }) {
  const type = field.type === 'checkbox' ? 'checkbox' : 'radio';
  return (
    <fieldset
      className="space-y-2"
      aria-describedby={describedBy(field, error)}
      aria-invalid={error ? true : undefined}
      aria-required={field.required || undefined}
    >
      <legend className="mb-1 text-sm font-medium">
        {field.label}
        <RequiredMark required={field.required} />
      </legend>
      <Description field={field} />
      <div className="space-y-1">
        {field.options.map((option) => {
          const id = `${field.id}-${option.id}`;
          return (
            <div key={option.id} className="flex items-center gap-3 rounded-md px-1 py-1.5">
              <input
                id={id}
                type={type}
                value={option.id}
                className="size-4 shrink-0 accent-primary"
                {...register(field.id)}
              />
              <label htmlFor={id} className="text-base">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      <FieldError id={`${field.id}-error`}>{error}</FieldError>
    </fieldset>
  );
}

function AnswerField({ field, register, error }) {
  if (field.type === 'radio' || field.type === 'checkbox') {
    return <ChoiceGroup field={field} register={register} error={error} />;
  }

  const common = {
    id: field.id,
    'aria-describedby': describedBy(field, error),
    'aria-invalid': error ? true : undefined,
    'aria-required': field.required || undefined,
    ...register(field.id),
  };

  let control;
  if (field.type === 'long_text') {
    control = <Textarea rows={5} placeholder={field.placeholder || undefined} {...common} />;
  } else if (field.type === 'select') {
    control = (
      <NativeSelect defaultValue="" {...common}>
        <option value="" disabled={field.required}>
          {field.placeholder || 'Select an option'}
        </option>
        {field.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    );
  } else if (field.type === 'file') {
    control = (
      <input
        type="file"
        accept={ACCEPTED_FILES}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium"
        {...common}
      />
    );
  } else {
    const { min, max, maxLength } = field.validation ?? {};
    control = (
      <Input
        {...INPUT_TYPES[field.type]}
        placeholder={field.placeholder || undefined}
        min={field.type === 'number' ? min : undefined}
        max={field.type === 'number' ? max : undefined}
        step={field.type === 'number' ? 'any' : undefined}
        maxLength={maxLength}
        {...common}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.id}>
        {field.label}
        <RequiredMark required={field.required} />
      </Label>
      <Description field={field} />
      {control}
      {field.type === 'file' ? (
        <p className="text-xs text-muted-strong">
          PDF, PNG, JPEG, WebP or TXT, up to {MAX_FILE_SIZE / 1024 / 1024} MB.
        </p>
      ) : null}
      <FieldError id={`${field.id}-error`}>{error}</FieldError>
    </div>
  );
}

function toSubmission(fields, values, website) {
  const answers = {};
  const files = [];
  for (const field of fields) {
    const value = values[field.id];
    if (value === undefined) continue;
    if (field.type === 'file') files.push([field.id, value]);
    else answers[field.id] = value;
  }

  const payload = { answers, visitorId: getVisitorId(), ...(website ? { website } : {}) };
  if (files.length === 0) return { body: JSON.stringify(payload), json: true };

  const body = new FormData();
  body.append('payload', JSON.stringify(payload));
  for (const [fieldId, file] of files) body.append(fieldId, file);
  return { body, json: false };
}

export function PublicForm({ form }) {
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const started = useRef(false);
  const fieldIds = form.fields.map((field) => field.id);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting, submitCount },
  } = useForm({ resolver: zodResolver(buildAnswerSchema(form.fields)) });

  useEffect(() => {
    sendFormEvent(form.slug, 'view');
  }, [form.slug]);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    sendFormEvent(form.slug, 'start');
  }

  async function onSubmit(values, event) {
    setFormError('');
    const website = event?.target.elements.namedItem('website')?.value;
    const { body, json } = toSubmission(form.fields, values, website);

    try {
      const response = await fetch(`/api/public/forms/${encodeURIComponent(form.slug)}/responses`, {
        method: 'POST',
        headers: json ? { 'content-type': 'application/json' } : undefined,
        body,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new ApiError(response.status, payload?.error);
      setSuccessMessage(payload.data.message);
    } catch (error) {
      const fieldErrors = error.details?.filter((detail) => fieldIds.includes(detail.path)) ?? [];
      fieldErrors.forEach((detail) =>
        setError(detail.path, { type: 'server', message: detail.message }),
      );
      if (fieldErrors.length > 0) setFocus(fieldErrors[0].path);
      else setFormError(error.message || 'Something went wrong. Please try again.');
    }
  }

  if (successMessage) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CircleCheck className="size-10 text-success" aria-hidden="true" />
        <h2
          ref={(node) => node?.focus()}
          tabIndex={-1}
          className="mt-4 text-xl font-semibold outline-none"
        >
          Response sent
        </h2>
        <p className="mt-2 max-w-md whitespace-pre-line text-muted-strong">{successMessage}</p>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} onFocus={markStarted} noValidate className="relative">
      <FormStatus error={formError} className="mb-6" />
      {submitCount > 0 && errorCount > 0 ? (
        <p className="sr-only" role="alert">
          {errorCount === 1
            ? 'One answer needs attention.'
            : `${errorCount} answers need attention.`}
        </p>
      ) : null}

      <div className="space-y-7">
        {form.fields.map((field) => (
          <AnswerField
            key={field.id}
            field={field}
            register={register}
            error={errors[field.id]?.message}
          />
        ))}
      </div>

      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton
        pending={isSubmitting}
        pendingText="Sending…"
        size="lg"
        className="mt-8 w-full sm:w-auto"
      >
        {form.settings.submitLabel}
      </SubmitButton>
    </form>
  );
}
