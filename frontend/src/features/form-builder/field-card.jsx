'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, ChevronDown, Copy, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FIELD_TYPE_MAP } from '@/config/field-types';
import { cn } from '@/lib/utils';
import { FieldEditor } from './field-editor';

export function FieldCard({ field, index, total, selected, hasProblem, dispatch, onMove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });
  const { icon: Icon, label: typeLabel } = FIELD_TYPE_MAP[field.type];
  const name = field.label.trim() || `Field ${index + 1}`;
  const editorId = `${field.id}-editor`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative rounded-lg border bg-surface',
        selected ? 'border-primary' : 'border-border',
        hasProblem && !selected && 'border-error',
        isDragging && 'z-10 shadow-popover',
      )}
    >
      <div className="flex items-center gap-1 p-2 pr-2 sm:gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-strong hover:bg-background active:cursor-grabbing"
          aria-label={`Reorder ${name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1.5 text-left"
          aria-expanded={selected}
          aria-controls={selected ? editorId : undefined}
          onClick={() => dispatch({ type: 'select', id: field.id })}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-soft-purple text-primary-dark">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {name}
              {field.required ? (
                <>
                  <span className="text-error-text" aria-hidden="true">
                    {' '}
                    *
                  </span>
                  <span className="sr-only"> (required)</span>
                </>
              ) : null}
            </span>
            <span className="block text-xs text-muted-strong">{typeLabel}</span>
          </span>
          <ChevronDown
            className={cn('ml-auto size-4 shrink-0 text-muted-strong', selected && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${name} up`}
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="hidden sm:inline-flex"
          >
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${name} down`}
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="hidden sm:inline-flex"
          >
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Duplicate ${name}`}
            onClick={() => dispatch({ type: 'duplicate', id: field.id })}
          >
            <Copy aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${name}`}
            onClick={() => dispatch({ type: 'remove', id: field.id })}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      {selected ? (
        <div id={editorId}>
          <div className="flex gap-2 px-4 pb-3 sm:hidden">
            <Button
              variant="secondary"
              size="sm"
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
            >
              <ArrowUp aria-hidden="true" />
              Move up
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={index === total - 1}
              onClick={() => onMove(index, index + 1)}
            >
              <ArrowDown aria-hidden="true" />
              Move down
            </Button>
          </div>
          <FieldEditor field={field} dispatch={dispatch} />
        </div>
      ) : null}
    </li>
  );
}
