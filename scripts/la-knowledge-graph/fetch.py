"""Download public textbook source as inert data; no source code is executed."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'tmp/codex/la-corpus'
OUT = ROOT / 'research/la-graph'

def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'KineticPress-research/0.1'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()

def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    lock = OUT / 'sources.lock.json'
    if lock.exists():
        records = json.loads(lock.read_text())
    else:
        records = []
        for book, repo in [('beezer','rbeezer/fcla'), ('ila','QBobWatson/ila')]:
            tree = json.loads(get(f'https://api.github.com/repos/{repo}/git/trees/master?recursive=1'))
            sha = tree['sha']
            for item in tree['tree']:
                path = item['path']
                if path.startswith('src/') and path.endswith('.xml') and path.count('/') == 1:
                    records.append({'book':book,'path':path,'revision':sha,
                        'url':f'https://raw.githubusercontent.com/{repo}/{sha}/{path}',
                        'sourceUrl':f'https://github.com/{repo}/blob/{sha}/{path}'})
        api = 'https://gitlab.com/api/v4/projects/jim.hefferon%2Flinear-algebra'
        sha = json.loads(get(api + '/repository/commits?per_page=1'))[0]['id']
        for directory in ['src/gr','src/vs','src/map','src/det','src/jc','src/sty']:
            items = json.loads(get(api + '/repository/tree?' + urllib.parse.urlencode({'path':directory,'per_page':100,'ref':sha})))
            for item in items:
                path=item['path']
                if item['type']=='blob' and path.endswith(('.tex','.sty')):
                    records.append({'book':'hefferon','path':path,'revision':sha,
                        'url':api+'/repository/files/'+urllib.parse.quote(path,safe='')+'/raw?ref='+sha,
                        'sourceUrl':f'https://gitlab.com/jim.hefferon/linear-algebra/-/blob/{sha}/{path}'})
        records.extend([
            {'book':'axler','path':'LADR4e.pdf','revision':'retrieved-2026-10-01','url':'https://linear.axler.net/LADR4e.pdf','sourceUrl':'https://linear.axler.net/LADR4e.pdf'},
            {'book':'hefferon','path':'LICENSE','revision':sha,'url':api+'/repository/files/LICENSE/raw?ref='+sha,'sourceUrl':'https://hefferon.net/source.html'},
            {'book':'licenses','path':'gfdl-1.3.txt','revision':'1.3','url':'https://www.gnu.org/licenses/fdl-1.3.txt','sourceUrl':'https://www.gnu.org/licenses/fdl-1.3.html'},
        ])
    def fetch(record):
        target=CACHE/record['book']/record['path']
        target.parent.mkdir(parents=True,exist_ok=True)
        data=target.read_bytes() if target.exists() else get(record['url'])
        digest=hashlib.sha256(data).hexdigest()
        if 'sha256' in record and record['sha256'] != digest:
            raise ValueError('Source changed: '+record['url'])
        target.write_bytes(data)
        return {**record,'sha256':digest,'bytes':len(data)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(fetch,records))
    lock.write_text(json.dumps(results,indent=2)+'\n')
    print(json.dumps({'files':len(results),'bytes':sum(r['bytes'] for r in results),'books':sorted(set(r['book'] for r in results))}))

if __name__ == '__main__': main()
