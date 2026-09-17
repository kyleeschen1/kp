import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export type Item = { checked: boolean; label: string; evidence?: string; id?: string; example?: string; audit?: string; uses?: string[] };
type Topic = { title: string; moves: Item[]; motifs: Item[] };
const topicSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function parseRepertoire(text: string, source: string) {
  let title = '', topic: Topic | undefined, list: Item[] | undefined;
  const topics: Topic[] = [];
  let lastItem: Item | undefined;
  for (const [index, raw] of text.split('\n').entries()) {
    const line = raw.trim();
    const fail = (reason: string): never => { throw new Error(`${source}:${index + 1}: ${reason}`); };
    if (!line) continue;
    const detail = /^(Example|Audit|Uses): (.+)$/.exec(line);
    if (detail) {
      if (!lastItem?.id || !raw.startsWith('  ')) fail('Details require an indented granular item');
      const item = lastItem!;
      if (detail[1] === 'Example') {
        if (item.example) fail('Duplicate Example');
        item.example = detail[2]!;
      } else if (detail[1] === 'Audit') {
        if (item.audit) fail('Duplicate Audit');
        item.audit = detail[2]!;
      } else {
        if (item.uses) fail('Duplicate Uses');
        item.uses = detail[2]!.split(',').map(id => id.trim());
      }
      continue;
    }
    lastItem = undefined;
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
    const identified = /^`([a-z][a-z0-9.-]+)` (.+)$/.exec(match![2]!);
    lastItem = { checked, label: identified?.[2] ?? match![2]!, ...(identified ? { id: identified[1]! } : {}), ...(evidence ? { evidence } : {}) };
    list!.push(lastItem);
  }
  if (!title || !topics.length || topics.some(t => !t.moves.length || !t.motifs.length))
    throw new Error(`${source}: each discipline needs topics with both lists`);
  for (const item of topics.flatMap(t => [...t.moves, ...t.motifs])) {
    if (!item.id) continue;
    const status = item.audit?.split(' — ')[0];
    if (!item.example || !status || !['implemented', 'unaudited', 'partial', 'gap'].includes(status))
      throw new Error(`${source}: ${item.id} needs Example and a valid Audit`);
    if (item.checked !== (status === 'implemented')) throw new Error(`${source}: ${item.id} checkbox contradicts audit`);
    if (status !== 'unaudited' && !item.evidence) throw new Error(`${source}: ${item.id} audited claims require Evidence`);
  }
  return { title, topics };
}

/** One folder may hold small topic files for a discipline; no parallel manifest. */
export function readRepertoire(projectRoot: string) {
  const directory = resolve(projectRoot, 'docs/project/repertoire');
  const groups = new Map<string, { title: string; topics: (Topic & { file: string })[] }>();
  const files = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
    .map(entry => resolve(entry.parentPath, entry.name)).sort();
  const ids = new Set<string>();
  for (const file of files) {
    const path = relative(directory, file).replaceAll('\\', '/');
    const id = path.split('/')[0]!.replace(/\.md$/, '');
    if (!/^[a-z][a-z-]+$/.test(id)) throw new Error(`Invalid discipline filename: ${path}`);
    const data = parseRepertoire(readFileSync(file, 'utf8'), path);
    const group = groups.get(id) ?? { title: data.title, topics: [] };
    if (group.title !== data.title) throw new Error(`${path}: inconsistent discipline title`);
    for (const topic of data.topics) {
      if (group.topics.some(t => topicSlug(t.title) === topicSlug(topic.title))) throw new Error(`${path}: duplicate topic route ${topic.title}`);
      group.topics.push({ ...topic, file });
      for (const item of [...topic.moves, ...topic.motifs]) {
        if (!item.id) throw new Error(`${path}: curriculum rows require stable IDs, Example and Audit`);
        if (ids.has(item.id)) throw new Error(`${path}: duplicate item ${item.id}`);
        ids.add(item.id);
      }
    }
    groups.set(id, group);
  }
  for (const group of groups.values()) for (const topic of group.topics) for (const item of [...topic.moves, ...topic.motifs])
    for (const id of item.uses ?? []) if (!ids.has(id)) throw new Error(`${item.id}: unknown Uses reference ${id}`);
  return [...groups].map(([id, data]) => ({ id, ...data }));
}

