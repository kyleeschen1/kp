export const kpOperationPresentationOptionalSeams = Object.freeze([
  seam("visual-motif", "visualMotif",
    "src/reader/renderers/equation-render-plan.ts"),
  seam("factoring-binding", "factoringMotifBinding",
    "src/reader/renderers/equation-render-plan.ts"),
  seam("structural-succession", "structuralSuccession",
    "src/reader/renderers/equation-render-plan.ts"),
  seam("successor-syntheses", "successorSyntheses",
    "src/reader/renderers/equation-render-plan.ts"),
  seam("operation-choreography", "operationChoreography",
    "src/reader/renderers/equation-render-plan.ts")
] as const);

export const kpOperationPresentationRendererInputs = Object.freeze([
  rendererInput("factoring", "factoring"),
  rendererInput("operation-choreography", "operationChoreography"),
  rendererInput("successor-syntheses", "successorSyntheses"),
  rendererInput("structural-succession", "structuralSuccession"),
  rendererInput("fan-in-routing", "fanInRouting"),
  rendererInput("copy-fan-out-routing", "copyFanOutRouting"),
  rendererInput("reorder-routing", "reorderRouting")
] as const);

export const kpOperationPresentationCancellationAuthoringSites = Object.freeze([
  cancellationSite(
    "fraction-composition",
    "src/semantic/fraction-composition-equation-asset.ts",
    "cancel("
  ),
  cancellationSite(
    "fractional-linear",
    "src/semantic/fractional-linear-equation-asset.ts",
    "\"cancelation\""
  ),
  cancellationSite(
    "linear-solve",
    "src/semantic/linear-solve-asset.ts",
    "\"cancelation\""
  ),
  cancellationSite(
    "divide-both-sides",
    "src/semantic/divide-both-sides-equation-asset.ts",
    "\"cancelation\""
  ),
  cancellationSite(
    "generated-algebra",
    "src/semantic/generated-algebra-tutorial-fixture.ts",
    "\"cancelation\""
  )
] as const);

export const kpOperationPresentationEvidenceGaps = Object.freeze([
  evidenceGap(
    "browser-choreography-label",
    "tests/semantic-reader-fraction-composition.browser.spec.ts",
    "data-kp-native-katex-operation-choreography",
    "The browser proof observes a choreography label rather than operand paths."
  ),
  evidenceGap(
    "visual-overlap-without-motif-fidelity",
    "tests/semantic-reader-fraction-composition-visual.browser.spec.ts",
    "inspectKpEquationVisiblePaintOverlap",
    "The visual matrix protects ownership and overlap without proving motif geometry."
  )
] as const);

export const kpOperationPresentationEvidenceClosures = Object.freeze([
  evidenceClosure(
    "enumerated-native-cancellation",
    "tests/fraction-composition-cancellation-choreography-conformance.test.ts",
    "every discovered cancellation obeys role-complete forward and rewind laws",
    "Every fraction-composition cancellation is automatically checked for bundle geometry, opacity, continuants, and exact rewind."
  )
] as const);

export type KpOperationPresentationMigrationState =
  | "independent-optional"
  | "flat-source-group"
  | "metadata-only-evidence"
  | "verified-plan";

export interface KpOperationPresentationMigrationInventoryEntry {
  readonly id: string;
  readonly sourcePath: string;
  readonly sourceNeedle: string;
  readonly state: KpOperationPresentationMigrationState;
  readonly summary: string;
}

function seam(
  id: string,
  sourceNeedle: string,
  sourcePath: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `seam.${id}`,
    sourcePath,
    sourceNeedle,
    state: "independent-optional" as const,
    summary:
      "This independently optional reader field can disagree with sibling presentation evidence."
  });
}

function rendererInput(
  id: string,
  sourceNeedle: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `renderer-input.${id}`,
    sourcePath: "src/rendering/native-katex-scene-compositor.ts",
    sourceNeedle,
    state: "independent-optional" as const,
    summary:
      "The canonical compositor currently accepts this presentation concern separately."
  });
}

function cancellationSite(
  id: string,
  sourcePath: string,
  sourceNeedle: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `cancellation-authoring.${id}`,
    sourcePath,
    sourceNeedle,
    state: "flat-source-group" as const,
    summary:
      "Cancellation sources do not distinguish inverse bundles, catalysts, artifacts, or survivors."
  });
}

function evidenceGap(
  id: string,
  sourcePath: string,
  sourceNeedle: string,
  summary: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `evidence-gap.${id}`,
    sourcePath,
    sourceNeedle,
    state: "metadata-only-evidence" as const,
    summary
  });
}

function evidenceClosure(
  id: string,
  sourcePath: string,
  sourceNeedle: string,
  summary: string
): KpOperationPresentationMigrationInventoryEntry {
  return Object.freeze({
    id: `evidence-closure.${id}`,
    sourcePath,
    sourceNeedle,
    state: "verified-plan" as const,
    summary
  });
}
