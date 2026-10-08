import snapshot from '../data/museum-catalog.json' with {type:'json'};
import {artists} from '../data/artists.js';
import {paintings} from '../data/content.js';
export const museums={nga:'National Gallery of Art',cleveland:'Cleveland Museum of Art',artic:'Art Institute of Chicago',london:'National Gallery, London',met:'The Metropolitan Museum of Art'};
export const catalogueDate=snapshot.updated;
// One museum object = one stable ID. Curated examples reuse their original ID.
const originalSources=new Set(paintings.map(p=>p.source.replace(/\/$/,'')));
export const museumPaintings=snapshot.records.filter(r=>!originalSources.has(r.source.replace(/\/$/,''))).map(r=>{
 const artist=artists.find(a=>a.id===r.artistIds[0]);
 const documentedYear=r.begin||Number(r.date?.match(/\b(1[2-7]\d{2})\b/)?.[1]);
 const year=r.begin&&r.end?Math.round((r.begin+r.end)/2):documentedYear;
 return {...r,year:Number.isFinite(year)&&year>=1250&&year<=1800?year:null,artist:artist.name,movement:artist.movement,sourceName:museums[r.museum],place:museums[r.museum],date:r.date||'Дата указана в музее',tags:[],text:'Музейная запись. Название, техника и атрибуция приведены в оригинале источника.',look:null,remoteImage:r.image,external:true};
});
export const allPaintings=[...paintings,...museumPaintings];
export const timelinePaintings=allPaintings.filter(p=>Number.isFinite(p.year));
export const museumWorksFor=id=>museumPaintings.filter(p=>p.artistIds.includes(id));
