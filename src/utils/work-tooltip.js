export function workTooltip(hover, paintings) {
  if (!hover) return null;
  if (hover.kind === 'density') return {title:`${hover.title} · ${hover.from}–${hover.to}`,description:`Плотность работ: ${hover.count}`};
  if (hover.count > 1) return {
    title: `${hover.count} близкие работы`,
    description: hover.artistId ? 'Открыть работы художника' : 'Приблизить направление',
  };
  const painting = paintings.find(p => p.id === hover.id);
  return painting ? { title: painting.artist, description: painting.title } : null;
}
