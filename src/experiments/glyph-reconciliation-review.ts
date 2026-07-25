import katex from "katex";

import "./glyph-reconciliation-review.css";
import {
  projectKpCanonicalExecutionLineage
} from "../animation/canonical-operation-lineage-adapter.ts";
import {
  createKpCrowdedQuadraticGlyphReconciliationCase,
  createKpFractionMergeGlyphReconciliationCase,
  createKpQuadraticPlusMinusGlyphReconciliationCase,
  createKpSolveXGlyphReconciliationCase
} from "../animation/semantic-glyph-reconciliation-cases.ts";
import {
  createKpFractionMergeClozeProjection
} from "../animation/semantic-glyph-reconciliation-cloze.ts";
import {
  compileKpGlyphReconciliationCase
} from "../animation/semantic-glyph-reconciliation-compiler.ts";
import {
  createKpGlyphReconciliationCompoundTrace
} from "../animation/semantic-glyph-reconciliation-compound-trace.ts";
import { createKpEquationFontReadiness } from "../rendering/equation-font-readiness.ts";
import {
  applyKpNativeKatexContextReflow,
  applyKpNativeKatexGlyphFrame,
  applyKpNativeKatexManyToOneFrame,
  applyKpNativeKatexOneToManyFrame,
  createKpNativeKatexFragmentClone,
  createKpNativeKatexFragmentClones,
  decideKpNativeKatexCompositorDisposition
} from "../rendering/native-katex-glyph-compositor.ts";
import {
  bindKpNativeKatexFragmentsWithinSemanticLineage,
  normalizeKpStageRelativeRect,
  observeKpNativeKatexFragments,
  settleAndObserveKpNativeKatexFragments,
  type KpStageRelativeRect
} from "../rendering/native-katex-fragment-observer.ts";
import {
  observeKpNativeKatexGlyphPaintAtoms
} from "../rendering/native-katex-rendered-scene.ts";

const rootNode = document.querySelector<HTMLElement>("#glyph-experiment");
if (rootNode === null) throw new Error("Glyph experiment root is missing.");
const root = rootNode;
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
if (import.meta.env.DEV) {
  Object.assign(window, {
    __kpObserveNativeKatexFragments: observeKpNativeKatexFragments,
    __kpSettleAndObserveNativeKatexFragments:
      settleAndObserveKpNativeKatexFragments,
    __kpObserveNativeKatexGlyphPaintAtoms:
      observeKpNativeKatexGlyphPaintAtoms
  });
}

const caseInput = createKpSolveXGlyphReconciliationCase();
const compiled = await compileKpGlyphReconciliationCase(caseInput);
const fractionCaseInput = createKpFractionMergeGlyphReconciliationCase();
const fractionCompiled = await compileKpGlyphReconciliationCase(
  fractionCaseInput
);
const branchCaseInput = createKpQuadraticPlusMinusGlyphReconciliationCase();
const branchCompiled = await compileKpGlyphReconciliationCase(branchCaseInput);
const crowdedViewportId = window.innerWidth <= 620 ? "phone" : "wide";
const crowdedCaseInput = createKpCrowdedQuadraticGlyphReconciliationCase(
  crowdedViewportId
);
const crowdedCompiled = await compileKpGlyphReconciliationCase(
  crowdedCaseInput
);
const fractionCloze = createKpFractionMergeClozeProjection();
const compoundTrace = createKpGlyphReconciliationCompoundTrace();
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
if (
  branchCompiled.schedule.usedOperationSpecificPolicy ||
  branchCompiled.schedule.motions.length !== 2 ||
  branchCompiled.schedule.motions.some(({ status }) => status !== "direct")
) {
  throw new Error("The plus-minus split requires two generic direct routes.");
}
const crowdedMerge = crowdedCompiled.matches.multiplicity[0];
const crowdedMergeMotions = crowdedCompiled.schedule.motions.filter(
  ({ matchId }) => matchId.startsWith(`${crowdedMerge?.id}.`)
);
if (
  crowdedMerge?.kind !== "merge" ||
  crowdedMergeMotions.length !== 3 ||
  crowdedMergeMotions.some(({ status }) =>
    status !== "clearance-route" && status !== "settle"
  ) ||
  crowdedCompiled.schedule.usedOperationSpecificPolicy
) {
  throw new Error("The crowded case requires the common bounded clearance result.");
}
const crowdedDisposition = decideKpNativeKatexCompositorDisposition({
  ambiguities: crowdedCompiled.matches.ambiguities,
  motions: crowdedMergeMotions
});

