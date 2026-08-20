import {
  KP_ANIMATION_TRANSFORMATION_COVERAGE_SCHEMA,
  type KpAnimationTransformationCoverage
} from "./animation-transformation-coverage.ts";

export const KP_SYMBOLIC_MATHEMATICS_COVERAGE_BASELINE_SCHEMA =
  "kp.symbolic-mathematics-coverage-baseline.v1" as const;

export const kpSymbolicCoverageMaturityDimensions = Object.freeze([
  maturity(
    "notation-paintable",
    "Notation paintable",
    "The selected renderer can paint the notation without asserting its meaning."
  ),
  maturity(
    "semantic-representable",
    "Semantic shape representable",
    "Typed roles, grouping, scope, identity, domain, and branch evidence can represent the source and target."
  ),
  maturity(
    "operation-authoritative",
    "Operation authoritative",
    "A registered semantic operation validates the transformation or returns an exact typed gap."
  ),
  maturity(
    "exemplar-executable",
    "Exemplar executable",
    "One deterministic, seekable, reversible caller exercises the operation through a real renderer."
  ),
  maturity(
    "family-promoted",
    "Family promoted",
    "A reviewed exemplar and structurally different caller prove a bounded shared recipe."
  ),
  maturity(
    "generation-governed",
    "Generation governed",
    "Natural-language or ordered-source authoring resolves only through registered evidence and typed repair."
  )
] as const);

/**
 * This is a historical comparison point, not the live coverage authority.
 * Keeping it separate lets later taxonomy work grow the denominator without
 * rewriting what was actually true when the Calc BC horizon was accepted.
 */
export const kpEquationCoverageBaseline20260820 = Object.freeze({
  schemaVersion: KP_SYMBOLIC_MATHEMATICS_COVERAGE_BASELINE_SCHEMA,
  kind: "symbolic-mathematics-coverage-baseline" as const,
  id: "baseline.equation-coverage.2026-08-20" as const,
  capturedOn: "2026-08-20" as const,
  sourceCoverageSchemaVersion: KP_ANIMATION_TRANSFORMATION_COVERAGE_SCHEMA,
  equationCapabilityCount: 19,
  byStatus: Object.freeze({
    Direct: 6,
    Registered: 4,
    Exemplar: 2,
    Missing: 7
  }),
  maturityDimensions: kpSymbolicCoverageMaturityDimensions
});

export function summarizeKpEquationCoverage(
  coverage: KpAnimationTransformationCoverage
): Readonly<{
  equationCapabilityCount: number;
  byStatus: Readonly<{
    Direct: number;
    Registered: number;
    Exemplar: number;
    Missing: number;
  }>;
}> {
  const byStatus = {
    Direct: 0,
    Registered: 0,
    Exemplar: 0,
    Missing: 0
  };
  const entries = coverage.entries.filter(({ domain }) => domain === "equation");
  for (const { status } of entries) byStatus[status] += 1;
  return Object.freeze({
    equationCapabilityCount: entries.length,
    byStatus: Object.freeze(byStatus)
  });
}

function maturity(
  id: string,
  label: string,
  claim: string
): Readonly<{ id: string; label: string; claim: string }> {
  return Object.freeze({ id, label, claim });
}
