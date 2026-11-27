import { presets, prepareComposition, readCompositionUrl, CompositionGap } from '../../composition-explanation/model.ts';
import { mountCompositionPlayer } from '../../composition-explanation/player.ts';
import './style.css';

const root = document.querySelector<HTMLElement>('#composition')!;
const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
for (const name of ['A', 'B']) {
  const host = find(`[data-inputs=${name}]`);
  for (let i = 0; i < 4; i++) {
    const input = document.createElement('input'); input.inputMode = 'numeric'; input.maxLength = 12;
    input.setAttribute('aria-label', `${name} row ${Math.floor(i / 2) + 1} column ${i % 2 + 1}`); host.append(input);
  }
}
const inputs = [...root.querySelectorAll<HTMLInputElement>('form input')];
const draft = () => inputs.map(input => input.value);
const preset = find<HTMLSelectElement>('[aria-label=Example]'), theme = find<HTMLButtonElement>('[data-theme]');
for (const value of presets) preset.add(new Option(value.title, value.id)); preset.add(new Option('Custom', 'custom'));
let loaded: ReturnType<typeof readCompositionUrl> = { draft: presets[0].values, progress: 0 }, linkError = '';
try { loaded = readCompositionUrl(new URLSearchParams(location.search)); }
catch (error) { if (!(error instanceof CompositionGap)) throw error; linkError = `${error.message} Showing the default example.`; }
inputs.forEach((input, i) => { input.value = loaded.draft[i]!; });
let model = prepareComposition(draft()), valid = true, disposed = false;
const player = mountCompositionPlayer(find('[data-player]'), 'composition.reference', loaded.progress, (progress, beat, playing) => {
  root.dataset['beat'] = beat; root.dataset['playing'] = String(playing);
  if (!valid || playing || disposed) return;
  history.replaceState(null, '', `${location.pathname}?${new URLSearchParams({ m: draft().join(','), beat, p: String(progress) })}`);
});
const apply = () => {
  valid = false; player.pause();
  const diagnostic = find('[data-host-diagnostic]');
  try { model = prepareComposition(draft()); valid = true; diagnostic.textContent = ''; }
  catch (error) { if (!(error instanceof CompositionGap)) throw error; diagnostic.textContent = error.message; }
  player.update(model, valid);
  inputs.forEach(input => input.setAttribute('aria-invalid', String(!valid)));
  preset.value = presets.find(item => item.values.join(',') === draft().map(Number).join(','))?.id ?? 'custom';
};
inputs.forEach(input => { input.oninput = apply; }); find<HTMLFormElement>('form').onsubmit = event => event.preventDefault();
preset.onchange = () => { const value = presets.find(item => item.id === preset.value); if (!value) return; inputs.forEach((input, i) => { input.value = value.values[i]!; }); apply(); };
theme.onclick = () => { const dark = document.documentElement.dataset['kpTheme'] !== 'dark'; document.documentElement.dataset['kpTheme'] = dark ? 'dark' : 'light'; theme.textContent = dark ? 'Light theme' : 'Dark theme'; };
const leaving = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
window.addEventListener('pagehide', leaving);
function dispose() {
  if (disposed) return; disposed = true; player.dispose(); window.removeEventListener('pagehide', leaving);
  inputs.forEach(input => { input.oninput = null; }); preset.onchange = theme.onclick = null;
  find<HTMLFormElement>('form').onsubmit = null;
}
apply(); if (linkError) find('[data-diagnostic]').textContent = linkError; root.dataset['ready'] = 'true';
if (import.meta.hot) import.meta.hot.dispose(dispose);
