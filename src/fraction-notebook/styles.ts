import { hasStyleCycle, palette, propertyNames, referenceName, styleFields } from './style-catalog.ts';
export { styleFields } from './style-catalog.ts';
export interface StyleSettings { theme: 'dark' | 'light'; values: Record<string, string> }
const validValue = (property: string, value: string) => value.length < 160 && !/[;{}]|url\s*\(/i.test(value) && CSS.supports(property, value);
export function readStyleSettings(raw: unknown): StyleSettings {
  const settings: StyleSettings = { theme: 'dark', values: {} };
  if (!raw || typeof raw !== 'object' || !('values' in raw)) return settings;
  settings.theme = 'theme' in raw && raw.theme === 'light' ? 'light' : 'dark';
  if (!raw.values || typeof raw.values !== 'object') return settings;
  for (const { key, property } of styleFields) {
    const value: unknown = Reflect.get(raw.values, key);
    if (typeof value === 'string' && validValue(property, value)) settings.values[key] = value;
  }
  const oldGap: unknown = Reflect.get(raw.values, '--kp-document-paragraph-gap');
  if (!settings.values['--fn-block-gap'] && typeof oldGap === 'string' && validValue('gap', oldGap)) settings.values['--fn-block-gap'] = oldGap;
  if (hasStyleCycle(settings.values)) settings.values = {};
  return settings;
}
export function applyStyles(settings: StyleSettings) {
  document.documentElement.dataset['notebookTheme'] = settings.theme;
  document.documentElement.style.removeProperty('--kp-document-paragraph-gap');
  for (const { key } of styleFields) {
    const value = settings.values[key];
    if (value) document.documentElement.style.setProperty(key, value);
    else document.documentElement.style.removeProperty(key);
  }
}
function select(name: string, options: readonly (readonly [string, string])[]) {
  const element = document.createElement('select'); element.setAttribute('aria-label', name);
  for (const [value, label] of options) { const option = document.createElement('option'); option.value = value; option.textContent = label; element.append(option); }
  return element;
}
export function mountStyles(host: HTMLElement, changed: (settings: StyleSettings) => void) {
  let settings: StyleSettings = { theme: 'dark', values: {} };
  try { settings = readStyleSettings(JSON.parse(localStorage.getItem('kp.notebook.styles.v1') ?? 'null')); } catch { /* Invalid preferences do not block editing. */ }
  const panel = document.createElement('aside'); panel.className = 'fn-side-panel fn-styles'; panel.hidden = true; panel.setAttribute('aria-label', 'Styles');
  const title = document.createElement('h2'); title.textContent = 'Styles';
  const close = document.createElement('button'); close.textContent = 'Close styles'; close.onclick = () => { panel.hidden = true; };
  const hint = document.createElement('p'); hint.textContent = 'Compare by property or object. Inherit follows the theme or parent style. Advanced exposes exact CSS values. Changes apply to this workspace and its preview.';
  const theme = select('Theme', [['dark', 'Dark'], ['light', 'Light']]); theme.value = settings.theme;
  const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Search styles, e.g. heading weight'; search.setAttribute('aria-label', 'Search styles');
  const object = select('Style object', [['', 'All objects'], ...[...new Set(styleFields.map(field => field.object))].map(value => [value, value] as const)]);
  const property = select('Style property', [['', 'All properties'], ...Object.entries(propertyNames)]);
  const grouping = select('Group styles by', [['property', 'Group by property'], ['object', 'Group by object']]);
  const filters = document.createElement('div'); filters.className = 'fn-style-filters'; filters.append(search, object, property, grouping);
  const count = document.createElement('p'); count.setAttribute('role', 'status');
  const content = document.createElement('div'); content.className = 'fn-style-groups';
  panel.append(title, close, hint, theme, filters, count, content);
  const refreshers: (() => void)[] = [];
  const publish = () => {
    applyStyles(settings); changed(settings);
    try { localStorage.setItem('kp.notebook.styles.v1', JSON.stringify(settings)); } catch { hint.textContent = 'Styles applied for this session; browser storage is unavailable.'; }
    refreshers.forEach(refresh => refresh());
  };
  theme.onchange = () => { settings.theme = theme.value === 'light' ? 'light' : 'dark'; publish(); };
  const rows = styleFields.map(field => {
    const { label, key, property: cssProperty } = field;
    const row = document.createElement('div'); row.className = 'fn-style-row'; row.dataset['styleKey'] = key;
    const heading = document.createElement('div'); heading.className = 'fn-style-label';
    const name = document.createElement('span'); name.textContent = label;
    const objectName = document.createElement('small'); objectName.textContent = field.object; heading.append(name, objectName);
    const input = document.createElement('input'); input.name = key; input.setAttribute('aria-label', label);
    const effective = document.createElement('small'); effective.className = 'fn-style-effective';
    const commit = (value: string) => {
      const values = { ...settings.values }; if (value) values[key] = value; else delete values[key];
      if ((value && !validValue(cssProperty, value)) || hasStyleCycle(values)) { input.setCustomValidity('Use a valid CSS value without circular references.'); input.reportValidity(); return false; }
      input.setCustomValidity(''); settings.values = values; publish(); return true;
    };
    input.onchange = () => { commit(input.value.trim()); };
    row.append(heading);
    let choice: HTMLSelectElement | undefined;
    let swatch: HTMLSpanElement | undefined;
    if (cssProperty === 'color') {
      choice = select(`${label} color`, [['', 'Inherit'], ...palette.filter(([, variable]) => variable !== key).map(([name, variable]) => [`var(${variable})`, name] as const), ['custom', 'Custom color']]);
      swatch = document.createElement('span'); swatch.className = 'fn-color-swatch'; swatch.style.backgroundColor = `var(${key})`; swatch.setAttribute('role', 'img');
      const controls = document.createElement('div'); controls.className = 'fn-color-choice'; controls.append(swatch, choice);
      const advanced = document.createElement('details'); advanced.className = 'fn-style-advanced';
      const summary = document.createElement('summary'); summary.textContent = 'Advanced';
      const variable = document.createElement('code'); variable.textContent = key;
      advanced.append(summary, variable, input); row.append(controls, effective, advanced);
      choice.onchange = () => {
        if (choice!.value === 'custom') { advanced.open = true; input.focus(); return; }
        if (!commit(choice!.value)) { advanced.open = true; input.focus(); }
      };
    } else row.append(input, effective);
    refreshers.push(() => {
      const value = settings.values[key] ?? '';
      input.value = value;
      const resolved = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
      const reference = value.match(/^var\((--[\w-]+)\)$/)?.[1] ?? (!value ? field.reference : undefined);
      const description = reference ? referenceName(reference) : cssProperty === 'color' ? (value ? 'Custom color' : 'Theme palette') : resolved;
      input.placeholder = cssProperty === 'color' ? `Inherit: ${description}` : `Inherit: ${resolved}`;
      effective.textContent = `${value ? 'Override' : 'Inherit'} · ${description}`;
      if (choice) choice.value = !value ? '' : [...choice.options].some(option => option.value === value) ? value : 'custom';
      swatch?.setAttribute('aria-label', `${label}: ${description}`);
    });
    return { field, row };
  });
  const filter = () => {
    content.replaceChildren(); const groups = new Map<string, HTMLFieldSetElement>(); let matches = 0;
    const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    for (const { field, row } of rows) {
      const haystack = `${field.label} ${field.object} ${field.property} ${propertyNames[field.property]} ${field.key}`.toLowerCase();
      if ((object.value && field.object !== object.value) || (property.value && field.property !== property.value) || !terms.every(term => haystack.includes(term))) continue;
      const group = grouping.value === 'object' ? field.object : propertyNames[field.property]!;
      let section = groups.get(group);
      if (!section) { section = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = group; section.append(legend); groups.set(group, section); content.append(section); }
      section.append(row); matches++;
    }
    count.textContent = matches ? `${matches} styles` : 'No matching styles. Clear the search or filters.';
  };
  search.oninput = filter; object.onchange = property.onchange = grouping.onchange = filter;
  const reset = document.createElement('button'); reset.textContent = 'Reset overrides'; reset.onclick = () => { settings.values = {}; rows.forEach(({ row }) => row.querySelector('input')?.setCustomValidity('')); publish(); };
  panel.append(reset); host.append(panel); filter(); publish();
  return { settings: () => settings, toggle() { panel.hidden = !panel.hidden; if (!panel.hidden) search.focus(); }, dispose() { panel.remove(); } };
}
