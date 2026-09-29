'use client';

import { FIELD_TYPE_OPTIONS } from '@/config/field-types';
import { FORM_LIMITS } from '@/types/field-types';

export function FieldPalette({ fieldCount, fileFieldCount, onAdd }) {
  const full = fieldCount >= FORM_LIMITS.fields;

  return (
    <section aria-labelledby="palette-heading">
      <h2 id="palette-heading" className="mb-3 text-sm font-semibold">
        Add a field
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {FIELD_TYPE_OPTIONS.map(({ type, label, icon: Icon }) => {
          const disabled = full || (type === 'file' && fileFieldCount >= FORM_LIMITS.fileFields);
          return (
            <li key={type}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAdd(type)}
                className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium hover:border-primary disabled:opacity-50"
              >
                <Icon className="size-4 shrink-0 text-primary-dark" aria-hidden="true" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      {full ? (
        <p className="mt-3 text-sm text-muted-strong">
          Forms can have up to {FORM_LIMITS.fields} fields.
        </p>
      ) : null}
    </section>
  );
}
