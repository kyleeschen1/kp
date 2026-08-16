export type KpEquationAdapterOwnerId =
  | "stage-frame-planning"
  | "host-orchestration"
  | "stage-material-lifecycle"
  | "specialized-dom-choreography"
  | "semantic-token-paint"
  | "stage-markup-projection";

export type KpEquationAdapterExtractionDecision =
  | "extract-a"
  | "extract-b-candidate"
  | "retain-in-host"
  | "defer-tightly-coupled";

export interface KpEquationAdapterOwner {
  readonly id: KpEquationAdapterOwnerId;
  readonly responsibility: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly sourceAnchors: readonly string[];
  readonly dependsOn: readonly KpEquationAdapterOwnerId[];
  readonly decision: KpEquationAdapterExtractionDecision;
  readonly proposedPath?: string | undefined;
  readonly reason: string;
}

export interface KpEquationAdapterOwnershipMap {
  readonly schemaVersion: "kp.equation-adapter-ownership-map.v1";
  readonly sourcePath: "src/editor/equation-surface-adapter.ts";
  readonly owners: readonly KpEquationAdapterOwner[];
}

export type KpEquationAdapterOwnershipDiagnosticCode =
  | "duplicate-owner"
  | "duplicate-anchor"
  | "unknown-dependency"
  | "dependency-cycle"
  | "missing-extraction-path";

export interface KpEquationAdapterOwnershipDiagnostic {
  readonly code: KpEquationAdapterOwnershipDiagnosticCode;
  readonly ownerId: string;
  readonly message: string;
}

