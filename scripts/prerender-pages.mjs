import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { movements, paintings } from '../src/data/content.js';
import { artists } from '../src/data/artists.js';
import { allPaintings } from '../src/utils/museum-catalog.js';

const dist = new URL('../dist/', import.meta.url).pathname;
const shell = await readFile(join(dist, 'index.html'), 'utf8');
const esc = v => String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const entries = [];
function add(path,title,description,body) { entries.push({path,title,description,body}); }
add('/', 'История искусства, которую легко понять', 'Бесплатные шпаргалки по истории европейской живописи XIII–XVIII веков, картины, художники и интерактивная хронология.', '<h1>История искусства, которую легко понять</h1><p>Бесплатный учебный атлас европейской живописи XIII–XVIII веков.</p><nav><a href="/movements/">Шпаргалки по направлениям</a> · <a href="/quiz/">Тест</a> · <a href="/compare/">Сравнение направлений</a> · <a href="/atlas/">Интерактивная шкала</a></nav>');
add('/movements/','Направления живописи — шпаргалки','10 направлений европейской живописи: периоды, признаки, художники и произведения.', '<h1>Направления живописи</h1>'+movements.map(m=>'<p><a href="/movements/'+esc(m.id)+'/">'+esc(m.title)+'</a> — '+esc(m.idea)+'</p>').join(''));
for (const m of movements) {
 const members=artists.filter(a=>a.movement===m.id);
 const related=paintings.filter(p=>p.movement===m.id).slice(0,12);
 add('/movements/'+m.id+'/',m.title+' — признаки, художники, картины',m.summary,'<article><h1>'+esc(m.title)+'</h1><p>'+esc(m.subtitle)+' · '+m.start+'–'+m.end+'</p><p>'+esc(m.summary)+'</p><h2>Как узнать направление</h2><ul>'+m.traits.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><p>'+esc(m.remember)+'</p><h2>Художники</h2>'+members.map(a=>'<p><a href="/artists/'+esc(a.id)+'/">'+esc(a.name)+'</a> · '+esc(a.date)+'</p>').join('')+'<h2>Произведения</h2>'+related.map(p=>'<p><a href="/artworks/'+esc(p.id)+'/">'+esc(p.title)+'</a> · '+esc(p.artist)+'</p>').join('')+'<p><a href="'+esc(m.source)+'">Музейный источник</a></p></article>');
}
for (const a of artists) add('/artists/'+a.id+'/',a.name+' — биография и картины',a.text,'<article><h1>'+esc(a.name)+'</h1><p>'+esc(a.date)+'</p><p>'+esc(a.text)+'</p><p><a href="/movements/'+esc(a.movement)+'/">Направление</a> · <a href="'+esc(a.source)+'">Музейный источник</a></p></article>');
for (const p of allPaintings) add('/artworks/'+p.id+'/',p.title+' — '+p.artist,p.text||'Картина '+p.title+' · '+p.artist+' · '+p.date,'<article><h1>'+esc(p.title)+'</h1><p>'+esc(p.artist)+' · '+esc(p.date)+'</p><p>'+esc(p.text||'Произведение в музейном каталоге атласа.')+'</p>'+(p.look?'<p>'+esc(p.look)+'</p>':'')+(p.source?'<p><a href="'+esc(p.source)+'">Музейный источник</a></p>':'')+'</article>');
add('/compare/','Сравнение направлений живописи','Сравни художественные направления по признакам и ключевым картинам.','<h1>Сравнение художественных направлений</h1><p>Интерактивные шпаргалки: Ренессанс, маньеризм, барокко и рококо.</p>');
add('/quiz/','Угадай художественное направление — тест','Бесплатный тест по истории живописи: угадай направление по картине.','<h1>Угадай направление по картине</h1><p>Интерактивный тест с объяснениями ответов.</p>');
add('/atlas/','Интерактивная хронология живописи XIII–XVIII веков','Хронология направлений, художников, произведений и исторических связей.','<h1>Интерактивный атлас европейской живописи</h1><p>Десять направлений, художники и музейные произведения на временной шкале.</p>');
for(const e of entries) {
 const html=shell.replace(/<html lang="en">/,'<html lang="ru">')
 .replace(/<title>[^<]*<\/title>/,'<title>'+esc(e.title)+' — Lines of Arts</title>')
 .replace(/<meta name="description" content="[^"]*"\s*\/>/,'<meta name="description" content="'+esc(e.description.slice(0,155))+'" />\n<meta property="og:type" content="article" />\n<meta property="og:title" content="'+esc(e.title)+'" />\n<meta property="og:description" content="'+esc(e.description.slice(0,155))+'" />')
 .replace('<div id="root"></div>','<div id="root"><main>'+e.body+'</main></div>');
 const dir=join(dist,e.path);await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),html);
}
const base=process.env.SITE_URL?.replace(/\/$/,'');
if(base&&/^https:\/\//.test(base))await writeFile(join(dist,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries.map(e=>'<url><loc>'+esc(base+e.path)+'</loc></url>').join('')+'</urlset>');
await writeFile(join(dist,'robots.txt'),'User-agent: *\nAllow: /\n'+(base?'Sitemap: '+base+'/sitemap.xml\n':''));
console.log('Generated '+entries.length+' indexable learning pages'+(base?' and sitemap':' (set SITE_URL for sitemap)'));
