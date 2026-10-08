// Factual fields from official collection pages; no narrative texts or restricted images.
import {readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {artists} from '../src/data/artists.js';
import aliases from '../src/data/museum-artists.json' with {type:'json'};
const cache=join(tmpdir(),'lines-of-arts-museum-data');
const norm=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
async function html(url,file){
 if(!process.argv.includes('--refresh'))try{return await readFile(join(cache,file),'utf8');}catch{}
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('London HTTP '+r.status);
 const s=await r.text();await writeFile(join(cache,file),s);return s;
}
const records=[];
for(const a of artists){
 const text=await html(a.source,`london-${a.id}.html`);
 // Only collection cards, not unrelated works mentioned in the biography.
 const cards=text.split(/<div class="image-item"/).slice(1);
 const seen=new Set();
 for(const card of cards){
  const accession=card.match(/data-object-number="([^"]+)"/)?.[1];
  const titleSection=card.match(/<div class="title">([\s\S]*?)<\/div>/)?.[1];
  const attribution=clean(card.match(/<div class="description">([\s\S]*?)<\/div>/)?.[1]||'');
  const path=titleSection?.match(/href="(\/paintings\/[^"?#]+)"/)?.[1];
  if(!path||!accession||seen.has(accession)||!aliases[a.id].some(n=>norm(n)===norm(attribution)))continue;
  seen.add(accession);
  const source='https://www.nationalgallery.org.uk'+path;
  const work=await html(source,`london-work-${accession}.html`);
  const field=label=>clean(work.match(new RegExp('<dt>'+label+'</dt>\\s*<dd>([\\s\\S]*?)</dd>'))?.[1]||'');
  const date=field('Date made');
  records.push({id:'ngl-'+accession,artistIds:[a.id],title:clean(titleSection),date,begin:null,end:null,medium:field('Medium and support'),attribution,credit:field('Acquisition credit'),accession,source,museum:'london',image:null,imageLicense:null});
 }
 console.log('London',a.id,seen.size);
}
const path='src/data/museum-catalog.json';const catalog=JSON.parse(await readFile(join(cache,'combined-api-index.json'),'utf8'));
catalog.updated=new Date().toISOString().slice(0,10);
catalog.records=[...catalog.records.filter(r=>r.museum!=='london'),...records];
await writeFile(path,JSON.stringify(catalog,null,2)+'\n');
const requests=JSON.parse(await readFile(join(cache,'api-coverage.json'),'utf8'));
await writeFile('docs/museum-coverage.json',JSON.stringify({updated:catalog.updated,total:catalog.records.length,sources:['https://github.com/NationalGalleryOfArt/opendata','https://openaccess-api.clevelandart.org/','https://api.artic.edu/docs/','https://www.nationalgallery.org.uk/documentation/ngacuk/licences','https://github.com/metmuseum/openaccess'],artists:artists.map(a=>({id:a.id,records:catalog.records.filter(r=>r.artistIds.includes(a.id)).length})),requests},null,2)+'\n');
console.log('London added',records.length,'painting records.');
