export const EXPANSION_KEY = 'art-atlas:expansion:session:v1';
export function readExpansion(storage, movements) {
  try {
    const value = JSON.parse(storage.getItem(EXPANSION_KEY));
    if (!Array.isArray(value)) return null;
    return [...new Set(value.filter(id => movements.some(m => m.id === id)))];
  } catch { return null; }
}
export function includeDirections(expanded, ids) {
  return [...new Set([...expanded, ...ids])];
}
