import { useEffect, useRef, useState } from 'react';

export function useLayout(target, direct) {
  const [view, setView] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (direct || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setView(target);
      return;
    }
    const start = current.current;
    const time = performance.now();
    let frame;
    const tick = now => {
      const progress = Math.min(1, (now - time) / 320);
      const ease = 1 - Math.pow(1 - progress, 3);
      const mix = (a, b) => a + (b - a) * ease;
      const next = {
        height: mix(start.height, target.height),
        rows: new Map([...target.rows].map(([id, row]) => [id, mix(start.rows.get(id) ?? row, row)])),
        groups: target.groups.map(group => {
          const old = start.groups.find(item => item.movement.id === group.movement.id) ?? group;
          return { ...group, y: mix(old.y, group.y), header: mix(old.header, group.header), openness: mix(old.openness, group.openness) };
        }),
      };
      current.current = next;
      setView(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, direct]);
  return direct ? target : view;
}
