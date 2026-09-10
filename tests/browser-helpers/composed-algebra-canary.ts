import { checkKpComposedAlgebraProof } from "../../src/authoring/composed-algebra-proof.ts";
import { resolveKpComposedAlgebraPresentation } from "../../src/authoring/composed-algebra-presentation.ts";
import { mountCanonicalComposedAlgebraOperation, mountCanonicalComposedAlgebraPresentation } from "../../src/experiments/common-factor/native.ts";
import { renderKpFocusDeckScaffold } from "../../src/tutorial/focus-deck-scaffold.ts";
import { observeKpNativeKatexRenderedScene } from "../../src/rendering/native-katex-rendered-scene.ts";
import { createKpEquationFontReadiness } from "../../src/rendering/equation-font-readiness.ts";
import { bindKpNativeKatexFactoringScene } from "../../src/rendering/native-katex-factoring-choreography.ts";
import { inspectKpEquationProtectedTransitTracks } from "../../src/rendering/equation-motion-path-planner.ts";
import type { KpNativeKatexSceneTrack } from "../../src/rendering/native-katex-base-scene-plan.ts";
import { createKpNativeKatexSceneAssembly } from "../../src/rendering/native-katex-scene-assembly.ts";

/** Static imports keep verifier and consumer in one Vite module revision.
 * Importing each authority URL independently can fork its private mint on HMR. */
export async function mountComposedAlgebraCanary(value: unknown, step: 0 | 1 | "chain") {
  const binding = resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(value));
  const wrapper = document.createElement("section");
  wrapper.innerHTML = renderKpFocusDeckScaffold({ id: "composed-canary", ariaLabel: "Composed algebra", activeBeatSlug: "start",
    beats: [{ slug: "start", title: "Before", html: "<p>Follow one verified deduction.</p>" }, { slug: "end", title: "After", html: "<p>The whole factor persists.</p>" }],
    stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage></div>', rootAttributes: { "data-kp-reasoning-card": true } });
  document.querySelector("#authored-focus-card")!.append(wrapper);
  const card = wrapper.firstElementChild as HTMLElement; card.id = "composed-canary";
  const surface = await (step === "chain" ? mountCanonicalComposedAlgebraPresentation(card, binding) : mountCanonicalComposedAlgebraOperation(card, binding, step));
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  slider.max = String(surface.checkpoints.last); slider.step = "any";
  slider.addEventListener("input", () => { surface.clock.seek(surface.checkpoints.progressAt(Number(slider.value))); surface.render(false);
    card.dataset["composedStep"] = String(surface.checkpoints.positionAt(surface.clock.getSnapshot().progress)); });
  surface.render(false);
  window.addEventListener("pagehide", () => surface.dispose(), { once: true });
  const evaluation = binding.steps[1].plan.successorSyntheses[0]!;
  return { ...binding.steps[0].plan.factoringMotifBinding,
    evaluation: { source: evaluation.sourceAnnotations, target: evaluation.targetAnnotations } };
}

/** A real native factor must be an obstacle even when absent from ordinary tracks. */
export async function probeOmittedFactoringOccupancy(value: unknown) {
  const presentation = resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(value));
  const intent = presentation.steps[0].plan.factoringMotifBinding;
  const stage = document.querySelector<HTMLElement>("#composed-canary [data-kp-reader-fit-surface]")!;
  const fontReadiness = createKpEquationFontReadiness(document); await fontReadiness.whenReady();
  try {
    const observe = (endpoint: "source" | "target") => observeKpNativeKatexRenderedScene({
      endpoint, stage, root: stage.querySelector<HTMLElement>(`[data-kp-reader-native="${endpoint}"]`)!,
      semanticEntityId: endpoint, presentationGroupId: endpoint, fontReadiness, includeHiddenPaint: true
    });
    const source = observe("source"), target = observe("target");
    const binding = bindKpNativeKatexFactoringScene({ source, target,
      intent, choreography: intent.operationPresentationPlan.choreography });
    const material = (p: number) => binding.contribution.sample(p).owners;
    const paint = material(.35).find(owner => owner.opacity === 1)!.expectedPaintRect;
    const track: KpNativeKatexSceneTrack = { id: "regression.context", componentId: "regression.context",
      lifecycle: "persist", visualAtomId: "regression.context",
      paintKind: "glyph", sizingMode: "rect", startRect: paint, endRect: paint, startOpacity: 1, endOpacity: 1 };
    const sampleFrames = (_: readonly KpNativeKatexSceneTrack[], progress: number) => [{
      trackId: track.id, componentId: track.componentId,
      rect: material(progress).find(owner => owner.opacity === 1)!.expectedPaintRect, opacity: 1
    }];
    const isolated = inspectKpEquationProtectedTransitTracks({ tracks: [track], sampleFrames });
    const before = material(.35).map(owner => owner.expectedPaintRect);
    const junction = binding.semanticClock!.fusionPlan.transferEvent.progress;
    const handoff = [junction - 1e-7, junction + 1e-7].map(progress => material(progress)
      .filter(owner => owner.opacity === 1).map(owner => ({ rect: owner.expectedPaintRect, focus: owner.focus?.variables })));
    let uninspectedPublicationRejected = false;
    try { Reflect.apply(binding.recordEvidence, binding, []); } catch { uninspectedPublicationRejected = true; }
    const assembly = createKpNativeKatexSceneAssembly({ source, target,
      tracks: [{ ...track, startPaintRect: paint, endPaintRect: paint }], contributions: [binding.contribution] });
    const combined = assembly.audit;
    binding.recordEvidence(assembly);
    return { isolatedIntersections: isolated.intersections.length, combinedIntersections: combined.intersections.length,
      uninspectedPublicationRejected, handoff, before, after: material(.35).map(owner => owner.expectedPaintRect) };
  } finally { fontReadiness.dispose(); }
}