export const kpEquationAdapterOwnershipMap: KpEquationAdapterOwnershipMap =
  Object.freeze({
    schemaVersion: "kp.equation-adapter-ownership-map.v1" as const,
    sourcePath: "src/editor/equation-surface-adapter.ts" as const,
    owners: Object.freeze([
      owner({
        id: "stage-frame-planning",
        responsibility:
          "Project one animation/player state into a deterministic, DOM-free equation stage frame and sampled specialized choreography frames.",
        inputs: [
          "KpAnimationAsset",
          "KpEditorAnimationPlayerState",
          "authoring revision",
          "math layout",
          "gestalt channels"
        ],
        outputs: [
          "KpEditorEquationStageFrame",
          "sampled semantic progress",
          "sampled specialized choreography frames",
          "stable stage/content/material identity keys"
        ],
        sourceAnchors: [
          "KpEditorEquationStageFrame",
          "createKpEditorEquationStageFrame",
          "createRadicalSuccessionFrame",
          "createFunctionWrapFrame",
          "createLinearRearrangementFrame",
          "createDotProductTraversalFrame",
          "createMatrixVectorCompositionFrame",
          "createMatrixMatrixCompositionFrame",
          "createDerivativePowerFrame"
        ],
        dependsOn: [],
        decision: "extract-a",
        proposedPath: "src/editor/equation-stage-frame.ts",
        reason:
          "This is the strongest pure seam: existing tests call its public frame constructor directly, it owns no live DOM, and the adapter can preserve its current public import through a re-export."
      }),
      owner({
        id: "stage-markup-projection",
        responsibility:
          "Project a stage frame and semantic objects into KaTeX-backed stage markup, structural motion bindings, labels, and unavailable-state HTML.",
        inputs: [
          "KpEditorEquationStageFrame",
          "runtime frame projection",
          "selector-annotated LaTeX",
          "surface declarations"
        ],
        outputs: [
          "stage HTML",
          "source/target layer HTML",
          "bound structural motion ids",
          "semantic status and motif labels"
        ],
        sourceAnchors: [
          "renderStage",
          "renderStageContent",
          "replaceStageContent",
          "renderEquationObjects",
          "annotatedLatexForStates",
          "annotatedLatexForObject",
          "bindStructuralMotionIds",
          "motifLabel",
          "renderSolveXSequence",
          "renderUnavailable",
          "escapeHtml"
        ],
        dependsOn: ["stage-frame-planning"],
        decision: "extract-b-candidate",
        proposedPath: "src/editor/equation-stage-markup.ts",
        reason:
          "After frame extraction this becomes a one-way frame-to-markup boundary and removes KaTeX/semantic-LaTeX imports from orchestration without changing paint behavior."
      }),
      owner({
        id: "stage-material-lifecycle",
        responsibility:
          "Own live stage invalidation, native measurement preparation, material-continuity handoff, native radical settlement, focus realization, and diagnostics cadence.",
        inputs: [
          "live equation stage",
          "hot-path cache",
          "semantic progress",
          "font/resize invalidation",
          "accessibility and quality settings"
        ],
        outputs: [
          "measurement invalidation",
          "material overlay owners",
          "native settlement datasets",
          "resample requests",
          "focus and gestalt styles"
        ],
        sourceAnchors: [
          "shouldSyncContinuityInspection",
          "invalidateEquationStageMeasurements",
          "resetEquationStageForMeasurement",
          "applyEquationMaterialLayer",
          "applyRadicalMaterialLayer",
          "applyFocusExperiment",
          "applyGestaltTokenRealization"
        ],
        dependsOn: [],
        decision: "defer-tightly-coupled",
        reason:
          "Its DOM nodes, measurement cache, WebGL radical lease, and resample lifecycle form one tightly coupled paint owner; splitting it now would move bytes without clarifying authority."
      }),
      owner({
        id: "semantic-token-paint",
        responsibility:
          "Measure and apply generic semantic token motion, fallback layer motion, canonical reverse operations, witnessed overlays, and family-specific focus channels.",
        inputs: [
          "semantic transition projection",
          "measured source/target tokens",
          "stage frame",
          "direction and runtime capabilities"
        ],
        outputs: [
          "token transforms and opacity",
          "semantic-motion datasets",
          "witness overlays",
          "family focus profiles"
        ],
        sourceAnchors: [
          "applySemanticTokenMotion",
          "applyCanonicalReverseChoreography",
          "applyDistributionFactorFocus",
          "applyFactoringFactorFocus",
          "syncWitnessedAnnihilationOverlay",
          "applyFractionRoleFocus",
          "applyExponentLawFocus",
          "applyIdentityAbsorptionFocus",
          "applyInequalityPivotFocus",
          "applyLayerMotion"
        ],
        dependsOn: ["stage-frame-planning"],
        decision: "defer-tightly-coupled",
        reason:
          "These paths share measured token geometry and fallback precedence. A useful extraction requires a separately proven renderer port, not a line-count split."
      }),
      owner({
        id: "specialized-dom-choreography",
        responsibility:
          "Bind sampled function, radical, linear, dot-product, matrix, and derivative choreography frames to exact DOM tokens and overlays.",
        inputs: [
          "sampled specialized choreography frame",
          "transition DOM",
          "playback direction",
          "measured token geometry"
        ],
        outputs: [
          "specialized token transforms",
          "focus shadows and operation banks",
          "overlay geometry datasets",
          "narration annotations"
        ],
        sourceAnchors: [
          "applyFunctionWrapChoreography",
          "applyRadicalSuccessionChoreography",
          "applyLinearRearrangementChoreography",
          "applyDotProductTraversalChoreography",
          "syncDotProductTraversalOverlay",
          "applyMatrixVectorCompositionChoreography",
          "syncMatrixLinearMapOperationBank",
          "applyMatrixMatrixCompositionChoreography"
        ],
        dependsOn: ["stage-frame-planning", "semantic-token-paint"],
        decision: "defer-tightly-coupled",
        reason:
          "The binders currently depend on token-paint helpers and overlay measurement in both directions of playback. Moving them before a renderer-port contract risks cycles and frame drift."
      }),
      owner({
        id: "host-orchestration",
        responsibility:
          "Select the equation presentation route and coordinate frame planning, markup replacement, measurement, paint owners, diagnostics, and adapter registration.",
        inputs: [
          "editor player",
          "equation slot",
          "runtime player state",
          "selected surface declaration"
        ],
        outputs: [
          "one hydrated equation stage",
          "adapter status",
          "ordered paint-owner application",
          "registered equation surface adapter"
        ],
        sourceAnchors: [
          "kpEditorEquationSurfaceAdapter",
          "registerKpEditorEquationSurfaceAdapter",
          "applyExponentExplanationProjection",
          "postBindingGestaltMotionTokens"
        ],
        dependsOn: [
          "stage-frame-planning",
          "stage-markup-projection",
          "stage-material-lifecycle",
          "specialized-dom-choreography",
          "semantic-token-paint"
        ],
        decision: "retain-in-host",
        reason:
          "This is the composition root. Keeping orchestration here preserves paint order and makes extracted owners dependencies rather than competing hosts."
      })
    ])
  });

