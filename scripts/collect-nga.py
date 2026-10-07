"""Read the museum's complete public tables; keep painting metadata, never images."""
import csv, json, os, sys, urllib.request, unicodedata
from pathlib import Path
csv.field_size_limit(10000000)
root=Path(__file__).resolve().parents[1]
cache=Path(os.environ.get('TEMP', '/tmp'))/'lines-of-arts-museum-data'
cache.mkdir(exist_ok=True)
base='https://raw.githubusercontent.com/NationalGalleryOfArt/opendata/main/data/'
def rows(name):
    target=cache/name
    if not target.exists() or '--refresh' in sys.argv:
        request=urllib.request.Request(base+name,headers={'User-Agent':'lines-of-arts/1.0 (educational collection index)'})
        with urllib.request.urlopen(request,timeout=90) as response:
            # Atomic replacement prevents reusing partial downloads.
            temp=target.with_suffix('.pending')
            with temp.open('wb') as out:
                while chunk:=response.read(1024*1024): out.write(chunk)
            temp.replace(target)
    with target.open(encoding='utf-8-sig',newline='') as stream:
        yield from csv.DictReader(stream)
def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFKD',s).lower() if c.isalnum())
aliases=json.loads((root/'src/data/museum-artists.json').read_text(encoding='utf-8'))
names={norm(name):id for id,values in aliases.items() for name in values}
makers={}
for c in rows('constituents.csv'):
    id=names.get(norm(c['forwarddisplayname']))
    if id: makers[c['constituentid']]=id
links={}
for r in rows('objects_constituents.csv'):
    if r['constituentid'] in makers and r['roletype']=='artist' and not r['prefix'] and not r['suffix']:
        links.setdefault(r['objectid'],set()).add(makers[r['constituentid']])
works={}
for r in rows('objects.csv'):
    if r['objectid'] not in links or r['classification'].lower()!='painting': continue
    # Keep the museum's attribution verbatim. Derivatives aren't the painter's works.
    if any(t in r['attribution'].lower() for t in ['workshop of','after ','follower of','circle of','school of','imitator of']): continue
    works[r['objectid']]={'id':'nga-'+r['objectid'],'artistIds':sorted(links[r['objectid']]),'title':r['title'],'date':r['displaydate'],'begin':int(r['beginyear']) if r['beginyear'] else None,'end':int(r['endyear']) if r['endyear'] else None,'medium':r['medium'],'attribution':r['attribution'],'credit':r['creditline'],'accession':r['accessionnum'],'source':'https://www.nga.gov/artworks/'+r['objectid'],'museum':'nga','image':None,'imageLicense':None}
for r in rows('published_images.csv'):
    w=works.get(r['depictstmsobjectid'])
    if w and r['openaccess']=='1' and r['viewtype']=='primary' and not w['image']:
        w['image']=r['iiifurl']+'/full/!640,640/0/default.jpg'
        w['imageLicense']='Public domain'
(cache/'nga-index.json').write_text(json.dumps(list(works.values()),ensure_ascii=False),encoding='utf-8')
print('NGA painting records:',len(works),'matched artists:',len(set(makers.values())),flush=True)
