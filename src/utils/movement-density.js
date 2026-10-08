// Fixed decade bins keep density comparable between movements and zoom levels.
export function movementDensity(movements, paintings) {
  let maximum = 1;
  const groups = new Map(movements.map(movement => {
    const buckets = new Map();
    for (const painting of paintings) {
      if (painting.movement !== movement.id || !Number.isFinite(painting.year)) continue;
      const start = Math.floor(painting.year / 10) * 10;
      const bucket = buckets.get(start) ?? {start, end:start+10, count:0, ids:[]};
      bucket.count++; bucket.ids.push(painting.id); buckets.set(start,bucket);
    }
    const bins = [...buckets.values()].sort((a,b)=>a.start-b.start);
    for (const bin of bins) maximum=Math.max(maximum,bin.count);
    return [movement.id,{bins,start:Math.min(movement.start,bins[0]?.start??movement.start),end:Math.max(movement.end,bins.at(-1)?.end??movement.end)}];
  }));
  return {groups,maximum};
}
