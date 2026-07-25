export type KpRealGlyphBaselineFailureCode =
  | "whole-equation-crossfade"
  | "approximate-text-overlay"
  | "mid-flight-character-substitution"
  | "unregistered-native-handoff";

export interface KpRealGlyphCompositorExperimentLedger {
  readonly schemaVersion: "kp.real-katex-glyph-compositor-experiment.v1";
  readonly canonicalCaseId: "case.solve-x.one-to-one";
  readonly currentRenderer: "approximate-text-overlay";
  readonly baselineFailureCodes: readonly KpRealGlyphBaselineFailureCode[];
  readonly exemplarAcceptance: readonly string[];
  readonly maxProductionModules: 4;
  readonly maxLifecyclePrimitives: 6;
  readonly nativeHandoffTolerancePx: 1;
}

export const kpRealGlyphCompositorExperimentLedger:
KpRealGlyphCompositorExperimentLedger = Object.freeze({
  schemaVersion: "kp.real-katex-glyph-compositor-experiment.v1",
  canonicalCaseId: "case.solve-x.one-to-one",
  currentRenderer: "approximate-text-overlay",
  baselineFailureCodes: Object.freeze([
    "whole-equation-crossfade",
    "approximate-text-overlay",
    "mid-flight-character-substitution",
    "unregistered-native-handoff"
  ]),
  exemplarAcceptance: Object.freeze([
    "Actual computed-style KaTeX fragments own visible transit.",
    "Stable semantic context remains visible and reflows continuously.",
    "Exactly one visual owner controls each moving semantic fragment.",
    "Native target handoff stays within one CSS pixel without weight or baseline change.",
    "Direct seek and rewind reproduce identical frames.",
    "Moving clones remain hidden from accessibility and pointer interaction."
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
  if (ledger.exemplarAcceptance.length !== 6) {
    issues.push("The real-glyph exemplar requires six frozen acceptance laws.");
  }
  if (
    ledger.maxProductionModules !== 4 ||
    ledger.maxLifecyclePrimitives !== 6
  ) {
    issues.push("The approved compositor complexity budget changed.");
  }
  if (ledger.nativeHandoffTolerancePx !== 1) {
    issues.push("Native handoff tolerance must remain one CSS pixel.");
  }
  return Object.freeze(issues);
}
