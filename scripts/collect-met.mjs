import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const cache=join(tmpdir(),'lines-of-arts-museum-data');
const refresh=process.argv.includes('--refresh');
const result=spawnSync(process.env.ARTS_PYTHON||'python',['scripts/collect-met.py',...(refresh?['--refresh']:[])],{stdio:'inherit'});
if(result.status!==0)throw Error('Met table import failed');
const records=JSON.parse(await readFile(join(cache,'met-index.json'),'utf8'));
let index=0;let apiAvailable=true;let imageWarning=null;
await Promise.all([0,1,2].map(async()=>{
 while(index<records.length){
  const work=records[index++];const id=work.id.slice(4);const file=join(cache,`met-object-${id}.json`);
  let data;
  if(!refresh)try{data=JSON.parse(await readFile(file,'utf8'));}catch{}
  if(!data&&apiAvailable){try{const response=await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Met object HTTP '+response.status);data=await response.json();await writeFile(file,JSON.stringify(data));}catch(error){apiAvailable=false;imageWarning=error.message;}}
  if(data?.isPublicDomain&&data.primaryImageSmall){work.image=data.primaryImageSmall;work.imageLicense='CC0';}
 }
}));
const file=join(cache,'combined-api-index.json');const snapshot=JSON.parse(await readFile(file,'utf8'));
snapshot.records=[...snapshot.records.filter(r=>r.museum!=='met'),...records];
await writeFile(file,JSON.stringify(snapshot));
console.log('Met imported with',records.filter(r=>r.image).length,'remote open images');

await writeFile(join(cache,'met-coverage.json'),JSON.stringify({records:records.length,images:records.filter(r=>r.image).length,imageWarning}));
if(imageWarning)console.log('Met image API unavailable; official metadata and source links retained:',imageWarning);
