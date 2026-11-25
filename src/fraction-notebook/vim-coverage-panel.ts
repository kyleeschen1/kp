import type { CommandOrigin, CommandRegistry } from '../editor-commands/registry.ts';
import { available, unavailable } from '../editor-commands/registry.ts';
import './vim-coverage.css';

/** The shell opens synchronously. Closing during import invalidates the request,
 * so a late module cannot steal focus or resurrect a dismissed panel. */
export function mountVimCoverage(root: HTMLElement, registry: CommandRegistry,
  capture: () => { origin: CommandOrigin; restore(): void }) {
  const dialog = document.createElement('dialog'); dialog.className = 'kp-vim-coverage'; dialog.setAttribute('aria-label', 'Vim binding coverage');
  const heading = document.createElement('div'); heading.className = 'kp-vim-heading';
  const title = document.createElement('h2'); title.textContent = 'Vim binding coverage';
  const closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.textContent = 'Close'; closeButton.setAttribute('aria-label', 'Close Vim binding coverage');
  heading.append(title, closeButton);
  const state = document.createElement('p'); state.setAttribute('role', 'status');
  const retryButton = document.createElement('button'); retryButton.type = 'button'; retryButton.textContent = 'Reload workspace'; retryButton.hidden = true;
  const content = document.createElement('div'); content.className = 'kp-vim-content'; dialog.append(heading, state, retryButton, content); root.append(dialog);
  let epoch = 0, disposed = false, failed = false, saved: ReturnType<typeof capture> | undefined;
  let view: { dispose(): void; handleKey(event: KeyboardEvent): boolean; back(): boolean } | undefined, requested: CommandOrigin | undefined;
  let module: Promise<typeof import('./vim-coverage-content.ts')> | undefined;
  function place() {
    const box = root.querySelector('.kp-editor-body')?.getBoundingClientRect();
    if (box) {
      const top = box.top + Math.min(48, box.height * .08);
      dialog.style.top = `${top}px`; dialog.style.maxHeight = `${Math.max(0, box.bottom - top - 12)}px`;
    }
  }
  async function load() {
    const token = ++epoch; failed = false; retryButton.hidden = true; state.hidden = false; state.textContent = 'Loading Vim reference…';
    registry.notify();
    try {
      const loaded = await (module ??= import('./vim-coverage-content.ts'));
      if (disposed || token !== epoch || !dialog.open || !requested) return;
      const invalid = saved?.origin.valid?.(); if (invalid) { state.textContent = invalid; return; }
      view = loaded.renderVimCoverage(content, requested, registry); state.hidden = true;
    } catch (error) {
      module = undefined;
      if (disposed || token !== epoch || !dialog.open) return;
      failed = true; state.textContent = `Reference could not load. Reload the workspace to retry; the browser can cache a failed module import. ${error instanceof Error ? error.message : String(error)}`;
      retryButton.hidden = false; registry.notify();
    }
  }
  function close(restore = true) {
    epoch++; view?.dispose(); view = undefined; content.replaceChildren();
    if (dialog.open) dialog.close();
    const previous = saved; saved = undefined; requested = undefined;
    if (restore) previous?.restore(); registry.notify();
  }
  const open = registry.add({ id: 'workspace.vim-coverage', title: 'Vim binding coverage', category: 'Workspace', scope: 'workspace',
    keywords: ['vim', 'bindings', 'missing', 'implemented', 'keyboard', 'checklist'], description: 'Search the Vim reference and inspect support in each editor.',
    run: origin => {
      if (dialog.open || disposed || document.querySelector('dialog[open]')) return;
      saved = capture(); requested = origin; place(); dialog.showModal(); closeButton.focus(); void load();
    } });
  const closing = registry.add({ id: 'workspace.vim-coverage.close', title: 'Close Vim binding coverage', category: 'Workspace', scope: 'workspace',
    state: () => dialog.open ? available() : unavailable('Binding coverage is closed'), run: () => close() }); closing.bind(closeButton);
  const retry = registry.add({ id: 'workspace.vim-coverage.reload', title: 'Reload workspace after reference failure', category: 'Workspace', scope: 'workspace',
    state: () => dialog.open && failed ? available() : unavailable('Reference has not failed'), run: () => location.reload() }); retry.bind(retryButton);
  // The dialog owns one-level dismissal ahead of editor/native field handlers,
  // so Escape returns context instead of merely changing the query's Vim mode.
  dialog.addEventListener('keydown', event => {
    if (view?.handleKey(event)) { event.preventDefault(); event.stopPropagation(); return; }
    if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); close(); }
  }, true);
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!view?.back()) close(); });
  const observer = new ResizeObserver(() => { if (dialog.open) place(); }); observer.observe(root);
  return { dispose() { disposed = true; close(false); observer.disconnect(); open.dispose(); closing.dispose(); retry.dispose(); dialog.remove(); } };
}
