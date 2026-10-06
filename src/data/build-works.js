import {artists} from './artists.js';
import {additionalWorks} from './additional-works.js';
import {workNotes} from './work-notes.js';
const venues={
'uffizi.it':['Галерея Уффици, Флоренция','Uffizi Galleries, Florence','Uffizi Galleries'],
'nationalgallery.org.uk':['Национальная галерея, Лондон','National Gallery, London','National Gallery'],
'collections.louvre.fr':['Лувр, Париж','Louvre, Paris','Musée du Louvre'],
'khm.at':['Музей истории искусств, Вена','Kunsthistorisches Museum, Vienna','Kunsthistorisches Museum'],
'baselitz.khm.at':['Музей истории искусств, Вена','Kunsthistorisches Museum, Vienna','Kunsthistorisches Museum'],
'cappelladegliscrovegni.it':['Капелла Скровеньи, Падуя','Scrovegni Chapel, Padua','Scrovegni Chapel'],
'operaduomo.siena.it':['Музей собора, Сиена','Cathedral Museum, Siena','Opera della Metropolitana di Siena'],
'liverpoolmuseums.org.uk':['Художественная галерея Уокера, Ливерпуль','Walker Art Gallery, Liverpool','National Museums Liverpool'],
'musefirenze.it':['Капелла Бранкаччи, Флоренция','Brancacci Chapel, Florence','MUS.E Firenze'],
'museivaticani.va':['Музеи Ватикана','Vatican Museums','Vatican Museums'],
'skd.museum':['Галерея старых мастеров, Дрезден','Old Masters Picture Gallery, Dresden','Staatliche Kunstsammlungen Dresden'],
'frick.org':['Коллекция Фрика, Нью-Йорк','The Frick Collection, New York','The Frick Collection'],
'gallerieaccademia.it':['Галерея Академии, Венеция','Gallerie dell’Accademia, Venice','Gallerie dell’Accademia'],
'sintbaafskathedraal.be':['Собор Святого Бавона, Гент','Saint Bavo’s Cathedral, Ghent','Saint Bavo’s Cathedral'],
'sammlung.pinakothek.de':['Старая пинакотека, Мюнхен','Alte Pinakothek, Munich','Bayerische Staatsgemäldesammlungen'],
'palazzostrozzi.org':['Санта-Феличита, Флоренция','Santa Felicita, Florence','Fondazione Palazzo Strozzi']
};
const fresco=['giotto-kiss','masaccio-tribute','perugino-keys','michelangelo-adam'];
const oil=['piero-nativity','perugino-madonna','leonardo-rocks','leonardo-mona','michelangelo-doni','bellini-francis','bellini-doge','titian-venus','eyck-ghent','eyck-rolin','durer-magi','durer-apostles','bruegel-babel','bruegel-wedding','pontormo-joseph','parmigianino-self','parmigianino-cupid','bronzino-allegory','bronzino-eleonora'];
export const newPaintings=additionalWorks.map(([id,owner,title,enTitle,year,date,source,wiki],i)=>{
 const a=artists.find(a=>a.id===owner);
 const [place,enPlace,sourceName]=venues[new URL(source).hostname.replace(/^www\./,'')];
 let medium='Темпера на дереве',enMedium='Tempera on wood';
 if(fresco.includes(id)){medium='Фреска';enMedium='Fresco';}
 if(oil.includes(id)){medium='Масло на дереве';enMedium='Oil on wood';}
 if(['titian-bacchus','raphael-sistine','uccello-george','botticelli-nativity','giorgione-philosophers'].includes(id)){medium='Масло на холсте';enMedium='Oil on canvas';}
 if(['verrocchio-baptism','filippino-saints','filippino-magi','michelangelo-doni','bellini-francis'].includes(id)){medium='Темпера и масло на дереве';enMedium='Tempera and oil on wood';}
 if(id==='giorgione-tempest'){medium='Темпера и масло на холсте';enMedium='Tempera and oil on canvas';}
 const [look,enLook]=workNotes[i];
 const artistIds=id==='verrocchio-baptism'?['verrocchio','leonardo']:[owner];
 const credits={
  'verrocchio-baptism':['Андреа дель Верроккьо и Леонардо да Винчи','Andrea del Verrocchio and Leonardo da Vinci'],
  'martini-annunciation':['Симоне Мартини и Липпо Мемми','Simone Martini and Lippo Memmi'],
  'eyck-ghent':['Хуберт и Ян ван Эйк','Hubert and Jan van Eyck']
 };
 return {id,artistIds,movement:a.movement,title,artist:credits[id]?.[0]??a.name,year,date:date.replace('c. ','ок. '),place,medium,source,sourceName,wiki,tags:[],text:look,look,english:{title:enTitle,date,place:enPlace,medium:enMedium,look:enLook,text:enLook,...(credits[id]?{artist:credits[id][1]}:{})}};
});
