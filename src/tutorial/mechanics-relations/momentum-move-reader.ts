import { checkMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { momentumMoveArrow, projectMomentumMove } from "./momentum-move.ts";

export function enhanceMomentumMove(root: HTMLElement) {
  const require = <T extends Element>(selector: string) => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing momentum move binding: ${selector}`);
    return element;
  };
  const checked = checkMomentumEnergy(JSON.parse(require('[data-move-source]').textContent ?? "null"));
  if (checked.status !== "checked") throw new Error(checked.code);
  const slider = require<HTMLInputElement>('[data-move-seek]');
  const details = require<HTMLDetailsElement>('details'), summary = require<HTMLElement>('summary');
  const arrow = require<SVGPathElement>('[data-move-arrow]');
  const close = require<HTMLButtonElement>('[data-move-close]');
  const bindings = Array.from(root.querySelectorAll('[data-move-entity]'));
  const clock = createKpReaderTimelinePlaybackClock({ id: "momentum.move", durationMs: 1000 });
  const abort = new AbortController(), options = { signal: abort.signal };
  const paint = () => {
    const p = clock.getSnapshot().progress, state = projectMomentumMove(checked.model, p);
    arrow.setAttribute("d", momentumMoveArrow(state.frame.momentum.x, state.frame.momentum.y));
    for (const entity of state.entities) for (const element of bindings)
      if (element.getAttribute('data-move-entity') === entity.id) element.setAttribute('data-move-salience', entity.salience);
    root.dataset['movePart'] = state.part;
    slider.value = String(p); slider.setAttribute('aria-valuetext', state.attention.cue);
  };
  const off = clock.subscribe(paint);
  slider.addEventListener('input', () => clock.seek(Number(slider.value)), options);
  slider.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const p = clock.getSnapshot().progress;
    clock.seek(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : Math.max(0, Math.min(1, p + (event.key === 'ArrowDown' ? .025 : -.025))));
  }, options);
  let entryTop: number | undefined;
  summary.addEventListener('click', () => { if (!details.open) entryTop = summary.getBoundingClientRect().top; }, options);
  close.addEventListener('click', () => {
    details.open = false; summary.focus({ preventScroll: true });
    if (entryTop !== undefined) window.scrollBy(0, summary.getBoundingClientRect().top - entryTop);
  }, options);
  const restore = () => {
    if (location.hash === '#momentum-move') { details.open = true; clock.seek(0, 'url'); }
    else if (location.hash === '#momentum-move-conclusion') { details.open = true; clock.seek(1, 'url'); }
  };
  window.addEventListener('hashchange', restore, options);
  let printState: { open: boolean; progress: number } | undefined;
  window.addEventListener('beforeprint', () => {
    printState = { open: details.open, progress: clock.getSnapshot().progress };
    details.open = true; clock.seek(1);
  }, options);
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    details.open = printState.open; clock.seek(printState.progress); printState = undefined;
  }, options);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    abort.abort(); off(); clock.dispose();
  }, options);
  slider.hidden = false; close.hidden = false; require<HTMLElement>('[data-move-instruction]').hidden = false;
  paint(); restore();
}
