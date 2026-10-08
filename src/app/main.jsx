import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Mail, ChevronDown, ChevronUp, Languages, Palette, Star, ArrowRight, Check, ChevronRight, CircleHelp, ExternalLink, Focus, GitBranch, Grid2X2, Maximize2, Minimize2, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { movements, paintings, glossary } from '../data/content';
import {keyWorks} from '../data/additional-works';
import { artists, relations } from '../data/artists';
import { START, END, MIN_ZOOM, MAX_ZOOM, DIRECTION_ZOOM, clamp, detailLevel, pixelsPerYear, yearToX, zoomAt, makeLayout, clusterWorks } from '../utils/canvas-layout';
import { LocaleContext, localizeTree, translate } from '../utils/i18n';
import { EXPANSION_KEY, readExpansion, includeDirections } from '../utils/expansion-session';
import { movementDensity } from '../utils/movement-density';
import { SpectrumTrack, SpectrumBins } from './spectrum-track.jsx';
import { workTooltip } from '../utils/work-tooltip';
import { useLayout } from '../utils/use-layout';
import { useCamera } from '../utils/use-camera';
import { FAVORITES_KEY, emptyFavorites, cleanFavorites, toggleFavorite } from '../utils/favorites';
import images from '../data/image-manifest.json';
import '../styles/global.css';
import MuseumWorks from './museum-works.jsx';
import Feedback from './feedback.jsx';
import ArtworkPresentation from './artwork-presentation.jsx';
import {allPaintings,timelinePaintings,museumPaintings,catalogueDate} from '../utils/museum-catalog.js';

const movementById = id => movements.find(m => m.id === id);
const artistById = id => artists.find(a => a.id === id);
const initialWork = new URLSearchParams(location.search).get('work');
const initialModal = allPaintings.some(p => p.id === initialWork) ? { type: 'painting', id: initialWork } : null;
const catalog = { movements, artists, paintings:allPaintings };
const fitCamera = { zoom: 1, center: (START + END) / 2, panY: 0 };
const boundsY = (y, content, viewport) => clamp(y, Math.min(0, viewport - content - 30), 25);

function ArtworkImage({ painting, ...props }) {
  const locale = useContext(LocaleContext);
  const [failed, setFailed] = useState(false);
  const image=painting.remoteImage||images[painting.id]?.file;
  if (failed || !image) return <span className="image-fallback">{translate(painting.external&&!failed?'Репродукция доступна на сайте музея':'Репродукция недоступна',locale)}</span>;
  return <img src={image} referrerPolicy="no-referrer" decoding="async" alt={translate(`${painting.artist} — «${painting.title}»`,locale)} onError={() => setFailed(true)} {...props}/>;
}

function Dialog({ modal, onClose, children }) {
  const locale = useContext(LocaleContext);
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const key = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const list = [...ref.current.querySelectorAll('button,a[href],input,textarea,select')].filter(el => el.getClientRects().length);
        if (e.shiftKey && document.activeElement === list[0]) { e.preventDefault(); list.at(-1)?.focus(); }
        else if (!e.shiftKey && document.activeElement === list.at(-1)) { e.preventDefault(); list[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    ref.current.querySelector('button')?.focus();
    return () => { document.removeEventListener('keydown', key); opener?.focus({ preventScroll: true }); };
  }, []);
  const title = modal.type === 'feedback' ? 'Обратная связь' : modal.type === 'language' ? 'Язык сайта' : modal.type === 'theme' ? 'Тема оформления' : modal.type === 'settings' ? 'Настройки' : modal.type === 'favorites' ? 'Избранное' : modal.type === 'filters' ? 'Фильтры карты' : modal.type === 'painting' ? 'Картина' : modal.type === 'artist' ? 'Художник' : modal.type === 'relation' ? 'Историческая связь' : modal.type === 'gallery' ? 'Картины' : modal.type === 'help' ? 'Как читать карту' : 'Источники и метод';
  return <div className={`dialog-backdrop ${modal.type}`} onClick={onClose}><section className={`dialog ${['filters','artist','painting','relation','movement'].includes(modal.type) ? 'drawer' : 'wide'}`} ref={ref} role="dialog" aria-modal="true" aria-label={translate(title,locale)} onClick={e => e.stopPropagation()}><div className="dialog-top"><span>{translate(title,locale)}</span><button aria-label={translate("Закрыть окно",locale)} onClick={onClose}><X size={19}/></button></div>{children}</section></div>;
}

