import {readFile,writeFile,stat} from 'node:fs/promises';
import overrides from '../src/data/work-images.json' with {type:'json'};
const file=new URL('../src/data/image-manifest.json',import.meta.url);
let manifest={};try{manifest=JSON.parse(await readFile(file));}catch{/* First asset download. */}
const errors=[];
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#95;','_').replaceAll('&quot;','"');
const clean=s=>decode(s.replace(/<[^>]*>/g,'').trim());
for(const [id,filename] of Object.entries(overrides)){
 const commonsPage='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(filename.replaceAll(' ','_'));
 if(manifest[id]&&decodeURIComponent(manifest[id].commonsPage.split('File:').at(-1)).replaceAll('_',' ')===filename&&await stat(new URL('../public/artworks/'+id+'.jpg',import.meta.url)).catch(()=>null))continue;
 try{
 const r=await fetch(commonsPage);if(!r.ok)throw new Error('Page HTTP '+r.status);
 const html=decode(await r.text());const part=html.slice(html.indexOf('class="fullImageLink"'));
 const originalUrl=decode(part.match(/<a href="([^"]+)"/)?.[1]??'').split('?')[0];
 const preview=decode(part.match(/<img[^>]+src="([^"]+)"/)?.[1]??'').split('?')[0];
 const license=clean(html.match(/class="licensetpl_short"[^>]*>([\s\S]*?)<\/span>/)?.[1]??'');
 if(!['Public domain','CC0','CC BY-SA 4.0','CC BY-SA 3.0','CC BY 3.0'].includes(license))throw new Error('Review license '+license);
 const image=await fetch(preview);if(!image.ok)throw new Error('Image HTTP '+image.status);
 const bytes=Buffer.from(await image.arrayBuffer());
 await writeFile(new URL('../public/artworks/'+id+'.jpg',import.meta.url),bytes);
 manifest[id]={file:'/artworks/'+id+'.jpg',originalUrl,commonsPage,license,licenseUrl:license==='Public domain'?'https://creativecommons.org/publicdomain/mark/1.0/':license==='CC0'?'https://creativecommons.org/publicdomain/zero/1.0/':'https://creativecommons.org/licenses/'+(license.includes('BY-SA')?'by-sa':'by')+'/'+license.split(' ').at(-1)+'/',credit:clean(html.match(/class="licensetpl_attr"[^>]*>([\s\S]*?)<\/span>/)?.[1]??''),artist:'',...(id==='filippino-magi'?{attribution:'Sailko'}:{}),retrieved:'2026-10-06',bytes:bytes.length};
 await writeFile(file,JSON.stringify(manifest,null,2)+'\n');console.log(id,license,bytes.length);
 }catch(e){errors.push(id);console.log('ERROR',id,e.message);}
}
if(errors.length)throw new Error('Assets need attention: '+errors.join(', '));
