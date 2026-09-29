export const FIELD_TYPES = [
  'short_text',
  'long_text',
  'email',
  'number',
  'phone',
  'url',
  'select',
  'radio',
  'checkbox',
  'date',
  'file',
];

export const CHOICE_TYPES = new Set(['select', 'radio', 'checkbox']);

export const TEXT_LIMITS = {
  short_text: 500,
  long_text: 5000,
};

export const FORM_LIMITS = {
  fields: 50,
  options: 50,
  fileFields: 3,
};

export const FORM_STATUSES = ['draft', 'published', 'paused', 'archived'];

export const STATUS_TRANSITIONS = {
  publish: { from: ['draft', 'paused'], to: 'published' },
  pause: { from: ['published'], to: 'paused' },
  archive: { from: ['draft', 'published', 'paused'], to: 'archived' },
  restore: { from: ['archived'], to: 'draft' },
};

export const FIELD_ID_PATTERN = /^fld_[a-z0-9]{10}$/;
export const OPTION_ID_PATTERN = /^opt_[a-z0-9]{8}$/;
