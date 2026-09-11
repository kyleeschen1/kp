import type { KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";
import type { KpComposedAlgebraPresentationV2 } from "../../authoring/composed-algebra-presentation-v2.ts";
import { mountCanonicalComposedAlgebraPresentation, mountCanonicalComposedAlgebraPresentationV2 } from "../common-factor/native.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { mountKpFocusDeckNativeInput } from "../../tutorial/focus-deck-native-input.ts";
import { bindKpFocusDeckKeyboard } from "../../tutorial/focus-deck-keyboard.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { encodeKpHtmlAttribute as escapeComposedAlgebraText } from "../../rendering/html-output-encoding.ts";
import { composedAlgebraSequence, composedAlgebraSequenceV2, composedAlgebraWindowV2, sampleComposedAlgebraSequence, type KpComposedAlgebraReaderSequence } from "./sequence.ts";
import type { KpComposedAlgebraSubexplanation } from "./subexplanations.ts";

export function mountComposedAlgebraCard(container: HTMLElement, draft: KpComposedAlgebraPresentation) {
  return mountResolvedCard(container, composedAlgebraSequence(draft), card => mountCanonicalComposedAlgebraPresentation(card, draft));
}
export function mountComposedAlgebraCardV2(container: HTMLElement, draft: KpComposedAlgebraPresentationV2, reference?: KpComposedAlgebraSubexplanation) {
  return mountResolvedCard(container, reference ? composedAlgebraWindowV2(draft, reference) : composedAlgebraSequenceV2(draft), card => mountCanonicalComposedAlgebraPresentationV2(card, draft));
}

// Both authenticated entrypoints use the same controls, scheduler and lifecycle.
// The native factory is private: hosts cannot replace a checked card's renderer.
async function mountResolvedCard(container: HTMLElement, sequence: KpComposedAlgebraReaderSequence,
  mountNative: (card: HTMLElement) => ReturnType<typeof mountCanonicalComposedAlgebraPresentation>) {
  const card = container.querySelector<HTMLElement>("[data-composed-card]")!;
  const surface = await mountNative(card), clock = surface.clock;
  clock.seek(sequence.checkpointProgress[0]!);
  const playback = createKpFocusDeckCheckpointPlayback(clock, sequence.checkpointProgress);
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  slider.max = String(sequence.checkpoints.last); slider.step = "any";
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)"), beats = sequence.beats;
  let disposed = false, visible = 0, practicing = false;
  const originalPassage = viewport.innerHTML;
  let input: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
  const cancel = () => { input?.cancel(); playback.cancel(); };
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
  const render = () => {
    if (disposed) return;
    surface.render(reduced.matches);
    if (practicing) return;
    const state = sampleComposedAlgebraSequence(sequence, clock.getSnapshot().progress, visible), position = state.position;
    visible = state.visible;
    card.dataset["composedStep"] = String(position);
    previous.disabled = position <= 0; next.disabled = position >= playback.last;
    slider.value = String(position); slider.setAttribute("aria-valuetext", state.accessiblePosition);
    card.dataset["kpFocusDeckActiveBeat"] = beats[visible]!.slug;
    const counter = card.querySelector<HTMLElement>("[data-composed-count]")!;
    counter.textContent = state.fraction; counter.setAttribute("aria-label", `Step ${visible + 1} of ${state.total}`);
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = slider.getAttribute("aria-valuetext")!;
    viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, index) => {
      item.dataset["kpFocusDeckBeatActive"] = String(index === visible);
      if (index === visible) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    if (!input?.ownsTravel()) viewport.scrollLeft = position * viewport.clientWidth;
  };
  const navigate = (step: number) => { cancel(); clock.pause(); surface.prepare(); playback.seek(step, !reduced.matches); };
  const unsubscribe = clock.subscribe(render);
  previous.onclick = () => navigate(Math.max(0, Math.ceil(playback.position()) - 1));
  next.onclick = () => navigate(Math.min(playback.last, Math.floor(playback.position()) + 1));
  replay.onclick = () => { cancel(); clock.seek(sequence.checkpointProgress[0]!); navigate(playback.last); };
  slider.oninput = () => { cancel(); clock.pause(); clock.seek(sequence.checkpoints.progressAt(Number(slider.value))); };
  const release = () => playback.seek(Math.round(playback.position()), !reduced.matches, true);
  slider.onchange = release; slider.onpointerup = release; slider.onpointercancel = release;
  const unbindKeyboard = bindKpFocusDeckKeyboard({ card, slider, enabled: () => !disposed && !practicing,
    position: playback.position, checkpointCount: () => playback.last + 1, navigate });
  input = mountKpFocusDeckNativeInput({ viewport, region: card, enabled: () => !disposed && !practicing,
    position: playback.position, begin: playback.begin, reduced: () => reduced.matches, interrupt: cancel });
  const resize = () => { if (!disposed) { cancel(); clock.pause(); surface.resize(); render(); } };
  const visibility = () => { if (document.hidden) { cancel(); clock.pause(); } };
  const dispose = () => { if (disposed) return; disposed = true; input?.dispose(); playback.dispose(); unsubscribe(); unbindKeyboard(); surface.dispose();
    previous.onclick = null; next.onclick = null; replay.onclick = null;
    slider.oninput = null; slider.onchange = null; slider.onpointerup = null; slider.onpointercancel = null;
    window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize); };
  window.addEventListener("resize", resize); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
  render(); card.dataset["kpFocusCardEnhancement"] = "ready";
  return { card, clock, dispose, cancel, reveal: navigate,
    practice(prompt?: string) {
      cancel(); clock.pause(); practicing = prompt !== undefined;
      card.querySelector<HTMLElement>(".kp-focus-deck__navigation")!.inert = practicing;
      card.querySelector<HTMLElement>("[data-composed-count]")!.hidden = practicing;
      if (prompt !== undefined) {
        const template = document.createElement("div");
        template.innerHTML = renderKpFocusDeckScaffold({ id: "composed-question", ariaLabel: "Practice", stageHtml: "", activeBeatSlug: "question",
          beats: [{ slug: "question", title: "Your turn", html: `<p>${escapeComposedAlgebraText(prompt)}</p>` }] });
        viewport.innerHTML = template.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!.innerHTML;
        viewport.scrollLeft = 0; clock.seek(sequence.checkpointProgress[0]!);
      } else { viewport.innerHTML = originalPassage; render(); }
    } };
}

