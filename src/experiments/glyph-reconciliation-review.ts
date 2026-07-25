import katex from "katex";

import "./glyph-reconciliation-review.css";
import {
  projectKpCanonicalExecutionLineage
} from "../animation/canonical-operation-lineage-adapter.ts";
import {
  createKpFractionMergeGlyphReconciliationCase,
  createKpSolveXGlyphReconciliationCase
} from "../animation/semantic-glyph-reconciliation-cases.ts";
import {
  createKpFractionMergeClozeProjection
} from "../animation/semantic-glyph-reconciliation-cloze.ts";
import {
  compileKpGlyphReconciliationCase
} from "../animation/semantic-glyph-reconciliation-compiler.ts";
import { createKpEquationFontReadiness } from "../rendering/equation-font-readiness.ts";
import {
  applyKpNativeKatexContextReflow,
  applyKpNativeKatexGlyphFrame,
  applyKpNativeKatexManyToOneFrame,
  createKpNativeKatexFragmentClone,
  createKpNativeKatexFragmentClones
} from "../rendering/native-katex-glyph-compositor.ts";
import {
  bindKpNativeKatexFragmentsWithinSemanticLineage,
  normalizeKpStageRelativeRect,
  observeKpNativeKatexFragments,
  settleAndObserveKpNativeKatexFragments,
  type KpStageRelativeRect
} from "../rendering/native-katex-fragment-observer.ts";

const root = document.querySelector<HTMLElement>("#glyph-experiment");
if (root === null) throw new Error("Glyph experiment root is missing.");
if (import.meta.env.DEV) {
  Object.assign(window, {
    __kpObserveNativeKatexFragments: observeKpNativeKatexFragments,
    __kpSettleAndObserveNativeKatexFragments:
      settleAndObserveKpNativeKatexFragments
  });
}

const caseInput = createKpSolveXGlyphReconciliationCase();
const compiled = await compileKpGlyphReconciliationCase(caseInput);
const fractionCaseInput = createKpFractionMergeGlyphReconciliationCase();
const fractionCompiled = await compileKpGlyphReconciliationCase(
  fractionCaseInput
);
const fractionCloze = createKpFractionMergeClozeProjection();
const scheduledMotion = compiled.schedule.motions[0]!;
if (scheduledMotion?.status !== "direct") {
  throw new Error("The solve-x exemplar requires the generic direct clearance route.");
}
if (
  fractionCompiled.schedule.usedOperationSpecificPolicy ||
  fractionCompiled.schedule.motions.length !== 2 ||
  fractionCompiled.schedule.motions.some(({ status }) => status !== "direct")
) {
  throw new Error("The fraction merge requires two generic direct clearance routes.");
}

