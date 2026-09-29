import { describe, expect, it } from 'vitest';
import {
  builderReducer,
  createField,
  findProblems,
  initBuilderState,
} from '@/features/form-builder/builder-reducer';

const form = { title: 'Survey', description: '', fields: [], version: 3 };
const reduce = (state, ...actions) => actions.reduce(builderReducer, state);

describe('builderReducer', () => {
  it('starts clean from a saved form', () => {
    expect(initBuilderState(form)).toMatchObject({
      title: 'Survey',
      version: 3,
      dirty: false,
      selectedId: null,
    });
  });

  it('adds fields after the selected one and selects them', () => {
    const state = reduce(
      initBuilderState(form),
      { type: 'add', fieldType: 'short_text' },
      { type: 'add', fieldType: 'email' },
    );
    expect(state.fields.map((field) => field.type)).toEqual(['short_text', 'email']);
    expect(state.selectedId).toBe(state.fields[1].id);
    expect(state.dirty).toBe(true);

    const inserted = reduce(
      state,
      { type: 'select', id: state.fields[0].id },
      { type: 'add', fieldType: 'date' },
    );
    expect(inserted.fields.map((field) => field.type)).toEqual(['short_text', 'date', 'email']);
  });

  it('creates choice fields with two options and ids in the API format', () => {
    const field = createField('radio');
    expect(field.id).toMatch(/^fld_[a-z0-9]{10}$/);
    expect(field.options).toHaveLength(2);
    field.options.forEach((option) => expect(option.id).toMatch(/^opt_[a-z0-9]{8}$/));
    expect(createField('email').options).toEqual([]);
  });

  it('duplicates a field with fresh ids', () => {
    const state = reduce(initBuilderState(form), { type: 'add', fieldType: 'checkbox' });
    const [source] = state.fields;
    const next = builderReducer(state, { type: 'duplicate', id: source.id });
    const copy = next.fields[1];

    expect(copy.label).toBe(`${source.label} (kopya)`);
    expect(copy.id).not.toBe(source.id);
    expect(copy.options.map((o) => o.label)).toEqual(source.options.map((o) => o.label));
    expect(copy.options[0].id).not.toBe(source.options[0].id);
  });

  it('moves fields and ignores out-of-range moves', () => {
    const state = reduce(
      initBuilderState(form),
      { type: 'add', fieldType: 'short_text' },
      { type: 'add', fieldType: 'email' },
      { type: 'add', fieldType: 'date' },
    );
    const moved = builderReducer(state, { type: 'move', from: 2, to: 0 });
    expect(moved.fields.map((field) => field.type)).toEqual(['date', 'short_text', 'email']);
    expect(builderReducer(state, { type: 'move', from: 0, to: -1 })).toBe(state);
  });

  it('removes a field and selects its neighbour', () => {
    const state = reduce(
      initBuilderState(form),
      { type: 'add', fieldType: 'short_text' },
      { type: 'add', fieldType: 'email' },
    );
    const removed = builderReducer(state, { type: 'remove', id: state.fields[1].id });
    expect(removed.fields).toHaveLength(1);
    expect(removed.selectedId).toBe(state.fields[0].id);
  });

  it('edits options and validation', () => {
    let state = reduce(initBuilderState(form), { type: 'add', fieldType: 'select' });
    const id = state.fields[0].id;
    state = reduce(
      state,
      { type: 'add_option', id },
      { type: 'update_option', id, optionId: state.fields[0].options[0].id, label: 'Yes' },
      { type: 'remove_option', id, optionId: state.fields[0].options[1].id },
    );
    expect(state.fields[0].options.map((option) => option.label)).toEqual(['Yes', 'Seçenek 3']);

    state = reduce(
      state,
      { type: 'set_validation', id, key: 'min', value: 2 },
      { type: 'set_validation', id, key: 'min', value: undefined },
    );
    expect(state.fields[0].validation).toEqual({});
  });

  it('marks the document clean after saving', () => {
    const state = reduce(initBuilderState(form), { type: 'set_meta', key: 'title', value: 'New' });
    expect(builderReducer(state, { type: 'saved', form: { version: 4 } })).toMatchObject({
      dirty: false,
      version: 4,
      title: 'New',
    });
  });
});

describe('findProblems', () => {
  it('reports missing labels, empty options and inverted bounds', () => {
    let state = reduce(
      initBuilderState({ ...form, title: ' ' }),
      { type: 'add', fieldType: 'radio' },
      { type: 'add', fieldType: 'number' },
    );
    const [radio, number] = state.fields;
    state = reduce(
      state,
      { type: 'update', id: radio.id, changes: { label: '', options: [] } },
      { type: 'set_validation', id: number.id, key: 'min', value: 10 },
      { type: 'set_validation', id: number.id, key: 'max', value: 1 },
    );

    const messages = findProblems(state).map((problem) => problem.message);
    expect(messages).toEqual([
      'Formuna bir başlık ver.',
      '1. alanın bir başlığı olmalı.',
      '“Alan 1” alanında en az bir seçenek olmalı.',
      '“Sayı” alanında en küçük değer en büyük değerden büyük.',
    ]);
  });
});
