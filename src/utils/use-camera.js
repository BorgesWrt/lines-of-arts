import { useEffect, useRef, useState } from 'react';

// Interpolate the camera itself, so SVG paths, labels and points move together.
export function useCamera(target, direct) {
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
      const progress = Math.min(1, (now - time) / 260);
      const ease = 1 - Math.pow(1 - progress, 3);
      const next = Object.fromEntries(Object.keys(target).map(key => [key, start[key] + (target[key] - start[key]) * ease]));
      current.current = next;
      setView(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, direct]);
  return direct ? target : view;
}