root.innerHTML = `
  <article class="glyph-exemplar" data-kp-glyph-review data-kp-progress="0">
    <header class="glyph-exemplar__header">
      <p class="glyph-exemplar__eyebrow">Real KaTeX compositor · promotion checkpoint</p>
      <h1>Does one <em>x</em> remain one object?</h1>
      <p>
        Watch native context clear and reflow before the focused symbol moves.
        The moving ink is an inert computed-style clone; exact KaTeX owns both endpoints.
      </p>
    </header>
    <section class="glyph-exemplar__review" data-reconciliation-case="solve-x">
      <div class="glyph-exemplar__prompt">
        <div>
          <span>one-to-one semantic lineage</span>
          <h2>Cancel the additive inverse</h2>
        </div>
        <p data-phase-label>Source notation</p>
      </div>
      <div class="glyph-exemplar__viewport">
        <div
          class="glyph-exemplar__stage"
          data-case-stage
          role="math"
          aria-label="x plus 3 minus 3 equals 7 minus 3"
        >
          <span class="glyph-exemplar__guide" data-source-guide aria-hidden="true">
            <span data-guide-source-x>${math("x")}</span>
            <span data-guide-departing>${math("{}+3-3")}</span>
            <span data-guide-source-context>${math("{}=7-3")}</span>
          </span>
          <span class="glyph-exemplar__guide" data-target-guide aria-hidden="true">
            <span data-guide-target-x>${math("x")}</span>
            <span data-guide-target-context>${math("{}=7-3")}</span>
          </span>
          <span
            class="glyph-exemplar__native glyph-exemplar__focus"
            data-case-source
            data-kp-motion-id="motion.solve-x.source-x"
            data-kp-annotation="The same semantic x before cancellation"
            title="Persistent x · source"
            tabindex="0"
          >${math("x")}</span>
          <span
            class="glyph-exemplar__native glyph-exemplar__departing"
            data-case-departing
          >${math("{}+3-3")}</span>
          <span
            class="glyph-exemplar__native glyph-exemplar__context"
            data-case-context
          >${math("{}=7-3")}</span>
          <span
            class="glyph-exemplar__native glyph-exemplar__focus"
            data-case-target
            data-kp-motion-id="motion.solve-x.target-x"
            data-kp-annotation="The same semantic x after cancellation"
            title="Persistent x · target"
            tabindex="-1"
          >${math("x")}</span>
          <span
            class="glyph-exemplar__material-layer"
            data-kp-editor-equation-material-layer
          ></span>
        </div>
      </div>
      <div class="glyph-exemplar__annotation" aria-live="polite">
        <span data-ownership-label>Native source owns x</span>
        <span>semantic DOM remains the accessibility + annotation authority</span>
      </div>
      <div class="glyph-exemplar__controls">
        <button type="button" data-play>Play</button>
        <input
          type="range"
          min="0"
          max="1000"
          value="0"
          aria-label="Solve-x animation progress"
          data-progress
        >
        <output data-status>0%</output>
      </div>
    </section>
    <section
      class="glyph-exemplar__review glyph-exemplar__review--secondary"
      data-reconciliation-case="fraction-merge"
    >
      <div class="glyph-exemplar__prompt">
        <div>
          <span>many-to-one semantic lineage</span>
          <h2>Merge equal native denominators</h2>
        </div>
        <p data-fraction-phase>Two source denominators</p>
      </div>
      <div class="glyph-exemplar__viewport glyph-exemplar__viewport--fraction">
        <div
          class="glyph-exemplar__stage"
          data-fraction-stage
          role="math"
          aria-label="x over 2 plus y over 2 merges into x plus y over 2"
        >
          <span class="glyph-exemplar__fraction-equation" data-fraction-source>
            ${trustedMath(
              String.raw`\frac{x}{\htmlData{kp-motion-id=motion.fraction.source-denominator-a}{2}}+\frac{y}{\htmlData{kp-motion-id=motion.fraction.source-denominator-b}{2}}`
            )}
          </span>
          <span
            class="glyph-exemplar__fraction-equation glyph-exemplar__fraction-equation--target"
            data-fraction-target
          >
            ${trustedMath(
              String.raw`\frac{x+y}{\htmlData{kp-motion-id=motion.fraction.target-denominator}{2}}`
            )}
          </span>
          <span
            class="glyph-exemplar__material-layer"
            data-kp-editor-equation-material-layer
          ></span>
        </div>
      </div>
      <div class="glyph-exemplar__annotation">
        <span data-fraction-owner>Two native source denominators own the ink</span>
        <span>Cloze, hover, and annotation stay on the settled denominator</span>
      </div>
      <div class="glyph-exemplar__controls glyph-exemplar__controls--compact">
        <button
          type="button"
          data-fraction-cloze
          aria-pressed="false"
        >Hide answer</button>
        <output data-fraction-cloze-status>Answer visible</output>
      </div>
    </section>
    <div class="glyph-exemplar__evidence">
      <span>actual KaTeX subtree</span>
      <span>canonical lineage</span>
      <span>one bounded scheduler</span>
      <span>atomic native handoff</span>
      <span>no equation crossfade</span>
      <span>static JS</span>
    </div>
  </article>`;

const review = root.querySelector<HTMLElement>("[data-kp-glyph-review]")!;
const stage = root.querySelector<HTMLElement>("[data-case-stage]")!;
const sourceX = root.querySelector<HTMLElement>("[data-case-source]")!;
const targetX = root.querySelector<HTMLElement>("[data-case-target]")!;
const departing = root.querySelector<HTMLElement>("[data-case-departing]")!;
const context = root.querySelector<HTMLElement>("[data-case-context]")!;
const slider = root.querySelector<HTMLInputElement>("[data-progress]")!;
const play = root.querySelector<HTMLButtonElement>("[data-play]")!;
const status = root.querySelector<HTMLOutputElement>("[data-status]")!;
const phaseLabel = root.querySelector<HTMLElement>("[data-phase-label]")!;
const ownershipLabel = root.querySelector<HTMLElement>(
  "[data-ownership-label]"
)!;
const fontReadiness = createKpEquationFontReadiness(document);
const fractionStage = root.querySelector<HTMLElement>("[data-fraction-stage]")!;
const fractionSource = root.querySelector<HTMLElement>("[data-fraction-source]")!;
const fractionTarget = root.querySelector<HTMLElement>("[data-fraction-target]")!;
const fractionPhase = root.querySelector<HTMLElement>("[data-fraction-phase]")!;
const fractionOwner = root.querySelector<HTMLElement>("[data-fraction-owner]")!;
const fractionClozeButton = root.querySelector<HTMLButtonElement>(
  "[data-fraction-cloze]"
)!;
const fractionClozeStatus = root.querySelector<HTMLOutputElement>(
  "[data-fraction-cloze-status]"
)!;

