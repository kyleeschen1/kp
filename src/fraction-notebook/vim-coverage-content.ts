import referenceText from '../../vendor/vim-9.2.0000/index.txt?raw';
import licenseText from '../../vendor/vim-9.2.0000/LICENSE?raw';
import { parseVimReference, vimReference, type VimMode } from '../editor-commands/vim-reference.ts';
import { bindingSupport, detectVimSurface, searchBindings, statuses, surfaces, workspaceBindings, type VimSurface, type SupportStatus } from '../editor-commands/vim-coverage.ts';
import { available, unavailable, type CommandOrigin, type CommandRegistry } from '../editor-commands/registry.ts';

const entries = [...workspaceBindings, ...parseVimReference(referenceText)];
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => { const element = document.createElement(tag); if (text) element.textContent = text; return element; };
const link = (title: string, href: string) => { const node = make('a', title); node.href = href; node.target = '_blank'; node.rel = 'noopener'; return node; };
export function renderVimCoverage(host: HTMLElement, origin: CommandOrigin, registry: CommandRegistry) {
  const intro = make('p', `Vim ${vimReference.version} · ${entries.length - workspaceBindings.length} reference forms + ${workspaceBindings.length} KP extensions`);
  const toolbar = make('div'); toolbar.className = 'kp-vim-filters';
  const select = <T extends string>(label: string, choices: readonly (readonly [T, string])[], initial: T, change: () => void) => {
    const wrapper = make('label', label === 'Editor surface' ? 'Editor' : label), control = make('select'); control.setAttribute('aria-label', label);
    for (const [key, title] of choices) { const option = make('option', title); option.value = key; control.append(option); }
    control.value = initial; control.onchange = change; wrapper.append(control); toolbar.append(wrapper); return control;
  };
  let surface: VimSurface = detectVimSurface(origin.element, origin.scope), status: SupportStatus | 'all' = 'all', mode: VimMode | 'all' | 'workspace' = 'all', limit = 80;
  const platform = /Mac|iPhone|iPad/.test(navigator.platform) ? 'mac' : 'other';
  const surfaceSelect = select('Editor surface', Object.entries(surfaces), surface, () => {
    const value = Object.keys(surfaces).find(key => key === surfaceSelect.value);
    if (value && isSurface(value)) surface = value; reset();
  });
  const statusSelect = select('Support', [['all', 'All'], ...Object.entries(statuses).map(([key, value]) => [key, `${value.mark} ${value.label}`] as const)], status, () => {
    const value = statusSelect.value; if (value === 'all' || isStatus(value)) status = value; reset();
  });
  const modes: readonly (readonly [VimMode | 'all' | 'workspace', string])[] = [['all', 'All modes'], ['normal', 'Normal'], ['insert', 'Insert'], ['visual', 'Visual'], ['operator', 'Objects / operators'], ['ex', 'Ex commands'], ['command-line', 'Command-line editing'], ['terminal', 'Terminal'], ['workspace', 'KP extensions']];
  const modeSelect = select('Mode', modes, mode, () => { const choice = modes.find(([key]) => key === modeSelect.value); if (choice) mode = choice[0]; reset(); });
  const search = make('input'); search.type = 'search'; search.setAttribute('aria-label', 'Search Vim bindings'); search.placeholder = 'Keys, action or example — diw, delete, macro…'; search.oninput = reset;
  const legend = make('p', Object.values(statuses).map(value => `${value.mark} ${value.label}`).join(' · ')); legend.className = 'kp-vim-legend';
  const context = make('p'); context.className = 'kp-vim-context';
  const count = make('p'); count.setAttribute('role', 'status'); count.setAttribute('aria-label', 'Binding results');
  const list = make('div'); list.className = 'kp-vim-rows'; list.setAttribute('role', 'list'); list.setAttribute('aria-label', 'Vim binding checklist');
  const more = make('button', 'Show next 80'); more.type = 'button';
  let remaining = 0;
  const moreCommand = registry.add({ id: 'workspace.vim-coverage.more', title: 'Show more Vim bindings', category: 'Workspace', scope: 'workspace',
    state: () => remaining > 0 ? available() : unavailable('All matching bindings are shown'), run: () => { limit += 80; draw(); } }); moreCommand.bind(more);
  const provenance = make('details'), summary = make('summary', 'Reference, evidence and license');
  const explanation = make('p', 'Checks describe support, not whether an action is currently available. Counts, registers and operator composition have their own rows; not every numeric combination is repeated. Plugins and script functions are outside this index. The Vim index lists shared forms once; Visual rows describe its mode-specific differences. Partial and overridden entries explain differences. Unverified does not mean implemented. Browser/OS shortcuts can intercept keys.');
  const license = make('pre', licenseText);
  provenance.append(summary, explanation, context, link('Pinned Vim index', vimReference.url), make('p', `Reference SHA-256: ${vimReference.sha256}`), license);
  host.append(intro, toolbar, search, legend, count, list, more, provenance);
  function draw() {
    const rows = searchBindings(entries, search.value).filter(entry => (mode === 'all' || (mode === 'workspace' ? entry.origin === 'workspace' : entry.mode === mode))
      && (status === 'all' || bindingSupport(entry, surface, platform).status === status));
    remaining = Math.max(0, rows.length - limit); list.replaceChildren();
    context.textContent = `${surfaces[surface]} · ${platform === 'mac' ? 'macOS modifier rules' : 'Ctrl modifier rules'}. Support does not depend on selection, connection or undo history.`;
    count.textContent = `${rows.length} matching bindings · showing ${Math.min(limit, rows.length)}${remaining ? ` · ${remaining} more` : ''}`;
    for (const entry of rows.slice(0, limit)) {
      const support = bindingSupport(entry, surface, platform), state = statuses[support.status];
      const row = make('div'); row.className = 'kp-vim-row'; row.setAttribute('role', 'listitem'); row.dataset['bindingTag'] = entry.tag; row.dataset['support'] = support.status;
      const heading = make('div'); heading.className = 'kp-vim-row-heading';
      const marker = make('span', state.mark); marker.className = 'kp-vim-check'; marker.setAttribute('aria-label', state.label);
      const keys = make('code', entry.keys), annotation = make('small', `${entry.group} · ${state.label}`);
      heading.append(marker, keys); row.append(heading, make('p', entry.description), annotation);
      const details = make('details'), title = make('summary', 'Support notes'); details.append(title, make('p', support.note));
      if (entry.examples.length) details.append(make('p', `Examples: ${entry.examples.join(' · ')}`));
      details.append(make('p', `Evidence: ${support.evidence.join(' · ')}`));
      if (entry.line) details.append(link('Reference entry', `${vimReference.url}#L${entry.line}`));
      row.append(details); list.append(row);
    }
    if (!rows.length) list.append(make('p', 'No bindings match these filters. Try All support or All modes.'));
    more.hidden = !remaining; registry.notify();
  }
  function reset() { limit = 80; draw(); }
  draw(); search.focus();
  return { dispose() { moreCommand.dispose(); host.replaceChildren(); } };
}
function isSurface(value: string): value is VimSurface { return Object.hasOwn(surfaces, value); }
function isStatus(value: string): value is SupportStatus { return Object.hasOwn(statuses, value); }
