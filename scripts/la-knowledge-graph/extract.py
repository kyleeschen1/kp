"""Offline, deterministic source extraction. References are not logical entailment.

No downloaded code or TeX is executed. Unresolved source references stay explicit;
PDF pages remain pages, rather than guessed theorem/proof boundaries.
"""
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'tmp/codex/la-corpus'
OUT = ROOT / 'research/la-graph'
KINDS = {'definition', 'theorem', 'lemma', 'proposition', 'corollary', 'example',
         'proof', 'fact', 'algorithm', 'remark', 'technique'}
BOOKS = [
    dict(id='beezer', title='A First Course in Linear Algebra', author='Robert A. Beezer',
         url='https://linear.pugetsound.edu/', license='GFDL 1.2 or later',
         licenseUrl='https://www.gnu.org/licenses/fdl-1.3.html', format='XML'),
    dict(id='ila', title='Interactive Linear Algebra', author='Dan Margalit and Joseph Rabinoff',
         url='https://textbooks.math.gatech.edu/ila/', license='GFDL 1.3 or later',
         licenseUrl='https://www.gnu.org/licenses/fdl-1.3.html', format='XML'),
    dict(id='hefferon', title='Linear Algebra', author='Jim Hefferon',
         url='https://hefferon.net/linearalgebra/', license='CC BY-SA 2.5 (pinned repository LICENSE; chosen dual-license option)',
         licenseUrl='https://creativecommons.org/licenses/by-sa/2.5/', format='LaTeX'),
    dict(id='axler', title='Linear Algebra Done Right, fourth edition', author='Sheldon Axler',
         url='https://linear.axler.net/', license='CC BY-NC 4.0',
         licenseUrl='https://creativecommons.org/licenses/by-nc/4.0/', format='PDF pages'),
]


def tag(el):
    return el.tag.split('}')[-1] if isinstance(el.tag, str) else ''


def compact(text):
    return re.sub(r'[ \t]+', ' ', re.sub(r'\n\s*\n+', '\n\n', text)).strip()


def xml_text(el, skip_records=False):
    name = tag(el)
    if skip_records and name in KINDS:
        return ''
    if name in {'idx', 'index', 'tikz', 'sage', 'image', 'video', 'interactive'}:
        return ''
    if name == 'acroref':
        return '[' + el.get('type', '') + ' ' + el.get('acro', '') + ']'
    if name == 'xref':
        return '[' + el.get('ref', '') + ']'
    if name in {'m', 'me', 'men', 'equation', 'alignmath', 'md', 'mdn'}:
        if name in {'md', 'mdn'}:
            content = r' \\ '.join(''.join(c.itertext()) for c in el if tag(c) == 'mrow')
            content = r'\begin{aligned}' + content + r'\end{aligned}'
        else:
            content = ''.join(el.itertext()).strip()
            if name == 'alignmath':
                content = r'\begin{aligned}' + content + r'\end{aligned}'
        return ('$' if name == 'm' else '\n$$') + content + ('$' if name == 'm' else '$$\n')
    text = el.text or ''
    for child in el:
        text += xml_text(child, skip_records) + (child.tail or '')
    if name in {'p', 'statement', 'li', 'title', 'intertext'}:
        text = '\n' + text + '\n'
    return text