await fontReadiness.whenReady();
await nextFrame();
const sourceXRect = guideRect("[data-guide-source-x]");
const targetXRect = guideRect("[data-guide-target-x]");
const departingRect = guideRect("[data-guide-departing]");
const sourceContextRect = guideRect("[data-guide-source-context]");
const targetContextRect = guideRect("[data-guide-target-context]");
placeNative(sourceX, sourceXRect);
placeNative(targetX, targetXRect);
placeNative(departing, departingRect);
placeNative(context, sourceContextRect);

const sourceObservation = await settleAndObserveKpNativeKatexFragments({
  stage,
  bindings: [{
    id: caseInput.sourceGlyphs[0]!.id,
    semanticEntityId: caseInput.sourceGlyphs[0]!.entityId,
    motionId: "motion.solve-x.source-x",
    glyphKey: caseInput.sourceGlyphs[0]!.glyphKey
  }],
  fontReadiness
});
const targetObservation = await settleAndObserveKpNativeKatexFragments({
  stage,
  bindings: [{
    id: caseInput.targetGlyphs[0]!.id,
    semanticEntityId: caseInput.targetGlyphs[0]!.entityId,
    motionId: "motion.solve-x.target-x",
    glyphKey: caseInput.targetGlyphs[0]!.glyphKey
  }],
  fontReadiness
});
const binding = bindKpNativeKatexFragmentsWithinSemanticLineage({
  lineage: projectKpCanonicalExecutionLineage(caseInput.execution),
  source: sourceObservation,
  target: targetObservation
}).bindings[0]!;
if (binding === undefined) {
  throw new Error("Canonical solve-x lineage did not bind its native fragments.");
}
const clone = createKpNativeKatexFragmentClone({
  stage,
  ownerId: "native-owner.solve-x.x",
  observation: binding.source
});
clone.ownerElement.dataset["kpNativeKatexFragmentClone"] = "true";

const fractionSourceObservation = await settleAndObserveKpNativeKatexFragments({
  stage: fractionStage,
  bindings: fractionCaseInput.sourceGlyphs.map((glyph, index) => ({
    id: glyph.id,
    semanticEntityId: glyph.entityId,
    motionId: index === 0
      ? "motion.fraction.source-denominator-a"
      : "motion.fraction.source-denominator-b",
    glyphKey: glyph.glyphKey
  })),
  fontReadiness
});
const fractionTargetObservation = await settleAndObserveKpNativeKatexFragments({
  stage: fractionStage,
  bindings: [{
    id: fractionCaseInput.targetGlyphs[0]!.id,
    semanticEntityId: fractionCaseInput.targetGlyphs[0]!.entityId,
    motionId: "motion.fraction.target-denominator",
    glyphKey: fractionCaseInput.targetGlyphs[0]!.glyphKey
  }],
  fontReadiness
});
const fractionMultiplicity = bindKpNativeKatexFragmentsWithinSemanticLineage({
  lineage: projectKpCanonicalExecutionLineage(fractionCaseInput.execution),
  source: fractionSourceObservation,
  target: fractionTargetObservation
}).multiplicity[0];
if (
  fractionMultiplicity?.kind !== "merge" ||
  fractionMultiplicity.sources.length !== 2 ||
  fractionMultiplicity.targets.length !== 1
) {
  throw new Error("Canonical fraction lineage did not bind its native merge.");
}
const fractionClones = createKpNativeKatexFragmentClones({
  stage: fractionStage,
  fragments: fractionMultiplicity.sources.map((observation, index) => ({
    ownerId: `native-owner.fraction.denominator.${index}`,
    observation
  }))
});
for (const fractionClone of fractionClones) {
  fractionClone.ownerElement.dataset["kpNativeKatexFragmentClone"] = "true";
}
const fractionNativeTarget = fractionMultiplicity.targets[0]!.sourceElement;
const fractionNativeSources = fractionMultiplicity.sources;
const fractionNativeTargetObservation = fractionMultiplicity.targets[0]!;
fractionNativeTarget.dataset["kpSemanticSelectorId"] =
  fractionCloze.hiddenSelectorIds[0]!;
