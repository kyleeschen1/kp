export const styleFields = [
  ['Body color', '--fn-text', 'color'], ['Background', '--fn-background', 'color'],
  ['Animation surface', '--fn-surface', 'color'], ['Animation emphasis', '--fn-focus', 'color'],
  ['Muted text', '--fn-muted', 'color'], ['Borders', '--fn-border', 'color'],
  ['Links', '--fn-link', 'color'], ['Inline math', '--fn-math', 'color'],
  ['Annotations', '--fn-annotation', 'color'], ['Selection', '--fn-selection', 'color'],
  ['Cursor', '--kp-editor-cursor', 'color'], ['Cursor text', '--kp-editor-cursor-ink', 'color'],
  ['Gutter', '--fn-gutter', 'color'], ['Warnings', '--fn-warning', 'color'],
  ['Code strings', '--fn-code-string', 'color'], ['Code properties', '--fn-code-property', 'color'],
  ['Code numbers', '--fn-code-number', 'color'], ['Code punctuation', '--fn-code-punctuation', 'color'],
  ['Masthead weight', '--fn-masthead-weight', 'font-weight'], ['Document title weight', '--fn-title-weight', 'font-weight'],
  ['Heading weight', '--kp-document-heading-weight', 'font-weight'], ['Object title weight', '--fn-object-weight', 'font-weight'],
  ['Body weight', '--kp-document-body-weight', 'font-weight'], ['Caption weight', '--fn-caption-weight', 'font-weight'],
  ['Body size', '--kp-document-body-size', 'font-size'], ['Title size', '--kp-document-title-size', 'font-size'],
  ['Heading size', '--kp-document-heading-size', 'font-size'], ['Line height', '--kp-document-body-leading', 'line-height'],
  ['Masthead size', '--fn-masthead-size', 'font-size'], ['Object title size', '--fn-object-size', 'font-size'],
  ['Caption size', '--fn-caption-size', 'font-size'], ['Code size', '--fn-code-size', 'font-size'],
  ['Paragraph gap', '--kp-document-paragraph-gap', 'margin'], ['Document width', '--kp-document-width', 'width'],
  ['Palette red', '--color-red-light', 'color'], ['Palette green', '--color-green-light', 'color'],
  ['Palette blue', '--color-blue-light', 'color'], ['Palette yellow', '--color-yellow-light', 'color']
] as const;
export interface StyleSettings { theme: 'dark' | 'light'; values: Record<string, string> }
export function readStyleSettings(raw: unknown): StyleSettings {
  const settings: StyleSettings = { theme: 'dark', values: {} };
  if (!raw || typeof raw !== 'object' || !('values' in raw)) return settings;
  settings.theme = 'theme' in raw && raw.theme === 'light' ? 'light' : 'dark';
  if (!raw.values || typeof raw.values !== 'object') return settings;
  for (const [, key, property] of styleFields) {
    const value: unknown = Reflect.get(raw.values, key);
    if (typeof value === 'string' && value.length < 160 && !/[;{}]|url\s*\(/i.test(value) && CSS.supports(property, value)) settings.values[key] = value;
  }
  return settings;
}
export function applyStyles(settings: StyleSettings) {
  document.documentElement.dataset['notebookTheme'] = settings.theme;
  for (const [, key] of styleFields) {
    const value = settings.values[key];
    if (value) document.documentElement.style.setProperty(key, value);
    else document.documentElement.style.removeProperty(key);
  }
}
export function mountStyles(host: HTMLElement, changed: (settings: StyleSettings) => void) {
  let settings: StyleSettings = { theme: 'dark', values: {} };
  try { settings = readStyleSettings(JSON.parse(localStorage.getItem('kp.notebook.styles.v1') ?? 'null')); } catch { /* Invalid preferences do not block editing. */ }
  const panel = document.createElement('aside'); panel.className = 'fn-side-panel fn-styles'; panel.hidden = true; panel.setAttribute('aria-label', 'Styles');
  const title = document.createElement('h2'); title.textContent = 'Styles';
  const close = document.createElement('button'); close.textContent = 'Close styles'; close.onclick = () => { panel.hidden = true; };
  const hint = document.createElement('p'); hint.textContent = 'Blank values inherit from the theme. Use palette references such as var(--color-green-light). Preferences apply to this notebook workspace, including its preview.';
  const theme = document.createElement('select'); theme.setAttribute('aria-label', 'Theme');
  for (const value of ['dark', 'light']) { const option = document.createElement('option'); option.value = value; option.textContent = value; theme.append(option); }
  theme.value = settings.theme;
  panel.append(title, close, hint, theme);
  const inputs: HTMLInputElement[] = [];
  const publish = () => {
    applyStyles(settings); changed(settings);
    try { localStorage.setItem('kp.notebook.styles.v1', JSON.stringify(settings)); } catch { hint.textContent = 'Styles applied for this session; browser storage is unavailable.'; }
    for (const input of inputs) input.placeholder = `Inherit: ${getComputedStyle(document.documentElement).getPropertyValue(input.name).trim()}`;
  };
  theme.onchange = () => { settings.theme = theme.value === 'light' ? 'light' : 'dark'; publish(); };
  for (const [label, key, property] of styleFields) {
    const row = document.createElement('label'); row.textContent = label;
    const input = document.createElement('input'); input.name = key; input.value = settings.values[key] ?? ''; input.setAttribute('aria-label', label); inputs.push(input);
    input.onchange = () => {
      const value = input.value.trim();
      if (value && (!CSS.supports(property, value) || /[;{}]|url\s*\(/i.test(value))) { input.setCustomValidity('Use a CSS value or palette variable.'); input.reportValidity(); return; }
      input.setCustomValidity(''); if (value) settings.values[key] = value; else delete settings.values[key]; publish();
    };
    row.append(input); panel.append(row);
  }
  const reset = document.createElement('button'); reset.textContent = 'Reset overrides'; reset.onclick = () => { settings.values = {}; inputs.forEach(input => { input.value = ''; input.setCustomValidity(''); }); publish(); };
  panel.append(reset); host.append(panel); publish();
  return { settings: () => settings, toggle() { panel.hidden = !panel.hidden; if (!panel.hidden) theme.focus(); }, dispose() { panel.remove(); } };
}
