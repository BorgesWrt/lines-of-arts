// Build-time only: public catalogue text, no user data and no runtime network requests.
import {readFile,writeFile} from 'node:fs/promises';
import {englishStrings} from '../src/utils/i18n.js';
const file=new URL('../src/data/languages.json',import.meta.url);
const result=JSON.parse(await readFile(file,'utf8'));
const native=['Русский','English','Español','Deutsch'];
const strings=[...englishStrings(),'active from ','documented in ','; died in '];
async function translate(text,lang){
 const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl='+lang+'&dt=t&q='+encodeURIComponent(text);
 for(let i=0;i<5;i++){
  try{const r=await fetch(url);if(!r.ok)throw new Error(r.status);const data=await r.json();return data[0].map(part=>part[0]??'').join('');}
  catch(e){if(i===4)throw e;await new Promise(r=>setTimeout(r,2000*(i+1)));}
 }
}
for(const lang of ['es','de']){
 const todo=strings.filter(text=>!result[lang][text]);
 for(let i=0;i<todo.length;i+=12){
  const batch=todo.slice(i,i+12);
  const encoded=batch.map((text,j)=>`[${j}] ${text}`).join('\n');
  const output=await translate(encoded,lang);
  const parts=[...output.matchAll(/\[(\d+)\]\s*([\s\S]*?)(?=\[\d+\]|$)/g)];
  for(let j=0;j<batch.length;j++){
   const text=batch[j];let translated=parts.find(p=>+p[1]===j)?.[2].trim();
   if(!translated||parts.length!==batch.length)translated=await translate(text,lang);
   result[lang][text]=native.includes(text)?text:translated;
  }
  await writeFile(file,JSON.stringify(result,null,2)+'\n');
  console.log(lang,Math.min(i+12,todo.length)+'/'+todo.length);
 }
}
// Terminology, proper names and concise interface labels receive editorial overrides.
Object.assign(result.es,{'Early Renaissance':'Renacimiento temprano','High Renaissance':'Alto Renacimiento','Proto-Renaissance':'Protorrenacimiento','Northern Renaissance':'Renacimiento del Norte','Venetian school':'Escuela veneciana','Mannerism':'Manierismo','Explore movement':'Explorar movimiento','Key paintings':'Obras clave','Giotto':'Giotto','Duccio':'Duccio','Titian':'Tiziano','Painting gallery':'Galería de pinturas','Preferences':'Preferencias','Favourite category':'Categoría de favoritos'});
Object.assign(result.de,{'Early Renaissance':'Frührenaissance','High Renaissance':'Hochrenaissance','Proto-Renaissance':'Protorenaissance','Northern Renaissance':'Nördliche Renaissance','Venetian school':'Venezianische Schule','Mannerism':'Manierismus','Explore movement':'Kunstrichtung erkunden','Key paintings':'Schlüsselwerke','Giotto':'Giotto','Duccio':'Duccio','Titian':'Tizian','Painting gallery':'Gemäldegalerie','Preferences':'Einstellungen','Favourite category':'Favoritenkategorie'});
for(const lang of ['es','de'])for(const name of native)result[lang][name]=name;
await writeFile(file,JSON.stringify(result,null,2)+'\n');
await import('./finish-translations.mjs');
