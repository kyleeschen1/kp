import { kpCanonicalEquationRendererConvergence } from
  "./canonical-equation-renderer-convergence.ts";

export type KpNativeKatexOwnershipLayer =
  | "semantic-input"
  | "scene-plan-compilation"
  | "measurement"
  | "sampling"
  | "paint-ownership"
  | "settlement";

export type KpNativeKatexRuntimeEffect =
  | "none"
  | "read-native-dom"
  | "write-transit-paint"
  | "write-native-visibility";

export interface KpNativeKatexOwnershipEvidence {
  readonly path: `src/${string}.ts`;
  readonly needle: string;
}

export interface KpNativeKatexResponsibilityOwnership {
  readonly id: `ownership.native-katex.${string}`;
  readonly title: string;
  readonly currentLayers: readonly KpNativeKatexOwnershipLayer[];
  readonly targetLayer: KpNativeKatexOwnershipLayer;
  readonly targetEffect: KpNativeKatexRuntimeEffect;
  readonly evidence: readonly KpNativeKatexOwnershipEvidence[];
  readonly forbiddenAuthority: readonly string[];
}

export interface KpNativeKatexOwnershipViolation {
  readonly code:
    | "duplicate-responsibility"
    | "missing-source-owner"
    | "invalid-target-effect"
    | "missing-forbidden-authority"
    | "mixed-target-owner";
  readonly responsibilityId?: string | undefined;
  readonly message: string;
}

const noDomAuthority = Object.freeze([
  "DOM nodes or CSSStyleDeclaration in durable or semantic state",
  "private clock or scheduler ownership",
  "paint mutation or native visibility mutation"
]);

const noSemanticInference = Object.freeze([
  "operation or motif selection",
  "semantic identity inferred from glyph or LaTeX equality",
  "route, collision, or successor synthesis"
]);

/**
 * This ledger describes where each responsibility is going, not where every
 * function happens to live today. Mixed current layers make the extraction
 * debt explicit without granting the final renderer permanent semantic power.
 */