export function validateKpEquationAdapterOwnershipMap(
  map: KpEquationAdapterOwnershipMap
): readonly KpEquationAdapterOwnershipDiagnostic[] {
  const diagnostics: KpEquationAdapterOwnershipDiagnostic[] = [];
  const owners = new Map<KpEquationAdapterOwnerId, KpEquationAdapterOwner>();
  const anchors = new Map<string, KpEquationAdapterOwnerId>();
  for (const entry of map.owners) {
    if (owners.has(entry.id)) {
      diagnostics.push(diagnostic(
        "duplicate-owner",
        entry.id,
        `Duplicate equation adapter owner ${entry.id}.`
      ));
    }
    owners.set(entry.id, entry);
    for (const anchor of entry.sourceAnchors) {
      const previous = anchors.get(anchor);
      if (previous !== undefined) {
        diagnostics.push(diagnostic(
          "duplicate-anchor",
          entry.id,
          `Source anchor ${anchor} is owned by both ${previous} and ${entry.id}.`
        ));
      }
      anchors.set(anchor, entry.id);
    }
    if (
      (entry.decision === "extract-a" ||
        entry.decision === "extract-b-candidate") &&
      entry.proposedPath === undefined
    ) {
      diagnostics.push(diagnostic(
        "missing-extraction-path",
        entry.id,
        `Extractable owner ${entry.id} requires a proposed path.`
      ));
    }
  }
  for (const entry of map.owners) {
    for (const dependency of entry.dependsOn) {
      if (!owners.has(dependency)) {
        diagnostics.push(diagnostic(
          "unknown-dependency",
          entry.id,
          `Owner ${entry.id} depends on unknown owner ${dependency}.`
        ));
      }
    }
  }
  const visiting = new Set<KpEquationAdapterOwnerId>();
  const visited = new Set<KpEquationAdapterOwnerId>();
  const visit = (ownerId: KpEquationAdapterOwnerId): void => {
    if (visiting.has(ownerId)) {
      diagnostics.push(diagnostic(
        "dependency-cycle",
        ownerId,
        `Equation adapter ownership dependency cycle reaches ${ownerId}.`
      ));
      return;
    }
    if (visited.has(ownerId)) return;
    const entry = owners.get(ownerId);
    if (entry === undefined) return;
    visiting.add(ownerId);
    entry.dependsOn.forEach(visit);
    visiting.delete(ownerId);
    visited.add(ownerId);
  };
  map.owners.forEach(({ id }) => visit(id));
  return Object.freeze(diagnostics);
}

function owner(input: KpEquationAdapterOwner): KpEquationAdapterOwner {
  return Object.freeze({
    ...input,
    inputs: Object.freeze([...input.inputs]),
    outputs: Object.freeze([...input.outputs]),
    sourceAnchors: Object.freeze([...input.sourceAnchors]),
    dependsOn: Object.freeze([...input.dependsOn])
  });
}

function diagnostic(
  code: KpEquationAdapterOwnershipDiagnosticCode,
  ownerId: string,
  message: string
): KpEquationAdapterOwnershipDiagnostic {
  return Object.freeze({ code, ownerId, message });
}