def extract_xml(source, content):
    root = ET.fromstring(content)
    book = source['book']
    nodes, pending, aliases = [], [], {}
    counters = Counter()

    def visit(el, parent=None, context=''):
        kind = tag(el)
        is_record = kind in KINDS or kind in {'section', 'subsection', 'chapter'}
        xml_id = el.get('{http://www.w3.org/XML/1998/namespace}id')
        acro = el.get('acro')
        own = parent
        if is_record:
            counters[kind] += 1
            local = xml_id or (kind + '-' + acro if acro else f'{Path(source["path"]).stem}-{kind}-{counters[kind]}')
            own = book + ':' + Path(source['path']).stem + ':' + local
            title = el.find('title')
            if title is None:
                title = el.find('.//term')
            title_text = compact(''.join(title.itertext())) if title is not None else local
            if kind == 'proof' and parent:
                parent_title = next((n['title'] for n in reversed(nodes) if n['id'] == parent), parent)
                title_text = 'Proof: ' + parent_title
            body = compact((el.text or '') + ''.join(xml_text(c, True) + (c.tail or '')
                           for c in el if tag(c) not in {'title', 'section', 'subsection', 'chapter'}
                           and (kind not in {'section', 'subsection', 'chapter'}
                                or tag(c) in {'p', 'introduction', 'objectives', 'paragraphs'})))
            if not body and kind in {'section', 'subsection', 'chapter'}:
                body = 'Source structure: ' + title_text
            nodes.append(dict(id=own, book=book, kind=kind, title=title_text,
                              body=body, context=context, source=source['path'],
                              locator=local, url=source['sourceUrl'],
                              evidence='source-structure', format='math-text'))
            if parent:
                pending.append(dict(source=parent, target=own, relation='contains', evidence='source-structure'))
            if kind == 'proof' and parent:
                pending.append(dict(source=own, target=parent, relation='proof-of', evidence='source-structure'))
            if xml_id:
                aliases[xml_id] = own
            if acro:
                aliases[kind + ':' + acro] = own
            context = title_text if kind in {'section', 'subsection', 'chapter'} else context
        # A reference to a non-record anchor maps to its containing record and is
        # marked as such. Preserve the original anchor to make that inspectable.
        if xml_id and xml_id not in aliases and own:
            aliases[xml_id] = own
        if kind in {'xref', 'acroref'} and own:
            references = el.get('ref', '').split(',') if kind == 'xref' else [el.get('type', '') + ':' + el.get('acro', '')]
            for reference in references:
                pending.append(dict(source=own, anchor=reference.strip(), relation='references', evidence='explicit-source-reference'))
        for child in el:
            visit(child, own, context)
    visit(root)
    return nodes, pending, aliases


def extract_tex(source, content):
    # Remove comments without changing line numbers; retain the original excerpt
    # separately. Balanced environment scanning permits nested align/matrix blocks.
    clean = re.sub(r'(?<!\\)%[^\n]*', '', content)
    stack, spans = [], []
    for match in re.finditer(r'\\(begin|end)\{([^}]+)\}', clean):
        action, kind = match.groups()
        if action == 'begin':
            stack.append((kind, match.start(), match.end()))
        elif stack and stack[-1][0] == kind:
            _, start, body_start = stack.pop()
            if kind in KINDS:
                spans.append((start, match.end(), body_start, match.start(), kind))
    spans.sort()
    nodes, pending, aliases = [], [], {}
    previous = None
    for count, (start, end, body_start, body_end, kind) in enumerate(spans):
        body = clean[body_start:body_end].strip()
        labels = re.findall(r'\\label\{([^}]+)\}', body)
        local = labels[0] if labels else f'{Path(source["path"]).stem}-{kind}-{count+1}'
        own = 'hefferon:' + local
        terms = re.findall(r'\\definend\{([^}]+)\}', body)
        title = ', '.join(terms[:3]) if terms else local
        line = clean[:start].count('\n') + 1
        nodes.append(dict(id=own, book='hefferon', kind=kind, title=title,
                          body=body, context=source['path'], source=source['path'],
                          locator=f'line {line}', url=source['sourceUrl'] + f'#L{line}',
                          evidence='source-structure', format='latex-source'))
        for label in labels:
            aliases.setdefault(label, own)
        for ref in re.findall(r'\\(?:ref|eqref|pageref)\{([^}]+)\}', body):
            pending.append(dict(source=own, anchor=ref, relation='references', evidence='explicit-source-reference'))
        if kind == 'proof' and previous and previous[2] in {'theorem', 'lemma', 'proposition', 'corollary'}:
            if not clean[previous[1]:start].strip():
                pending.append(dict(source=own, target=previous[0], relation='proof-of', evidence='source-structure'))
        previous = (own, end, kind)
    return nodes, pending, aliases


