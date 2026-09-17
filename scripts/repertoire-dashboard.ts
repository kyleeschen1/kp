import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
type Item = { checked: boolean; label: string; evidence?: string };
type Topic = { title: string; moves: Item[]; motifs: Item[] };
export function parseRepertoire(text: string, source: string) {
  let title = '', topic: Topic | undefined, list: Item[] | undefined;
  const topics: Topic[] = [];
  for (const [index, raw] of text.split('\n').entries()) {
    const line = raw.trim();
    const fail = (reason: string): never => { throw new Error(`${source}:${index + 1}: ${reason}`); };
    if (!line) continue;
    if (line.startsWith('# ')) {
      if (title || topics.length) fail('Use one discipline heading');
      title = line.slice(2); continue;
    }
    if (line.startsWith('## ')) {
      if (!title) fail('Add a discipline heading first');
      topic = { title: line.slice(3), moves: [], motifs: [] };
      if (topics.some(t => t.title === topic!.title)) fail('Duplicate topic');
      topics.push(topic); list = undefined; continue;
    }
    if (line === '### Semantic moves' || line === '### Visual motifs') {
      if (!topic) fail('Add a topic heading first');
      list = line === '### Semantic moves' ? topic!.moves : topic!.motifs; continue;
    }
    const match = /^- \[([ x])\] (.+?)(?: \[Evidence\]\(([^)]+)\))?$/.exec(line);
    if (!match || !list) fail('Expected a checklist item under Semantic moves or Visual motifs');
    const checked = match![1] === 'x', evidence = match![3];
    if (checked && !evidence) fail('Checked items require an Evidence link');
    list!.push({ checked, label: match![2]!, ...(evidence ? { evidence } : {}) });
  }
  if (!title || !topics.length || topics.some(t => !t.moves.length || !t.motifs.length))
    throw new Error(`${source}: each discipline needs topics with both lists`);
  return { title, topics };
}

/** Build a small static projection. Markdown remains the only status source;
 * this does not import catalogue inventories or compute maturity scores. */
export function compileRepertoire(projectRoot: string) {
  const directory = resolve(projectRoot, 'docs/project/repertoire');
  const assets = new Map<string, string>();
  const sourceLink = (file: string) => {
    const path = relative(realpathSync(projectRoot), realpathSync(file)).replaceAll('\\', '/');
    // Only authored evidence inside ordinary repo source directories is served.
    if (!/^(docs|src|domains|tests|examples)\//.test(path)) throw new Error(`Evidence outside supported source directories: ${path}`);
    const asset = `experiments/repertoire/evidence/${path}.txt`;
    assets.set(asset, readFileSync(file, 'utf8'));
    return '/' + asset.split('/').map(encodeURIComponent).join('/');
  };
  const disciplines = readdirSync(directory).filter(name => name.endsWith('.md') && name !== 'README.md').sort().map(name => {
    const id = name.slice(0, -3);
    if (!/^[a-z][a-z-]+$/.test(id)) throw new Error(`Invalid discipline filename: ${name}`);
    const file = resolve(directory, name);
    const data = parseRepertoire(readFileSync(file, 'utf8'), name);
    const items = (list: Item[]) => `<ul>${list.map(item => {
      const evidence = item.evidence ? sourceLink(resolve(directory, item.evidence.split('#')[0]!)) : undefined;
      return `<li><span class="status ${item.checked ? 'implemented' : ''}" role="img" aria-label="${item.checked ? 'Implemented at stated scope' : 'Predicted; implementation unconfirmed'}">${item.checked ? '✓' : '☐'}</span><div>${escape(item.label)}${evidence ? ` <a class="evidence" href="${escape(evidence)}" target="_blank" rel="noopener">Evidence<span class="sr-only"> for ${escape(item.label)}</span> ↗</a>` : ''}</div></li>`;
    }).join('')}</ul>`;
    return { id, title: data.title, html: `<section data-discipline="${id}" aria-labelledby="heading-${id}"><div class="discipline-heading"><h2 id="heading-${id}">${escape(data.title)}</h2><a class="source" href="${sourceLink(file)}" target="_blank" rel="noopener">Markdown source ↗</a></div>${data.topics.map(topic => `<article class="topic"><h3>${escape(topic.title)}</h3><div class="lists"><section><h4>Semantic moves</h4>${items(topic.moves)}</section><section><h4>Visual motifs</h4>${items(topic.motifs)}</section></div></article>`).join('')}</section>` };
  });
  return { assets, html: `<div class="selector"><label for="discipline">Discipline</label><select id="discipline" disabled>${disciplines.map(d => `<option value="${d.id}">${escape(d.title)}</option>`).join('')}</select><a href="#shared">Shared reading motifs</a></div><div id="disciplines">${disciplines.map(d => d.html).join('')}</div>` };
}
