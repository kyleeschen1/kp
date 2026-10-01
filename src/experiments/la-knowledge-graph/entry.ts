import katex from 'katex';
import 'katex/dist/katex.min.css';
import './style.css';
import corpusUrl from '../../../research/la-graph/corpus.json?url';
import interpretationUrl from '../../../research/la-graph/interpretation.json?url';
import { makeIndex, type Corpus, type Interpretation, type RecordNode } from './model.ts';

const root = document.querySelector<HTMLElement>('#la-graph');
if (!root) throw new Error('Missing graph host');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  return node;
}
function external(text: string, url: string) {
  const link = el('a', text);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}
const macros = {
  '\\R': '\\mathbb{R}', '\\C': '\\mathbb{C}', '\\F': '\\mathbb{F}',
  '\\Re': '\\mathbb{R}', '\\To': '\\longrightarrow', '\\cB': '\\mathcal{B}',
  '\\cC': '\\mathcal{C}', '\\vect': '\\mathbf{#1}', '\\complex': '\\mathbb{C}^{#1}',
  '\\real': '\\mathbb{R}^{#1}', '\\colvector': '\\begin{pmatrix}#1\\end{pmatrix}',
  '\\matrix': '\\mathbf{#1}', '\\lt': '#1\\left(#2\\right)',
  '\\ltdefn': '#1:#2\\longrightarrow#3', '\\set': '\\left\\{#1\\right\\}',
  '\\zerovector': '\\mathbf{0}', '\\null': '', '\\transpose': '{#1}^{T}',
  '\\adjoint': '{#1}^{*}', '\\conjugate': '\\overline{#1}',
  '\\innerproduct': '\\left\\langle #1,#2\\right\\rangle',
  '\\rank': '\\operatorname{rank}', '\\nullity': '\\operatorname{nullity}',
  '\\norm': '\\left\\lVert#1\\right\\rVert',
};

// Unknown source macros remain visible as source text. Rendering must never
// silently substitute a different mathematical expression.
function mathText(text: string) {
  const block = el('div', '', 'math-text');
  const pattern = /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
  let position = 0;
  for (const match of text.matchAll(pattern)) {
    block.append(document.createTextNode(text.slice(position, match.index)));
    const formula = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';
    const display = match[1] !== undefined || match[3] !== undefined;
    const span = el('span');
    try {
      katex.render(formula, span, { displayMode: display, throwOnError: true, trust: false, macros, maxExpand: 200 });
    } catch {
      span.textContent = match[0];
      span.className = 'unrendered';
      span.title = 'Source notation retained: this macro or expression is not supported by the preview.';
    }
    block.append(span);
    position = (match.index ?? 0) + match[0].length;
  }
  block.append(document.createTextNode(text.slice(position)));
  return block;
}

