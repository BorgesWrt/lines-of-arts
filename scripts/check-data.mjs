import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { paintings, movements } from '../src/data/content.js';
import { artists, relations } from '../src/data/artists.js';
import {keyWorks} from '../src/data/additional-works.js';
import { detailLevel, pixelsPerYear, zoomAt, yearToX, makeLayout, clusterWorks } from '../src/utils/canvas-layout.js';
const manifest = JSON.parse(await readFile(new URL('../src/data/image-manifest.json', import.meta.url), 'utf8'));
assert.equal(new Set(paintings.map(p => p.id)).size, paintings.length, 'Duplicate artwork id');
assert.equal(new Set(movements.map(m => m.id)).size, movements.length, 'Duplicate movement id');
for (const p of paintings) {
  const movement = movements.find(m => m.id === p.movement);
  assert.ok(movement, 'Missing movement: ' + p.id);
  assert.ok(p.artistIds.length>0, 'Missing authors: '+p.id);
  assert.ok(p.source.startsWith('https://'), 'Missing source: ' + p.id);
  assert.ok(manifest[p.id]?.commonsPage && manifest[p.id]?.license, 'Missing attribution: ' + p.id);
  assert.ok(['Public domain','CC0','CC BY-SA 4.0','CC BY-SA 3.0','CC BY 3.0'].includes(manifest[p.id].license), 'Review rights: ' + p.id);
  assert.ok((await stat(new URL('../public' + manifest[p.id].file, import.meta.url))).size > 1000, 'Missing image: ' + p.id);
  if(manifest[p.id].license.startsWith('CC BY'))assert.ok(manifest[p.id].attribution&&manifest[p.id].licenseUrl,'Missing photographer attribution: '+p.id);
}
assert.equal(new Set(artists.map(a => a.id)).size, artists.length, 'Duplicate artist id');
for (const artist of artists) {
  assert.ok(artist.start < artist.end && artist.source.startsWith('https://'), 'Invalid artist: ' + artist.id);
  assert.ok(movements.some(m => m.id === artist.movement), 'Missing artist movement');
}
for (const p of paintings) {
  for(const id of p.artistIds){const a=artists.find(a=>a.id===id);assert.ok(a&&p.year>=a.start&&p.year<=a.end,'Painting outside artist timeline: '+p.id);}
}
for(const a of artists)assert.ok(paintings.filter(p=>p.artistIds.includes(a.id)).length>=2,'Every artist needs at least two works: '+a.id);
for(const m of movements){assert.equal(keyWorks[m.id].length,3);for(const id of keyWorks[m.id])assert.ok(paintings.some(p=>p.id===id&&p.movement===m.id),'Invalid key work: '+id);}
assert.deepEqual(paintings.find(p=>p.id==='verrocchio-baptism').artistIds,['verrocchio','leonardo']);
for (const r of relations) {
  assert.ok(artists.some(a => a.id === r.from) && artists.some(a => a.id === r.to), 'Broken relation');
  assert.ok(r.source.startsWith('https://') && ['confirmed','disputed'].includes(r.status), 'Missing evidence');
  assert.ok(['training','workshop','collaboration'].includes(r.type), 'Invalid relation type');
}
assert.equal(detailLevel(1, null), 'overview');
assert.equal(detailLevel(2.5, null), 'artists');
assert.equal(detailLevel(1.4, 'north'), 'artists');
assert.equal(detailLevel(5, 'early'), 'works');
const camera = { zoom: 1, center: 1425, panY: 0 };
const anchorYear = camera.center + (650 - 500) / pixelsPerYear(1000, 1);
const zoomed = zoomAt(camera, 3, 650, 1000);
assert.ok(Math.abs(yearToX(anchorYear, 1000, zoomed) - 650) < .001, 'Zoom must retain pointer anchor');
const compact = makeLayout(movements, artists, 'artists');
assert.equal(compact.rows.size, artists.length);
assert.equal(new Set(compact.rows.values()).size, artists.length, 'Artist rows overlap');
const detailed = makeLayout(movements, artists, 'works');
assert.ok(detailed.height > compact.height, 'Detailed artwork layout needs more vertical space');
const clusters = clusterWorks(paintings.filter(p => ['leonardo','raphael'].includes(p.id)), year => year * .6);
assert.equal(clusters.length, 1, 'Close overview nodes must cluster');
assert.equal(clusters[0].length, 2);
console.log(`Validated ${movements.length} movements, ${artists.length} artists, ${paintings.length} paintings, ${relations.length} sourced relations; semantic zoom, camera anchoring, row spacing, clustering, and image rights.`);