renderMathSlots("solve-x", math("x"));
renderMathSlots("solve-departing", math("{}+3-3"));
renderMathSlots("solve-context", math("{}=7-3"));
renderMathSlots(
  "fraction-source",
  trustedMath(
    String.raw`\frac{x}{\htmlData{kp-motion-id=motion.fraction.source-denominator-a}{2}}+\frac{y}{\htmlData{kp-motion-id=motion.fraction.source-denominator-b}{2}}`
  )
);
renderMathSlots(
  "fraction-target",
  trustedMath(
    String.raw`\frac{x+y}{\htmlData{kp-motion-id=motion.fraction.target-denominator}{2}}`
  )
);
renderMathSlots(
  "branch-source",
  trustedMath(
    String.raw`r=\htmlData{kp-motion-id=motion.branch.source-plus-minus}{\pm}\sqrt{\Delta}`
  )
);
renderMathSlots(
  "branch-minus",
  trustedMath(
    String.raw`r_-=\htmlData{kp-motion-id=motion.branch.target-minus}{-}\sqrt{\Delta}`
  )
);
renderMathSlots(
  "branch-plus",
  trustedMath(
    String.raw`r_+=\htmlData{kp-motion-id=motion.branch.target-plus}{+}\sqrt{\Delta}`
  )
);
renderMathSlots(
  "crowded-source",
  trustedMath(
    String.raw`r=-5\htmlData{kp-motion-id=motion.crowded.source-plus-minus}{\pm}\sqrt{\htmlData{kp-motion-id=motion.crowded.source-power}{25}\htmlData{kp-motion-id=motion.crowded.source-minus}{-}\htmlData{kp-motion-id=motion.crowded.source-product}{24}}`
  )
);
renderMathSlots(
  "crowded-target",
  trustedMath(
    String.raw`r=-5\htmlData{kp-motion-id=motion.crowded.target-plus-minus}{\pm}\sqrt{\htmlData{kp-motion-id=motion.crowded.target-result}{1}}`
  )
);
root.querySelector<HTMLElement>("[data-trace-metrics]")!.textContent =
  `${compoundTrace.operationIds.length} operations · ` +
  `${formatDuration(compoundTrace.compressedDurationMs)} compressed · ` +
  `${formatDuration(compoundTrace.fullDurationMs)} inspected`;
root.querySelector<HTMLElement>("[data-trace-track]")!.innerHTML =
  compoundTrace.operationIds.map((operationId, index) => `
    <span
      role="listitem"
      data-trace-operation="${index}"
      data-canonical-operation-id="${operationId}"
      title="${operationId}"
    >${index + 1}</span>
  `).join("");
root.querySelector<HTMLOListElement>("[data-trace-detail]")!.innerHTML =
  compoundTrace.accessibilityTranscript.map((entry, index) => `
    <li data-trace-detail-operation="${index}">
      ${entry.replace(compoundTrace.operationIds[index]!, readableOperation(
        compoundTrace.operationIds[index]!
      ))}
    </li>
  `).join("");


