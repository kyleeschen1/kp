import type { MatrixNotebookRuntime } from './matrix-runtime.ts';

type Explanation = ReturnType<MatrixNotebookRuntime['explanation']>;
type Embed = typeof import('../experiments/matrix-column-combinations/embed.ts');
type Player = ReturnType<Embed['mountColumnExplanation']>;
const storagePrefix = 'kp-matrix-column-position-v1:';

/** Playback is occurrence-local UI state, never a document transaction. A
 * revision pin prevents a saved position being mistaken for another source. */
function position(key: string, sourceRevision: string): number {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (raw && typeof raw === 'object' && 'sourceRevision' in raw && raw.sourceRevision === sourceRevision
      && 'progress' in raw && typeof raw.progress === 'number' && Number.isFinite(raw.progress))
      return Math.max(0, Math.min(1, raw.progress));
  } catch { /* A denied or old UI preference cannot invalidate the document. */ }
  return 0;
}

export function createMatrixExplanation(host: HTMLElement, occurrence: string, surface: 'editor' | 'reader',
  read: () => Explanation, report: (message: string) => void) {
  // The editor and reading iframe are independent mounts. An idle reader must
  // not overwrite the editor's held position when it is resized or disposed.
  const key = `${storagePrefix}${surface}:${occurrence}`;
  let disposed = false, request = 0, revision: string | undefined, player: Player | undefined;
  let module: Embed | undefined;
  let visibilityOwner: Element | null = null, observer: MutationObserver | undefined;
  const hidden = () => visibilityOwner?.getAttribute('aria-hidden') === 'true';
  const save = (progress: number) => {
    if (!revision) return;
    try { localStorage.setItem(key, JSON.stringify({ sourceRevision: revision, progress })); } catch { /* Optional UI persistence. */ }
  };
  const stop = () => { if (player) { save(player.progress()); player.dispose(); player = undefined; } };
  const failure = (error: unknown) => {
    player?.pause();
    report(`${player ? 'Showing the previous explanation. ' : ''}${error instanceof Error ? error.message : String(error)}`);
  };
  const update = async () => {
    const attempt = ++request;
    if (disposed) return;
    if (hidden()) { stop(); host.replaceChildren(); return; }
    let explanation: Explanation;
    try { explanation = read(); }
    catch (error) { failure(error); return; }
    if (revision === explanation.sourceRevision && player) { report(''); return; }
    try {
      module ??= await import('../experiments/matrix-column-combinations/embed.ts');
      await module.prepareColumnExplanationFonts();
      // Import/font completion can arrive after removal, folding or another edit.
      if (disposed || attempt !== request || !host.isConnected || hidden()) return;
      const progress = player?.progress() ?? position(key, explanation.sourceRevision);
      const candidate = document.createElement('div');
      // Prepare attached geometry without replacing the last valid player. Keep
      // the old revision usable if admission or mounting the candidate fails.
      candidate.style.visibility = 'hidden'; host.append(candidate);
      let next: Player;
      try { next = module.mountColumnExplanation(candidate, explanation.product, progress, value => {
        if (revision === explanation.sourceRevision) save(value);
      }); }
      catch (error) { candidate.remove(); throw error; }
      stop(); host.replaceChildren(candidate); candidate.style.visibility = '';
      revision = explanation.sourceRevision; player = next;
      host.dataset['sourceRevision'] = revision;
      host.dataset['sourceResult'] = explanation.sourceResult.id;
      save(progress); report('');
    } catch (error) {
      if (disposed || attempt !== request) return;
      failure(error);
    }
  };
  // NodeViews are constructed detached; observe the host's visibility contract
  // once ProseMirror has inserted the node. Hiding the editor releases playback.
  queueMicrotask(() => {
    if (disposed) return;
    visibilityOwner = host.closest('[aria-hidden]');
    if (visibilityOwner) { observer = new MutationObserver(() => { void update(); }); observer.observe(visibilityOwner, { attributes: true, attributeFilter: ['aria-hidden'] }); }
    void update();
  });
  const leaving = () => { player?.pause(); if (player) save(player.progress()); };
  window.addEventListener('pagehide', leaving);
  return { update, dispose() { if (disposed) return; disposed = true; request++; observer?.disconnect(); window.removeEventListener('pagehide', leaving); stop(); host.replaceChildren(); } };
}