export const kpNativeKatexCompositorOwnership = Object.freeze([
  responsibility({
    id: "ownership.native-katex.semantic-correspondence-input",
    title: "Verified correspondence and presentation input",
    currentLayers: ["semantic-input", "scene-plan-compilation"],
    targetLayer: "semantic-input",
    targetEffect: "none",
    evidence: [
      evidence("src/animation/canonical-operation-lineage-adapter.ts", "projectKpCanonicalExecutionLineage"),
      evidence("src/animation/equation-shared-presentation-policy.ts", "KpCallerProvenEquationPresentationPolicy"),
      evidence("src/animation/structural-succession-presentation.ts", "compileKpEquationStructuralSuccessionIntent"),
      evidence("src/animation/symbol-motion-contract.ts", "KpSymbolMotionContract")
    ],
    forbiddenAuthority: noDomAuthority
  }),
  responsibility({
    id: "ownership.native-katex.native-fragment-observation",
    title: "Native fragment and rendered-paint observation",
    currentLayers: ["measurement"],
    targetLayer: "measurement",
    targetEffect: "read-native-dom",
    evidence: [
      evidence("src/rendering/native-katex-fragment-observer.ts", "observeKpNativeKatexFragments"),
      evidence("src/rendering/native-katex-rendered-scene.ts", "observeKpNativeKatexRenderedScene"),
      evidence("src/rendering/equation-font-readiness.ts", "createKpEquationFontReadiness")
    ],
    forbiddenAuthority: noSemanticInference
  }),
  responsibility({
    id: "ownership.native-katex.semantic-fragment-binding",
    title: "Observed-paint binding through declared semantic lineage",
    currentLayers: ["measurement", "scene-plan-compilation"],
    targetLayer: "scene-plan-compilation",
    targetEffect: "none",
    evidence: [
      evidence("src/rendering/native-katex-fragment-observer.ts", "bindKpNativeKatexFragmentsWithinSemanticLineage"),
      evidence("src/animation/lineage-constrained-glyph-matcher.ts", "matchKpGlyphsWithinSemanticLineage"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "reconcileKpNativeKatexScenes")
    ],
    forbiddenAuthority: noDomAuthority
  }),
  responsibility({
    id: "ownership.native-katex.reconciliation-hierarchy-and-base-tracks",
    title: "Scene reconciliation, hierarchy, and base-track compilation",
    currentLayers: ["scene-plan-compilation", "paint-ownership"],
    targetLayer: "scene-plan-compilation",
    targetEffect: "none",
    evidence: [
      evidence("src/rendering/native-katex-base-scene-plan.ts", "createKpNativeKatexSceneReconciliation"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpNativeKatexHierarchicalScenePlan"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpNativeKatexSceneTracks")
    ],
    forbiddenAuthority: noDomAuthority
  }),
  responsibility({
    id: "ownership.native-katex.semantic-motion-projection",
    title: "Semantic motion and measured track projection",
    currentLayers: ["scene-plan-compilation", "paint-ownership"],
    targetLayer: "scene-plan-compilation",
    targetEffect: "none",
    evidence: [
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpNativeKatexSemanticMotionTracks"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpNativeKatexProjectedTracks"),
      evidence("src/rendering/native-katex-symbol-motion.ts", "applyKpNativeKatexSymbolMotionContract"),
      evidence("src/rendering/native-katex-track-projection.ts", "applyKpNativeKatexTrackProjection"),
      evidence("src/rendering/equation-motion-path-planner.ts", "planKpEquationMotionPath")
    ],
    forbiddenAuthority: noDomAuthority
  }),
  responsibility({
    id: "ownership.native-katex.operation-choreography",
    title: "Operation choreography and fan-in route planning",
    currentLayers: ["scene-plan-compilation", "paint-ownership"],
    targetLayer: "scene-plan-compilation",
    targetEffect: "none",
    evidence: [
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpNativeKatexOperationTracks"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpCollisionSafeReorderTracks"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpQualityBoundedFanInTracks"),
      evidence("src/rendering/native-katex-operation-choreography.ts", "applyKpNativeKatexOperationChoreography"),
      evidence("src/rendering/native-katex-factoring-choreography.ts", "compileKpNativeKatexFactoringScenePlan"),
      evidence("src/rendering/native-katex-fan-in-motion.ts", "compileKpQualityBoundedFanInTracks")
    ],
    forbiddenAuthority: noDomAuthority
  }),
  responsibility({
    id: "ownership.native-katex.structural-successor-planning",
    title: "Structural succession and successor synthesis",
    currentLayers: ["scene-plan-compilation", "paint-ownership"],
    targetLayer: "scene-plan-compilation",
    targetEffect: "none",
    evidence: [
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpNativeKatexSuccessorSynthesisScenePlans"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "partitionKpNativeKatexSuccessorOwnedTracks"),
      evidence("src/rendering/native-katex-structural-succession-renderer.ts", "syncKpNativeKatexStructuralSuccession"),
      evidence("src/rendering/native-katex-successor-synthesis.ts", "compileKpNativeKatexSuccessorSynthesisScenePlans"),
      evidence("src/rendering/native-katex-scene-compositor.ts", "compileKpCanonicalNativeKatexPureScenePlan")
    ],
    forbiddenAuthority: noDomAuthority
  }),
  responsibility({
    id: "ownership.native-katex.measured-paint-geometry",
    title: "Stage-local native paint and handoff measurement",
    currentLayers: ["measurement", "paint-ownership"],
    targetLayer: "measurement",
    targetEffect: "read-native-dom",
    evidence: [
      evidence("src/rendering/native-katex-paint-geometry.ts", "attachKpNativeKatexTrackPaintGeometry"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "compileKpCollisionSafeTransitTracks"),
      evidence("src/rendering/native-katex-scene-compositor.ts", "measureKpNativeKatexGlyphHandoff")
    ],
    forbiddenAuthority: noSemanticInference
  }),
  responsibility({
    id: "ownership.native-katex.track-contract-and-sampling",
    title: "Renderer-ready track contract and pure progress sampling",
    currentLayers: ["scene-plan-compilation", "sampling", "paint-ownership"],
    targetLayer: "sampling",
    targetEffect: "none",
    evidence: [
      evidence("src/rendering/native-katex-scene-track-contract.ts", "KpNativeKatexSceneTrackContract"),
      evidence("src/rendering/native-katex-scene-track-sampling.ts", "sampleKpNativeKatexSceneTrackFrames"),
      evidence("src/rendering/native-katex-base-scene-plan.ts", "createKpNativeKatexRendererReadyScenePlan"),
      evidence("src/rendering/native-katex-scene-compositor.ts", "sampleKpNativeKatexSceneTracks")
    ],
    forbiddenAuthority: Object.freeze([
      "DOM reads or writes",
      "operation, motif, route, or lifecycle selection",
      "private clock or scheduler ownership"
    ])
  }),
  responsibility({
    id: "ownership.native-katex.transit-paint-ownership",
    title: "Inert transit clone and material paint ownership",
    currentLayers: ["paint-ownership"],
    targetLayer: "paint-ownership",
    targetEffect: "write-transit-paint",
    evidence: [
      evidence("src/rendering/computed-style-clone.ts", "cloneElementWithComputedStyles"),
      evidence("src/rendering/native-katex-glyph-compositor.ts", "applyKpNativeKatexGlyphFrame"),
      evidence("src/rendering/equation-material-layer-dom.ts", "syncKpEquationMaterialLayer"),
      evidence("src/rendering/equation-material-owner.ts", "createKpEquationMaterialOwnerRegistry")
    ],
    forbiddenAuthority: noSemanticInference
  }),
  responsibility({
    id: "ownership.native-katex.renderer-session",
    title: "One ephemeral native renderer session",
    currentLayers: ["scene-plan-compilation", "measurement", "sampling", "paint-ownership", "settlement"],
    targetLayer: "paint-ownership",
    targetEffect: "write-transit-paint",
    evidence: [
      evidence("src/rendering/native-katex-scene-compositor.ts", "createKpNativeKatexRendererSession")
    ],
    forbiddenAuthority: noSemanticInference
  }),
  responsibility({
    id: "ownership.native-katex.native-endpoint-settlement",
    title: "Exact native endpoint visibility and retirement",
    currentLayers: ["paint-ownership", "settlement"],
    targetLayer: "settlement",
    targetEffect: "write-native-visibility",
    evidence: [
      evidence("src/rendering/native-katex-scene-compositor.ts", "assertKpNativeKatexPaintPreservingRetirement")
    ],
    forbiddenAuthority: noSemanticInference
  })
] satisfies readonly KpNativeKatexResponsibilityOwnership[]);