/** Build a small static projection. Markdown remains the only status source;
 * this does not import catalogue inventories or compute maturity scores. */
export function compileRepertoire(projectRoot: string) {
  const assets = new Map<string, string>();
  const sourceLink = (file: string) => {
    const path = relative(realpathSync(projectRoot), realpathSync(file)).replaceAll('\\', '/');
    // Only authored evidence inside ordinary repo source directories is served.
    if (!/^(docs|src|domains|tests|examples)\//.test(path)) throw new Error(`Evidence outside supported source directories: ${path}`);
    const asset = `experiments/repertoire/evidence/${path}.txt`;
    assets.set(asset, readFileSync(file, 'utf8'));
    return '/' + asset.split('/').map(encodeURIComponent).join('/');
  };
  const disciplines = readRepertoire(projectRoot).map(data => {
    const { id } = data;
    const items = (list: Item[], file: string) => `<ul>${list.map(item => {
      const evidence = item.evidence ? sourceLink(resolve(file, '..', item.evidence.split('#')[0]!)) : undefined;
      return `<li${item.id ? ` id="${item.id}"` : ''}><span class="status ${item.checked ? 'implemented' : ''}" role="img" aria-label="${item.checked ? 'Implemented at stated scope' : 'Predicted; implementation unconfirmed'}">${item.checked ? '✓' : '☐'}</span><div>${escape(item.label)}${evidence ? ` <a class="evidence" href="${escape(evidence)}" target="_blank" rel="noopener">Evidence<span class="sr-only"> for ${escape(item.label)}</span> ↗</a>` : ''}${item.example ? `<div class="example">${escape(item.example)}</div>` : ''}${item.audit && !item.checked ? `<div class="audit">${escape(item.audit)}</div>` : ''}${item.uses ? `<div class="audit">Uses: ${item.uses.map(id => `<a href="#${id}">${id}</a>`).join(', ')}</div>` : ''}</div></li>`;
    }).join('')}</ul>`;
    return { id, title: data.title, html: `<section data-discipline="${id}" aria-labelledby="heading-${id}"><div class="discipline-heading"><h2 id="heading-${id}">${escape(data.title)}</h2></div>${data.topics.map(topic => `<article class="topic" id="topic-${id}-${topicSlug(topic.title)}" data-topic-title="${escape(topic.title)}"><div class="discipline-heading"><h3>${escape(topic.title)}</h3><a class="source" href="${sourceLink(topic.file)}" target="_blank" rel="noopener">Markdown source ↗</a></div><div class="lists"><section><h4>Semantic moves</h4>${items(topic.moves, topic.file)}</section><section><h4>Visual motifs</h4>${items(topic.motifs, topic.file)}</section></div></article>`).join('')}</section>` };
  });
  const guide = sourceLink(resolve(projectRoot, 'docs/project/repertoire-notes/scope-and-sources.md'));
  const findings = sourceLink(resolve(projectRoot, 'docs/project/repertoire-notes/trace-findings.md'));
  const editing = sourceLink(resolve(projectRoot, 'docs/project/repertoire/README.md'));
  return { assets, html: `<p class="note"><a href="${guide}" target="_blank" rel="noopener">Scope and sources</a> · <a href="${findings}" target="_blank" rel="noopener">Worked-problem findings</a> · <a href="${editing}" target="_blank" rel="noopener">Editing guide</a></p><div class="selector"><div><label for="discipline">Discipline</label><select id="discipline" disabled>${disciplines.map(d => `<option value="${d.id}">${escape(d.title)}</option>`).join('')}</select></div><div id="topic-control" hidden><label for="topic">Topic</label><select id="topic" disabled></select></div><a href="#shared">Shared reading motifs</a></div><div id="disciplines">${disciplines.map(d => d.html).join('')}</div>` };
}
