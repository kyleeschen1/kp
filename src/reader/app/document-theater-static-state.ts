/** Select only a compiled static endpoint. URL validation and in-between
 * animation frames still belong to the reader's session/clock, not this preview.
 * Self-contained so the compiler can include it in the inline layout pass. */
export function prepareDocumentTheaterStaticState(document: Document) {
  const window = document.defaultView!;
  const params = new URL(window.location.href).searchParams;
  if (params.has('kpLesson') && params.get('kpLesson') !== document.body.dataset['kpReaderDocumentId']) return;
  if (params.has('kpVersion') && params.get('kpVersion') !== document.body.dataset['kpReaderDocumentVersion']) return;
  const states = [...document.querySelectorAll<HTMLElement>('.kp-animation-static > [data-kp-static-state]')];
  const value = params.get('kpProgress');
  let progress = value === null || value.trim() === '' ? undefined : Number(value);
  if (progress === undefined) {
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const beat = document.getElementById(id);
    if (beat?.dataset['kpBeat']) progress = Number(beat.dataset['kpCheckpoint']);
  }
  const selected = states.find(state => Number(state.dataset['kpProgress']) === progress);
  if (selected) for (const state of states) state.hidden = state !== selected;
  // Apply the browser's ordinary fragment navigation before exposing the
  // measured theater. Otherwise it can paint once at the document opening.
  let fragment: string;
  try { fragment = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(fragment);
  if (target?.dataset['kpBeat']) target.scrollIntoView();
}
