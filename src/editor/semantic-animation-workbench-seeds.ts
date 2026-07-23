export type KpAnimationWorkbenchSeedSource =
  | {
      readonly kind: "catalog";
      readonly descriptorId: string;
    }
  | {
      readonly kind: "approved-plan";
      readonly sourcePath: string;
    };

export interface KpAnimationWorkbenchSeed {
  readonly animationId: string;
  readonly title: string;
  readonly source: KpAnimationWorkbenchSeedSource;
  readonly expectedPlayability: "playable" | "planned-only";
}

const seeds = [
  {
    animationId: "animation.generated.radical.square-root-as-power",
    title: "Power to radical",
    source: {
      kind: "catalog",
      descriptorId:
        "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
    },
    expectedPlayability: "playable"
  },
  {
    animationId: "animation.derivative-rules.tangent-graph",
    title: "Difference quotient converging to a tangent",
    source: {
      kind: "catalog",
      descriptorId:
        "editor-animation.sample.animation.derivative-rules.tangent-graph"
    },
    expectedPlayability: "playable"
  },
  {
    animationId: "animation.algebra.quadratic.solution-branching",
    title: "Quadratic solution branching",
    source: {
      kind: "approved-plan",
      sourcePath:
        "docs/project/reviews/2026-07-23-semantic-animation-workbench-long-loop-proposal.md"
    },
    expectedPlayability: "planned-only"
  }
] as const satisfies readonly KpAnimationWorkbenchSeed[];

export function createKpAnimationWorkbenchSeedCohort():
  readonly KpAnimationWorkbenchSeed[] {
  assertKpAnimationWorkbenchSeedCohort(seeds);
  return seeds;
}

export function assertKpAnimationWorkbenchSeedCohort(
  input: readonly KpAnimationWorkbenchSeed[]
): void {
  if (input.length === 0) {
    throw new Error("Workbench seed cohort must not be empty.");
  }
  const ids = new Set<string>();
  for (const seed of input) {
    if (ids.has(seed.animationId)) {
      throw new Error(`Duplicate Workbench seed animation ${seed.animationId}.`);
    }
    ids.add(seed.animationId);
    if (
      seed.source.kind === "catalog" &&
      seed.expectedPlayability !== "playable"
    ) {
      throw new Error(
        `Catalog seed ${seed.animationId} must remain concretely playable.`
      );
    }
    if (
      seed.source.kind === "approved-plan" &&
      seed.expectedPlayability !== "planned-only"
    ) {
      throw new Error(
        `Approved-plan seed ${seed.animationId} must remain planned-only.`
      );
    }
  }
}
