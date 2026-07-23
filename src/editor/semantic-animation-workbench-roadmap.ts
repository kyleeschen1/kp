import type {
  KpWorkbenchPlanPhase,
  KpWorkbenchPlanRevisionNode
} from "./semantic-animation-workbench-roadmap-authority.ts";

export interface KpWorkbenchRoadmapRow {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly objective: string;
  readonly topic?: string;
  readonly horizon: KpWorkbenchPlanPhase["horizon"];
  readonly state: KpWorkbenchPlanPhase["status"];
  readonly architectureBenefit?: string;
  readonly rationale?: string;
  readonly canonicalExemplar?: string;
}

export interface KpWorkbenchRoadmap {
  readonly planId: string;
  readonly planRevision: number;
  readonly planTitle: string;
  readonly objective: string;
  readonly rows: readonly KpWorkbenchRoadmapRow[];
}

export function projectKpWorkbenchRoadmap(
  plan: KpWorkbenchPlanRevisionNode
): KpWorkbenchRoadmap {
  const rows = plan.planRevision.phases.map((phase, index) =>
    Object.freeze({
      id: phase.id,
      order: index + 1,
      title: phase.title,
      objective: phase.objective,
      ...(phase.topic === undefined ? {} : { topic: phase.topic }),
      horizon: phase.horizon,
      state: phase.status,
      ...(phase.architectureBenefit === undefined
        ? {}
        : { architectureBenefit: phase.architectureBenefit }),
      ...(phase.rationale === undefined
        ? {}
        : { rationale: phase.rationale }),
      ...(phase.canonicalExemplar === undefined
        ? {}
        : { canonicalExemplar: phase.canonicalExemplar })
    })
  );

  // This frozen snapshot is a rendering projection only; phase lifecycle
  // continues to come exclusively from the approved plan node.
  return Object.freeze({
    planId: plan.id,
    planRevision: plan.planRevision.revision,
    planTitle: plan.title,
    objective: plan.planRevision.objective,
    rows: Object.freeze(rows)
  });
}
