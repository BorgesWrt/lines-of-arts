import { additionalWorks } from '../src/data/additional-works.js';
import {writeFile} from 'node:fs/promises';
const results=[];let index=0;
async function worker(){while(index<additionalWorks.length){const row=additionalWorks[index++];try{const r=await fetch(row[6],{signal:AbortSignal.timeout(20000)});const html=await r.text();const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g,'').trim();results.push({id:row[0],status:r.status,url:r.url,title});console.log(row[0],r.status,title?.slice(0,100));}catch(e){results.push({id:row[0],error:e.message});console.log(row[0],e.message);}}}
await Promise.all(Array.from({length:5},worker));await writeFile(new URL('../docs/work-source-check.json',import.meta.url),JSON.stringify(results,null,2));
