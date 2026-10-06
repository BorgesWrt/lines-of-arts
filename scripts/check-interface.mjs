import assert from 'node:assert/strict';
import { movements, paintings, glossary } from '../src/data/content.js';
import { artists, relations } from '../src/data/artists.js';
import { createElement } from 'react';
import { translate, localizeTree, englishStrings } from '../src/utils/i18n.js';
import languages from '../src/data/languages.json' with {type:'json'};
import { cleanFavorites, emptyFavorites, toggleFavorite } from '../src/utils/favorites.js';
import { makeLayout } from '../src/utils/canvas-layout.js';

const catalog = { movements, artists, paintings };
const adjacentSaved={movements:['rococo'],artists:['fragonard'],paintings:['fragonard-swing']};
assert.deepEqual(cleanFavorites(adjacentSaved,catalog),adjacentSaved,'New eras must retain independent saved references');
assert.deepEqual(cleanFavorites(toggleFavorite(adjacentSaved,'artists','fragonard'),catalog),{...adjacentSaved,artists:[]},'Removing a new artist must retain the movement and painting');
let saved = toggleFavorite(emptyFavorites(), 'artists', 'masaccio');
saved = toggleFavorite(saved, 'paintings', 'masaccio');
saved = toggleFavorite(saved, 'paintings', 'masaccio');
assert.deepEqual(saved.artists, ['masaccio'], 'Removing a painting must preserve its artist');
assert.deepEqual(saved.paintings, []);
assert.deepEqual(cleanFavorites({ artists: ['masaccio','missing','masaccio'], movements: null }, catalog), { movements: [], artists: ['masaccio'], paintings: [] }, 'Old or malformed storage must not produce invalid items');

function verifyEnglish(value) {
  if (typeof value === 'string' && /[А-Яа-яЁё]/.test(value)) {
    assert.ok(!/[А-Яа-яЁё]/.test(translate(value,'en')), `Missing catalogue translation: ${value}`);
    assert.equal(translate(value,'ru'), value);
  } else if (Array.isArray(value)) value.forEach(verifyEnglish);
  else if (value && typeof value === 'object') Object.values(value).forEach(verifyEnglish);
}
[movements, paintings, artists, relations, glossary].forEach(verifyEnglish);
assert.equal(translate(movements.find(m=>m.id==='high').title,'en'),'High Renaissance','Chronological sorting must not misalign existing translations');
assert.equal(translate(movements.find(m=>m.id==='gothic').title,'de'),'Internationale Gotik');
for(const locale of ['es','de']){
 for(const text of englishStrings())assert.ok(languages[locale][text],`Missing ${locale} translation: ${text}`);
 for(const p of paintings)for(const field of ['title','artist','look','medium'])assert.ok(!/[А-Яа-яЁё]/.test(translate(p[field],locale)),`Untranslated ${locale} painting: ${p.id}`);
 assert.notEqual(translate('Ключевые работы',locale),translate('Ключевые работы','en'));
}
assert.equal(translate('Художники','es'),'Artistas');
assert.equal(translate('Ключевые работы','de'),'Schlüsselwerke');
assert.equal(translate('24 художника, ','es'),'24 artistas, ');
assert.equal(translate('Альбрехт Дюрер · Работы: 3','de'),'Albrecht Dürer · Gemälde: 3');
saved=toggleFavorite(saved,'paintings','giotto-kiss');
assert.ok(cleanFavorites(saved,catalog).paintings.includes('giotto-kiss'),'New paintings must support saved favourites');
const shell = createElement('div', null, createElement('header', null, 'Избранное'), createElement('main', { 'aria-label':'Картины' }, 'Весь Ренессанс'));
assert.deepEqual(localizeTree(shell,'ru').props.children.map(child=>child.key), localizeTree(shell,'en').props.children.map(child=>child.key), 'Changing language must preserve canvas element identity and its ResizeObserver');

const mixed = makeLayout(movements,artists,'artists',74,['high']);
assert.equal(mixed.groups.find(g=>g.movement.id==='early').openness,0);
assert.equal(mixed.groups.find(g=>g.movement.id==='high').openness,1);
assert.equal(new Set(artists.filter(a=>a.movement==='high').map(a=>mixed.rows.get(a.id))).size,3);
const collapsed = makeLayout(movements,artists,'artists',74,[]);
assert.ok(collapsed.height < mixed.height, 'Collapsing a movement restores compact lanes');
const pair = makeLayout(movements,artists,'artists',74,['high','venice']);
assert.equal(pair.groups.filter(g=>g.openness===1).length,2,'Directions expand independently');
console.log('Validated independent favourites, corrupt storage recovery, complete catalogue translations, and mixed expanded/collapsed directions.');
