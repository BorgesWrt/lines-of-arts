// Only the explicitly reviewed Public domain reproductions in this manifest.
// Optional maintenance script. Requires Python with Pillow; runtime uses local JPEGs.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import approved from '../src/data/adjacent-image-sources.json' with {type:'json'};
const python=process.env.ARTS_PYTHON || 'python';
const manifestFile=new URL('../src/data/image-manifest.json',import.meta.url);
const manifest=JSON.parse(await readFile(manifestFile));
const errors=[];
for(const [id,source] of Object.entries(approved)){
 const target=new URL('../public/artworks/'+id+'.jpg',import.meta.url);
 if(manifest[id]?.commonsPage===source.commonsPage&&await stat(target).catch(()=>null))continue;
 try{
  if(source.license!=='Public domain')throw Error('Unreviewed rights');
  // Wikimedia asks external consumers to use a common thumbnail size.
  // https://www.mediawiki.org/wiki/Common_thumbnail_sizes
  const basename=source.originalUrl.split('/').at(-1);
  const downloadUrl=source.originalUrl.replace('/commons/','/commons/thumb/')+'/960px-'+basename;
  const response=await fetch(downloadUrl,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('Preview HTTP '+response.status);
  if(!response.headers.get('content-type')?.startsWith('image/'))throw Error('Expected image');
  const bytes=Buffer.from(await response.arrayBuffer());
  const converted=spawnSync(python,['-c',"from PIL import Image; import io,sys; Image.MAX_IMAGE_PIXELS=200000000; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); im.thumbnail((1600,1600),Image.Resampling.LANCZOS); im.convert('RGB').save(sys.stdout.buffer,format='JPEG',quality=90,optimize=True)"],{input:bytes,maxBuffer:10*1024*1024});
  if(converted.status!==0)throw Error('Pillow conversion failed');
  await writeFile(target,converted.stdout);
  manifest[id]={file:'/artworks/'+id+'.jpg',...source,downloadUrl,licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',credit:'',artist:'',retrieved:new Date().toISOString().slice(0,10),bytes:converted.stdout.length,processing:'Standard 960px Wikimedia preview; JPEG quality 90; no crop.'};
  await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  console.log(id,converted.stdout.length);
  await new Promise(resolve=>setTimeout(resolve,15000));
 }catch(error){errors.push(id);console.log(id,error.message);}
}
if(errors.length)throw Error('Missing reviewed assets: '+errors.join(', '));