function App() {
  const [preferences, setPreferences] = useState(() => {
    try { const saved=JSON.parse(localStorage.getItem('art-atlas:preferences:v1'));return { locale:['ru','en','es','de'].includes(saved?.locale)?saved.locale:'en', theme:['white','warm','dark','black'].includes(saved?.theme)?saved.theme:'dark' }; }
    catch { return { locale:'en',theme:'dark' }; }
  });
  const locale=preferences.locale;
  const [preferencesError,setPreferencesError]=useState(false);
  useEffect(()=>{
    document.documentElement.dataset.theme=preferences.theme;
    document.documentElement.lang=locale;
    document.title='lines-of-arts — '+translate('Европейская живопись',locale);
    try { localStorage.setItem('art-atlas:preferences:v1',JSON.stringify(preferences));setPreferencesError(false); }
    catch { setPreferencesError(true); }
  },[preferences,locale]);
  const [modal, setModal] = useState(initialModal);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [galleryMovement, setGalleryMovement] = useState('all');
  const [active, setActive] = useState(movements.map(m => m.id));
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(null);
  const [expansionSession,setExpanded] = useState(() => {
    try { return readExpansion(sessionStorage,movements); } catch { return null; }
  });
  const expanded = expansionSession ?? [];
  useEffect(() => {
    if(expansionSession === null)return;
    try { sessionStorage.setItem(EXPANSION_KEY,JSON.stringify(expansionSession)); } catch {}
  },[expansionSession]);
  const [targetCamera, setCamera] = useState(fitCamera);
  const [size, setSize] = useState({ width: 1200, height: 650 });
  const [links, setLinks] = useState(true);
  const [disputed, setDisputed] = useState(false);
  const [types, setTypes] = useState(['training','workshop','collaboration']);
  const [selected, setSelected] = useState(initialWork || null);
  const [hover, setHover] = useState(null);
  const tooltip = workTooltip(hover,allPaintings);
  const [dragging, setDragging] = useState(false);
  const camera = useCamera(targetCamera, dragging);
  const [direction, setDirection] = useState(null);
  const directionTimer = useRef(null);
  const suppressDirectionHover = useRef(0);
  const [favoriteType, setFavoriteType] = useState('movements');
  const [storageError, setStorageError] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return cleanFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY)), catalog); }
    catch { return emptyFavorites(); }
  });
  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [favorites]);
  useEffect(() => () => clearTimeout(directionTimer.current), []);
  const stage = useRef(null);
  const gesture = useRef({ points: new Map(), start: null });
  const latest = useRef({});
  const normalized = query.trim().toLocaleLowerCase(locale);
  const searchText = value => [value,...['en','es','de'].map(lang=>translate(value,lang))].join(' ').toLocaleLowerCase(locale);
  const visibleArtists = useMemo(() => artists.filter(a => active.includes(a.movement) && (!focused || focused === a.movement) && (!normalized || searchText(`${a.name} ${a.date} ${movementById(a.movement).title}`).includes(normalized) || allPaintings.some(p => p.artistIds.includes(a.id) && searchText(`${p.title} ${p.tags.join(' ')} ${p.date}`).includes(normalized)))), [active, focused, normalized, locale]);
  const visibleMovements = movements.filter(m => visibleArtists.some(a => a.movement === m.id));
  const workResults = useMemo(() => timelinePaintings.filter(p => visibleArtists.some(a => p.artistIds.includes(a.id)) && (!normalized || searchText(`${p.artist} ${p.title} ${p.tags.join(' ')} ${p.date} ${movementById(p.movement).title}`).includes(normalized))),[visibleArtists,normalized,locale]);
  const density = useMemo(() => movementDensity(movements,workResults),[workResults]);
  const level = normalized ? (targetCamera.zoom >= 5 ? 'works' : 'artists') : detailLevel(targetCamera.zoom, focused);
  const targetLayout = useMemo(() => makeLayout(visibleMovements, visibleArtists, level, 74 + 52 * clamp((targetCamera.zoom - 4.4) / 1.1, 0, 1), normalized ? undefined : expanded, Math.max(48,Math.min(78,(size.height-200)/Math.max(1,visibleMovements.length)))), [visibleMovements.map(m => m.id).join(','), visibleArtists.map(a => a.id).join(','), level, targetCamera.zoom, expanded.join(','), normalized, size.height]);
  const layout=useLayout(targetLayout,dragging);
  const artistOpenness = id => layout.groups.find(g=>g.movement.id===id)?.openness ?? 0;
  const pixelYear = pixelsPerYear(size.width, camera.zoom);
  const x = year => yearToX(year, size.width, camera);
  const y = value => value + camera.panY;
  const relationResults = relations.filter(r => types.includes(r.type) && (disputed || r.status === 'confirmed') && artistOpenness(artistById(r.from).movement)>.05 && artistOpenness(artistById(r.to).movement)>.05 && layout.rows.has(r.from) && layout.rows.has(r.to));
  const yearStep = pixelYear > 16 ? 5 : pixelYear > 8 ? 10 : pixelYear > 4 ? 25 : pixelYear > .7 ? 50 : pixelYear > .35 ? 100 : 200;
  const firstTick=Math.ceil(START/yearStep)*yearStep;
  const ticks = Array.from({ length: Math.floor((END - firstTick) / yearStep) + 1 }, (_, i) => firstTick + i * yearStep).filter(year => x(year) > 18 && x(year) < size.width - 18);
  latest.current = { camera, targetCamera, size, layout, targetLayout, level, expanded, hasExpansionChoice:expansionSession!==null, visibleMovements, visibleArtists, focused, normalized };

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setCamera(c => { const panY = boundsY(c.panY, targetLayout.height, size.height); return panY === c.panY ? c : { ...c, panY }; });
  }, [targetLayout.height, size.height]);
  useEffect(() => {
    const handleWheel = e => {
      if (e.target.closest('.direction-preview, .filter-dock')) return;
      e.preventDefault();
      const { targetCamera: c, size: s, layout: l } = latest.current;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        setCamera({ ...c, center: clamp(c.center + (e.deltaX || e.deltaY) / pixelsPerYear(s.width,c.zoom), START - 60, END + 60) });
      } else {
        const rect = stage.current.getBoundingClientRect();
        const next = zoomAt(c, c.zoom * Math.exp(-clamp(e.deltaY, -80, 80) * .0015), e.clientX - rect.left, s.width);
        applyZoom(next,e.clientY-stage.current.getBoundingClientRect().top);
      }
      setHover(null); setDirection(null);
    };
    stage.current.addEventListener('wheel', handleWheel, { passive: false });
    return () => stage.current?.removeEventListener('wheel', handleWheel);
  }, []);
  useEffect(() => {
    const key = e => { if (e.key === 'Escape' && !modal) { setHover(null); setDirection(null); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [modal]);

  function close() { setModal(null); setDirection(null); const url = new URL(location.href); url.searchParams.delete('work'); history.replaceState({}, '', url); }
  function reset() { setActive(movements.map(m => m.id)); setQuery(''); setFocused(null); setCamera(fitCamera); setHover(null); }
  function overview() { setFocused(null); setCamera(fitCamera); setHover(null); }
  function focusMovement(id) {
    suppressDirectionHover.current=performance.now()+500;clearTimeout(directionTimer.current);
    const m = movementById(id);
    setActive(value => [...new Set([...value,id])]); setFocused(id); setExpanded(value=>includeDirections(value??[],[id])); setQuery('');
    setCamera({ zoom: clamp((END - START) / (m.end - m.start + 55), 1.25, 4.6), center: (m.start + m.end) / 2, panY: 0 });
    setHover(null); close();
  }
  function openPainting(id) {
    setSelected(id); setModal({ type: 'painting', id }); setHover(null);
    const url = new URL(location.href); url.searchParams.set('work', id); history.replaceState({}, '', url);
  }
  function openArtist(id) { setSelected(id); setModal({ type:'artist', id }); setHover(null); }
  function showArtist(id) {
    const a = artistById(id); const m = movementById(a.movement);
    setQuery(''); setFocused(m.id); setExpanded(value=>includeDirections(value??[],[m.id])); setActive(value => [...new Set([...value,m.id])]); setSelected(id);
    const others = artists.filter(item => item.movement === m.id);
    const focusedLayout = makeLayout([m], others, 'artists');
    setCamera({ zoom: 3, center: (a.start + a.end) / 2, panY: boundsY(size.height / 2 - focusedLayout.rows.get(id), focusedLayout.height, size.height) });
    close();
  }
  function showRelation(r) {
    const first = artistById(r.from); const second = artistById(r.to);
    const nextExpanded=includeDirections(expanded,[first.movement,second.movement]);
    const allLayout = makeLayout(movements,artists,'artists',undefined,nextExpanded);
    setQuery(''); setFocused(null); setExpanded(nextExpanded); setActive(movements.map(m => m.id)); setSelected(first.id); setDisputed(v => v || r.status === 'disputed'); setLinks(true);
    setCamera({ zoom: 2.8, center: (Math.max(first.start,second.start) + Math.min(first.end,second.end)) / 2, panY: boundsY(size.height / 2 - (allLayout.rows.get(r.from) + allLayout.rows.get(r.to)) / 2, allLayout.height,size.height) });
    close();
  }
  function applyZoom(next, pointerY) {
    const state=latest.current;
    if (!state.focused && !state.normalized && state.targetCamera.zoom < DIRECTION_ZOOM && next.zoom >= DIRECTION_ZOOM) {
      const group=state.layout.groups.reduce((best,g)=>Math.abs(g.y+state.camera.panY-pointerY)<Math.abs(best.y+state.camera.panY-pointerY)?g:best,state.layout.groups[0]);
      if(group){
        const ids=state.hasExpansionChoice?state.expanded:[group.movement.id];
        const newLayout=makeLayout(state.visibleMovements,state.visibleArtists,'artists',undefined,ids);
        const newGroup=newLayout.groups.find(g=>g.movement.id===group.movement.id);
        setExpanded(ids);
        next={...next,panY:boundsY(state.camera.panY+group.y-newGroup.y,newLayout.height,state.size.height)};
      }
    } else if (!state.focused && !state.normalized && state.targetCamera.zoom >= DIRECTION_ZOOM && next.zoom < DIRECTION_ZOOM) {
      const group=state.layout.groups.filter(g=>g.openness>.5).sort((a,b)=>Math.abs(a.y+state.camera.panY-pointerY)-Math.abs(b.y+state.camera.panY-pointerY))[0];
      const newLayout=makeLayout(state.visibleMovements,state.visibleArtists,'overview');
      if(group)next={...next,panY:boundsY(state.camera.panY+group.y-newLayout.groups.find(g=>g.movement.id===group.movement.id).y,newLayout.height,state.size.height)};
    }
    setCamera(next);
  }
  function toggleOverviewZoom() { if(targetCamera.zoom >= 1.82 - 1e-6) overview(); else changeZoom(1.82); }
  function changeZoom(value) { applyZoom(zoomAt(targetCamera,value,size.width/2,size.width),size.height/2);setHover(null);setDirection(null); }
  function toggleDirection(id) {
    suppressDirectionHover.current=performance.now()+500;clearTimeout(directionTimer.current);
    const next=expanded.includes(id)?expanded.filter(value=>value!==id):[...expanded,id];
    const currentGroup=layout.groups.find(g=>g.movement.id===id);
    const zoom=Math.max(DIRECTION_ZOOM,targetCamera.zoom);
    const newLayout=makeLayout(visibleMovements,visibleArtists,zoom>=5?'works':'artists',74+52*clamp((zoom-4.4)/1.1,0,1),next);
    const nextGroup=newLayout.groups.find(g=>g.movement.id===id);
    setExpanded(next);setDirection(null);
    setCamera(c=>({...c,zoom,panY:boundsY(camera.panY+currentGroup.header-nextGroup.header,newLayout.height,size.height)}));
  }
  function stepZoom(sign) { changeZoom(Math.round((targetCamera.zoom + sign * (targetCamera.zoom >= 4 ? .25 : .2)) * 100) / 100); }
  function openDirection(id, event) {
    if(event.type==='mouseenter'&&performance.now()<suppressDirectionHover.current)return;
    clearTimeout(directionTimer.current);
    const rect = event.currentTarget.getBoundingClientRect();
    const parent = stage.current.getBoundingClientRect();
    setHover(null);
    setDirection({ id, x: rect.left - parent.left, y: rect.bottom - parent.top + 12 });
  }
  function leaveDirection() { directionTimer.current = setTimeout(() => setDirection(null), 220); }
  function favoriteButton(type, id, name) {
    const saved = favorites[type].includes(id);
    return <button className={`favorite-button ${saved?'saved':''}`} aria-label={`${saved?'Убрать из избранного':'Добавить в избранное'}: ${name}`} aria-pressed={saved} onClick={()=>setFavorites(value=>toggleFavorite(value,type,id))}><Star size={17} fill={saved?'currentColor':'none'}/><span>{saved?'В избранном':'В избранное'}</span></button>;
  }
  function pointerDown(e) {
    if (e.button !== 0 || e.target.closest('button,a,input,[role="button"],.direction-preview')) return;
    setDirection(null); setCamera(camera);
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current.points.set(e.pointerId, { x:e.clientX, y:e.clientY });
    const points = [...gesture.current.points.values()];
    gesture.current.start = { camera: latest.current.camera, points: points.map(p => ({ ...p })), distance: points.length > 1 ? Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y) : 0 };
    setDragging(true); setHover(null);
  }
  function pointerMove(e) {
    const g = gesture.current;
    if (!g.points.has(e.pointerId)) return;
    g.points.set(e.pointerId,{ x:e.clientX,y:e.clientY });
    const points = [...g.points.values()]; const { camera: c, size:s, layout:l } = latest.current;
    if (points.length > 1 && g.start.points.length > 1) {
      const distance = Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y);
      const mid = { x:(points[0].x+points[1].x)/2, y:(points[0].y+points[1].y)/2 };
      const initial = { x:(g.start.points[0].x+g.start.points[1].x)/2, y:(g.start.points[0].y+g.start.points[1].y)/2 };
      const rect = stage.current.getBoundingClientRect();
      const next = zoomAt(g.start.camera,g.start.camera.zoom * distance / Math.max(1,g.start.distance),initial.x-rect.left,s.width);
      setCamera({ ...next, center: next.center - (mid.x-initial.x) / pixelsPerYear(s.width,next.zoom), panY: boundsY(g.start.camera.panY+mid.y-initial.y,l.height,s.height) });
    } else {
      const p = points[0]; const p0 = g.start.points[0];
      setCamera({ ...g.start.camera, center:clamp(g.start.camera.center - (p.x-p0.x)/pixelsPerYear(s.width,g.start.camera.zoom),START-60,END+60), panY:boundsY(g.start.camera.panY+p.y-p0.y,l.height,s.height) });
    }
  }
  function pointerUp(e) {
    gesture.current.points.delete(e.pointerId);
    const remaining = [...gesture.current.points.values()];
    if (remaining.length) gesture.current.start = { camera: latest.current.camera, points:remaining.map(p => ({ ...p })), distance:0 };
    else { gesture.current.start = null; setDragging(false); }
  }
  function canvasKey(e) {
    if (e.target !== e.currentTarget) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','=','-','0'].includes(e.key)) e.preventDefault();
    if (e.key === '+' || e.key === '=') stepZoom(1);
    else if (e.key === '-') stepZoom(-1);
    else if (e.key === '0') overview();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setCamera(c => ({ ...c, center:clamp(c.center+(e.key === 'ArrowRight' ? 70 : -70)/pixelYear,START-60,END+60) }));
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') setCamera(c => ({ ...c,panY:boundsY(c.panY+(e.key === 'ArrowDown' ? -80 : 80),layout.height,size.height) }));
  }

  function relationList(id) {
    const list = relations.filter(r => (r.from === id || r.to === id) && (r.status === 'confirmed' || disputed));
    return list.length ? <div className="relationship-list"><h3>Связи с мастерами</h3>{list.map(r => <button key={r.id} onClick={() => setModal({ type:'relation',id:r.id })}><span className={`relation-key ${r.type}`}/><span><strong>{artistById(r.from === id ? r.to : r.from).name}</strong><small>{r.status === 'disputed' ? 'Обсуждаемое отношение' : r.label}</small></span><ChevronRight size={17}/></button>)}</div> : <p className="secondary-note">Для этого художника в текущую карту пока не добавлены подтверждённые связи.</p>;
  }
  function content(type = modal?.type) {
    if(type==='feedback') return <Feedback/>;
    if (['language','theme'].includes(type)) return <div className="dialog-content"><h2>{type==='language'?'Язык сайта':'Тема оформления'}</h2>{type==='language'&&<><div className="settings-options" role="group" aria-label="Язык сайта">{[['ru','Русский'],['en','English'],['es','Español'],['de','Deutsch']].map(([value,label])=><button key={value} aria-pressed={locale===value} onClick={()=>setPreferences(p=>({...p,locale:value}))}>{label}{locale===value&&<Check size={16}/>}</button>)}</div></>}{type==='theme'&&<><div className="theme-options" role="group" aria-label="Тема оформления">{[['white','Белая'],['warm','Тёплая'],['dark','Тёмная'],['black','Чёрная']].map(([value,label])=><button key={value} aria-pressed={preferences.theme===value} onClick={()=>setPreferences(p=>({...p,theme:value}))}><i className={`theme-swatch ${value}`}/><span>{label}</span>{preferences.theme===value&&<Check size={16}/>}</button>)}</div></>}<p className="secondary-note">Выбор сохраняется в этом браузере.</p>{preferencesError&&<p role="status">Настройки не сохраняются: браузер запретил локальное хранилище.</p>}</div>;
    if (type === 'favorites') {
      const labels = { movements:'Направления', artists:'Художники', paintings:'Картины' };
      const entries = catalog[favoriteType].filter(item=>favorites[favoriteType].includes(item.id));
      return <div className="dialog-content"><h2>Мои шпаргалки</h2><p className="secondary-note">Собирай направления, мастеров и картины отдельно. Избранное сохраняется в этом браузере.</p>{storageError&&<p role="status">Браузер запретил сохранение. Избранное доступно до закрытия страницы.</p>}<div className="favorite-tabs" role="tablist" aria-label="Тип избранного">{Object.entries(labels).map(([type,label])=><button key={type} role="tab" aria-selected={favoriteType===type} onClick={()=>setFavoriteType(type)}>{label}<b>{favorites[type].length}</b></button>)}</div><div role="tabpanel" aria-label={labels[favoriteType]}>{entries.length?entries.map(item=><div className="favorite-entry" key={item.id}><button onClick={()=>favoriteType==='movements'?focusMovement(item.id):favoriteType==='artists'?openArtist(item.id):openPainting(item.id)}><strong>{item.title||item.name}</strong><small>{favoriteType==='movements'?item.subtitle:favoriteType==='artists'?item.date:item.artist}</small></button>{favoriteButton(favoriteType,item.id,item.title||item.name)}</div>):<div className="favorites-empty"><Star size={28}/><p>Здесь пока пусто</p><span>Нажми на звезду в карточке, чтобы сохранить шпаргалку.</span></div>}</div></div>;
    }
    if (type === 'filters') return <div className="dialog-content"><h2>Что показать на карте</h2><div className="filter-section"><span className="section-kicker">НАПРАВЛЕНИЯ</span><button onClick={() => setActive(movements.map(m=>m.id))}>Все</button></div><div className="movement-filter-list">{movements.map(m => <div key={m.id}><button className="filter-choice" aria-pressed={active.includes(m.id)} onClick={() => { setActive(value => value.includes(m.id) ? value.filter(id=>id!==m.id) : [...value,m.id]); if (focused===m.id) setFocused(null); }}><span className="check-box" style={{ '--color':m.color }}>{active.includes(m.id) && <Check size={13}/>}</span><span>{m.title}<small>ок. {m.start}–{m.end}</small></span></button><button className="focus-direction" aria-label={`Приблизить: ${m.title}`} onClick={() => focusMovement(m.id)}><Focus size={17}/></button></div>)}</div><div className="filter-divider"/><label className="toggle"><span>Исторические связи</span><input type="checkbox" checked={links} onChange={e=>setLinks(e.target.checked)}/></label><p className="secondary-note">Отношения между мастерами видны на уровне художников. У каждой связи есть музейный источник.</p>{[['training','Обучение'],['workshop','Работа в мастерской'],['collaboration','Совместная работа']].map(([id,label]) => <label key={id} className="relation-filter"><input type="checkbox" checked={types.includes(id)} onChange={()=>setTypes(v=>v.includes(id)?v.filter(t=>t!==id):[...v,id])}/><i className={id}/>{label}</label>)}<label className="relation-filter disputed-filter"><input type="checkbox" checked={disputed} onChange={e=>setDisputed(e.target.checked)}/>Обсуждаемые отношения</label><p className="secondary-note">По умолчанию скрыты. При включении показаны пунктиром с пояснением неопределённости.</p><button className="primary-button" onClick={()=>{reset();close();}}>Сбросить фильтры</button></div>;
    if (type === 'painting') {
      const p = allPaintings.find(p=>p.id===modal.id); const m=movementById(p.movement);
      return <><ArtworkPresentation key={p.id} painting={p} Image={ArtworkImage}><h2>{p.title}</h2><p>{p.artist}</p><span>{p.date}</span></ArtworkPresentation><div className="dialog-content"><button className="colored-label" style={{color:m.color}} onClick={()=>focusMovement(m.id)}>{m.title}<Focus size={13}/></button>{favoriteButton('paintings',p.id,p.title)}{(p.artistIds.length>1||p.artist!==artistById(p.artistIds[0]).name)&&<p className="work-attribution">{p.artist}</p>}<div className="work-authors">{p.artistIds.map(id=><button key={id} className="artist-link" onClick={()=>openArtist(id)}>{artistById(id).name}<ChevronRight size={15}/></button>)}</div><dl className="metadata"><div><dt>Техника</dt><dd>{p.medium}</dd></div><div><dt>Где находится</dt><dd>{p.place}</dd></div></dl>{p.text!==p.look&&<p>{p.text}</p>}{p.look&&<div className="look-note"><span><Focus size={15}/>НА ЧТО СМОТРЕТЬ</span><p>{p.look}</p></div>}{p.external&&<p className="secondary-note">{p.attribution}<br/>{p.credit}<br/>{p.accession}</p>}<div className="tags">{p.tags.map(tag=><button key={tag} onClick={()=>{setFocused(null);setActive(movements.map(m=>m.id));setQuery(tag);setCamera({...fitCamera,zoom:2.3});close();}}>{tag}</button>)}</div>{p.artistIds.map(id=><React.Fragment key={id}>{relationList(id)}</React.Fragment>)}<a className="source-link" href={p.source} target="_blank" rel="noreferrer">{p.sourceName}<ExternalLink size={14}/></a>{p.external?<span className="image-credit">{p.remoteImage?`${p.sourceName} · ${p.imageLicense}`:'Репродукция доступна на сайте музея'}</span>:<a className="image-credit" href={images[p.id].commonsPage} target="_blank" rel="noreferrer">Wikimedia Commons · {images[p.id].attribution&&`${images[p.id].attribution} · `}{images[p.id].license}</a>}</div></>;
    }
    if (type === 'artist') {
      const a=artistById(modal.id);const m=movementById(a.movement);const works=paintings.filter(p=>p.artistIds.includes(a.id)).sort((a,b)=>a.year-b.year);
      return <div className="dialog-content">{works[0]&&<ArtworkPresentation key={`artist-presentation-${a.id}`} painting={works[0]} Image={ArtworkImage}><h2>{a.name}</h2><p>{a.date}</p><span>{works[0].title}</span></ArtworkPresentation>}<span className="colored-label" style={{color:m.color}}>{m.title}</span>{!works[0]&&<h2>{a.name}</h2>}{favoriteButton('artists',a.id,a.name)}{!works[0]&&<p className="date-line">{a.date}</p>}<p>{a.text}</p><p className="secondary-note">{a.period==='activity'?'Линия показывает период от документированной деятельности до смерти.':'Линия показывает годы жизни, а не весь период работы художника.'} Приблизительные даты отмечены в подписи.</p><button className="primary-button" onClick={()=>showArtist(a.id)}><Focus size={16}/>Найти на холсте</button>{relationList(a.id)}<h3>Работы в атласе <small className="catalog-count">{works.length}</small></h3><p className="secondary-note">Учебная подборка работ; полный каталог смотри в музейных источниках.</p>{works.length?works.map(p=><button className="related-work" key={p.id} onClick={()=>openPainting(p.id)}><ArtworkImage painting={p}/><span>{p.title}<small>{p.date}</small></span><ChevronRight size={16}/></button>):<p className="secondary-note">Разбор картин этого мастера пока не добавлен. В музейном каталоге можно посмотреть его работы.</p>}<MuseumWorks key={a.id} artist={a} onOpen={openPainting} Image={ArtworkImage} favoriteButton={favoriteButton}/><a className="source-link" href={a.source} target="_blank" rel="noreferrer">Биография · National Gallery<ExternalLink size={14}/></a></div>;
    }
    if (type === 'relation') {
      const r=relations.find(r=>r.id===modal.id); const a=artistById(r.from);const b=artistById(r.to);
      return <div className="dialog-content"><span className={`connection-status ${r.status}`}>{r.status==='confirmed'?'Подтверждено музейным источником':'Характер отношения обсуждается'}</span><h2>{r.label}</h2><div className="relation-people"><button onClick={()=>openArtist(a.id)}>{a.name}</button><span>{r.type==='collaboration'?'↔':'→'}</span><button onClick={()=>openArtist(b.id)}>{b.name}</button></div><p>{r.text}</p><p className="secondary-note">Положение изгиба на шкале не обозначает дату знакомства или обучения: это соединение двух линий художников.</p><a className="source-link" href={r.source} target="_blank" rel="noreferrer">Проверить в {r.status==='disputed'?'публикации The Met':'National Gallery'}<ExternalLink size={14}/></a><button className="primary-button" onClick={()=>showRelation(r)}><GitBranch size={16}/>Показать связь на холсте</button></div>;
    }
    if (type === 'gallery') return <div className="dialog-content"><h2>Галерея работ <small className="catalog-count">{allPaintings.length}</small></h2><p className="secondary-note">Учебные разборы и музейные записи. У каждой работы есть ссылка на первоисточник.</p><div className="gallery-filters" role="group" aria-label="Направления"><button aria-pressed={galleryMovement==='all'} onClick={()=>setGalleryMovement('all')}>Весь атлас</button>{movements.map(m=><button key={m.id} aria-pressed={galleryMovement===m.id} onClick={()=>setGalleryMovement(m.id)} style={{'--color':m.color}}>{m.title}</button>)}</div><div className="gallery">{allPaintings.filter(p=>galleryMovement==='all'||p.movement===galleryMovement).sort((a,b)=>(a.year||a.begin||1800)-(b.year||b.begin||1800)).map(p=><button key={p.id} onClick={()=>openPainting(p.id)}><div><ArtworkImage painting={p} loading="lazy"/><span>{p.date}</span></div><strong>{p.title}</strong><small>{p.artist}</small></button>)}</div></div>;
    if (type === 'help') return <div className="dialog-content"><h2>От эпохи к художнику</h2><div className="help-steps"><p><b>01</b><span><strong>Общий вид</strong>Цветные линии — направления. Маленькие точки — работы. Близкие точки объединяются в одну с числом.</span></p><p><b>02</b><span><strong>Линии художников</strong>Наведи на направление и нажми «Открыть направление» или приблизь карту. У каждого мастера появляется отдельная линия с годами жизни или документированной деятельности.</span></p><p><b>03</b><span><strong>Работы крупным планом</strong>При масштабе от 5× видны миниатюры. При меньшем масштабе они превращаются в точки: холст остаётся читаемым.</span></p></div><h3>Управление холстом</h3><p>Колесо мыши приближает место под указателем. Перетаскивание двигает холст. На телефоне — движение одним пальцем и масштабирование двумя. Shift + колесо двигает шкалу по горизонтали.</p><p>С клавиатуры: фокус на холсте, стрелки для перемещения, + и − для масштаба, 0 для общего вида. Escape закрывает окно.</p><h3>Что означают связи</h3><p>Золотые линии — обучение, голубые — работа в мастерской, зелёные — совместная работа. Направленная стрелка указывает на ученика или участника мастерской. Пунктирные обсуждаемые отношения включаются отдельно.</p><p className="secondary-note">Направления служат учебной группировкой и не исчерпывают творчество мастеров. Границы эпох условны. Фрески входят в атлас как живопись; архитектура и скульптура не рассматриваются.</p><h3>Словарь</h3><div className="glossary">{glossary.map(([term,definition])=><div key={term}><h4>{term}</h4><p>{definition}</p></div>)}</div></div>;
    return <div className="dialog-content"><h2>Источники и метод</h2><p>В атласе — {movements.length} направлений, {artists.length} художников, {allPaintings.length} картин и {relations.filter(r=>r.status==='confirmed').length} подтверждённых связей. Одна обсуждаемая связь включается отдельно.</p><p>Подборка включает не все сохранившиеся работы. Картины сгруппированы по основному направлению художника, поэтому некоторые даты выходят за условные границы эпох. Три ключевые работы — учебный выбор редакции. Биографии и даты даны по музейным каталогам. Подписи — самостоятельная учебная редакция. Начало линии с пометкой «активен» обозначает документированную деятельность, а не дату рождения. Связи не датированы: изгиб линии не служит исторической датой.</p><h3>Музейный каталог</h3><p>Дополнительно — {museumPaintings.length} музейных записей. Обновлено: {catalogueDate}. Это доступные записи пяти коллекций, а не полный каталог всех известных работ.</p><div className="source-list">{[['National Gallery of Art','https://github.com/NationalGalleryOfArt/opendata'],['Cleveland Museum of Art','https://openaccess-api.clevelandart.org/'],['Art Institute of Chicago','https://api.artic.edu/docs/'],['National Gallery, London','https://www.nationalgallery.org.uk/documentation/ngacuk/licences'],['The Metropolitan Museum of Art','https://github.com/metmuseum/openaccess']].map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<ExternalLink size={15}/></a>)}</div><h3>Источники отношений</h3><div className="source-list">{relations.map(r=><a key={r.id} href={r.source} target="_blank" rel="noreferrer"><span>{artistById(r.from).name} · {artistById(r.to).name}<small>{r.label}{r.status==='disputed'?' · обсуждается':''}</small></span><ExternalLink size={15}/></a>)}</div><h3>Музейные биографии</h3><div className="source-list">{artists.map(a=><a key={a.id} href={a.source} target="_blank" rel="noreferrer"><span>{a.name}<small>{a.date}</small></span><ExternalLink size={15}/></a>)}</div><h3>Картины и репродукции</h3><div className="source-list">{paintings.map(p=><div key={p.id}><a href={p.source} target="_blank" rel="noreferrer">{p.artist} · {p.title}<ExternalLink size={14}/></a><a className="image-credit" href={images[p.id].commonsPage} target="_blank" rel="noreferrer">Репродукция · {images[p.id].attribution&&`${images[p.id].attribution} · `}{images[p.id].license}</a></div>)}</div><h3>Вдохновение</h3><p><a href="https://www.invaluable.com/blog/art-history-timeline/" target="_blank" rel="noreferrer">Invaluable</a> — идея учебной хронологии; <a href="https://www.denizcemonduygu.com/philo/browse/" target="_blank" rel="noreferrer">Deniz Cem Önduygu</a> — карта с изменяемым масштабом.</p><p className="secondary-note">Учебные репродукции и шрифты сохранены локально. Изображения музейного каталога загружаются с серверов музеев. Регистрации и аналитики нет.</p></div>;
  }

  return <LocaleContext.Provider value={locale}>{localizeTree(<div className="atlas-app">
    <header className="atlas-header" inert={modal ? true : undefined}><button className="brand" onClick={overview} aria-label="lines-of-arts — общий вид"><span className="brand-icon"><i/><i/><i/></span><span className="brand-wordmark">lines-of-arts</span></button><div className="header-divider"/><span className="header-title">Живопись <small>XIII–XVIII века</small></span><div className="search-box"><Search size={16}/><input aria-label="Поиск художников и картин" placeholder="Найти художника или картину" value={query} onChange={e=>{setQuery(e.target.value);setFocused(null);setCamera(c=>({...c,panY:0}));}}/>{query&&<button aria-label="Очистить поиск" onClick={()=>setQuery('')}><X size={14}/></button>}</div><button className="filter-button" aria-label={`Фильтры: ${active.length} направлений`} onClick={()=>window.matchMedia('(min-width: 1100px)').matches?setFiltersOpen(v=>!v):setModal({type:'filters'})}><SlidersHorizontal size={17}/><span>Фильтры</span><b>{active.length}</b></button><button className="header-icon" aria-label="Избранное" title="Избранное" onClick={()=>{setDirection(null);setModal({type:'favorites'});}}><Star size={18}/></button><button className="header-icon" aria-label="Галерея картин" title="Галерея картин" onClick={()=>setModal({type:'gallery'})}><Grid2X2 size={18}/></button><button className="header-icon language-trigger" aria-label="Язык сайта" title="Язык сайта" onClick={()=>{setDirection(null);setModal({type:'language'});}}><Languages size={18}/><span>{locale.toUpperCase()}</span></button><button className="header-icon theme-trigger" aria-label="Тема оформления" title="Тема оформления" onClick={()=>{setDirection(null);setModal({type:'theme'});}}><Palette size={18}/></button><button className="header-icon help-trigger" aria-label="Как читать карту" title="Как читать карту" onClick={()=>setModal({type:'help'})}><CircleHelp size={18}/></button></header>
    <div className={`atlas-workspace ${filtersOpen?'filters-visible':'filters-hidden'}`}><aside className="filter-dock" inert={modal||!filtersOpen?true:undefined} aria-label={translate('Фильтры карты',locale)}><div className="dock-heading"><SlidersHorizontal size={17}/><span>Фильтры карты</span><button aria-label="Скрыть фильтры" onClick={()=>setFiltersOpen(false)}><ChevronDown size={18}/></button></div>{content('filters')}</aside><button className="filter-dock-tab" aria-label="Открыть фильтры" onClick={()=>setFiltersOpen(true)} inert={modal||filtersOpen?true:undefined}><SlidersHorizontal size={16}/><span>Фильтры</span><ChevronUp size={16}/></button><main className={`canvas-viewport ${dragging?'dragging':''} level-${level}`} ref={stage} tabIndex="0" role="region" aria-label="Холст хронологии. Колесо меняет масштаб, перетаскивание двигает карту" inert={modal ? true : undefined} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onKeyDown={canvasKey}>
      <div className="canvas-topbar"><div className="breadcrumb"><button onClick={overview}>Весь атлас</button>{focused&&<><ChevronRight size={13}/><strong style={{color:movementById(focused).color}}>{movementById(focused).title}</strong><button className="back-overview" aria-label="Вернуться к общему виду" onClick={overview}><X size={13}/></button></>}</div><span className="level-indicator"><i/>{level==='overview'?'Общий вид':level==='artists'?'Линии художников':'Картины крупным планом'}</span></div>
      <svg className="canvas-lines" width={size.width} height={size.height} aria-hidden="true"><defs><marker id="arrow-training" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="none" stroke="#ccb88c"/></marker><marker id="arrow-workshop" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="none" stroke="#88accc"/></marker></defs>{ticks.map(year=><line key={year} x1={x(year)} x2={x(year)} y1="77" y2={size.height-25} stroke={year%100===0?'var(--grid-major)':'var(--grid-minor)'} strokeDasharray={year%100===0?undefined:'2 6'}/>)}{layout.groups.map(g=><g key={g.movement.id}>{g.openness<.999&&<SpectrumTrack group={g} density={density.groups.get(g.movement.id)} x={x} y={y}/>}{g.openness>.001&&<line x1="24" x2={size.width-24} y1={y(g.header)-10} y2={y(g.header)-10} stroke={g.movement.color} strokeOpacity={g.openness*.15}/>}</g>)}{visibleArtists.map(a=>{if(!layout.rows.has(a.id))return null;const row=y(layout.rows.get(a.id));const m=movementById(a.movement);return <g key={a.id} opacity={artistOpenness(a.movement)}><line x1={x(a.start)} x2={x(a.end)} y1={row} y2={row} stroke={m.color} strokeOpacity={selected===a.id?'.95':'.35'} strokeWidth={selected===a.id?'2':'1'}/><circle cx={x(a.start)} cy={row} r="2" fill={m.color}/><circle cx={x(a.end)} cy={row} r="2" fill={m.color}/></g>;})}</svg>
      {links&&level!=='overview'&&<svg className="connection-layer" width={size.width} height={size.height}>{relationResults.map((r,index)=>{const a=artistById(r.from);const b=artistById(r.to);const year=(Math.max(a.start,b.start)+Math.min(a.end,b.end))/2;const sx=x(year);const sy=y(layout.rows.get(a.id));const ty=y(layout.rows.get(b.id));const bend=45+index%3*18;const d=`M${sx},${sy} C${sx+bend},${sy} ${sx+bend},${ty} ${sx},${ty}`;const focusedLink=selected===a.id||selected===b.id;return <g key={r.id} className={`connection ${r.type} ${r.status} ${focusedLink?'highlighted':''}`}><path d={d} className="connection-visible" markerEnd={r.type==='collaboration'?undefined:`url(#arrow-${r.type})`}/><path d={d} className="connection-hit" role="button" tabIndex="0" aria-label={`${a.name} — ${b.name}: ${r.label}`} onClick={()=>setModal({type:'relation',id:r.id})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setModal({type:'relation',id:r.id});}}}/></g>;})}</svg>}
      <div className="year-ruler">{ticks.map(year=><span key={year} style={{left:x(year)}}>{year}</span>)}</div>
      {layout.groups.map(g=>{const m=g.movement;const top=y(g.header);return top>80&&top<size.height-40?<div key={m.id} className="direction-heading" style={{left:clamp(x(m.start),24,size.width-270)*(1-g.openness)+24*g.openness,top,color:m.color}}><button className={`direction-label ${g.openness<.5?'overview-label':''}`} onMouseEnter={e=>openDirection(m.id,e)} onMouseLeave={leaveDirection} onFocus={e=>openDirection(m.id,e)} onClick={e=>openDirection(m.id,e)} aria-expanded={direction?.id===m.id}><span>{m.title}</span><small>{g.openness<.5?`ок. ${m.start}–${m.end}`:`${g.members.length} ${g.members.length===1?'художник':g.members.length<5?'художника':'художников'}`}</small></button>{level!=='overview'&&<button className="direction-toggle" aria-label={`${expanded.includes(m.id)?'Свернуть':'Развернуть'} направление: ${m.title}`} aria-expanded={expanded.includes(m.id)} onClick={()=>toggleDirection(m.id)}>{expanded.includes(m.id)?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>}</div>:null;})}
      {layout.groups.filter(g=>g.openness<.999).map(g=><SpectrumBins key={g.movement.id} group={g} density={density.groups.get(g.movement.id)} maximum={density.maximum} x={x} y={y} width={size.width} height={size.height} onHover={setHover} onLeave={()=>setHover(null)} onOpen={focusMovement}/>)}{visibleArtists.map(a=>{if(!layout.rows.has(a.id))return null;const row=y(layout.rows.get(a.id));const m=movementById(a.movement);if(artistOpenness(a.movement)<.01||row<95||row>size.height-35||x(a.end)<0||x(a.start)>size.width)return null;return <React.Fragment key={a.id}><button className={`artist-label ${selected===a.id?'selected':''}`} style={{left:clamp(x(a.start),24,size.width-255),top:row-28,opacity:artistOpenness(a.movement),'--color':m.color}} onClick={()=>openArtist(a.id)}><span>{a.name}</span><small>{a.date}</small>{a.period==='activity'&&<i title="Документированная деятельность">*</i>}</button>{clusterWorks(workResults.filter(p=>p.artistIds.includes(a.id)),x,level==='works'?190:28).map(cluster=>{const p=cluster[0];const px=x(cluster.reduce((sum,p)=>sum+p.year,0)/cluster.length);if(px<15||px>size.width-15)return null;const open=()=>cluster.length>1?openArtist(a.id):openPainting(p.id);return <React.Fragment key={cluster.map(p=>p.id).join('-')}><button className={`work-point ${cluster.some(p=>selected===p.id)?'selected':''} ${cluster.length>1?'cluster':''}`} style={{left:px,top:row,opacity:artistOpenness(a.movement),'--color':m.color}} aria-label={cluster.length>1?`${a.name} · Работы: ${cluster.length}`:`${p.artist}, ${p.title}, ${p.date}`} onClick={open} onMouseEnter={()=>setHover({x:px,y:row,kind:'work',id:p.id,count:cluster.length,artistId:a.id})} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover({x:px,y:row,kind:'work',id:p.id,count:cluster.length,artistId:a.id})} onBlur={()=>setHover(null)}><i/>{cluster.length>1&&<b>{cluster.length}</b>}</button>{level==='works'&&px>85&&px<size.width-85&&row+105<size.height&&<button className="work-miniature" style={{left:px,top:row+18,opacity:artistOpenness(a.movement),'--color':m.color}} onClick={open}><ArtworkImage painting={p}/><span>{cluster.length>1?`Работы: ${cluster.length}`:p.date}<strong>{cluster.length>1?a.name:p.title}</strong></span></button>}</React.Fragment>;})}</React.Fragment>;})}
      {direction&&(()=>{const m=movementById(direction.id);const members=artists.filter(a=>a.movement===m.id);const above=direction.y>size.height-320;const previewTop=above?92:direction.y;const previewHeight=above?direction.y-92-32:size.height-direction.y-55;return <section className="direction-preview" aria-label={`О направлении: ${m.title}`} style={{left:clamp(direction.x,12,Math.max(12,size.width-640)),top:previewTop,maxHeight:Math.max(180,previewHeight),'--color':m.color}} onMouseEnter={()=>clearTimeout(directionTimer.current)} onMouseLeave={leaveDirection} onFocus={()=>clearTimeout(directionTimer.current)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))leaveDirection();}}><button className="preview-close" aria-label="Закрыть карточку направления" onClick={()=>setDirection(null)}><X size={16}/></button><div className="direction-intro"><span className="section-kicker">{m.subtitle} · {m.start}–{m.end}</span><h2>{m.title}</h2><h3>{m.idea}</h3><p>{m.summary}</p><div className="preview-traits">{m.traits.map(trait=><span key={trait}>{trait}</span>)}</div><div className="preview-keyworks"><span className="section-kicker">Ключевые работы</span>{keyWorks[m.id].map(id=>{const p=paintings.find(p=>p.id===id);return <button key={id} onClick={()=>{setDirection(null);openPainting(id);}}><ArtworkImage painting={p}/><span><strong>{p.title}</strong><small>{p.artist} · {p.date}</small><em>{p.keyReason}</em></span><ChevronRight size={14}/></button>;})}</div><div className="preview-actions"><button className="direction-cta" onClick={()=>focusMovement(m.id)}>Открыть направление<ArrowRight size={17}/></button>{favoriteButton('movements',m.id,m.title)}</div></div><div className="direction-artists"><span className="section-kicker">Художники · {members.length}</span><div>{members.map(a=><div className="preview-artist" key={a.id}><button onClick={()=>{setDirection(null);openArtist(a.id);}}>{a.name}<small>{a.date}</small></button>{favoriteButton('artists',a.id,a.name)}</div>)}</div></div></section>;})()}
      {hover&&tooltip&&<div className="canvas-tooltip" style={{left:clamp(hover.x,110,size.width-110),top:Math.max(92,hover.y-64)}}><strong>{tooltip.title}</strong><span>{tooltip.description}</span></div>}
      {!visibleArtists.length&&<div className="empty-state"><Search size={27}/><h2>Ничего не найдено</h2><p>Измени запрос или включи направления.</p><button onClick={reset}>Показать всё</button></div>}
      <div className="zoom-control"><button aria-label="Уменьшить масштаб" disabled={camera.zoom<=MIN_ZOOM} onClick={()=>stepZoom(-1)}><Minus size={18}/></button><output aria-label="Масштаб">{camera.zoom.toFixed(2).replace(/0$/, '')}×</output><button aria-label="Увеличить масштаб" disabled={camera.zoom>=MAX_ZOOM} onClick={()=>stepZoom(1)}><Plus size={18}/></button><span/><button aria-label={targetCamera.zoom>=1.82-1e-6?"Общий вид · 1.0×":"Увеличить масштаб · 1.82×"} title={targetCamera.zoom>=1.82-1e-6?"Общий вид · 1.0×":"Увеличить масштаб · 1.82×"} aria-pressed={targetCamera.zoom>=1.82-1e-6} onClick={toggleOverviewZoom}>{targetCamera.zoom>=1.82-1e-6?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div>
      {layout.height>size.height&&<div className="vertical-control"><input aria-label="Положение по вертикали" type="range" min="0" max={Math.max(1,layout.height-size.height+30)} value={Math.max(0,-camera.panY)} onChange={e=>setCamera(c=>({...c,panY:-Number(e.target.value)}))}/></div>}
      <div className="canvas-bottom"><span className="canvas-instruction">Колесо — масштаб <i/> Перетаскивание — перемещение</span><span className="touch-instruction">Двигай холст пальцем · Приближай двумя</span><div className="canvas-legend">{layout.groups.some(g=>g.openness<.999)&&<><span><i className="density-symbol"/>Плотность работ</span><span><i className="period-symbol"/>Период направления</span><span><i className="tail-symbol"/>Вне периода</span></>}{level!=='overview'&&<span><i className="dot-symbol"/>Картина</span>}{level!=='overview'&&links&&<><span><i className="line-symbol training"/>Обучение</span><span><i className="line-symbol workshop"/>Мастерская</span><span><i className="line-symbol collaboration"/>Сотрудничество</span></>}</div><button className="feedback-trigger" onClick={()=>setModal({type:'feedback'})}><Mail size={13}/>Обратная связь</button><button onClick={()=>setModal({type:'sources'})}>Источники<ExternalLink size={12}/></button></div>
    </main></div>
    {modal&&<Dialog key={modal.type} modal={modal} onClose={close}>{content()}</Dialog>}
  </div>,locale)}</LocaleContext.Provider>;
}

createRoot(document.getElementById('root')).render(<App/>);
