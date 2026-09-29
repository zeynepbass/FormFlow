import { newFieldId, newOptionId } from '@/lib/ids';
import { CHOICE_TYPES, FORM_LIMITS } from '@/types/field-types';

const DEFAULT_LABELS = {
  short_text: 'Kısa yanıt',
  long_text: 'Uzun yanıt',
  email: 'E-posta adresi',
  number: 'Sayı',
  phone: 'Telefon numarası',
  url: 'Web sitesi',
  select: 'Bir seçenek belirle',
  radio: 'Birini seç',
  checkbox: 'Uygun olanların hepsini seç',
  date: 'Tarih',
  file: 'Dosya yükle',
};

export function createField(type) {
  return {
    id: newFieldId(),
    type,
    label: DEFAULT_LABELS[type],
    description: '',
    placeholder: '',
    required: false,
    options: CHOICE_TYPES.has(type)
      ? [
          { id: newOptionId(), label: 'Seçenek 1' },
          { id: newOptionId(), label: 'Seçenek 2' },
        ]
      : [],
    validation: {},
  };
}

export function initBuilderState(form) {
  return {
    title: form.title,
    description: form.description ?? '',
    fields: form.fields,
    version: form.version,
    selectedId: form.fields[0]?.id ?? null,
    dirty: false,
  };
}

function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function updateField(state, id, update) {
  return {
    ...state,
    dirty: true,
    fields: state.fields.map((field) => (field.id === id ? update(field) : field)),
  };
}

export function builderReducer(state, action) {
  switch (action.type) {
    case 'set_meta':
      return { ...state, [action.key]: action.value, dirty: true };

    case 'add': {
      if (state.fields.length >= FORM_LIMITS.fields) return state;
      const field = createField(action.fieldType);
      const index = state.fields.findIndex((item) => item.id === state.selectedId);
      const fields = [...state.fields];
      fields.splice(index === -1 ? fields.length : index + 1, 0, field);
      return { ...state, fields, selectedId: field.id, dirty: true };
    }

    case 'update':
      return updateField(state, action.id, (field) => ({ ...field, ...action.changes }));

    case 'set_validation':
      return updateField(state, action.id, (field) => {
        const validation = { ...field.validation, [action.key]: action.value };
        if (action.value === undefined) delete validation[action.key];
        return { ...field, validation };
      });

    case 'remove': {
      const index = state.fields.findIndex((field) => field.id === action.id);
      if (index === -1) return state;
      const fields = state.fields.filter((field) => field.id !== action.id);
      const neighbour = fields[Math.min(index, fields.length - 1)];
      return {
        ...state,
        fields,
        selectedId: state.selectedId === action.id ? (neighbour?.id ?? null) : state.selectedId,
        dirty: true,
      };
    }

    case 'duplicate': {
      if (state.fields.length >= FORM_LIMITS.fields) return state;
      const index = state.fields.findIndex((field) => field.id === action.id);
      if (index === -1) return state;
      const source = state.fields[index];
      const copy = {
        ...source,
        id: newFieldId(),
        label: `${source.label} (kopya)`.slice(0, 200),
        options: source.options.map((option) => ({ ...option, id: newOptionId() })),
        validation: { ...source.validation },
      };
      const fields = [...state.fields];
      fields.splice(index + 1, 0, copy);
      return { ...state, fields, selectedId: copy.id, dirty: true };
    }

    case 'move': {
      const fields = moveItem(state.fields, action.from, action.to);
      return fields === state.fields ? state : { ...state, fields, dirty: true };
    }

    case 'collapse':
      return state.selectedId ? { ...state, selectedId: null } : state;

    case 'select':
      return { ...state, selectedId: state.selectedId === action.id ? null : action.id };

    case 'add_option':
      return updateField(state, action.id, (field) =>
        field.options.length >= FORM_LIMITS.options
          ? field
          : {
              ...field,
              options: [
                ...field.options,
                { id: newOptionId(), label: `Seçenek ${field.options.length + 1}` },
              ],
            },
      );

    case 'update_option':
      return updateField(state, action.id, (field) => ({
        ...field,
        options: field.options.map((option) =>
          option.id === action.optionId ? { ...option, label: action.label } : option,
        ),
      }));

    case 'remove_option':
      return updateField(state, action.id, (field) => ({
        ...field,
        options: field.options.filter((option) => option.id !== action.optionId),
      }));

    case 'saved':
      return { ...state, version: action.form.version, dirty: false };

    default:
      return state;
  }
}

export function findProblems(state) {
  const problems = [];
  if (!state.title.trim()) problems.push({ fieldId: null, message: 'Formuna bir başlık ver.' });

  state.fields.forEach((field, index) => {
    const name = field.label.trim() || `Alan ${index + 1}`;
    if (!field.label.trim()) {
      problems.push({ fieldId: field.id, message: `${index + 1}. alanın bir başlığı olmalı.` });
    }
    if (CHOICE_TYPES.has(field.type)) {
      if (field.options.length === 0) {
        problems.push({
          fieldId: field.id,
          message: `“${name}” alanında en az bir seçenek olmalı.`,
        });
      }
      if (field.options.some((option) => !option.label.trim())) {
        problems.push({ fieldId: field.id, message: `“${name}” alanında boş bir seçenek var.` });
      }
    }
    const { min, max } = field.validation;
    if (min !== undefined && max !== undefined && min > max) {
      problems.push({
        fieldId: field.id,
        message: `“${name}” alanında en küçük değer en büyük değerden büyük.`,
      });
    }
  });

  if (state.fields.filter((field) => field.type === 'file').length > FORM_LIMITS.fileFields) {
    problems.push({
      fieldId: null,
      message: `Bir formda en fazla ${FORM_LIMITS.fileFields} dosya yükleme alanı olabilir.`,
    });
  }

  return problems;
}
