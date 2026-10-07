import assert from 'node:assert/strict';
import snapshot from '../src/data/museum-catalog.json' with {type:'json'};
import {museumPaintings,allPaintings,museums} from '../src/utils/museum-catalog.js';
import {artists} from '../src/data/artists.js';
import {paintings} from '../src/data/content.js';
import {cleanFavorites,toggleFavorite,emptyFavorites} from '../src/utils/favorites.js';
import {feedbackMailto,CONTACT_EMAIL} from '../src/utils/feedback.js';
const museumHosts={nga:['www.nga.gov'],cleveland:['www.clevelandart.org','clevelandart.org'],artic:['www.artic.edu'],london:['www.nationalgallery.org.uk']};
const imageHosts=new Set(['api.nga.gov','openaccess-cdn.clevelandart.org','www.artic.edu']);
assert.ok(snapshot.records.length>250,'Expected expanded official collection coverage');
assert.equal(new Set(snapshot.records.map(p=>p.id)).size,snapshot.records.length,'Museum IDs must be unique');
for(const p of snapshot.records){
 assert.ok(museums[p.museum]);assert.ok(p.title&&p.attribution&&p.accession);
 assert.ok(museumHosts[p.museum].includes(new URL(p.source).hostname),'Source must belong to the museum');
 assert.ok(p.artistIds.length&&p.artistIds.every(id=>artists.some(a=>a.id===id)));
 assert.ok(!/workshop of|follower of|school of|circle of|after /i.test(p.attribution),'Derivatives must not be represented as autographic works');
 if(p.image){assert.ok(['CC0','Public domain'].includes(p.imageLicense));assert.ok(imageHosts.has(new URL(p.image).hostname));}
}
for(const a of artists)assert.ok(snapshot.records.some(p=>p.artistIds.includes(a.id)),`Missing source catalogue for ${a.id}`);
assert.equal(new Set(allPaintings.map(p=>p.id)).size,allPaintings.length);
assert.ok(museumPaintings.every(p=>!paintings.some(old=>old.source===p.source)),'Curated source duplicates must retain original IDs');
const p=museumPaintings[0];const saved=toggleFavorite(emptyFavorites(),'paintings',p.id);
assert.equal(cleanFavorites(saved,{artists,paintings:allPaintings,movements:[]}).paintings[0],p.id,'Museum favourites must survive storage cleanup');
const draft=new URL(feedbackMailto({name:'Test & name',email:'test@example.org',message:'A & B\nC?subject=x'}));
assert.equal(draft.pathname,CONTACT_EMAIL);assert.equal(draft.searchParams.get('subject'),'lines-of-arts · Test & name');assert.ok(draft.searchParams.get('body').startsWith('A & B\nC?subject=x'));
console.log(`Validated ${snapshot.records.length} museum records, all ${artists.length} artists, image licences, duplicate handling, museum favourites and safe mail drafts.`);
