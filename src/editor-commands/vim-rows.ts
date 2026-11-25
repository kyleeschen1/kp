import type { FacetGroup, Row } from '../editor-rows/model.ts';
import type { VimEntry } from './vim-reference.ts';
import { bindingSupport, statuses, type Support, type VimSurface } from './vim-coverage.ts';

export const vimFacetGroups: readonly FacetGroup[] = [
  { id: 'role', label: 'Role', values: [
    { id: 'operation', label: 'Operations', key: 'o' }, { id: 'operator', label: 'Operators', key: 'p' },
    { id: 'motion', label: 'Motions', key: 'm' }, { id: 'text-object', label: 'Text objects', key: 't' }, { id: 'modifier', label: 'Modifiers', key: 'c' }
  ] },
  { id: 'mode', label: 'Invocation', values: [
    { id: 'normal', label: 'Normal', key: 'n' }, { id: 'insert', label: 'Insert', key: 'i' }, { id: 'visual', label: 'Visual', key: 'v' },
    { id: 'ex', label: 'Ex', key: 'e' }, { id: 'command-line', label: 'Command line', key: 'l' },
    { id: 'operator', label: 'Operator pending', key: 'g' }, { id: 'terminal', label: 'Terminal', key: 'z' }
  ] },
  { id: 'domain', label: 'Domain', values: [
    { id: 'vim', label: 'General Vim', key: 'a' }, { id: 'notebook', label: 'KP notebook', key: 'd' },
    { id: 'chat', label: 'Chat', key: 'h' }, { id: 'workspace', label: 'Workspace', key: 'w' }
  ] },
  { id: 'support', label: 'Support', values: Object.entries(statuses).map(([id, value], index) => ({ id, label: value.label, key: ['x', 'f', 's', 'j', 'u', 'k'][index]! })) }
];
const motions = new Set(['h', 'j', 'k', 'l', 'w', 'W', 'b', 'B', 'e', 'E', 'ge', 'gE', '0', '^', '$', 'g0', 'g^', 'g$', 'gm', 'gM',
  'gj', 'gk', 'gg', 'G', 'H', 'M', 'L', '|', '+', '-', '_', '<CR>', '<Space>', '<BS>', '<Left>', '<Right>', '<Up>', '<Down>',
  '<Home>', '<End>', '<PageUp>', '<PageDown>', '<S-Left>', '<S-Right>', '<C-Left>', '<C-Right>', '<C-Home>', '<C-End>',
  'f', 'F', 't', 'T', ';', ',', '%', '(', ')', '{', '}', '[[', ']]', '[]', '][', '[(', '])', '[{', ']}', '[m', ']m', '[M', ']M',
  '/', '?', 'n', 'N', '*', '#', 'g*', 'g#', 'gd', 'gD', "'", '`', "''", '``', 'g;', 'g,',
  'CTRL-B', 'CTRL-F', 'CTRL-D', 'CTRL-U', 'CTRL-E', 'CTRL-Y', 'CTRL-O', 'CTRL-I', 'CTRL-]', 'CTRL-T',
  'zt', 'zz', 'zb', 'z<CR>', 'z.', 'z-', 'z+', 'z^', 'zh', 'zl', 'zH', 'zL', 'zs', 'ze',
  ':goto', ':next', ':previous', ':first', ':last', ':rewind', ':bnext', ':bprevious', ':bfirst', ':blast', ':cnext', ':cprevious', ':lnext', ':lprevious']);
const operators = new Set(['d', 'c', 'y', '!', '=', '<', '>', 'g~', 'gu', 'gU', 'gq', 'gw', 'g?', 'g@', 'zf']);
const editingNavigation = new Set(['<Left>', '<Right>', '<Up>', '<Down>', '<Home>', '<End>', '<PageUp>', '<PageDown>', '<S-Left>', '<S-Right>', '<C-Left>', '<C-Right>', '<C-Home>', '<C-End>']);

/** Classification describes a reference form, not whether the current surface
 * implements it. Operators also remain operations; text objects are operands. */
export function vimTags(entry: VimEntry): { role: readonly string[]; mode: readonly string[]; domain: readonly string[] } {
  if (entry.origin === 'workspace') return {
    role: ['pane', 'message'].includes(entry.tag) ? ['motion'] : ['operation'], mode: [entry.mode],
    domain: ['run', 'number'].includes(entry.tag) ? ['notebook'] : ['chat-menu', 'message', 'source', 'transcript-ex'].includes(entry.tag) ? ['chat']
      : entry.tag === 'submit' ? ['notebook', 'chat'] : ['workspace']
  };
  const tag = entry.tag.replace(/^(?:i_|v_|c_)/, '');
  // The pinned index explicitly marks Normal-mode cursor motions. Insert and
  // command-line keys need their own interpretation: Backspace edits there.
  const movement = entry.moves || (['normal', 'visual', 'ex'].includes(entry.mode) && motions.has(tag))
    || (['insert', 'command-line'].includes(entry.mode) && editingNavigation.has(tag))
    || ['i_CTRL-G_j', 'i_CTRL-G_k', 'c_CTRL-B', 'c_CTRL-E'].includes(entry.tag);
  const role = entry.group === 'Text objects' ? ['text-object']
    : ['count', 'quote'].includes(entry.tag) || entry.group === 'Operator pending' ? ['modifier']
    : entry.mode === 'normal' && operators.has(tag) ? ['operation', 'operator']
    : movement ? ['motion'] : ['operation'];
  return { role, mode: entry.group === 'Text objects' ? ['operator', 'visual'] : [entry.mode], domain: ['vim'] };
}
export interface VimRowResource { entry: VimEntry; support: Support }
export function vimRows(entries: readonly VimEntry[], surface: VimSurface, platform: 'mac' | 'other'): Row<VimRowResource>[] {
  const aliases: Readonly<Record<string, string>> = { q: 'macro recording', '@': 'macro playback', '@@': 'macro repeat', count: 'counts counted motion composition',
    quote: 'register clipboard', '.': 'dot repeat last change', '%': 'matching bracket delimiter' };
  return entries.map(entry => {
    const tags = vimTags(entry), support = bindingSupport(entry, surface, platform), status = statuses[support.status];
    return { id: entry.id, resource: { entry, support }, facets: { ...tags, support: [support.status] }, actions: ['workspace.vim-coverage.inspect'], fields: {
      keys: { text: entry.keys, display: 'primary', search: 'fuzzy' },
      description: { text: entry.description, display: 'secondary', search: 'fuzzy' },
      status: { text: `${status.mark} ${status.label} · ${tags.role.join(' / ')} · ${tags.mode.join(' / ')}`, display: 'annotation', search: 'none' },
      aliases: { text: [entry.tag, ...entry.examples, aliases[entry.tag] ?? ''].filter(Boolean).join(' '), display: 'hidden', search: 'literal', label: 'Matched alias' },
      name: { text: entry.tag.startsWith(':') ? entry.tag.slice(1) : '', display: 'hidden', search: 'literal', label: 'Matched command' }
    } };
  });
}