const review = root.querySelector<HTMLElement>("[data-kp-glyph-review]")!;
const stage = root.querySelector<HTMLElement>("[data-case-stage]")!;
const sourceX = root.querySelector<HTMLElement>("[data-case-source]")!;
const targetX = root.querySelector<HTMLElement>("[data-case-target]")!;
const departing = root.querySelector<HTMLElement>("[data-case-departing]")!;
const context = root.querySelector<HTMLElement>("[data-case-context]")!;
const sliders = [
  ...root.querySelectorAll<HTMLInputElement>("[data-progress]")
];
const playButtons = [
  ...root.querySelectorAll<HTMLButtonElement>("[data-play]")
];
const statuses = [
  ...root.querySelectorAll<HTMLOutputElement>("[data-status]")
];
if (
  sliders.length === 0 ||
  sliders.length !== playButtons.length ||
  sliders.length !== statuses.length
) {
  throw new Error("Every glyph review card requires one complete playback control.");
}
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
const branchStage = root.querySelector<HTMLElement>("[data-branch-stage]")!;
const branchSource = root.querySelector<HTMLElement>("[data-branch-source]")!;
const branchTargets = {
  minus: root.querySelector<HTMLElement>('[data-branch-target="minus"]')!,
  plus: root.querySelector<HTMLElement>('[data-branch-target="plus"]')!
};
const branchPhase = root.querySelector<HTMLElement>("[data-branch-phase]")!;
const branchOwner = root.querySelector<HTMLElement>("[data-branch-owner]")!;
const branchStatus = root.querySelector<HTMLOutputElement>(
  "[data-branch-status]"
)!;
const branchChoiceButtons = [
  ...root.querySelectorAll<HTMLButtonElement>("[data-branch-choice]")
];
const crowdedStage = root.querySelector<HTMLElement>("[data-crowded-stage]")!;
const crowdedSource = root.querySelector<HTMLElement>("[data-crowded-source]")!;
const crowdedTarget = root.querySelector<HTMLElement>("[data-crowded-target]")!;
const crowdedPhase = root.querySelector<HTMLElement>("[data-crowded-phase]")!;
const crowdedOwner = root.querySelector<HTMLElement>("[data-crowded-owner]")!;
const crowdedRoute = root.querySelector<HTMLElement>("[data-crowded-route]")!;
const tracePanel = root.querySelector<HTMLElement>("[data-compound-trace]")!;
const traceOperations = [
  ...root.querySelectorAll<HTMLElement>("[data-trace-operation]")
];
const tracePlay = root.querySelector<HTMLButtonElement>("[data-trace-play]")!;
const traceInspect = root.querySelector<HTMLButtonElement>(
  "[data-trace-inspect]"
)!;
const traceDetail = root.querySelector<HTMLOListElement>(
  "[data-trace-detail]"
)!;
const traceStatus = root.querySelector<HTMLOutputElement>(
  "[data-trace-status]"
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

const branchSourceObservation = await settleAndObserveKpNativeKatexFragments({
  stage: branchStage,
  bindings: [{
    id: branchCaseInput.sourceGlyphs[0]!.id,
    semanticEntityId: branchCaseInput.sourceGlyphs[0]!.entityId,
    motionId: "motion.branch.source-plus-minus",
    glyphKey: branchCaseInput.sourceGlyphs[0]!.glyphKey
  }],
  fontReadiness
});
const branchTargetObservation = await settleAndObserveKpNativeKatexFragments({
  stage: branchStage,
  bindings: [{
    id: branchCaseInput.targetGlyphs[0]!.id,
    semanticEntityId: branchCaseInput.targetGlyphs[0]!.entityId,
    motionId: "motion.branch.target-minus",
    glyphKey: branchCaseInput.targetGlyphs[0]!.glyphKey
  }, {
    id: branchCaseInput.targetGlyphs[1]!.id,
    semanticEntityId: branchCaseInput.targetGlyphs[1]!.entityId,
    motionId: "motion.branch.target-plus",
    glyphKey: branchCaseInput.targetGlyphs[1]!.glyphKey
  }],
  fontReadiness
});
const branchMultiplicity = bindKpNativeKatexFragmentsWithinSemanticLineage({
  lineage: projectKpCanonicalExecutionLineage(branchCaseInput.execution),
  source: branchSourceObservation,
  target: branchTargetObservation
}).multiplicity[0];
if (
  branchMultiplicity?.kind !== "split" ||
  branchMultiplicity.sources.length !== 1 ||
  branchMultiplicity.targets.length !== 2
) {
  throw new Error("Canonical plus-minus lineage did not bind its native split.");
}
const branchNativeSource = branchMultiplicity.sources[0]!;
const branchNativeTargets = branchMultiplicity.targets;
const branchClones = createKpNativeKatexFragmentClones({
  stage: branchStage,
  fragments: branchNativeTargets.map((observation, index) => ({
    ownerId: `native-owner.branch.target.${index}`,
    observation
  }))
});
for (const branchClone of branchClones) {
  branchClone.ownerElement.dataset["kpNativeKatexFragmentClone"] = "true";
}
branchNativeTargets.forEach((target, index) => {
  const branchId = index === 0 ? "minus" : "plus";
  target.sourceElement.dataset["kpBranchId"] = branchId;
  target.sourceElement.dataset["kpAnnotation"] =
    `${branchId === "minus" ? "Negative" : "Positive"} quadratic root branch`;
  target.sourceElement.title =
    `${branchId === "minus" ? "Negative" : "Positive"} root branch`;
  target.sourceElement.tabIndex = -1;
});

const crowdedSourceMotionIds = new Map([
  ["source.power", "motion.crowded.source-power"],
  ["source.minus", "motion.crowded.source-minus"],
  ["source.product", "motion.crowded.source-product"],
  ["source.plus-minus", "motion.crowded.source-plus-minus"]
]);
const crowdedTargetMotionIds = new Map([
  ["target.radical", "motion.crowded.target-result"],
  ["target.plus-minus", "motion.crowded.target-plus-minus"]
]);
const crowdedSourceObservation = await settleAndObserveKpNativeKatexFragments({
  stage: crowdedStage,
  bindings: crowdedCaseInput.sourceGlyphs.map((glyph) => ({
    id: glyph.id,
    semanticEntityId: glyph.entityId,
    motionId: crowdedSourceMotionIds.get(glyph.id)!,
    glyphKey: glyph.glyphKey
  })),
  fontReadiness
});
const crowdedTargetObservation = await settleAndObserveKpNativeKatexFragments({
  stage: crowdedStage,
  bindings: crowdedCaseInput.targetGlyphs.map((glyph) => ({
    id: glyph.id,
    semanticEntityId: glyph.entityId,
    motionId: crowdedTargetMotionIds.get(glyph.id)!,
    glyphKey: glyph.glyphKey
  })),
  fontReadiness
});
const crowdedBindings = bindKpNativeKatexFragmentsWithinSemanticLineage({
  lineage: projectKpCanonicalExecutionLineage(crowdedCaseInput.execution),
  source: crowdedSourceObservation,
  target: crowdedTargetObservation
});
const crowdedMultiplicity = crowdedBindings.multiplicity[0];
const crowdedPlusMinusBinding = crowdedBindings.bindings.find(
  ({ glyphKey }) => glyphKey === "±"
);
if (
  crowdedMultiplicity?.kind !== "merge" ||
  crowdedMultiplicity.sources.length !== 3 ||
  crowdedMultiplicity.targets.length !== 1 ||
  crowdedPlusMinusBinding === undefined
) {
  throw new Error("Crowded native fragments did not preserve merge and protected ± lineage.");
}
const crowdedNativeSources = crowdedMultiplicity.sources;
const crowdedNativeTarget = crowdedMultiplicity.targets[0]!;
const crowdedClones = createKpNativeKatexFragmentClones({
  stage: crowdedStage,
  fragments: crowdedNativeSources.map((observation, index) => ({
    ownerId: `native-owner.crowded.merge.${index}`,
    observation
  }))
});
for (const crowdedClone of crowdedClones) {
  crowdedClone.ownerElement.dataset["kpNativeKatexFragmentClone"] = "true";
}
const crowdedPlayback = crowdedCompiled.createPlayback({
  supportedMatchIds: new Set(
    crowdedCompiled.schedule.motions.map(({ matchId }) => matchId)
  ),
  apply() {}
});

const playback = compiled.createPlayback({
  supportedMatchIds: new Set([scheduledMotion.matchId]),
  apply() {}
});
let animationFrame: number | undefined;
let traceAnimationFrame: number | undefined;
let traceParentProgress = compoundTrace.drillDown.parentClock.progress;
let selectedBranch: "both" | "minus" | "plus" = "both";
let branchAtTarget = false;

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
  const branchProgress = clamp((bounded - 0.12) / 0.74);
  const branchFrame = applyKpNativeKatexOneToManyFrame({
    clones: branchClones,
    source: branchNativeSource,
    targets: branchNativeTargets,
    progress: branchProgress
  });
  branchAtTarget = branchFrame.visualOwner === "target-natives";
  branchSource.style.opacity = branchProgress === 0 ? "1" : "0";
  branchTargets.minus.style.opacity = branchProgress > 0 ? "1" : "0";
  branchTargets.plus.style.opacity = branchProgress > 0 ? "1" : "0";
  branchPhase.textContent = branchProgress === 0
    ? "One plus-minus origin"
    : branchAtTarget
      ? "Two exact native branches"
      : "Exact target fragments separate";
  branchOwner.textContent = branchFrame.visualOwner === "source-native"
    ? "Native plus-minus origin owns the ink"
    : branchAtTarget
      ? "Two native branch endpoints own the ink"
      : "Two inert target-fragment clones own the moving ink";
  review.dataset["kpBranchVisualOwner"] = branchFrame.visualOwner;
  applyBranchSelection();
  const crowdedProgress = clamp((bounded - 0.1) / 0.78);
  const crowdedSamples = new Map(
    crowdedPlayback.sample(crowdedProgress).map((frame) => [
      frame.matchId,
      frame
    ])
  );
  const crowdedRouteRects = crowdedNativeSources.map((source, index) => {
    const motion = crowdedMergeMotions[index]!;
    const sample = crowdedSamples.get(motion.matchId)!;
    return projectScheduledRect({
      motion,
      sample,
      source: source.rect,
      target: crowdedNativeTarget.rect,
      progress: crowdedProgress,
      sourceViewport: crowdedCaseInput.viewport,
      targetViewport: {
        width: crowdedStage.offsetWidth,
        height: crowdedStage.offsetHeight
      }
    });
  });
  const crowdedFrame = applyKpNativeKatexManyToOneFrame({
    clones: crowdedClones,
    sources: crowdedNativeSources,
    target: crowdedNativeTarget,
    progress: crowdedProgress,
    routeRects: crowdedRouteRects
  });
  const crowdedAtTarget = crowdedFrame.visualOwner === "target-native";
  crowdedSource.style.opacity = crowdedAtTarget ? "0" : "1";
  crowdedTarget.style.opacity = crowdedProgress > 0 ? "1" : "0";
  crowdedNativeTarget.sourceElement.setAttribute(
    "aria-hidden",
    String(!crowdedAtTarget)
  );
  crowdedPhase.textContent = crowdedProgress === 0
    ? "Measured source notation"
    : crowdedAtTarget
      ? "Exact native result"
      : "Bounded route protects ±";
  crowdedOwner.textContent = crowdedFrame.visualOwner === "source-natives"
    ? "Native source discriminant owns the ink"
    : crowdedAtTarget
      ? "Native target result owns the ink"
      : "Inert exact fragments route or hold for settlement";
  crowdedRoute.textContent = crowdedDisposition.mode === "checkpoint-settlement"
    ? `Inspectable checkpoint · ${crowdedDisposition.reason}`
    : `${crowdedViewportId} projection · common clearance lanes`;
  review.dataset["kpCrowdedVisualOwner"] = crowdedFrame.visualOwner;
  review.dataset["kpCrowdedRouteStatuses"] = crowdedMergeMotions
    .map(({ status: routeStatus }) => routeStatus)
    .join(",");
  review.dataset["kpCrowdedDisposition"] = crowdedDisposition.mode;
  review.dataset["kpCrowdedDispositionReason"] = crowdedDisposition.reason;
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
  sliders.forEach((slider) => {
    slider.value = String(Math.round(bounded * 1000));
  });
  statuses.forEach((status) => {
    status.value = `${Math.round(bounded * 100)}%`;
  });
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

sliders.forEach((slider) => {
  slider.addEventListener("input", () => {
    stopPlayback();
    render(Number(slider.value) / 1000);
  });
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
branchChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const choice = button.dataset["branchChoice"];
    if (choice === "both" || choice === "minus" || choice === "plus") {
      selectedBranch = choice;
      applyBranchSelection();
    }
  });
});
tracePlay.addEventListener("click", () => {
  stopPlayback();
  stopTracePlayback();
  if (reducedMotion) {
    traceOperations.forEach((operation) => {
      operation.dataset["traceState"] = "complete";
    });
    tracePanel.dataset["traceCompletedCycles"] = String(
      Number(tracePanel.dataset["traceCompletedCycles"] ?? "0") + 1
    );
    tracePlay.textContent = "Compressed work shown";
    traceStatus.value =
      `All ${traceOperations.length} operations shown without motion.`;
    return;
  }
  const startedAt = performance.now();
  tracePlay.textContent = "Playing…";
  tracePlay.disabled = true;
  const tick = (now: number): void => {
    const elapsedMs = Math.min(
      compoundTrace.compressedDurationMs,
      now - startedAt
    );
    const activeIndex = Math.min(
      compoundTrace.operationIds.length - 1,
      Math.floor(elapsedMs / 180)
    );
    traceOperations.forEach((operation, index) => {
      operation.dataset["traceState"] = index < activeIndex
        ? "complete"
        : index === activeIndex
          ? "active"
          : "pending";
    });
    traceStatus.value =
      `Compressed operation ${activeIndex + 1} of ${traceOperations.length}`;
    if (elapsedMs < compoundTrace.compressedDurationMs) {
      traceAnimationFrame = requestAnimationFrame(tick);
      return;
    }
    traceAnimationFrame = undefined;
    tracePlay.disabled = false;
    tracePlay.textContent = "Replay compressed work";
    traceOperations.forEach((operation) => {
      operation.dataset["traceState"] = "complete";
    });
    tracePanel.dataset["traceCompletedCycles"] = String(
      Number(tracePanel.dataset["traceCompletedCycles"] ?? "0") + 1
    );
    traceStatus.value =
      `All ${traceOperations.length} canonical operations depicted.`;
  };
  traceAnimationFrame = requestAnimationFrame(tick);
});
traceInspect.addEventListener("click", () => {
  const opening = traceInspect.getAttribute("aria-expanded") !== "true";
  stopPlayback();
  stopTracePlayback();
  if (opening) {
    traceParentProgress = currentProgress();
    const liveTrace = createKpGlyphReconciliationCompoundTrace({
      parentProgress: traceParentProgress
    });
    traceInspect.setAttribute("aria-expanded", "true");
    traceInspect.textContent = "Return to exact overview frame";
    traceDetail.hidden = false;
    sliders.forEach((slider) => {
      slider.disabled = true;
    });
    playButtons.forEach((button) => {
      button.disabled = true;
    });
    tracePlay.disabled = true;
    tracePanel.dataset["traceMode"] = "full-detail";
    tracePanel.dataset["traceParentProgress"] =
      String(liveTrace.drillDown.parentClock.progress);
    tracePanel.dataset["traceRestoreExact"] = "pending";
    traceStatus.value =
      `Parent paused at ${Math.round(traceParentProgress * 100)}%; ` +
      `${formatDuration(liveTrace.fullDurationMs)} full trace exposed.`;
    return;
  }
  traceInspect.setAttribute("aria-expanded", "false");
  traceInspect.textContent = "Inspect all operations";
  traceDetail.hidden = true;
  sliders.forEach((slider) => {
    slider.disabled = false;
  });
  playButtons.forEach((button) => {
    button.disabled = false;
  });
  tracePlay.disabled = false;
  render(traceParentProgress);
  tracePanel.dataset["traceMode"] = "compressed";
  tracePanel.dataset["traceRestoreExact"] =
    currentProgress() === traceParentProgress ? "true" : "false";
  traceStatus.value =
    `Exact ${Math.round(traceParentProgress * 100)}% overview frame restored.`;
});
playButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (animationFrame !== undefined) {
      stopPlayback();
      return;
    }
    const startProgress = currentProgress();
    const reverse = startProgress >= 1;
    const targetProgress = reverse ? 0 : 1;
    if (reducedMotion) {
      render(targetProgress);
      syncPlayButtonLabels();
      return;
    }
    const startedAt = performance.now();
    const durationMs = 1_800 * Math.abs(targetProgress - startProgress);
    playButtons.forEach((playButton) => {
      playButton.textContent = "Pause";
    });
    const tick = (now: number): void => {
      const elapsed = Math.min(1, (now - startedAt) / durationMs);
      render(lerp(startProgress, targetProgress, elapsed));
      if (elapsed < 1) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        animationFrame = undefined;
        syncPlayButtonLabels();
      }
    };
    animationFrame = requestAnimationFrame(tick);
  });
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

