export const KP_QUADRATIC_BRANCHING_ANIMATION_ID =
  "animation.algebra.quadratic.solution-branching";

export interface KpQuadraticBranchingPreservationEntry {
  readonly id: "solve-x" | "derivative" | "radical" | "quadratic";
  readonly animationId: string;
  readonly query: string;
  readonly expectedPlayability: "playable" | "planned-only";
  readonly role:
    | "measured-equation-reference"
    | "equation-graph-reference"
    | "known-residual-boundary"
    | "planned-exemplar";
}

const entries = [
  {
    id: "solve-x",
    animationId: "animation.linear-solve.solve-x",
    query: "solve",
    expectedPlayability: "playable",
    role: "measured-equation-reference"
  },
  {
    id: "derivative",
    animationId: "animation.derivative-rules.tangent-graph",
    query: "tangent",
    expectedPlayability: "playable",
    role: "equation-graph-reference"
  },
  {
    id: "radical",
    animationId: "animation.generated.radical.square-root-as-power",
    query: "radical",
    expectedPlayability: "playable",
    role: "known-residual-boundary"
  },
  {
    id: "quadratic",
    animationId: KP_QUADRATIC_BRANCHING_ANIMATION_ID,
    query: "quadratic",
    expectedPlayability: "planned-only",
    role: "planned-exemplar"
  }
] as const satisfies readonly KpQuadraticBranchingPreservationEntry[];

export function createKpQuadraticBranchingPreservationManifest(): {
  readonly schemaVersion: "kp.quadratic-branching-preservation.v1";
  readonly entries: readonly KpQuadraticBranchingPreservationEntry[];
  readonly radicalResidualSource: string;
} {
  return {
    schemaVersion: "kp.quadratic-branching-preservation.v1",
    entries,
    radicalResidualSource:
      "docs/project/decisions/2026-07-24-kp-radical-cross-renderer-handoff-residual.md"
  };
}
