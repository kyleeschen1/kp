import { checkMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createInspectionEdgeScroll } from "../../reader/runtime/inspection-edge-scroll.ts";
import { momentumMoveArrow, projectMomentumMove } from "./momentum-move.ts";

export function enhanceMomentumMove(root: HTMLElement) {
  const binding = <T extends Element>(selector: string) => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing momentum move binding: ${selector}`);
    return element;
  };
  const checked = checkMomentumEnergy(JSON.parse(binding('[data-move-source]').textContent ?? "null"));
  if (checked.status !== "checked") throw new Error(checked.code);
  const slider = binding<HTMLInputElement>('[data-move-seek]');
  const pointerSurface = binding<HTMLElement>('[data-move-pointer]');
  const details = binding<HTMLDetailsElement>('details'), summary = binding<HTMLElement>('summary');
  const arrow = binding<SVGPathElement>('[data-move-arrow]');
  const close = binding<HTMLButtonElement>('[data-move-close]');
  const argument = binding<HTMLElement>('.momentum-move-argument');
  const bindings = Array.from(root.querySelectorAll('[data-move-entity]'));
  const clock = createKpReaderTimelinePlaybackClock({ id: "momentum.move", durationMs: 1000 });
  const abort = new AbortController(), options = { signal: abort.signal };
  const paint = () => {
    const p = clock.getSnapshot().progress, state = projectMomentumMove(checked.model, p);
    arrow.setAttribute("d", momentumMoveArrow(state.frame.momentum.x, state.frame.momentum.y));
    for (const entity of state.entities) for (const element of bindings)
      if (element.getAttribute('data-move-entity') === entity.id) element.setAttribute('data-move-salience', entity.salience);
    root.dataset['movePart'] = state.part;
    root.dataset['moveProgress'] = String(p);
    slider.value = String(p); slider.setAttribute('aria-valuetext', state.attention.cue);
  };
  const off = clock.subscribe(paint);
  let drag: { pointer: number; offset: number } | undefined;
  const range = () => {
    const box = slider.getBoundingClientRect();
    return { top: box.top + 10, bottom: box.bottom - 10 };
  };
  const edgeScroll = createInspectionEdgeScroll({ signal: abort.signal,
    readableBounds: () => argument.getBoundingClientRect(),
    bounds: () => { const box = range(); return { top: box.top + (drag?.offset ?? 0), bottom: box.bottom + (drag?.offset ?? 0) }; },
    sample: clientY => {
      if (!drag) return;
      const box = range();
      clock.seek(Math.max(0, Math.min(1, (clientY - drag.offset - box.top) / Math.max(1, box.bottom - box.top))));
    }
  });
  const stopDrag = () => {
    edgeScroll.stop(); const pointer = drag?.pointer; drag = undefined;
    if (pointer !== undefined && pointerSurface.hasPointerCapture(pointer)) pointerSurface.releasePointerCapture(pointer);
  };
  root.querySelectorAll('[data-move-depth]').forEach(detail => detail.addEventListener('toggle', stopDrag, options));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopDrag(); }, options);
  pointerSurface.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault(); slider.focus({ preventScroll: true });
    const box = range(), center = box.top + clock.getSnapshot().progress * (box.bottom - box.top);
    drag = { pointer: event.pointerId, offset: Math.abs(event.clientY - center) <= 10 ? event.clientY - center : 0 };
    pointerSurface.setPointerCapture(event.pointerId); edgeScroll.update(event.clientY);
  }, options);
  pointerSurface.addEventListener('pointermove', event => { if (drag?.pointer === event.pointerId) { event.preventDefault(); edgeScroll.update(event.clientY); } }, options);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pointerSurface.addEventListener(type, stopDrag, options);
  window.addEventListener('blur', stopDrag, options);
  window.addEventListener('resize', stopDrag, options);
  details.addEventListener('toggle', () => { if (!details.open) stopDrag(); }, options);
  // Native range dragging can retain pre-scroll geometry. During captured
  // pointer input only our document-relative mapping may update the clock.
  slider.addEventListener('input', () => { if (drag) paint(); else clock.seek(Number(slider.value)); }, options);
  slider.addEventListener('keydown', event => {
    if (event.key === 'Escape') { stopDrag(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const p = clock.getSnapshot().progress;
    clock.seek(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : Math.max(0, Math.min(1, p + (event.key === 'ArrowDown' ? .025 : -.025))));
  }, options);
  let entryTop: number | undefined;
  summary.addEventListener('click', () => { if (!details.open) entryTop = summary.getBoundingClientRect().top; }, options);
  close.addEventListener('click', () => {
    stopDrag();
    details.open = false; summary.focus({ preventScroll: true });
    if (entryTop !== undefined) window.scrollBy(0, summary.getBoundingClientRect().top - entryTop);
  }, options);
  const restore = () => {
    stopDrag();
    if (location.hash === '#momentum-move') { details.open = true; clock.seek(0, 'url'); }
    else if (location.hash === '#momentum-move-conclusion') { details.open = true; clock.seek(1, 'url'); }
  };
  window.addEventListener('hashchange', restore, options);
  let printState: { open: boolean; progress: number } | undefined;
  window.addEventListener('beforeprint', () => {
    stopDrag();
    printState = { open: details.open, progress: clock.getSnapshot().progress };
    details.open = true; clock.seek(1);
  }, options);
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    details.open = printState.open; clock.seek(printState.progress); printState = undefined;
  }, options);
  window.addEventListener('pagehide', event => {
    stopDrag();
    if (event.persisted) return;
    stickySize.disconnect(); abort.abort(); off(); clock.dispose();
  }, options);
  const figure = binding<HTMLElement>('figure');
  const fitSticky = () => { figure.dataset['stickyFit'] = String(figure.getBoundingClientRect().height + 32 < window.innerHeight); };
  const stickySize = new ResizeObserver(fitSticky); stickySize.observe(figure);
  // Text zoom changes the track without a window resize. Retire the old grip
  // rather than letting reflow become an unintended semantic seek.
  let argumentHeight = argument.getBoundingClientRect().height;
  const argumentSize = new ResizeObserver(() => {
    const next = argument.getBoundingClientRect().height;
    if (Math.abs(next - argumentHeight) > .5) { argumentHeight = next; stopDrag(); }
  });
  argumentSize.observe(argument);
  abort.signal.addEventListener('abort', () => argumentSize.disconnect(), { once: true });
  window.addEventListener('resize', fitSticky, options);
  binding<HTMLElement>('[data-move-gutter]').hidden = false; close.hidden = false; binding<HTMLElement>('[data-move-instruction]').hidden = false;
  paint(); restore();
}
