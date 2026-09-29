const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomId(prefix, length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let id = prefix;
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
  return id;
}

export const newFieldId = () => randomId('fld_', 10);
export const newOptionId = () => randomId('opt_', 8);