fractionNativeTarget.dataset["kpAnnotation"] =
  "The one native denominator produced by the canonical merge";
fractionNativeTarget.title = "Merged denominator · target";
fractionNativeTarget.tabIndex = -1;

const playback = compiled.createPlayback({
  supportedMatchIds: new Set([scheduledMotion.matchId]),
  apply() {}
});
let animationFrame: number | undefined;

function render(progress: number): void {
  const bounded = clamp(progress);
  const departureProgress = clamp(bounded / 0.24);
  const reflowProgress = clamp((bounded - 0.1) / 0.45);
  const requestedGlyphProgress = clamp((bounded - 0.3) / 0.62);
  const scheduledFrame = playback.sample(requestedGlyphProgress)[0]!;
  const glyphProgress = directScheduleProgress(
    scheduledMotion.waypoints,
    scheduledFrame.x,
    scheduledFrame.y
  );
  const contextFrame = applyKpNativeKatexContextReflow({
    persistentElement: context,
    persistentSourceRect: sourceContextRect,
    persistentTargetRect: targetContextRect,
    departingElements: [departing],
    reflowProgress,
    departureProgress
  });
  const glyphFrame = applyKpNativeKatexGlyphFrame({
    clone,
    source: binding.source,
    target: binding.target,
    progress: glyphProgress
  });
  const fractionProgress = clamp((bounded - 0.14) / 0.72);
  const fractionFrame = applyKpNativeKatexManyToOneFrame({
    clones: fractionClones,
    sources: fractionNativeSources,
    target: fractionNativeTargetObservation,
    progress: fractionProgress
  });
  const fractionAtTarget = fractionFrame.visualOwner === "target-native";
  fractionSource.style.opacity = fractionAtTarget ? "0" : "1";
  // Target context is revealed as a destination before its denominator owns
  // ink; only the semantically bound denominator participates in the handoff.
  fractionTarget.style.opacity = fractionProgress > 0 ? "1" : "0";
  fractionNativeTarget.tabIndex = fractionAtTarget ? 0 : -1;
  fractionNativeTarget.setAttribute("aria-hidden", String(!fractionAtTarget));
  fractionPhase.textContent = fractionProgress === 0
    ? "Two source denominators"
    : fractionAtTarget
      ? "One exact native denominator"
      : "Exact fragments converge";
  fractionOwner.textContent = fractionFrame.visualOwner === "source-natives"
    ? "Two native source denominators own the ink"
    : fractionAtTarget
      ? "One native target denominator owns the ink"
      : "Two inert native-fragment clones own the moving ink";
  review.dataset["kpFractionVisualOwner"] = fractionFrame.visualOwner;
  const atTarget = glyphFrame.visualOwner === "target-native";
  const atSource = glyphFrame.visualOwner === "source-native";
  sourceX.setAttribute("aria-hidden", String(!atSource));
  targetX.setAttribute("aria-hidden", String(!atTarget));
  sourceX.tabIndex = atSource ? 0 : -1;
  targetX.tabIndex = atTarget ? 0 : -1;
  departing.setAttribute(
    "aria-hidden",
    String(contextFrame.departingOpacity === 0)
  );
  stage.setAttribute(
    "aria-label",
    atTarget
      ? "x equals 7 minus 3"
      : "x plus 3 minus 3 equals 7 minus 3"
  );
  review.dataset["kpProgress"] = String(Math.round(bounded * 1000));
  review.dataset["kpVisualOwner"] = glyphFrame.visualOwner;
  review.dataset["kpHandoffDelta"] = glyphFrame.targetHandoffDeltaPx.toFixed(4);
  review.dataset["kpScheduleStatus"] = scheduledMotion.status;
  slider.value = String(Math.round(bounded * 1000));
  status.value = `${Math.round(bounded * 100)}%`;
  phaseLabel.textContent = bounded < 0.24
    ? "Clear local context"
    : bounded < 0.55
      ? "Reflow creates the destination"
      : bounded < 0.92
        ? "Move the persistent x"
        : "Exact native target";
  ownershipLabel.textContent = glyphFrame.visualOwner === "source-native"
    ? "Native source owns x"
    : glyphFrame.visualOwner === "target-native"
      ? "Native target owns x"
      : "Inert real-KaTeX clone owns visible ink";
}

