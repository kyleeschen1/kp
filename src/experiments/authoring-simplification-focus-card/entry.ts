import "../authored-focus-card.css";
import "../../editor/carrier-preserving-simplification-surface.css";
import { bindKpFocusDeckRangeController } from "../focus-deck-range-controller.ts";
import { renderKpAuthoredFocusCard, kpAuthoredSimplificationBeats as beats } from "../authored-focus-card-content.ts";
import { restoreKpReaderAuthoringSimplificationPreview } from "../../reader/app/authoring-simplification-preview.ts";
import { createKpPreparedCarrierPreservingSimplificationSurfaceAdapter } from "../../editor/carrier-preserving-simplification-surface-adapter.ts";
import { createKpEditorAnimationDescriptor } from "../../editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from "../../editor/animation-player-state.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from "../../editor/animation-player-controller.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;


async function mount() {
  const response = await fetch("/api/dev/authoring-structural/simplification", { cache: "no-store" });
  if (!response.ok) throw new Error("Prepared simplification is unavailable.");
  const data = restoreKpReaderAuthoringSimplificationPreview(await response.json());
  const { animation } = data;
  const adapter = createKpPreparedCarrierPreservingSimplificationSurfaceAdapter(animation, { identityInkShrinkReview: true });
  const descriptor = createKpEditorAnimationDescriptor({ animationId: animation.id,
    title: animation.title, summary: "Verified carrier-preserving simplification", renderTargetKinds: ["equation"] });
  root.innerHTML = '<h1>Multiplying by one</h1><p class="source-label">Authoring-backed Focus Card · carrier-preserving simplification</p>' + renderKpAuthoredFocusCard("simplification", '<div class="kp-focus-deck__stage" data-carrier-slot></div>');
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
  const controller = bindKpFocusDeckRangeController({
    card, beats, hashPrefix: "beat.authoring-simplification", end: 1, clock, reduced,
    render: () => {
      const progress = clock.getSnapshot().progress;
      renderFrame(progress);
      card.dataset["kpSimplificationProgress"] = String(progress);
    },
    disposeSurface: () => card.dispatchEvent(new CustomEvent(KP_EDITOR_ANIMATION_DISPOSE_EVENT))
  });
  import.meta.hot?.dispose(controller.dispose);
  card.dataset["kpAuthoringSimplificationCard"] = "ready";
  card.dataset["kpFocusCardEnhancement"] = "ready";
}
void mount().catch(error => {
  root.dataset["kpSimplificationRepairGap"] = "true";
  const message = document.createElement("p"); message.setAttribute("role", "alert");
  message.textContent = `Unable to render authored simplification: ${error instanceof Error ? error.message : String(error)}`;
  root.append(message);
});
