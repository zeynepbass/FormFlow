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

export const TEXT_LIMITS = { short_text: 500, long_text: 5000 };

export const FORM_LIMITS = { fields: 50, options: 50, fileFields: 3 };

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ACCEPTED_FILES = '.pdf,.png,.jpg,.jpeg,.webp,.txt';
