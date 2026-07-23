export interface KpWorkbenchPlanPhase {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly horizon: "now" | "next" | "later" | "someday";
  readonly status: "planned" | "active" | "complete" | "deferred";
  readonly topic?: string;
  readonly architectureBenefit?: string;
  readonly rationale?: string;
  readonly canonicalExemplar?: string;
}

export interface KpWorkbenchPlanRevisionNode {
  readonly id: string;
  readonly kind: "plan-revision";
  readonly title: string;
  readonly status: string;
  readonly domain?: string;
  readonly planRevision: {
    readonly schemaVersion: string;
    readonly revision: number;
    readonly objective: string;
    readonly phases: readonly KpWorkbenchPlanPhase[];
    readonly approval: {
      readonly status: string;
    };
  };
}

export function selectKpActiveApprovedPlan(
  nodes: readonly KpWorkbenchPlanRevisionNode[]
): KpWorkbenchPlanRevisionNode {
  const candidates = nodes
    .filter(
      (node) =>
        node.kind === "plan-revision" &&
        node.domain === "kp" &&
        node.status === "active" &&
        node.planRevision.approval.status === "approved"
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  if (candidates.length !== 1) {
    const ids =
      candidates.length === 0
        ? "none"
        : candidates.map(({ id }) => id).join(", ");
    throw new Error(
      `Expected exactly one active approved KP plan revision; found ${candidates.length}: ${ids}.`
    );
  }
  return candidates[0]!;
}
