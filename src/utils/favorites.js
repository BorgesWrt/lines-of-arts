export const FAVORITES_KEY = 'art-atlas:favorites:v1';
export const emptyFavorites = () => ({ movements: [], artists: [], paintings: [] });
export function cleanFavorites(value, catalog) {
  return Object.fromEntries(Object.keys(catalog).map(type => [type, [...new Set(Array.isArray(value?.[type]) ? value[type] : [])].filter(id => catalog[type].some(item => item.id === id))]));
}
export function toggleFavorite(value, type, id) {
  return { ...value, [type]: value[type].includes(id) ? value[type].filter(item => item !== id) : [...value[type], id] };
}
