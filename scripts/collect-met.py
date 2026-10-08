"""Import factual painting records from the Met's official CC0 collection table."""
import csv, json, os, sys, unicodedata, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cache=Path(os.environ.get('TEMP','/tmp'))/'lines-of-arts-museum-data'
cache.mkdir(exist_ok=True)
table=cache/'MetObjects.csv'
if not table.exists() or '--refresh' in sys.argv:
    pending=table.with_suffix('.pending')
    with urllib.request.urlopen('https://media.githubusercontent.com/media/metmuseum/openaccess/master/MetObjects.csv',timeout=120) as response, pending.open('wb') as out:
        while chunk:=response.read(1024*1024): out.write(chunk)
    pending.replace(table)
aliases=json.loads((root/'src/data/museum-artists.json').read_text(encoding='utf-8'))
def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if c.isalnum())
records=[]
with table.open(encoding='utf-8-sig',newline='') as stream:
    for r in csv.DictReader(stream):
        if r['Classification']!='Paintings': continue
        name=r['Artist Display Name'].split(' (')[0]
        ids=[k for k,names in aliases.items() if any(norm(a)==norm(name) for a in names)]
        if not ids or any(r[k].strip() for k in ['Artist Prefix','Artist Suffix']): continue
        records.append(dict(id='met-'+r['Object ID'],artistIds=ids,title=r['Title'],date=r['Object Date'],begin=int(r['Object Begin Date']) or None,end=int(r['Object End Date']) or None,medium=r['Medium'],attribution=r['Artist Display Name'],credit=r['Credit Line'],accession=r['Object Number'],source=r['Link Resource'],museum='met',image=None,imageLicense=None))
(cache/'met-index.json').write_text(json.dumps(records,ensure_ascii=False),encoding='utf-8')
print('Met paintings:',len(records))

