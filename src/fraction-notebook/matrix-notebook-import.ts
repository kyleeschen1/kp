import { readNotebook } from './model.ts';
import { openFractionDraft } from './storage.ts';
import { CommandRegistry } from '../editor-commands/registry.ts';
import type { UUID } from '../notebook/model.ts';

/** Restore a portable snapshot only into an absent or identical record. A file
 * picker is never authority to overwrite a different saved notebook silently. */
export async function restoreMatrixNotebook(raw: unknown, defaultNotebook: UUID) {
  const notebook = readNotebook(raw);
  if (!notebook.matrixResources || notebook.cells.some(c => c.type === 'story' || c.type === 'mathObject')) throw new Error('Choose an exported matrix notebook.');
  const name = 'kp-matrix-notebook-v1' + (notebook.id === defaultNotebook ? '' : `:${notebook.id}`);
  const store = await openFractionDraft(notebook, name, null);
  try {
    const saved = await store.read();
    if (JSON.stringify(saved.draft) !== JSON.stringify(notebook)) throw new Error('This notebook already has different saved content. Its data was retained; open it to reconcile instead of overwriting.');
  } finally { store.close(); }
  return `/experiments/fraction-notebook/?notebook=matrix&document=${notebook.id}`;
}
export function mountMatrixImport(host: HTMLElement, registry: CommandRegistry, defaultNotebook: UUID, report: (text: string) => void) {
  let disposed = false;
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json'; input.hidden = true;
  input.setAttribute('aria-label', 'Import matrix notebook JSON'); host.append(input);
  input.onchange = () => { void (async () => {
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    if (file.size > 5_000_000) throw new Error('Choose a matrix notebook smaller than 5 MB.');
    const contents = await file.text(); if (disposed) return;
    const url = await restoreMatrixNotebook(JSON.parse(contents), defaultNotebook);
    if (!disposed) location.assign(url);
  })().catch(error => { if (!disposed) report(String(error)); }); };
  const command = registry.add({ id: 'notebook.import-matrix', title: 'Open exported matrix notebook JSON', category: 'Notebook', scope: 'notebook',
    keywords: ['import', 'restore', 'backup'], run: () => input.click() });
  return { dispose() { disposed = true; command.dispose(); input.remove(); } };
}