def main():
    lock = json.loads((OUT / 'sources.lock.json').read_text())
    # fetch.py writes a list, not an inferred dependency schema.
    sources = lock if isinstance(lock, list) else lock['sources']
    version = subprocess.run(['pdftotext', '-v'], capture_output=True, text=True, check=True)
    pdf_tool = (version.stdout + version.stderr).splitlines()[0]
    nodes, pending, aliases, diagnostics = [], [], {}, []
    for source in sources:
        path = CACHE / source['book'] / source['path']
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != source['sha256']:
            raise ValueError(f'Source hash mismatch: {path}')
        book = source['book']
        if source['path'].endswith('.xml'):
            try:
                ns, es, als = extract_xml(source, data.decode())
            except ET.ParseError as error:
                diagnostics.append(dict(source=source['path'], book=book, issue=str(error)))
                continue
        elif book == 'hefferon' and source['path'].endswith('.tex'):
            ns, es, als = extract_tex(source, data.decode())
        elif book == 'axler':
            target = path.with_suffix('.txt')
            subprocess.run(['pdftotext', '-layout', str(path), str(target)], check=True)
            ns, es, als = [], [], {}
            for page, body in enumerate(target.read_text().split('\f'), 1):
                if not body.strip():
                    continue
                ns.append(dict(id=f'axler:page-{page}', book=book, kind='page',
                               title=f'PDF page {page}', body=body.strip(), context='PDF extraction; page boundaries only',
                               source=source['path'], locator=f'PDF page {page}',
                               url=source['url'] + f'#page={page}', evidence='pdf-text', format='plain'))
        else:
            continue
        nodes.extend(ns)
        pending.extend(dict(edge, book=book) for edge in es)
        for key, value in als.items():
            aliases.setdefault(book + ':' + key, []).append(value)
    ids = {node['id'] for node in nodes}
    if len(ids) != len(nodes):
        duplicates = [key for key, n in Counter(n['id'] for n in nodes).items() if n > 1]
        raise ValueError(f'Duplicate source IDs: {duplicates}')
    edges, unresolved, seen = [], [], set()
    for edge in pending:
        if 'target' not in edge:
            candidates = list(dict.fromkeys(aliases.get(edge['book'] + ':' + edge['anchor'], [])))
            same_file = [c for c in candidates if c.split(':')[:2] == edge['source'].split(':')[:2]]
            candidates = same_file or candidates
            edge['target'] = candidates[0] if len(candidates) == 1 else None
            if len(candidates) > 1:
                edge['candidates'] = candidates
        if edge['target'] not in ids:
            unresolved.append(edge)
            continue
        key = (edge['source'], edge['target'], edge['relation'], edge.get('anchor'))
        if key not in seen:
            seen.add(key)
            edges.append(edge)
    payload = dict(schemaVersion=1, extraction=dict(pdfTool=pdf_tool), books=BOOKS, nodes=nodes, edges=edges,
                   diagnostics=diagnostics, unresolved=unresolved,
                   limitations=[
                       'Source references are citations, not verified logical dependencies.',
                       'XML math is normalized; custom macros and omitted figures may require the original source.',
                       'LaTeX excerpts preserve source syntax; contextual hypotheses may occur outside a block.',
                       'Axler PDF text is indexed by physical PDF page, without inferred theorem/proof boundaries.',
                       'No extracted proof is formally verified. No inferred equivalence is promoted to runtime authority.',
                   ])
    (OUT / 'corpus.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    licenses = OUT / 'licenses'
    licenses.mkdir(exist_ok=True)
    (licenses / 'GFDL-1.3.txt').write_bytes((CACHE / 'licenses/gfdl-1.3.txt').read_bytes())
    notice = (CACHE / 'hefferon/LICENSE').read_text()
    (licenses / 'HEFFERON-NOTICE.txt').write_text('\n'.join(line.rstrip() for line in notice.splitlines()) + '\n')
    print(json.dumps(dict(nodes=len(nodes), edges=len(edges), unresolved=len(unresolved),
                          diagnostics=diagnostics, kinds=dict(Counter(n['kind'] for n in nodes))), indent=2))


if __name__ == '__main__':
    main()
