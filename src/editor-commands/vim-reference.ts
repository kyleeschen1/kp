export const vimReference = {
  version: '9.2.0000',
  sha256: 'b1b3f89f5da0fd18e013d1a06d60b801ee65f43b437ef17a72219691a28f9a53',
  url: 'https://github.com/vim/vim/blob/v9.2.0000/runtime/doc/index.txt',
  license: 'https://github.com/vim/vim/blob/v9.2.0000/LICENSE',
  taggedRows: 1336
} as const;
export type VimMode = 'normal' | 'insert' | 'visual' | 'operator' | 'command-line' | 'terminal' | 'ex';
export interface VimEntry {
  id: string; tag: string; keys: string; description: string; mode: VimMode; group: string;
  line: number; changes: boolean; origin: 'vim' | 'workspace'; examples: readonly string[];
}
const sections: Readonly<Record<string, readonly [VimMode, string]>> = {
  '1': ['insert', 'Insert'], '2': ['normal', 'Normal'], '2.1': ['operator', 'Text objects'],
  '2.2': ['normal', 'Windows'], '2.3': ['normal', 'Bracket commands'], '2.4': ['normal', 'g commands'],
  '2.5': ['normal', 'Folding and z commands'], '2.6': ['operator', 'Operator pending'],
  '3': ['visual', 'Visual'], '4': ['command-line', 'Command line'], '5': ['terminal', 'Terminal'], '6': ['ex', 'Ex commands']
};
const examples: Readonly<Record<string, readonly string[]>> = {
  count: ['3w', '2j', '5dd', '2d3w'], d: ['dw', 'd$', 'diw', 'daw'], c: ['cw', 'ciw', 'ci"'], y: ['yw', 'yiw'],
  v_iw: ['diw', 'ciw', 'yiw'], v_aw: ['daw', 'caw', 'yaw'], v_ip: ['dip', 'cip'], v_iB: ['di{', 'ci{'],
  q: ['qa', 'q'], '@': ['@a'], quote: ['"ay', '"ap'], ':substitute': [':s/foo/bar/g', ':%s/foo/bar/g'],
  ':set': [':set number', ':set nonumber', ':set relativenumber']
};
const clean = (value: string) => value.replace(/\|([^|]+)\|/g, '$1').replace(/\s+/g, ' ').trim();
const expandTabs = (line: string) => { let result = ''; for (const char of line) result += char === '\t' ? ' '.repeat(8 - result.length % 8) : char; return result; };

/** Parse the pinned reference, including aliases without tags and wrapped rows.
 * Keep upstream data intact; exceptional single-space separators are explicit. */
export function parseVimReference(source: string): VimEntry[] {
  const entries: VimEntry[] = [], ids = new Set<string>();
  let mode: VimMode = 'normal', group = '', active = false, current: VimEntry | undefined;
  const singleSpaceKeys: Readonly<Record<string, string>> = {
    'i_CTRL-V_digit': 'CTRL-V {number}', 'c_CTRL-\\_e': 'CTRL-\\ e {expr}',
    ':menutranslate': ':menut[ranslate]', ':redrawtabpanel': ':redrawtabp[anel]', ':startgreplace': ':startg[replace]'
  };
  const lines = source.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index]!, expanded = expandTabs(raw);
    const section = raw.match(/^(\d+(?:\.\d+)?)\.?\s+.*\*/);
    if (section) {
      const value = sections[section[1]!]; if (!value) throw new Error(`Unknown Vim section at ${index + 1}`);
      [mode, group] = value; active = false; current = undefined; continue;
    }
    if (raw.startsWith('commands in ')) { group = raw.replace(/\s*[(*].*$/, '').trim(); active = true; current = undefined; continue; }
    if (/^-{20}/.test(raw)) { active = true; current = undefined; continue; }
    const settingRow = raw.startsWith("'cedit'");
    if (/^={20}/.test(raw) || (!raw.startsWith('|') && !settingRow && /^\S/.test(raw))) { active = false; current = undefined; continue; }
    if (!active || !raw.trim()) { current = undefined; continue; }
    const tagged = raw.match(/^\|([^|]+)\|[\t ]+(.*)/);
    // Continuations begin in the description column. Untagged aliases begin at 16.
    if (!tagged && expanded.search(/\S/) >= 32) {
      if (current) current.description = clean(`${current.description} ${expanded.trim().replace(/^[12](?:,2)?\s+/, '')}`);
      continue;
    }
    const tail = tagged?.[2] ?? (settingRow || expanded.startsWith('                ') ? expanded.slice(16) : '');
    if (!tail) { current = undefined; continue; }
    const tag = tagged?.[1] ?? '';
    const special = singleSpaceKeys[tag];
    const split = special ? [special, tail.slice(special.length).trim()] : tail.split(/\t+| {2,}/);
    const keys = split.shift()?.trim() ?? '', rawDescription = split.join(' ').trim();
    const description = clean(rawDescription.replace(/^[12](?:,2)?\s+/, ''));
    if (!keys || /^(not used|reserved for|does not start)/.test(description) || keys === 'other' || keys.includes(' to ')) { current = undefined; continue; }
    // Ditto marks in the count rows refer to the first count description.
    const resolvedDescription = description === '"' ? entries.find(row => row.tag === tag)?.description ?? '' : description;
    const id = `${mode}:${group}:${tag || 'alias'}:${keys}`;
    if (ids.has(id)) throw new Error(`Duplicate Vim reference row: ${id}`);
    ids.add(id);
    current = { id, tag, keys, description: resolvedDescription, mode, group, line: index + 1,
      changes: /^2\s|^1,2\s/.test(rawDescription), origin: 'vim', examples: examples[tag] ?? [] };
    entries.push(current);
  }
  // Upstream prints one shared description after these two command-line forms.
  const literalRegister = entries.find(entry => entry.tag === 'c_CTRL-R_CTRL-R');
  if (literalRegister && !literalRegister.description) literalRegister.description = entries.find(entry => entry.tag === 'c_CTRL-R_CTRL-O')?.description ?? '';
  if (entries.filter(entry => entry.tag).length !== vimReference.taggedRows || entries.some(entry => !entry.description))
    throw new Error(`Pinned Vim index extraction is incomplete: ${entries.filter(entry => entry.tag).length} tagged rows; missing lines: ${lines.flatMap((line, index) => /^\|[^|]+\|[\t ]+/.test(line) && !entries.some(entry => entry.line === index + 1) ? [index + 1] : []).join(', ')}; empty descriptions: ${entries.filter(entry => !entry.description).map(entry => entry.tag).join(', ')}`);
  return entries;
}
