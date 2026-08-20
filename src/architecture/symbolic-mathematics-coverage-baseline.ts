import {
  KP_ANIMATION_TRANSFORMATION_COVERAGE_SCHEMA,
  type KpAnimationTransformationCoverage
} from "./animation-transformation-coverage.ts";
import { kpSymbolicCoverageMaturityDimensions } from
  "./symbolic-mathematics-maturity.ts";

export { kpSymbolicCoverageMaturityDimensions } from
  "./symbolic-mathematics-maturity.ts";

export const KP_SYMBOLIC_MATHEMATICS_COVERAGE_BASELINE_SCHEMA =
  "kp.symbolic-mathematics-coverage-baseline.v1" as const;

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