const allowedEffects = Object.freeze({
  "semantic-input": Object.freeze(["none"]),
  "scene-plan-compilation": Object.freeze(["none"]),
  measurement: Object.freeze(["read-native-dom"]),
  sampling: Object.freeze(["none"]),
  "paint-ownership": Object.freeze(["write-transit-paint"]),
  settlement: Object.freeze(["write-native-visibility"])
} as const satisfies Readonly<Record<
  KpNativeKatexOwnershipLayer,
  readonly KpNativeKatexRuntimeEffect[]
>>);

export function validateKpNativeKatexCompositorOwnership(
  responsibilities: readonly KpNativeKatexResponsibilityOwnership[] =
    kpNativeKatexCompositorOwnership
): readonly KpNativeKatexOwnershipViolation[] {
  const violations: KpNativeKatexOwnershipViolation[] = [];
  const ids = new Set<string>();
  const coveredPaths = new Set<string>();
  for (const responsibility of responsibilities) {
    if (ids.has(responsibility.id)) {
      violations.push(violation("duplicate-responsibility", responsibility,
        `Duplicate responsibility ${responsibility.id}.`));
    }
    ids.add(responsibility.id);
    for (const item of responsibility.evidence) coveredPaths.add(item.path);
    const layerEffects: readonly KpNativeKatexRuntimeEffect[] =
      allowedEffects[responsibility.targetLayer];
    if (!layerEffects.includes(responsibility.targetEffect)) {
      violations.push(violation("invalid-target-effect", responsibility,
        `${responsibility.targetLayer} cannot own ${responsibility.targetEffect}.`));
    }
    if (responsibility.forbiddenAuthority.length === 0) {
      violations.push(violation("missing-forbidden-authority", responsibility,
        `${responsibility.id} lacks an explicit forbidden-authority boundary.`));
    }
    if (new Set(responsibility.currentLayers).size !==
      responsibility.currentLayers.length) {
      violations.push(violation("mixed-target-owner", responsibility,
        `${responsibility.id} repeats a current ownership layer.`));
    }
  }

  const requiredPaths = [
    ...kpCanonicalEquationRendererConvergence.productionSourceFiles,
    ...kpCanonicalEquationRendererConvergence.productionDirectDependencySourceFiles,
    ...kpCanonicalEquationRendererConvergence.productionScenePlanBoundarySourceFiles,
    ...kpCanonicalEquationRendererConvergence.productionRendererSupportSourceFiles
  ];
  for (const path of requiredPaths) {
    if (!coveredPaths.has(path)) {
      violations.push(Object.freeze({
        code: "missing-source-owner" as const,
        message: `${path} has no classified compositor responsibility.`
      }));
    }
  }
  return Object.freeze(violations);
}

function responsibility(
  value: KpNativeKatexResponsibilityOwnership
): KpNativeKatexResponsibilityOwnership {
  return Object.freeze({
    ...value,
    currentLayers: Object.freeze([...value.currentLayers]),
    evidence: Object.freeze([...value.evidence]),
    forbiddenAuthority: Object.freeze([...value.forbiddenAuthority])
  });
}

function evidence(
  path: KpNativeKatexOwnershipEvidence["path"],
  needle: string
): KpNativeKatexOwnershipEvidence {
  return Object.freeze({ path, needle });
}

function violation(
  code: KpNativeKatexOwnershipViolation["code"],
  responsibility: KpNativeKatexResponsibilityOwnership,
  message: string
): KpNativeKatexOwnershipViolation {
  return Object.freeze({ code, responsibilityId: responsibility.id, message });
}