function projectScheduledRect(input: {
  readonly motion: {
    readonly status: "direct" | "clearance-route" | "settle";
    readonly waypoints: readonly { readonly x: number; readonly y: number }[];
  };
  readonly sample: { readonly x: number; readonly y: number };
  readonly source: KpStageRelativeRect;
  readonly target: KpStageRelativeRect;
  readonly progress: number;
  readonly sourceViewport: { readonly width: number; readonly height: number };
  readonly targetViewport: { readonly width: number; readonly height: number };
}): KpStageRelativeRect {
  if (input.motion.status === "settle") {
    return input.progress < 1 ? input.source : input.target;
  }
  const sourcePoint = input.motion.waypoints[0]!;
  const targetPoint = input.motion.waypoints.at(-1)!;
  const scaleX = input.targetViewport.width / input.sourceViewport.width;
  const scaleY = input.targetViewport.height / input.sourceViewport.height;
  const actualSourceCenter = {
    x: input.source.left + input.source.width / 2,
    y: input.source.top + input.source.height / 2
  };
  const actualTargetCenter = {
    x: input.target.left + input.target.width / 2,
    y: input.target.top + input.target.height / 2
  };
  const correctionX = lerp(
    actualSourceCenter.x - sourcePoint.x * scaleX,
    actualTargetCenter.x - targetPoint.x * scaleX,
    input.progress
  );
  const correctionY = lerp(
    actualSourceCenter.y - sourcePoint.y * scaleY,
    actualTargetCenter.y - targetPoint.y * scaleY,
    input.progress
  );
  const width = lerp(input.source.width, input.target.width, input.progress);
  const height = lerp(input.source.height, input.target.height, input.progress);
  return {
    left: input.sample.x * scaleX + correctionX - width / 2,
    top: input.sample.y * scaleY + correctionY - height / 2,
    width,
    height
  };
}

