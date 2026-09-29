'use client';

import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FieldCard } from './field-card';

const screenReaderInstructions = {
  draggable:
    'To reorder, press space or enter on the handle, use the up and down arrow keys to move the field, then press space or enter to drop it. Press escape to cancel.',
};

export function FieldList({ fields, selectedId, problemIds, dispatch, onMove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const labelOf = (id) => {
    const index = fields.findIndex((field) => field.id === id);
    return fields[index]?.label.trim() || `Field ${index + 1}`;
  };
  const positionOf = (id) => fields.findIndex((field) => field.id === id) + 1;

  const announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${labelOf(active.id)}. It is at position ${positionOf(active.id)} of ${fields.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} moved to position ${positionOf(over.id)} of ${fields.length}.`
        : `${labelOf(active.id)} is no longer over the list.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} dropped at position ${positionOf(over.id)} of ${fields.length}.`
        : `${labelOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Reordering cancelled. ${labelOf(active.id)} was not moved.`,
  };

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    onMove(positionOf(active.id) - 1, positionOf(over.id) - 1, { announce: false });
  }

  return (
    <DndContext
      id="form-builder-fields"
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={() => dispatch({ type: 'collapse' })}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements, screenReaderInstructions }}
    >
      <SortableContext
        items={fields.map((field) => field.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="space-y-3" aria-label="Form fields">
          {fields.map((field, index) => (
            <FieldCard
              key={field.id}
              field={field}
              index={index}
              total={fields.length}
              selected={field.id === selectedId}
              hasProblem={problemIds.has(field.id)}
              dispatch={dispatch}
              onMove={onMove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
