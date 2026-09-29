export function withId(document) {
  if (!document) return document;
  const { _id, ...rest } = document;
  return { id: _id.toString(), ...rest };
}
