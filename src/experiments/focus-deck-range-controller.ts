import type { KpReaderTimelinePlaybackClock } from "../reader/runtime/timeline-playback-clock.ts";
import { navigateKpFocusDeckPlayback } from "../tutorial/focus-deck-playback.ts";

/** Shared enhancement for the two-endpoint authored cards. The caller retains
 * semantic endpoints, native preparation and paint; this owns only navigation
 * and lifecycle, driving the existing clock without rescaling its duration. */
export function bindKpFocusDeckRangeController(input: {
  readonly card: HTMLElement;
  readonly beats: readonly [{ readonly slug: string; readonly title: string }, { readonly slug: string; readonly title: string }];
  readonly hashPrefix: string;
  readonly end: number;
  readonly clock: KpReaderTimelinePlaybackClock;
  readonly reduced: MediaQueryList;
  readonly render: () => void;
  readonly prepareNavigation?: () => void;
  readonly prepareResize?: () => void;
  readonly disposeSurface: () => void;
}) {
  const { card, clock, reduced, beats, end } = input;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  let destination = 0;
  let passageIndex = -1;
  let disposed = false;
  const show = (index: number) => {
    destination = index;
    if (passageIndex === index) return;
    passageIndex = index;
    card.dataset["kpFocusDeckActiveBeat"] = beats[index]!.slug;
    viewport.scrollLeft = viewport.clientWidth * index;
    previous.disabled = index === 0; next.disabled = index === 1;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = beats[index]!.title;
    card.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((node, i) => {
      node.dataset["kpFocusDeckBeatActive"] = String(i === index);
      if (i === index) node.setAttribute("aria-current", "page"); else node.removeAttribute("aria-current");
    });
  };
  const render = () => {
    if (disposed) return;
    input.render();
    const progress = clock.getSnapshot().progress / end;
    slider.value = String(progress);
    slider.setAttribute("aria-valuetext", `${Math.round(progress * 100)}% — ${beats[destination]!.title}`);
  };
  const unsubscribe = clock.subscribe(render);
  const select = (index: number, animate = true) => {
    if (disposed) return;
    clock.pause();
    input.prepareNavigation?.();
    show(index);
    history.replaceState(null, "", `#${input.hashPrefix}.${beats[index]!.slug}`);
    navigateKpFocusDeckPlayback(clock, animate
      ? { kind: "play-transition", target: index * end, motion: reduced.matches ? "reduced" : "full" }
      : { kind: "restore-position", target: index * end });
  };
  previous.onclick = () => select(0);
  next.onclick = () => select(1);
  replay.onclick = () => { clock.seek(0); select(1); };
  slider.oninput = () => {
    const progress = Number(slider.value);
    show(progress >= .5 ? 1 : 0);
    clock.seek(progress * end);
  };
  // Programmatic passage alignment must not steal the playhead back from the
  // clock. Only a change in destination constitutes a swipe navigation.
  viewport.onscroll = () => {
    const index = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
    if ((index === 0 || index === 1) && index !== destination) select(index);
  };
  const restore = () => select(location.hash === `#${input.hashPrefix}.${beats[1].slug}` ? 1 : 0, false);
  const resize = () => {
    if (disposed) return;
    clock.pause(); input.prepareResize?.(); passageIndex = -1; show(destination); render();
  };
  const motionChange = () => { if (disposed) return; if (reduced.matches) clock.seek(destination * end); else render(); };
  const visibility = () => { if (!disposed && document.hidden) { clock.pause(); render(); } };
  const pagehide = (event: PageTransitionEvent) => { if (disposed) return; if (event.persisted) { clock.pause(); render(); } else dispose(); };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) resize(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true; unsubscribe(); clock.dispose(); input.disposeSurface();
    previous.onclick = null; next.onclick = null; replay.onclick = null;
    slider.oninput = null; viewport.onscroll = null;
    window.removeEventListener("hashchange", restore); window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", motionChange);
    window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow);
  };
  window.addEventListener("hashchange", restore); window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", motionChange);
  window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow);
  restore();
  return { dispose };
}