function stopPlayback(): void {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  syncPlayButtonLabels();
}

function currentProgress(): number {
  return Number(sliders[0]!.value) / 1000;
}

function syncPlayButtonLabels(): void {
  const label = currentProgress() >= 1 ? "Rewind" : "Play";
  playButtons.forEach((button) => {
    button.textContent = label;
  });
}

function stopTracePlayback(): void {
  if (traceAnimationFrame !== undefined) {
    cancelAnimationFrame(traceAnimationFrame);
  }
  traceAnimationFrame = undefined;
  tracePlay.disabled = false;
  tracePlay.textContent = "Play compressed work";
  traceOperations.forEach((operation) => {
    operation.dataset["traceState"] = "pending";
  });
}

function applyBranchSelection(): void {
  branchChoiceButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset["branchChoice"] === selectedBranch)
    );
  });
  (["minus", "plus"] as const).forEach((branch, index) => {
    const selected = selectedBranch === "both" || selectedBranch === branch;
    branchTargets[branch].classList.toggle(
      "glyph-exemplar__branch-equation--muted",
      !selected
    );
    branchTargets[branch].setAttribute(
      "aria-hidden",
      String(!branchAtTarget || !selected)
    );
    branchNativeTargets[index]!.sourceElement.tabIndex =
      branchAtTarget && selected ? 0 : -1;
  });
  branchStatus.value = selectedBranch === "both"
    ? "Both exact branches active"
    : `${selectedBranch === "minus" ? "Negative" : "Positive"} branch active`;
  review.dataset["kpSelectedBranch"] = selectedBranch;
}

function math(latex: string): string {
  return katex.renderToString(latex, { throwOnError: true });
}

function renderMathSlots(slot: string, html: string): void {
  const elements = root.querySelectorAll<HTMLElement>(
    `[data-math-slot="${slot}"]`
  );
  if (elements.length === 0) {
    throw new Error(`Glyph experiment math slot ${slot} is missing.`);
  }
  elements.forEach((element) => {
    element.innerHTML = html;
  });
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

function lerp(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function readableOperation(operationId: string): string {
  return operationId
    .split(".")
    .at(-1)!
    .split("-")
    .join(" ");
}

function formatDuration(durationMs: number): string {
  const seconds = durationMs / 1000;
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
