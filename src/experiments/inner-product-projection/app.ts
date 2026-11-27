import { mountRowPicker } from '../../interaction/row-picker.ts';
import { available, unavailable } from '../../editor-commands/registry.ts';
import { CommandShortcut } from '../../editor-commands/shortcut.ts';
import { examples, prepareProjection, readProjectionUrl, type ProjectionDraft } from '../../projection-explanation/model.ts';
import { mountProjectionPlayer } from '../../projection-explanation/player.ts';
import './style.css';

const root = document.querySelector<HTMLElement>('#projection')!;
const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
const inputs = [...root.querySelectorAll<HTMLInputElement>('.vectors input')];
const draft = (): ProjectionDraft => [inputs[0]!.value, inputs[1]!.value, inputs[2]!.value, inputs[3]!.value];
const preset = find<HTMLSelectElement>('[aria-label=Example]'), discover = find<HTMLButtonElement>('[data-discover]');
const theme = find<HTMLButtonElement>('[data-theme]');
for (const example of examples) preset.add(new Option(example.title, example.id));
preset.add(new Option('Custom', 'custom'));
const loaded = readProjectionUrl(new URLSearchParams(location.search));
if (loaded.status === 'ready') inputs.forEach((input, index) => { input.value = loaded.draft[index]!; });
let source = prepareProjection(draft()), revision = 0, disposed = false;
let beat = 'source-pose';
const saveLocation = () => {
  if (source.status === 'invalid') return;
  const params = new URLSearchParams({ a: source.a.join(','), b: source.b.join(','), beat });
  history.replaceState(null, '', `${location.pathname}?${params}`);
};
const player = mountProjectionPlayer(find('[data-player]'), 'projection.editable',
  loaded.status === 'ready' ? loaded.progress : 0, (_progress, value) => { beat = value; root.dataset['beat'] = beat; saveLocation(); });
const operations = [
  { id: 'dot', title: 'Inspect dot product', detail: 'Scalar · sum of component products', progress: 3 / 8 },
  { id: 'projection', title: 'Inspect projection', detail: 'Vector · signed multiple along b', progress: 6 / 8 },
  { id: 'residual', title: 'Inspect perpendicular remainder', detail: 'Residual · orthogonal decomposition', progress: 7 / 8 }
] as const;
const picker = mountRowPicker(document.body, {
  id: 'projection-capabilities', label: 'Vector relationships', maxVisible: 5,
  rows: () => operations.map(operation => ({ id: operation.id, resource: { operation, revision },
    fields: { title: { text: operation.title, display: 'primary', search: 'fuzzy' }, detail: { text: operation.detail, display: 'secondary', search: 'fuzzy' } },
    facets: {}, actions: ['inspect'] })),
  state: row => source.status !== 'ready' ? unavailable('Enter valid vectors with a nonzero b.')
    : row.resource.revision !== revision ? unavailable('The inputs changed. Reopen relationships.') : available(),
  execute: row => {
    if (disposed || row.resource.revision !== revision || source.status !== 'ready') return { ok: false, reason: 'The inputs changed. Reopen relationships.' };
    player.seek(row.resource.operation.progress); return { ok: true };
  }
});
const apply = () => {
  player.pause(); revision++; source = prepareProjection(draft());
  inputs.forEach((input, index) => input.setAttribute('aria-invalid', String(source.status === 'invalid' && source.index === index)));
  player.update(source);
  if (source.status === 'undefined') saveLocation();
  preset.value = examples.find(example => [...example.a, ...example.b].join(',') === draft().map(Number).join(','))?.id ?? 'custom';
  picker.refresh();
};
inputs.forEach(input => { input.oninput = apply; });
find<HTMLFormElement>('form').onsubmit = event => event.preventDefault();
preset.onchange = () => {
  const example = examples.find(item => item.id === preset.value); if (!example) return;
  inputs.forEach((input, index) => { input.value = String([...example.a, ...example.b][index]); }); apply();
};
discover.onclick = () => { player.pause(); picker.open(); };
theme.onclick = () => {
  const dark = document.documentElement.dataset['kpTheme'] !== 'dark';
  document.documentElement.dataset['kpTheme'] = dark ? 'dark' : 'light'; theme.textContent = dark ? 'Light theme' : 'Dark theme';
};
const shortcut = new CommandShortcut();
const keydown = (event: KeyboardEvent) => {
  const action = shortcut.next(event, performance.now());
  if (action !== 'pass') event.preventDefault();
  if (action === 'open') discover.click();
};
const resetShortcut = () => shortcut.reset();
const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
document.addEventListener('keydown', keydown); document.addEventListener('pointerdown', resetShortcut); document.addEventListener('focusin', resetShortcut);
window.addEventListener('blur', resetShortcut); window.addEventListener('pagehide', pagehide);
function dispose() {
  if (disposed) return; disposed = true;
  player.dispose(); picker.dispose();
  document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', resetShortcut); document.removeEventListener('focusin', resetShortcut);
  window.removeEventListener('blur', resetShortcut); window.removeEventListener('pagehide', pagehide);
  inputs.forEach(input => { input.oninput = null; });
  discover.onclick = theme.onclick = null; preset.onchange = null; find<HTMLFormElement>('form').onsubmit = null;
}
apply(); if (loaded.status === 'invalid') find<HTMLElement>('[data-diagnostic]').textContent = loaded.message;
root.dataset['ready'] = 'true';
if (import.meta.hot) import.meta.hot.dispose(dispose);
