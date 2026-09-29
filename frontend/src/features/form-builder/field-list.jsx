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
    'Sıralamak için tutamakta boşluk ya da enter tuşuna bas, alanı yukarı ve aşağı ok tuşlarıyla taşı, bırakmak için tekrar boşluk ya da enter tuşuna bas. İptal etmek için escape tuşuna bas.',
};

export function FieldList({ fields, selectedId, problemIds, dispatch, onMove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const labelOf = (id) => {
    const index = fields.findIndex((field) => field.id === id);
    return fields[index]?.label.trim() || `Alan ${index + 1}`;
  };
  const positionOf = (id) => fields.findIndex((field) => field.id === id) + 1;

  const announcements = {
    onDragStart: ({ active }) =>
      `${labelOf(active.id)} seçildi. ${fields.length} alan içinde ${positionOf(active.id)}. sırada.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelOf(active.id)}, ${fields.length} alan içinde ${positionOf(over.id)}. sıraya taşındı.`
        : `${labelOf(active.id)} artık listenin üzerinde değil.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)}, ${fields.length} alan içinde ${positionOf(over.id)}. sıraya bırakıldı.`
        : `${labelOf(active.id)} bırakıldı.`,
    onDragCancel: ({ active }) => `Sıralama iptal edildi. ${labelOf(active.id)} taşınmadı.`,
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
        <ol className="space-y-3" aria-label="Form alanları">
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