slider.addEventListener("input", () => {
  stopPlayback();
  render(Number(slider.value) / 1000);
});
fractionClozeButton.addEventListener("click", () => {
  const hidden = fractionClozeButton.getAttribute("aria-pressed") !== "true";
  fractionClozeButton.setAttribute("aria-pressed", String(hidden));
  fractionClozeButton.textContent = hidden ? "Reveal answer" : "Hide answer";
  fractionNativeTarget.classList.toggle("glyph-exemplar__cloze-hidden", hidden);
  fractionNativeTarget.dataset["kpClozeHidden"] = String(hidden);
  fractionClozeStatus.value = hidden
    ? fractionCloze.prompt
    : "Answer visible";
});
play.addEventListener("click", () => {
  if (animationFrame !== undefined) {
    stopPlayback();
    return;
  }
  const reverse = Number(slider.value) >= 1000;
  const start = performance.now();
  const durationMs = 1_800;
  play.textContent = "Pause";
  const tick = (now: number): void => {
    const elapsed = Math.min(1, (now - start) / durationMs);
    render(reverse ? 1 - elapsed : elapsed);
    if (elapsed < 1) {
      animationFrame = requestAnimationFrame(tick);
    } else {
      animationFrame = undefined;
      play.textContent = reverse ? "Play" : "Rewind";
    }
  };
  animationFrame = requestAnimationFrame(tick);
});

const requestedProgress = Number(
  new URL(location.href).searchParams.get("progress") ?? "0"
) / 1000;
render(requestedProgress);
review.dataset["kpReady"] = "true";

if (import.meta.env.DEV) {
  const { mountKpDevReview } = await import("../dev-review/review-bootstrap.ts");
  mountKpDevReview({
    provider: {
      id: "experiment.real-katex-glyph-compositor",
      matches: () => true,
      capture: () => ({
        semantic: {
          documentId: "experiment.real-katex-glyph-compositor",
          documentVersion: "1",
          assetId: caseInput.id,
          progressPermille: Number(review.dataset["kpProgress"] ?? "0"),
          activeTransformationIds: [caseInput.execution.transformationId],
          focusRefs: [binding.source.semanticEntityId],
          playbackDirection: "forward"
        },
        render: {
          rendererId: "static-js-real-katex-glyph-compositor",
          motionAuthority: "canonical-lineage-plus-bounded-clearance",
          fontReady: fontReadiness.status === "ready",
          ownerIds: [clone.ownerElement.dataset["kpEquationMaterialOwnerId"]!]
        },
        temporalTrace: [{
          offsetMs: 0,
          progressPermille: Number(review.dataset["kpProgress"] ?? "0"),
          phase: phaseLabel.textContent ?? ""
        }]
      })
    },
    placement: (width) =>
      width >= 881 ? "left-prose-rail" : "captured-moment-sheet"
  });
}

function guideRect(selector: string): KpStageRelativeRect {
  const element = stage.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`Missing exemplar guide ${selector}.`);
  const stageRect = stage.getBoundingClientRect();
  return normalizeKpStageRelativeRect({
    stageClientRect: stageRect,
    stageLayoutWidth: stage.offsetWidth || stageRect.width,
    stageLayoutHeight: stage.offsetHeight || stageRect.height,
    fragmentClientRect: element.getBoundingClientRect()
  });
}

function placeNative(
  element: HTMLElement,
  rect: KpStageRelativeRect
): void {
  Object.assign(element.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });
}

function directScheduleProgress(
  waypoints: readonly { readonly x: number; readonly y: number }[],
  x: number,
  y: number
): number {
  const source = waypoints[0];
  const target = waypoints[waypoints.length - 1];
  if (source === undefined || target === undefined) return 1;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return 1;
  return clamp(((x - source.x) * dx + (y - source.y) * dy) / lengthSquared);
}

function stopPlayback(): void {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  play.textContent = Number(slider.value) >= 1000 ? "Rewind" : "Play";
}

function math(latex: string): string {
  return katex.renderToString(latex, { throwOnError: true });
}

function trustedMath(latex: string): string {
  return katex.renderToString(latex, {
    throwOnError: true,
    strict: false,
    trust: (context) => context.command === "\\htmlData"
  });
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
