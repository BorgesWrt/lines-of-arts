import productCopy from '../data/product-copy.json' with {type:'json'};
import { Children, createContext, cloneElement, isValidElement } from 'react';
import { movements, paintings, glossary } from '../data/content.js';
import { artists, relations } from '../data/artists.js';
import {keyWorkReasons} from '../data/additional-works.js';
import extraLanguages from '../data/languages.json' with {type:'json'};
export const LocaleContext = createContext('ru');
const dictionary = new Map();
const add = (ru,en) => dictionary.set(ru,en);
const artistNames = ['Giotto','Duccio','Simone Martini','Paolo Uccello','Masaccio','Fra Filippo Lippi','Piero della Francesca','Andrea del Verrocchio','Sandro Botticelli','Domenico Ghirlandaio','Filippino Lippi','Pietro Perugino','Leonardo da Vinci','Michelangelo','Raphael','Giovanni Bellini','Giorgione','Titian','Jan van Eyck','Albrecht Dürer','Pieter Bruegel the Elder','Pontormo','Parmigianino','Bronzino'];
const artistTexts = [
'Worked in Florence, Padua and other Italian cities. His painting is distinguished by solid figures and expressive gestures.',
'A leading master of Siena. His workshop and the Maestà altarpiece became important parts of Sienese painting. His birth date is unknown.',
'A Sienese painter who also worked in Assisi and Avignon. His paintings combine expressive imagery with delicate decorative lines.',
'A Florentine painter who combined the decorative Gothic tradition with an exploration of linear perspective.',
'A key master of the early Florentine Renaissance. Light and perspective give his figures convincing volume.',
'A Florentine painter of religious panels and frescoes. Botticelli and Filippino Lippi trained in his workshop.',
'A painter and theorist of perspective. His compositions are marked by clear space, geometry and calm figures.',
'Led a major Florentine workshop. This atlas focuses on his role in painting and the training of artists.',
'A Florentine painter trained by Filippo Lippi, known for religious and mythological paintings with a distinctive rhythm of lines.',
'A Florentine painter of large fresco cycles. He ran a busy workshop in which the young Michelangelo trained.',
'The son of Filippo Lippi and a pupil of his father and Botticelli. He worked in Florence and Rome.',
'A master of Umbrian painting who also worked in Florence and Rome. The line begins with an early documented mention, not his birth.',
'Trained in Verrocchio’s workshop in Florence. His painting explores space, light and human action.',
'Began his training in painting with Ghirlandaio. This atlas covers his paintings, including the Sistine Chapel frescoes.',
'A master from Urbino who worked in central Italy and Rome. His early paintings show a connection to Perugino’s work.',
'A central figure in fifteenth-century Venetian painting. His workshop was an important setting for the next generation.',
'A Venetian painter whose atmospheric pictures and collaboration with Titian helped shape the early sixteenth century.',
'A Venetian master who worked in Bellini’s workshop and collaborated with Giorgione. His exact birth date is undocumented.',
'A Netherlandish painter known for fine detail and his command of oil technique. The line begins with documented activity.',
'An artist from Nuremberg who combined northern observation with an interest in proportion and Italian artistic culture.',
'A Netherlandish painter of landscapes and everyday life. The line begins with documented activity, not his birth.',
'A Florentine master of early Mannerism. Bronzino was his pupil and maintained a close relationship with him.',
'A painter from Parma who also worked in Rome and Bologna. Elongated forms become an expressive device in his pictures.',
'A pupil of Pontormo and court painter to the Medici. His portraits and allegories feature complex, carefully constructed forms.'
];
artists.filter(a=>!a.english).forEach((a,i)=>{add(a.name,artistNames[i]);add(a.text,artistTexts[i]);});
const movementEnglish = [
['Proto-Renaissance','Italy · 13th–14th centuries','The image comes alive','In late medieval Italian painting, figures gain weight, space gains depth, and gestures become convincingly human. Giotto is a key figure in this transition.',['Solid figures','Expressive gestures','Early attempts at depth'],'Look at emotion and the weight of the figures: the scene already feels like an event involving real people.'],
['Early Renaissance','Florence · 15th century','The world can be measured','Florentine painters explore perspective, proportion and the human body. Classical subjects coexist with religious scenes, though not all masters pursue the same kind of naturalism.',['Linear perspective','Classical revival','Study of proportion'],'Look for a vanishing point and a sense of constructed space. In Botticelli, notice the expressive line as well.'],
['High Renaissance','Florence, Milan, Rome','Harmony of the whole','Leonardo, Raphael and Michelangelo create monumental images of humanity. Composition, gesture, light and space form a coherent scene. This is a conventional period in Italian history, not the pinnacle of all world art.',['Balanced composition','Idealised figures','Unity of action'],'Begin with the whole composition: how do groups of figures and gestures hold it in balance?'],
['Venetian school','Venice · 15th–16th centuries','Colour builds the picture','In Bellini, Giorgione and Titian, colour and light become essential to form and atmosphere. The Venetian school develops alongside other Italian traditions.',['Tonal transitions','Rich colour','Light and atmosphere'],'Notice how colour connects the figures and how light gives bodies volume.'],
['Northern Renaissance','Netherlands, Germany','The world in minute detail','Painters in the Netherlands and Germany closely observe materials, light and their surroundings. Oil painting allows delicate layers and detail. Van Eyck perfected the technique but did not invent oil paint.',['Precise details and textures','Oil glazes','Portraits and everyday life'],'Look closely at reflections, fabrics and objects; in Bruegel, at people within a vast landscape.'],
['Mannerism','Italy and Europe · 16th century','Harmony becomes complex','Some painters move away from serene balance, elongating figures, complicating poses and creating deliberately unusual space. Mannerism overlaps with the late Renaissance; its boundaries and definition remain debated.',['Elongated proportions','Complex poses','Unusual space'],'Strange proportions may be a deliberate artistic choice.']
];
movements.filter(m=>!m.english).forEach(m=>{const i=['proto','early','high','venice','north','mannerism'].indexOf(m.id);const [title,subtitle,idea,summary,traits,remember]=movementEnglish[i];for(const [key,value] of Object.entries({title,subtitle,idea,summary,remember}))add(m[key],value);m.traits.forEach((v,j)=>add(v,traits[j]));});
const works = {
giotto:['Lamentation','Scrovegni Chapel, Padua','Fresco','Grief is expressed through poses and gestures. The figures have weight, and the rocky slope directs attention to the faces of Christ and Mary.','Find the two figures seated with their backs to us: they create a sense of being present within the scene.'],
masaccio:['Holy Trinity','Santa Maria Novella, Florence','Fresco','The painted illusion takes the viewer beyond the wall. Linear perspective unites the figures and vault in a coherent space.','Trace the vault lines as they converge at eye level. The date follows the Santa Maria Novella catalogue; other publications use different dates.'],
eyck:['The Arnolfini Portrait','National Gallery, London','Oil on wood','Reflections and material surfaces are rendered with exceptional precision. The identities of the sitters and the meaning of some objects remain debated.','Examine the convex mirror at the back: it reveals part of the room beyond the main view.'],
botticelli:['The Birth of Venus','Uffizi Galleries, Florence','Tempera on canvas','The classical goddess appears as a poetic image. Contour and the rhythm of lines take precedence over strict anatomical and spatial realism.','Follow the curve of Venus’s body and her flowing hair: line unifies the composition.'],
leonardo:['The Last Supper','Santa Maria delle Grazie, Milan','Mixed technique on a dry wall','Perspective leads to Christ, while the apostles form four groups. Movement and reactions turn the composition into a coherent dramatic event.','Find the groups of three and the vanishing point. This wall painting uses an experimental technique rather than traditional fresco.'],
durer:['Self-Portrait','Alte Pinakothek, Munich','Oil on wood','The frontal view, strict symmetry and detailed fur create a solemn image of the artist. The composition recalls traditional images of Christ.','Compare the almost symmetrical face with the asymmetrical hand: a small gesture animates the still pose.'],
raphael:['The School of Athens','Stanza della Segnatura, Vatican','Fresco','Ancient thinkers gather in a space constructed using perspective. Plato and Aristotle at the centre establish its conceptual and compositional focus.','Look at the gestures of Plato and Aristotle, then at the surrounding groups: each holds its own conversation within the overall order.'],
titian:['Assumption of the Virgin','Santa Maria Gloriosa dei Frari, Venice','Oil on wood','Colour and movement connect the earthly and heavenly levels. Red garments lead the eye through the composition towards Mary.','Find the recurring red tones and the upward movement of hands and figures.'],
parmigianino:['Madonna of the Long Neck','Uffizi Galleries, Florence','Oil on wood','Elongated forms and the crowded angels on the left create deliberately unusual space. The painting remained unfinished.','Compare the size of figures on the right and left. The space does not resolve into a familiar, easily measured scene.'],
bruegel:['The Hunters in the Snow','Kunsthistorisches Museum, Vienna','Oil on wood','A vast winter landscape connects work, leisure and nature. People belong to a wide panorama, while dark foreground silhouettes enhance its depth.','Move from the foreground hunters to the small figures on the ice: scale reveals itself gradually.']
};
paintings.forEach(p=>{const values=works[p.id];if(!values)return;['title','place','medium','text','look'].forEach((k,i)=>add(p[k],values[i]));});
const relationTexts = [
'Botticelli trained in the workshop of Fra Filippo Lippi.',
'Filippino trained in the workshop of his father, Filippo Lippi.',
'The museum biography names Filippino as Botticelli’s pupil; he worked in his workshop.',
'Leonardo received his early artistic training in the workshop of Andrea del Verrocchio.',
'The National Gallery lists Pietro Perugino among Verrocchio’s pupils.',
'The young Michelangelo studied painting with Domenico Ghirlandaio.',
'The National Gallery biography of Titian states that Giorgione had previously trained in Giovanni Bellini’s workshop.',
'After Gentile Bellini’s death in 1507, Titian joined Giovanni Bellini’s workshop.',
'In 1508–1509, Giorgione and Titian worked together on the frescoes of the Fondaco dei Tedeschi façades in Venice.',
'Bronzino was Pontormo’s pupil. The museum biography notes their close relationship.',
'The connection between Raphael’s early painting and Perugino is clear, but scholars debate whether Raphael was a pupil or collaborator. This relationship is not presented as confirmed training.'
];
relations.filter(r=>!r.english).forEach((r,i)=>add(r.text,relationTexts[i]));
const glossaryEnglish = [
['Linear perspective','A way to represent depth: parallel lines receding into the distance converge at vanishing points.'],
['Humanism','An interest in human beings, their abilities and classical culture. Religious subjects remain important.'],
['Glazing','A thin transparent layer of paint over a dry layer: it changes the hue and increases the depth of colour.'],
['Sfumato','Soft transitions of light and shade that blur contours, especially associated with Leonardo’s painting.'],
['Tempera','Paint using a water-based emulsion, often with egg as a binder. Widely used before and during the Renaissance.'],
['Fresco','Painting on wet plaster. Not every wall painting uses this technique.'],
['Tenebrism','A sharp contrast between illuminated figures and deep shadow that intensifies dramatic action, especially associated with Caravaggio and his followers.'],
['Tronie','An image of a facial type, expression or unusual costume that is not necessarily a portrait of a specific person.'],
['Fête galante','An elegant leisure scene in a garden or park, often involving music and courtship; especially associated with Watteau.']
];
glossary.forEach((row,i)=>row.forEach((v,j)=>add(v,glossaryEnglish[i][j])));
const ui = {
'Избранное':'Favourites','Фильтры карты':'Map filters','Картина':'Painting','Художник':'Artist','Историческая связь':'Historical relationship','Картины':'Paintings','Как читать карту':'How to read the map','Источники и метод':'Sources and method','Закрыть окно':'Close window','Репродукция недоступна':'Image unavailable',
'Убрать из избранного':'Remove from favourites','Добавить в избранное':'Add to favourites','В избранном':'Saved','В избранное':'Save','Обсуждаемое отношение':'Debated relationship','Направления':'Movements','Художники':'Artists','Обучение':'Training','Работа в мастерской':'Workshop membership','Совместная работа':'Collaboration','Учитель → ученик':'Teacher → pupil','Обучение в мастерской':'Workshop training',
'Линия показывает период от документированной деятельности до смерти.':'The line runs from documented activity to death.','Линия показывает годы жизни, а не весь период работы художника.':'The line shows the artist’s lifetime, not their entire working career.','Подтверждено музейным источником':'Supported by a museum source','Характер отношения обсуждается':'The nature of the relationship is debated','публикации The Met':'The Met publication',' · обсуждается':' · debated',
'Общий вид':'Overview','Линии художников':'Artist timelines','Картины крупным планом':'Paintings in detail','художника':'artists','художников':'artists','художник':'artist','Приблизить направление':'Explore movement','Документированная деятельность':'Documented activity','Связи с мастерами':'Relationships with artists','Для этого художника в текущую карту пока не добавлены подтверждённые связи.':'No confirmed relationships have been added for this artist yet.',
'Мои шпаргалки':'My reference notes','Собирай направления, мастеров и картины отдельно. Избранное сохраняется в этом браузере.':'Save movements, artists and paintings independently. Favourites are stored in this browser.','Браузер запретил сохранение. Избранное доступно до закрытия страницы.':'Browser storage is unavailable. Favourites will last until this page is closed.','Здесь пока пусто':'Nothing saved yet','Нажми на звезду в карточке, чтобы сохранить шпаргалку.':'Click the star on a card to save a reference note.',
'Что показать на карте':'What to show on the map','НАПРАВЛЕНИЯ':'MOVEMENTS','Все':'All','Исторические связи':'Historical relationships','Отношения между мастерами видны на уровне художников. У каждой связи есть музейный источник.':'Relationships appear at the artist level. Each has a museum source.','Обсуждаемые отношения':'Debated relationships','По умолчанию скрыты. При включении показаны пунктиром с пояснением неопределённости.':'Hidden by default. When enabled, they use dashed lines and explain the uncertainty.','Сбросить фильтры':'Reset filters','Техника':'Technique','Где находится':'Location','НА ЧТО СМОТРЕТЬ':'WHAT TO LOOK FOR','Найти на холсте':'Find on canvas','Работы в атласе':'Works in the atlas','Разбор картин этого мастера пока не добавлен. В музейном каталоге можно посмотреть его работы.':'No painting notes for this artist have been added yet. Explore their works in the museum catalogue.','Биография · National Gallery':'Biography · National Gallery','Приблизительные даты отмечены в подписи.':'Approximate dates are marked in the label.',
'Положение изгиба на шкале не обозначает дату знакомства или обучения: это соединение двух линий художников.':'The position of the curve does not date a meeting or training: it connects two artist timelines.','Показать связь на холсте':'Show relationship on canvas','Проверить в ':'Verify in ','Десять картин, десять открытий':'Ten paintings, ten discoveries','Картины расположены по дате. Выбери работу, чтобы открыть её разбор.':'Paintings are ordered by date. Choose a work to open its notes.',
'От эпохи к художнику':'From period to painter','Цветные линии — направления. Маленькие точки — работы. Близкие точки объединяются в одну с числом.':'Coloured lines represent movements. Small points are paintings. Nearby points form a numbered cluster.','Наведи на направление и нажми «Открыть направление» или приблизь карту. У каждого мастера появляется отдельная линия с годами жизни или документированной деятельности.':'Hover over a movement and choose “Explore movement”, or zoom in. Each artist gets a separate line showing their lifetime or documented activity.','Работы крупным планом':'Works in detail','При масштабе от 5× видны миниатюры. При меньшем масштабе они превращаются в точки: холст остаётся читаемым.':'Thumbnails appear from 5× zoom. At smaller scales they become points, keeping the canvas readable.',
'Управление холстом':'Canvas controls','Колесо мыши приближает место под указателем. Перетаскивание двигает холст. На телефоне — движение одним пальцем и масштабирование двумя. Shift + колесо двигает шкалу по горизонтали.':'The wheel zooms around the pointer. Drag to pan. On touch screens, drag with one finger and pinch with two. Shift + wheel pans horizontally.','С клавиатуры: фокус на холсте, стрелки для перемещения, + и − для масштаба, 0 для общего вида. Escape закрывает окно.':'With the canvas focused, use arrows to pan, + and − to zoom, and 0 for overview. Escape closes a window.','Что означают связи':'Understanding relationships','Золотые линии — обучение, голубые — работа в мастерской, зелёные — совместная работа. Направленная стрелка указывает на ученика или участника мастерской. Пунктирные обсуждаемые отношения включаются отдельно.':'Gold lines show training, blue lines workshop membership and green lines collaboration. Arrows point to the pupil or workshop member. Dashed, debated relationships can be enabled separately.','Направления служат учебной группировкой и не исчерпывают творчество мастеров. Границы эпох условны. Фрески входят в атлас как живопись; архитектура и скульптура не рассматриваются.':'Movements are learning categories and do not encompass an artist’s entire work. Period boundaries are approximate. Frescoes count as painting; architecture and sculpture are outside this atlas.',
'Словарь':'Glossary','Биографии и даты даны по музейным каталогам. Подписи — самостоятельная учебная редакция. Начало линии с пометкой «активен» обозначает документированную деятельность, а не дату рождения. Связи не датированы: изгиб линии не служит исторической датой.':'Biographies and dates follow museum catalogues. Notes are independently written for learning. A line marked “active” begins with documented activity, not birth. Relationships are undated; the curve does not represent a historical date.','Источники отношений':'Relationship sources','Музейные биографии':'Museum biographies','Картины и репродукции':'Paintings and reproductions','Вдохновение':'Inspiration',' — идея учебной хронологии; ':' — the idea of a learning timeline; ',' — карта с изменяемым масштабом.':' — a map with adjustable zoom.','Редакция от 6 октября 2026. Репродукции и шрифты сохранены локально. Регистрации, cookies и аналитики нет.':'Edited 6 October 2026. Images and fonts are stored locally. No registration, cookies or analytics.',
'линии':'lines of','искусства':'art','Ренессанс ':'Renaissance ','Живопись':'Painting','Фильтры':'Filters','Весь Ренессанс':'All Renaissance','Открыть направление':'Explore movement','Ничего не найдено':'No results','Измени запрос или включи направления.':'Change the search or enable movements.','Показать всё':'Show all','Колесо — масштаб ':'Wheel to zoom ',' Перетаскивание — перемещение':' Drag to pan','Двигай холст пальцем · Приближай двумя':'Drag with one finger · Pinch to zoom','Мастерская':'Workshop','Сотрудничество':'Collaboration','Источники':'Sources',
'Поиск художников и картин':'Search artists and paintings','Найти художника или картину':'Find an artist or painting','Галерея картин':'Painting gallery','Линии искусства — общий вид':'Lines of art — overview','Холст хронологии. Колесо меняет масштаб, перетаскивание двигает карту':'Timeline canvas. Wheel to zoom, drag to pan','Вернуться к общему виду':'Return to overview','Уменьшить масштаб':'Zoom out','Увеличить масштаб':'Zoom in','Масштаб':'Zoom','Положение по вертикали':'Vertical position','Очистить поиск':'Clear search','Закрыть карточку направления':'Close movement card','Тип избранного':'Favourite category','О направлении:':'About movement:','Приблизить:':'Explore:','близкие работы':'nearby paintings','картины:':'paintings:','Фильтры:':'Filters:','направлений':'movements',
'Настройки':'Preferences','Язык и тема':'Language and appearance','Язык сайта':'Website language','Тема оформления':'Colour theme','Белая':'White','Тёплая':'Warm','Тёмная':'Dark','Чёрная':'Black','Выбор сохраняется в этом браузере.':'Your choices are saved in this browser.','Русский':'Русский','Английский':'English','Настройки не сохраняются: браузер запретил локальное хранилище.':'Preferences cannot be saved: browser storage is unavailable.',
'Эмоция':'Emotion','Объём':'Volume','Перспектива':'Perspective','Деталь':'Detail','Масло':'Oil','Античность':'Classical antiquity','Линия':'Line','Композиция':'Composition','Портрет':'Portrait','Цвет':'Colour','Пропорции':'Proportion','Пространство':'Space','Пейзаж':'Landscape','Повседневность':'Everyday life',
'В атласе — 6 направлений, ':'The atlas includes 6 movements, ',' художника, 10 разобранных картин и ':' artists, 10 painting notes and ',' подтверждённых связей. Одна обсуждаемая связь включается отдельно.':' supported relationships. One debated relationship can be enabled separately.','Репродукция · ':'Image · '
};
Object.entries(ui).forEach(([ru,en])=>add(ru,en));
// Full catalogue fields are translated before short UI fragments.
Object.entries({
'Свернуть':'Collapse','Развернуть':'Expand','направление:':'movement:',
'The Met · итальянская живопись позднего Средневековья':'The Met · Italian painting in the later Middle Ages',
'Музеи Ватикана · «Афинская школа»':'Vatican Museums · The School of Athens',
'The Met · Венеция и Северная Италия, 1400–1600':'The Met · Venice and northern Italy, 1400–1600',
'The Met · масляная живопись в Нидерландах':'The Met · oil painting in the Low Countries',
'The Met · Бронзино и маньеризм':'The Met · Bronzino and Mannerism','Капелла Скровеньи':'Scrovegni Chapel','Музеи Ватикана':'Vatican Museums','Боттичелли':'Botticelli','Питер Брейгель':'Pieter Bruegel'
}).forEach(([ru,en])=>add(ru,en));
paintings.forEach(p=>{if(p.english)for(const [key,en] of Object.entries(p.english))add(p[key],en);});
Object.values(keyWorkReasons).forEach(([ru,en])=>add(ru,en));
add('Картина','Artwork');
Object.entries({
'Живопись Ренессанса':'Renaissance painting','lines-of-arts — общий вид':'lines-of-arts — overview',
'Галерея работ':'Painting gallery','Работы:':'Paintings:','Ключевые работы':'Key paintings','Открыть работы художника':'View this artist’s paintings',
'Учебная подборка работ; полный каталог смотри в музейных источниках.':'A selection for learning; see museum sources for a full catalogue.',
' художника, ':' artists, ',' картин и ':' paintings and ',
'Подборка включает не все сохранившиеся работы. Картины сгруппированы по основному направлению художника, поэтому некоторые даты выходят за условные границы эпох. Три ключевые работы — учебный выбор редакции. Биографии и даты даны по музейным каталогам.':'The selection does not include every surviving work. Paintings are grouped by each artist’s principal movement, so some dates fall outside the approximate period boundaries. The three key paintings are an editorial selection for learning. Biographies and dates follow museum catalogues.'
}).forEach(([ru,en])=>add(ru,en));
[...movements,...artists,...relations].forEach(item=>{if(item.english)for(const [key,en] of Object.entries(item.english)){if(Array.isArray(en))item[key].forEach((ru,i)=>add(ru,en[i]));else add(item[key],en);}});
Object.entries({'Европейская живопись':'European painting','В атласе — ':'The atlas includes ',' направлений, ':' movements, ',' художников, ':' artists, ','Весь атлас':'Full atlas','XIII–XVIII века':'13th–18th centuries'}).forEach(([ru,en])=>add(ru,en));
add('Скрыть фильтры','Hide filters');
add('Открыть фильтры','Open filters');
productCopy.forEach(([ru,en])=>add(ru,en));
export const englishStrings = () => [...new Set(dictionary.values())];
const phrases=[...dictionary].sort((a,b)=>b[0].length-a[0].length);
export function translate(text,locale='en') {
  if(locale==='ru'||typeof text!=='string')return text;
  let result=dictionary.get(text)??text;
  if(!dictionary.has(text)){
  for(const [ru,en] of phrases)if(/[А-Яа-яЁё]/.test(ru))result=result.split(ru).join(en);
  result=result.replace(/ок\. /g,'c. ').replace(/активен с /g,'active from ').replace(/упомянут в /g,'documented in ').replace(/; умер в /g,'; died in ');
  }
  if(locale==='en')return result;
  const target=extraLanguages[locale];if(!target)return result;
  if(target[result])return target[result];
  result=result.replace(languagePatterns[locale],match=>target[match]);
  return result.replace(/c\. /g,locale==='es'?'h. ':'um ').replace(/active from /g,locale==='es'?'activo desde ':'tätig ab ').replace(/documented in /g,locale==='es'?'documentado en ':'erwähnt im Jahr ').replace(/; died in /g,locale==='es'?'; fallecido en ':'; gestorben ');
}
const languagePhrases=Object.fromEntries(Object.entries(extraLanguages).map(([locale,entries])=>[locale,Object.entries(entries).filter(([en])=>en.trim().length>2).sort((a,b)=>b[0].length-a[0].length)]));
const escapePattern=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const languagePatterns=Object.fromEntries(Object.entries(languagePhrases).map(([locale,entries])=>[locale,new RegExp('(?<![\\p{L}])(?:'+entries.map(([en])=>escapePattern(en)).join('|')+')(?![\\p{L}])','gu')]));
export function localizeTree(node,locale) {
  if(typeof node==='string')return translate(node,locale);
  if(Array.isArray(node))return Children.map(node,child=>localizeTree(child,locale));
  if(!isValidElement(node))return node;
  const props={};
  for(const key of ['aria-label','title','placeholder','alt'])if(node.props[key])props[key]=translate(node.props[key],locale);
  if(node.props.children!==undefined)props.children=localizeTree(node.props.children,locale);
  return cloneElement(node,props);
}
