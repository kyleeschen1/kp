export const palette = [
  ['Paper', '--color-paper'], ['Ink', '--color-ink'], ['Muted ink', '--color-muted'],
  ['Border', '--color-border'], ['Stage', '--color-stage'], ['Selection wash', '--color-selection'],
  ['Warning', '--color-warning'], ['Red', '--color-red-light'], ['Green', '--color-green-light'],
  ['Blue', '--color-blue-light'], ['Yellow', '--color-yellow-light'], ['Emphasis', '--color-emphasis'],
  ['Cursor ink', '--color-cursor-ink'], ['Shadow', '--color-shadow']
] as const;
export interface StyleField { label: string; key: string; property: string; object: string; reference?: string }
type Definition = readonly [string, string, string, string?];
const fields = (object: string, definitions: readonly Definition[]): StyleField[] => definitions.map(([label, key, property, reference]) => ({ label, key, property, object, ...(reference ? { reference } : {}) }));
export const styleFields: readonly StyleField[] = [
  ...fields('Body', [['Body color', '--fn-text', 'color', '--color-ink'], ['Body weight', '--kp-document-body-weight', 'font-weight'], ['Body size', '--kp-document-body-size', 'font-size'], ['Line height', '--kp-document-body-leading', 'line-height']]),
  ...fields('Document', [['Background', '--fn-background', 'color', '--color-paper'], ['Muted text', '--fn-muted', 'color', '--color-muted'], ['Borders', '--fn-border', 'color', '--color-border'], ['Block gap', '--fn-block-gap', 'gap'], ['Title group gap', '--fn-title-gap', 'gap'], ['Document width', '--kp-document-width', 'width']]),
  ...fields('Masthead', [['Masthead weight', '--fn-masthead-weight', 'font-weight'], ['Masthead size', '--fn-masthead-size', 'font-size'], ['Header shadow', '--fn-shadow', 'color', '--color-shadow']]),
  ...fields('Windows', [['Window width', '--kp-window-width', 'width'], ['Window background', '--kp-window-background', 'color', '--fn-background'], ['Window opacity', '--kp-window-alpha', 'opacity'], ['Window shadow', '--kp-window-shadow', 'color', '--fn-shadow'], ['Focus transition', '--kp-window-focus-duration', 'transition-duration'], ['Focus lift', '--kp-window-focus-lift', 'height']]),
  ...fields('Document title', [['Document title weight', '--fn-title-weight', 'font-weight'], ['Title size', '--kp-document-title-size', 'font-size']]),
  ...fields('Section headings', [['Heading weight', '--kp-document-heading-weight', 'font-weight'], ['Heading size', '--kp-document-heading-size', 'font-size']]),
  ...fields('Animation', [['Animation surface', '--fn-surface', 'color', '--color-stage'], ['Animation emphasis', '--fn-focus', 'color', '--color-emphasis'], ['Object title weight', '--fn-object-weight', 'font-weight'], ['Object title size', '--fn-object-size', 'font-size', '--kp-document-heading-size']]),
  ...fields('Caption', [['Caption weight', '--fn-caption-weight', 'font-weight', '--kp-document-body-weight'], ['Caption size', '--fn-caption-size', 'font-size', '--kp-document-body-size']]),
  ...fields('Links and math', [['Links', '--fn-link', 'color', '--color-blue-light'], ['Inline math', '--fn-math', 'color', '--fn-text'], ['Annotations', '--fn-annotation', 'color', '--fn-muted']]),
  ...fields('Editor', [['Selection', '--fn-selection', 'color', '--color-selection'], ['Cursor', '--kp-editor-cursor', 'color', '--color-red-light'], ['Cursor text', '--kp-editor-cursor-ink', 'color', '--color-cursor-ink'], ['Gutter', '--fn-gutter', 'color', '--fn-muted'], ['Warnings', '--fn-warning', 'color', '--color-warning']]),
  ...fields('Code', [['Code strings', '--fn-code-string', 'color', '--color-yellow-light'], ['Code properties', '--fn-code-property', 'color', '--color-blue-light'], ['Code numbers', '--fn-code-number', 'color', '--color-green-light'], ['Code punctuation', '--fn-code-punctuation', 'color', '--fn-muted'], ['Code size', '--fn-code-size', 'font-size']]),
  ...fields('Palette', palette.map(([name, key]) => [`Palette ${name.toLowerCase()}`, key, 'color'] as const))
];
export const propertyNames: Record<string, string> = { 'font-weight': 'Font weight', 'font-size': 'Font size', 'line-height': 'Line height', gap: 'Spacing', width: 'Width', color: 'Color', opacity: 'Opacity', 'transition-duration': 'Duration', height: 'Distance' };
export function referenceName(key: string) { return palette.find(([, variable]) => variable === key)?.[0] ?? styleFields.find(field => field.key === key)?.label ?? key; }
// CSS accepts cyclic var() expressions but silently invalidates their consumers.
// Include default references when checking overrides before persistence.
export function hasStyleCycle(values: Record<string, string>): boolean {
  const active = new Set<string>(), done = new Set<string>();
  const visit = (key: string): boolean => {
    if (active.has(key)) return true;
    if (done.has(key)) return false;
    active.add(key);
    const field = styleFields.find(item => item.key === key);
    const value = values[key] ?? (field?.reference ? `var(${field.reference})` : '');
    for (const match of value.matchAll(/var\(\s*(--[\w-]+)/g)) if (visit(match[1]!)) return true;
    active.delete(key); done.add(key); return false;
  };
  return styleFields.some(field => visit(field.key));
}
