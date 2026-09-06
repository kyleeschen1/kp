import "../authoring-distribution-focus-card/style.css";
import "../../editor/carrier-preserving-simplification-surface.css";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { restoreKpReaderAuthoringSimplificationPreview } from "../../reader/app/authoring-simplification-preview.ts";
import { createKpPreparedCarrierPreservingSimplificationSurfaceAdapter } from "../../editor/carrier-preserving-simplification-surface-adapter.ts";
import { createKpEditorAnimationDescriptor } from "../../editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from "../../editor/animation-player-state.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from "../../editor/animation-player-controller.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";

const root = document.querySelector<HTMLElement>("#distribution-card")!;
const beats = [
  { slug: "source", title: "Multiplying by one", html: "<p>Multiplying by one leaves the value unchanged. Follow the first two.</p>" },
  { slug: "target", title: "The same two remains", html: "<p>The multiplication sign and one withdraw. The original two remains the carrier of the result.</p>" }
];

async function mount() {
  const response = await fetch("/api/dev/authoring-structural/simplification", { cache: "no-store" });
  if (!response.ok) throw new Error("Prepared simplification is unavailable.");
  const data = restoreKpReaderAuthoringSimplificationPreview(await response.json());
  const { animation } = data;
  const adapter = createKpPreparedCarrierPreservingSimplificationSurfaceAdapter(animation);
  const descriptor = createKpEditorAnimationDescriptor({ animationId: animation.id,
    title: animation.title, summary: "Verified carrier-preserving simplification", renderTargetKinds: ["equation"] });
  root.innerHTML = '<h1>Multiplying by one</h1><p class="source-label">Authoring-backed Focus Card · carrier-preserving simplification</p>' + renderKpFocusDeckScaffold({
    id: "authoring-simplification", ariaLabel: "Two times one simplifies to two", activeBeatSlug: "source", beats,
    stageHtml: '<div class="kp-focus-deck__stage" data-carrier-slot></div>', replayHidden: false,
    rootAttributes: { "data-kp-authoring-simplification-card": "preparing" }
  });
  const card = root.querySelector<HTMLElement>("[data-kp-focus-deck]")!;
  card.dataset["kpAuthoringStructuralBefore"] = data.beforeVersionId;
  card.dataset["kpAuthoringStructuralAfter"] = data.afterVersionId;
  const slot = card.querySelector<HTMLElement>("[data-carrier-slot]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const renderFrame = (progress: number) => {
    card.dataset["kpEditorAnimationAccessibilityMode"] = reduced.matches ? "reduced-motion" : "full";
    adapter.render({ player: card, slot, state: createKpEditorAnimationPlayerState({ descriptor, animation, progress }) });
  };
  renderFrame(0);
  // Native measurement must finish before the shared clock starts advancing.
  await new Promise<void>((resolve, reject) => {
    const observer = new MutationObserver(check);
    function check() {
      const stage = slot.querySelector<HTMLElement>("[data-kp-carrier-preserving-simplification-stage]");
      const status = stage?.dataset["kpCarrierPreservingSimplificationStage"];
      if (status === "ready") { observer.disconnect(); resolve(); }
      if (status === "failed") { observer.disconnect(); reject(new Error(stage?.dataset["kpCarrierPreservingSimplificationError"])); }
    }
    observer.observe(slot, { attributes: true, subtree: true }); check();
  });
  if (!animation.timeline?.durationMs) throw new Error("Missing canonical duration.");
  const clock = createKpReaderTimelinePlaybackClock({ id: "reader.focus-card.authored-simplification", durationMs: animation.timeline.durationMs, ownerWindow: window });
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  let destination = 0;
  let disposed = false;
  const show = (index: number) => {
    destination = index;
    card.dataset["kpFocusDeckActiveBeat"] = beats[index]!.slug;
    viewport.scrollLeft = viewport.clientWidth * index;
    previous.disabled = index === 0; next.disabled = index === 1;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = beats[index]!.title;
    card.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((node, i) => {
      node.dataset["kpFocusDeckBeatActive"] = String(i === index);
      if (i === index) node.setAttribute("aria-current", "page"); else node.removeAttribute("aria-current");
    });
  };
  const unsubscribe = clock.subscribe(() => {
    if (disposed) return;
    const progress = clock.getSnapshot().progress;
    renderFrame(progress); slider.value = String(progress);
    card.dataset["kpSimplificationProgress"] = String(progress);
  });
  const select = (index: number, animate = true) => {
    if (disposed) return;
    clock.pause(); show(index);
    history.replaceState(null, "", `#beat.authoring-simplification.${beats[index]!.slug}`);
    if (!animate || reduced.matches) clock.seek(index);
    else clock.play({ direction: index === 1 ? "forward" : "rewind", stopAt: index });
  };
  previous.onclick = () => select(0); next.onclick = () => select(1);
  card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!.onclick = () => { clock.seek(0); select(1); };
  slider.oninput = () => { clock.seek(Number(slider.value)); show(Number(slider.value) >= .5 ? 1 : 0); };
  viewport.onscroll = () => {
    const index = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
    if ((index === 0 || index === 1) && index !== destination) select(index);
  };
  const restore = () => select(location.hash.endsWith(".target") ? 1 : 0, false);
  const resize = () => show(destination);
  const motionChange = () => select(destination, false);
  const visibility = () => { if (document.hidden) clock.pause(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true; unsubscribe(); clock.dispose();
    card.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_DISPOSE_EVENT));
    window.removeEventListener("hashchange", restore); window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", motionChange);
    window.removeEventListener("pagehide", pagehide);
  };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) clock.pause(); else dispose(); };
  window.addEventListener("hashchange", restore); window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", motionChange);
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  restore(); card.dataset["kpAuthoringSimplificationCard"] = "ready";
}
void mount().catch(error => {
  root.dataset["kpSimplificationRepairGap"] = "true";
  const message = document.createElement("p"); message.setAttribute("role", "alert");
  message.textContent = `Unable to render authored simplification: ${error instanceof Error ? error.message : String(error)}`;
  root.append(message);
});
