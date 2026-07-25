export type KpRealGlyphBaselineFailureCode =
  | "whole-equation-crossfade"
  | "approximate-text-overlay"
  | "mid-flight-character-substitution"
  | "unregistered-native-handoff";

export type KpFullSceneFailureCode =
  | "focal-only-reconciliation"
  | "implicit-target-subtree"
  | "unplanned-structural-ink"
  | "component-checkpoint-without-scene-settlement";

export interface KpRealGlyphCompositorExperimentLedger {
  readonly schemaVersion: "kp.real-katex-glyph-compositor-experiment.v1";
  readonly canonicalCaseId: "case.solve-x.one-to-one";
  readonly currentRenderer: "native-katex-fragment-compositor";
  readonly baselineFailureCodes: readonly KpRealGlyphBaselineFailureCode[];
  readonly fullSceneFailureCodes: readonly KpFullSceneFailureCode[];
  readonly fullSceneAcceptance: readonly string[];
  readonly durableForbiddenFields: readonly string[];
  readonly exemplarAcceptance: readonly string[];
  readonly productionModules: readonly string[];
  readonly lifecyclePrimitives: readonly string[];
  readonly maxProductionModules: 4;
  readonly maxLifecyclePrimitives: 6;
  readonly nativeHandoffTolerancePx: 1;
}

export const kpRealGlyphCompositorExperimentLedger:
KpRealGlyphCompositorExperimentLedger = Object.freeze({
  schemaVersion: "kp.real-katex-glyph-compositor-experiment.v1",
  canonicalCaseId: "case.solve-x.one-to-one",
  currentRenderer: "native-katex-fragment-compositor",
  baselineFailureCodes: Object.freeze([
    "whole-equation-crossfade",
    "approximate-text-overlay",
    "mid-flight-character-substitution",
    "unregistered-native-handoff"
  ] as const),
  fullSceneFailureCodes: Object.freeze([
    "focal-only-reconciliation",
    "implicit-target-subtree",
    "unplanned-structural-ink",
    "component-checkpoint-without-scene-settlement"
  ] as const),
  fullSceneAcceptance: Object.freeze([
    "Every painted source and target fragment has exactly one lifecycle disposition.",
    "One inert material scene owns every visible fragment during active transit.",
    "No complete native endpoint subtree leaks visible ink during transit.",
    "Persistent glyphs and structural rules move continuously between exact endpoints.",
    "The complete scene hands off atomically to native target notation.",
    "Unsupported geometry settles one explicit connected scene component."
  ]),
  durableForbiddenFields: Object.freeze([
    "backendPlan",
    "domHandle",
    "glyphRect",
    "keyframes",
    "nativeFragmentObservations"
  ]),
  exemplarAcceptance: Object.freeze([
    "Actual computed-style KaTeX fragments own visible transit.",
    "Stable semantic context remains visible and reflows continuously.",
    "Exactly one visual owner controls each moving semantic fragment.",
    "Native target handoff stays within one CSS pixel without weight or baseline change.",
    "Direct seek and rewind reproduce identical frames.",
    "Moving clones remain hidden from accessibility and pointer interaction."
  ]),
  productionModules: Object.freeze([
    "src/rendering/native-katex-fragment-observer.ts",
    "src/rendering/native-katex-glyph-compositor.ts"
  ]),
  lifecyclePrimitives: Object.freeze([
    "observe-settled-fragments",
    "bind-semantic-lineage",
    "clone-inert-fragments",
    "handoff-exclusive-ownership",
    "reflow-persistent-context",
    "choose-conservative-settlement"
  ]),
  maxProductionModules: 4,
  maxLifecyclePrimitives: 6,
  nativeHandoffTolerancePx: 1
});

export function validateKpRealGlyphCompositorExperimentLedger(
  ledger: KpRealGlyphCompositorExperimentLedger
): readonly string[] {
  const issues: string[] = [];
  if (new Set(ledger.baselineFailureCodes).size !== 4) {
    issues.push("The failed overlay baseline requires four distinct failure codes.");
  }
  if (
    ledger.fullSceneFailureCodes.length !== 4 ||
    new Set(ledger.fullSceneFailureCodes).size !== 4
  ) {
    issues.push("The focal-only scene baseline requires four distinct failure codes.");
  }
  if (ledger.fullSceneAcceptance.length !== 6) {
    issues.push("The full-scene fraction exemplar requires six frozen acceptance laws.");
  }
  if (ledger.exemplarAcceptance.length !== 6) {
    issues.push("The real-glyph exemplar requires six frozen acceptance laws.");
  }
  if (
    ledger.durableForbiddenFields.length !== 5 ||
    new Set(ledger.durableForbiddenFields).size !== 5
  ) {
    issues.push("The durable artifact boundary requires five forbidden fields.");
  }
  if (
    ledger.maxProductionModules !== 4 ||
    ledger.maxLifecyclePrimitives !== 6
  ) {
    issues.push("The approved compositor complexity budget changed.");
  }
  if (
    ledger.productionModules.length > ledger.maxProductionModules ||
    new Set(ledger.productionModules).size !== ledger.productionModules.length
  ) {
    issues.push("Native compositor production modules exceed their fixed budget.");
  }
  if (
    ledger.lifecyclePrimitives.length > ledger.maxLifecyclePrimitives ||
    new Set(ledger.lifecyclePrimitives).size !==
      ledger.lifecyclePrimitives.length
  ) {
    issues.push("Native compositor lifecycle primitives exceed their fixed budget.");
  }
  if (ledger.nativeHandoffTolerancePx !== 1) {
    issues.push("Native handoff tolerance must remain one CSS pixel.");
  }
  return Object.freeze(issues);
}