async function start(host: HTMLElement) {
  const [corpusResponse, interpretationResponse] = await Promise.all([fetch(corpusUrl), fetch(interpretationUrl)]);
  if (!corpusResponse.ok || !interpretationResponse.ok) throw new Error('Could not load research data');
  const corpus: Corpus = await corpusResponse.json();
  const interpretation: Interpretation = await interpretationResponse.json();
  const nodes = [...interpretation.nodes, ...corpus.nodes];
  const edges = [...interpretation.edges, ...corpus.edges];
  const { byId, adjacency } = makeIndex(nodes, edges);
  const header = el('header');
  header.append(el('p', 'KINETIC PRESS / RESEARCH', 'eyebrow'), el('h1', 'Linear algebra, connected.'),
    el('p', 'Explore the relationships. Inspect the definitions and proofs. Keep the assumptions in view.', 'intro'));
  const stats = el('p', `${corpus.nodes.length.toLocaleString()} source records · ${interpretation.nodes.length} interpreted nodes · ${edges.length.toLocaleString()} links`, 'stats');
  const tours = el('nav', '', 'tours');
  tours.setAttribute('aria-label', 'Starting neighborhoods');
  for (const [key, title] of [['product', 'Matrix multiplication'], ['polynomial', 'Polynomials → coordinates'], ['pairing-vs-inner', 'Common conflations'], ['normal-equations', 'A proof neighborhood'], ['svd', 'Beyond square matrices']]) {
    const button = el('button', title);
    button.onclick = () => select('concept:' + key);
    tours.append(button);
  }
  header.append(stats, tours);
  const shell = el('div', '', 'workspace');
  const sidebar = el('aside');
  const searchLabel = el('label', 'Search definitions, statements, proofs');
  const search = el('input');
  search.type = 'search'; search.placeholder = 'Try “kernel”, “basis”, “orthogonal”…';
  searchLabel.append(search);
  const modeLabel = el('label', 'Collection');
  const mode = el('select');
  mode.id = 'graph-collection'; modeLabel.htmlFor = mode.id;
  for (const [value, title] of [['interpretation', 'Interpreted graph'], ['all', 'All records'], ...corpus.books.map(b => [b.id, b.title])]) {
    const option = el('option', title); option.value = value ?? ''; mode.append(option);
  }
  const kindLabel = el('label', 'Record kind');
  const kind = el('select');
  kind.id = 'graph-kind'; kindLabel.htmlFor = kind.id;
  for (const value of ['all', ...new Set(nodes.map(n => n.kind))]) {
    const option = el('option', value === 'all' ? 'All kinds' : value); option.value = value; kind.append(option);
  }
  const count = el('p', '', 'muted');
  count.setAttribute('aria-live', 'polite');
  const list = el('div', '', 'results');
  sidebar.append(searchLabel, modeLabel, mode, kindLabel, kind, count, list);
  const content = el('article');
  const audit = el('details', '', 'audit');
  audit.append(el('summary', 'Sources, licenses and extraction boundaries'));
  for (const book of corpus.books) {
    const p = el('p');
    p.append(external(book.title, book.url), document.createTextNode(` — ${book.author}. ${book.format}. `), external(book.license, book.licenseUrl));
    audit.append(p);
  }
  audit.append(el('p', interpretation.note));
  for (const limitation of corpus.limitations) audit.append(el('p', limitation));
  audit.append(el('p', `${corpus.unresolved.length} unresolved source references; ${corpus.diagnostics.length} parse diagnostics. Unresolved references are not graph edges. See the selected record for its unresolved anchors.`));
  audit.append(external('Download corpus JSON', corpusUrl), document.createTextNode(' · '), external('Download interpreted graph', interpretationUrl));
  shell.append(sidebar, content);
  host.replaceChildren(header, shell, audit);

  function nodeLink(node: RecordNode, label = node.title) {
    const a = el('a', label); a.href = '#' + encodeURIComponent(node.id);
    a.onclick = event => { event.preventDefault(); select(node.id); };
    return a;
  }
  function results() {
    const query = search.value.toLowerCase().trim();
    const found = nodes.filter(n => (mode.value === 'all' || n.book === mode.value)
      && (kind.value === 'all' || kind.value === n.kind)
      && (!query || `${n.title} ${n.body} ${n.id}`.toLowerCase().includes(query)));
    count.textContent = `${found.length.toLocaleString()} matches${found.length > 100 ? ' · first 100 shown; narrow your search' : ''}`;
    list.replaceChildren(...found.slice(0, 100).map(n => {
      const row = el('div'); row.append(nodeLink(n), el('small', `${n.book} · ${n.kind}`)); return row;
    }));
  }
  search.oninput = results; mode.onchange = results; kind.onchange = results;

  function neighborhood(node: RecordNode) {
    const section = el('section', '', 'neighborhood');
    section.append(el('h3', 'One-hop neighborhood'));
    const adjacent = adjacency.get(node.id) ?? [];
    const neighbors = [...new Set(adjacent.map(e => e.source === node.id ? e.target : e.source))].filter(id => id !== node.id);
    const shown = neighbors.slice(0, 24);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 760 420');
    svg.setAttribute('aria-hidden', 'true');
    const points = [{ id: node.id, x: 380, y: 210 }, ...shown.map((id, i) => {
      const angle = i / shown.length * Math.PI * 2;
      return { id, x: 380 + Math.cos(angle) * 255, y: 210 + Math.sin(angle) * 163 };
    })];
    const visiblePoints = new Map(points.map(point => [point.id, point]));
    // Show actual links between neighbors too, rather than implying every
    // neighborhood is a star. Full edge direction remains in the text list.
    const visibleEdges = edges.filter(edge => visiblePoints.has(edge.source) && visiblePoints.has(edge.target));
    for (const edge of visibleEdges) {
      const from = visiblePoints.get(edge.source)!;
      const to = visiblePoints.get(edge.target)!;
      const line = document.createElementNS(svg.namespaceURI, 'line');
      for (const [key, value] of Object.entries({ x1: from.x, y1: from.y, x2: to.x, y2: to.y })) line.setAttribute(key, String(value));
      const title = document.createElementNS(svg.namespaceURI, 'title');
      title.textContent = `${byId.get(edge.source)?.title} → ${edge.relation} → ${byId.get(edge.target)?.title}`;
      line.append(title);
      svg.append(line);
    }
    for (const point of points) {
      const target = byId.get(point.id);
      if (!target) continue;
      const group = document.createElementNS(svg.namespaceURI, 'a');
      group.setAttribute('href', '#' + encodeURIComponent(point.id));
      group.setAttribute('tabindex', '-1');
      const circle = document.createElementNS(svg.namespaceURI, 'circle');
      circle.setAttribute('cx', String(point.x)); circle.setAttribute('cy', String(point.y));
      circle.setAttribute('r', point.id === node.id ? '12' : '6');
      circle.setAttribute('class', target.book === 'interpretation' ? 'interpreted' : 'source');
      const label = document.createElementNS(svg.namespaceURI, 'text');
      label.setAttribute('x', String(point.x)); label.setAttribute('y', String(point.y + 21));
      label.setAttribute('text-anchor', 'middle');
      label.textContent = target.title.length > 29 ? target.title.slice(0, 27) + '…' : target.title;
      const title = document.createElementNS(svg.namespaceURI, 'title'); title.textContent = target.title;
      group.append(title, circle, label); svg.append(group);
    }
    section.append(svg, el('p', `Blue: interpreted nodes. Ochre: source records. ${shown.length} of ${neighbors.length} neighbors drawn; all ${adjacent.length} relationships listed below. Lines indicate adjacency only; direction and relation are explicit in the list.`, 'muted'));
    const relationships = el('ul', '', 'relationships');
    for (const edge of adjacent) {
      const outgoing = edge.source === node.id;
      const other = byId.get(outgoing ? edge.target : edge.source);
      if (!other) continue;
      const item = el('li');
      item.append(el('span', `${outgoing ? '→' : '←'} ${edge.relation.replaceAll('-', ' ')}`, 'relation'), nodeLink(other), el('small', edge.evidence));
      relationships.append(item);
    }
    section.append(relationships);
    return section;
  }
  function select(id: string, updateHash = true) {
    const node = byId.get(id);
    if (!node) {
      content.replaceChildren(el('h2', 'Record not found'), el('p', id));
      return;
    }
    if (updateHash) history.pushState(null, '', '#' + encodeURIComponent(id));
    const badge = el('p', `${node.book} / ${node.kind} / ${node.evidence}`, 'eyebrow');
    content.replaceChildren(badge, el('h2', node.title));
    if (node.book === 'interpretation') content.append(el('p', 'Authored synthesis · informal mathematics · not a checked runtime capability', 'status'));
    else content.append(el('p', node.context, 'muted'));
    if (node.assumptions?.length) {
      const assumptions = el('section', '', 'assumptions'); assumptions.append(el('h3', 'Assumptions'));
      for (const a of node.assumptions) assumptions.append(el('p', a));
      content.append(assumptions);
    }
    if (node.format === 'plain') content.append(el('pre', node.body, 'pdf-text'));
    else if (node.format === 'latex-source') {
      content.append(el('p', 'LaTeX source excerpt. Custom environments and macros are retained; follow the source link for complete context.', 'muted'), el('pre', node.body, 'tex-source'));
    } else content.append(mathText(node.body));
    if (node.steps?.length) {
      content.append(el('h3', 'Informal proof outline'));
      const steps = el('ol', '', 'proof');
      for (const step of node.steps) { const li = el('li'); li.append(mathText(step)); steps.append(li); }
      content.append(steps);
    }
    const book = corpus.books.find(b => b.id === node.book);
    if (node.url) content.append(external(`Open source · ${node.locator ?? node.id}`, node.url));
    if (book) content.append(el('p', `${book.author} · ${book.license}. Extracted/normalized by Kinetic Press; figures and source-specific formatting may be omitted.`, 'muted'));
    const unresolved = corpus.unresolved.filter(e => e.source === id);
    if (unresolved.length) {
      const details = el('details'); details.append(el('summary', `${unresolved.length} unresolved source references`));
      details.append(el('pre', unresolved.map(e => `${e.anchor}${e.candidates ? ' (ambiguous)' : ''}`).join('\n'))); content.append(details);
    }
    content.append(neighborhood(node));
  }
  function restore() {
    try { select(decodeURIComponent(location.hash.slice(1)) || 'concept:product', false); }
    catch { content.replaceChildren(el('p', 'Invalid record URL. Choose a starting neighborhood above.')); }
  }
  window.addEventListener('hashchange', restore);
  window.addEventListener('popstate', restore);
  results(); restore();
}

start(root).catch(error => { root.replaceChildren(el('h1', 'Could not open the graph'), el('p', String(error))); });
