export const START = 1250;
export const END = 1800;
export const MIN_ZOOM = .7;
export const MAX_ZOOM = 20;
export const DIRECTION_ZOOM = 1.5;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function detailLevel(zoom, focused) { return zoom >= 5 ? 'works' : focused || zoom >= DIRECTION_ZOOM ? 'artists' : 'overview'; }
export function pixelsPerYear(width, zoom) { return Math.max(240, width - 120) / (END - START) * zoom; }
export function yearToX(year, width, camera) { return width / 2 + (year - camera.center) * pixelsPerYear(width, camera.zoom); }
export function zoomAt(camera, newZoom, x, width) {
  const zoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
  const year = camera.center + (x - width / 2) / pixelsPerYear(width, camera.zoom);
  return { ...camera, zoom, center: clamp(year - (x - width / 2) / pixelsPerYear(width, zoom), START - 60, END + 60) };
}
export function makeLayout(movements, artists, level, rowSpacing, expanded, compactSpacing = 78) {
  let cursor = 130;
  const groups = [];
  const rows = new Map();
  for (const movement of movements) {
    const members = artists.filter(a => a.movement === movement.id);
    const header = cursor - 32;
    if (level === 'overview' || (expanded && !expanded.includes(movement.id))) {
      members.forEach(artist => rows.set(artist.id, cursor));
      groups.push({ movement, y: cursor, header, members, openness: 0 });
      cursor += level === 'overview' ? compactSpacing : 78;
    } else {
      const first = cursor + 20;
      const spacing = rowSpacing ?? (level === 'works' ? 126 : 74);
      members.forEach((artist, i) => rows.set(artist.id, first + i * spacing));
      const size = Math.max(1, members.length) * spacing;
      groups.push({ movement, y: first, header, members, bottom: first + size, openness: 1 });
      cursor = first + size + 46;
    }
  }
  return { groups, rows, height: cursor + 35 };
}
export function clusterWorks(works, getX, distance = 28) {
  const clusters = [];
  for (const work of [...works].sort((a, b) => a.year - b.year)) {
    const last = clusters.at(-1);
    if (last && getX(work.year) - getX(last.at(-1).year) < distance) last.push(work);
    else clusters.push([work]);
  }
  return clusters;
}
