// Official public collection metadata only. No media downloads and no API secrets.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {artists} from '../src/data/artists.js';
import aliases from '../src/data/museum-artists.json' with {type:'json'};
const cache=join(tmpdir(),'lines-of-arts-museum-data');await mkdir(cache,{recursive:true});
const norm=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const belongs=(id,name)=>aliases[id].some(a=>norm(a)===norm(name));
async function get(url,file){
 if(!process.argv.includes('--refresh')){try{return JSON.parse(await readFile(join(cache,file),'utf8'));}catch{}}
 const response=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'lines-of-arts/1.0 (educational painting index)'}});
 if(!response.ok)throw Error(`Museum HTTP ${response.status}`);
 const data=await response.json();await writeFile(join(cache,file),JSON.stringify(data));return data;
}
const result=spawnSync(process.env.ARTS_PYTHON||'python',['scripts/collect-nga.py',...(process.argv.includes('--refresh')?['--refresh']:[])],{stdio:'inherit'});
if(result.status!==0)throw Error('NGA import failed');
const records=JSON.parse(await readFile(join(cache,'nga-index.json'),'utf8'));
const report=[];
for(const artist of artists){
 const name=aliases[artist.id][0];
 for(const museum of ['cleveland','artic']){
  let count=0;
  try{
   for(let page=0;;page++){
    let url;
    if(museum==='cleveland')url=`https://openaccess-api.clevelandart.org/api/artworks/?artists=${encodeURIComponent(name)}&type=Painting&limit=100&skip=${page*100}`;
    else{
     const params={query:{bool:{must:[{match_phrase:{artist_title:name}},{match_phrase:{artwork_type_title:'Painting'}}]}},page:page+1,limit:100,fields:['id','title','artist_title','artist_display','artwork_type_title','image_id','is_public_domain','date_display','date_start','date_end','medium_display','credit_line','main_reference_number']};
     url='https://api.artic.edu/api/v1/artworks/search?params='+encodeURIComponent(JSON.stringify(params));
    }
    const data=await get(url,`${museum}-${artist.id}-${page}.json`);
    for(const r of data.data){
     if(museum==='cleveland'){
      const makers=(r.creators||[]).filter(c=>c.role==='artist');
      if(r.type!=='Painting'||!makers.some(c=>belongs(artist.id,c.description.split(' (')[0]))||makers.some(c=>/studio|workshop|after|follower|circle|school/i.test(c.description+' '+(c.qualifier||''))))continue;
      records.push({id:'cma-'+r.id,artistIds:[artist.id],title:r.title,date:r.creation_date,begin:r.creation_date_earliest,end:r.creation_date_latest,medium:r.technique,attribution:makers.map(c=>c.description).join('; '),credit:r.creditline,accession:r.accession_number,source:r.url,museum:'cleveland',image:r.share_license_status==='CC0'?r.images?.web?.url||null:null,imageLicense:r.share_license_status==='CC0'?'CC0':null});
     }else{
      if(r.artwork_type_title!=='Painting'||!belongs(artist.id,r.artist_title))continue;
      records.push({id:'aic-'+r.id,artistIds:[artist.id],title:r.title,date:r.date_display,begin:r.date_start,end:r.date_end,medium:r.medium_display,attribution:r.artist_display||r.artist_title,credit:r.credit_line,accession:r.main_reference_number,source:'https://www.artic.edu/artworks/'+r.id,museum:'artic',image:r.is_public_domain&&r.image_id?`https://www.artic.edu/iiif/2/${r.image_id}/full/843,/0/default.jpg`:null,imageLicense:r.is_public_domain?'Public domain':null});
     }
     count++;
    }
    const total=museum==='cleveland'?data.info.total:data.pagination.total;
    if((page+1)*100>=total)break;
    if(page>99)throw Error('Unexpected pagination bound');
   }
   report.push({artist:artist.id,museum,count,status:'ok'});
  }catch(error){report.push({artist:artist.id,museum,status:'error',message:error.message});}
 }
 console.log(artist.id,records.filter(w=>w.artistIds.includes(artist.id)).length);
}
const unique=[...new Map(records.map(w=>[w.id,w])).values()].sort((a,b)=>(a.begin||0)-(b.begin||0)||a.id.localeCompare(b.id));
if(report.some(r=>r.status==='error')){
 await writeFile('docs/museum-sync-errors.json',JSON.stringify(report.filter(r=>r.status==='error'),null,2));throw Error('Partial import: existing catalogue was preserved. See docs/museum-sync-errors.json');
}
// Publish only after the London adapter succeeds too.
await writeFile(join(cache,'combined-api-index.json'),JSON.stringify({updated:new Date().toISOString().slice(0,10),records:unique},null,2)+'\n');
await writeFile(join(cache,'api-coverage.json'),JSON.stringify(report));
console.log('Imported',unique.length,'paintings; images remain on museum servers.');
const london=spawnSync(process.execPath,['scripts/collect-london.mjs',...(process.argv.includes('--refresh')?['--refresh']:[])],{stdio:'inherit'});
if(london.status!==0)throw Error('London import failed; published catalogue was preserved.');
