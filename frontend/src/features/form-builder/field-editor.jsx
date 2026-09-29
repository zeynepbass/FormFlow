'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CHOICE_TYPES, FORM_LIMITS, TEXT_LIMITS } from '@/types/field-types';

const PLACEHOLDER_TYPES = new Set(['short_text', 'long_text', 'email', 'number', 'phone', 'url']);

function toNumber(value) {
  if (value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function FieldEditor({ field, dispatch }) {
  const id = (name) => `${field.id}-${name}`;
  const update = (changes) => dispatch({ type: 'update', id: field.id, changes });
  const setValidation = (key, value) =>
    dispatch({ type: 'set_validation', id: field.id, key, value });

  return (
    <div className="grid gap-4 border-t border-border px-4 pt-4 pb-5 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={id('label')}>Question</Label>
        <Input
          id={id('label')}
          value={field.label}
          maxLength={200}
          onChange={(event) => update({ label: event.target.value })}
          aria-invalid={field.label.trim() ? undefined : true}
        />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={id('description')}>Help text</Label>
        <Textarea
          id={id('description')}
          rows={2}
          maxLength={500}
          value={field.description}
          placeholder="Optional hint shown under the question"
          onChange={(event) => update({ description: event.target.value })}
        />
      </div>

      {PLACEHOLDER_TYPES.has(field.type) ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={id('placeholder')}>Placeholder</Label>
          <Input
            id={id('placeholder')}
            maxLength={150}
            value={field.placeholder}
            onChange={(event) => update({ placeholder: event.target.value })}
          />
        </div>
      ) : null}

      {CHOICE_TYPES.has(field.type) ? (
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">Options</legend>
          <ol className="space-y-2">
            {field.options.map((option, index) => (
              <li key={option.id} className="flex items-center gap-2">
                <Input
                  aria-label={`Option ${index + 1}`}
                  value={option.label}
                  maxLength={200}
                  onChange={(event) =>
                    dispatch({
                      type: 'update_option',
                      id: field.id,
                      optionId: option.id,
                      label: event.target.value,
                    })
                  }
                  aria-invalid={option.label.trim() ? undefined : true}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove option ${index + 1}`}
                  disabled={field.options.length <= 1}
                  onClick={() =>
                    dispatch({ type: 'remove_option', id: field.id, optionId: option.id })
                  }
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ol>
          <Button
            variant="secondary"
            size="sm"
            disabled={field.options.length >= FORM_LIMITS.options}
            onClick={() => dispatch({ type: 'add_option', id: field.id })}
          >
            <Plus aria-hidden="true" />
            Add option
          </Button>
        </fieldset>
      ) : null}

      {field.type === 'number' ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={id('min')}>Minimum</Label>
            <Input
              id={id('min')}
              type="number"
              inputMode="decimal"
              value={field.validation.min ?? ''}
              onChange={(event) => setValidation('min', toNumber(event.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={id('max')}>Maximum</Label>
            <Input
              id={id('max')}
              type="number"
              inputMode="decimal"
              value={field.validation.max ?? ''}
              onChange={(event) => setValidation('max', toNumber(event.target.value))}
            />
          </div>
        </>
      ) : null}

      {field.type === 'short_text' || field.type === 'long_text' ? (
        <div className="space-y-1.5">
          <Label htmlFor={id('max-length')}>Character limit</Label>
          <Input
            id={id('max-length')}
            type="number"
            inputMode="numeric"
            min={1}
            max={TEXT_LIMITS[field.type]}
            placeholder={String(TEXT_LIMITS[field.type])}
            value={field.validation.maxLength ?? ''}
            onChange={(event) => {
              const value = toNumber(event.target.value);
              setValidation(
                'maxLength',
                value === undefined
                  ? undefined
                  : Math.min(Math.max(Math.round(value), 1), TEXT_LIMITS[field.type]),
              );
            }}
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2.5 sm:col-span-2">
        <input
          id={id('required')}
          type="checkbox"
          className="size-4 accent-primary"
          checked={field.required}
          onChange={(event) => update({ required: event.target.checked })}
        />
        <Label htmlFor={id('required')}>Required</Label>
      </div>
    </div>
  );
}
