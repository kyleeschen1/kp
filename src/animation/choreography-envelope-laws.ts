import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";
import type {
  KpChoreographyActivity,
  KpChoreographyPlan
} from "./choreography-plan.ts";

export interface KpChoreographyDependencyEdge {
  readonly prerequisiteId: string;
  readonly dependentId: string;
}

export function kpChoreographyDependencyEdges(
  plan: KpChoreographyPlan,
  direction: "forward" | "rewind" = "forward"
): readonly KpChoreographyDependencyEdge[] {
  const forward = [
    ...plan.phases.flatMap((phase) =>
      phase.dependsOnPhaseIds.map((prerequisiteId) => ({
        prerequisiteId,
        dependentId: phase.id
      }))
    ),
    ...plan.activities.flatMap((activity) =>
      activity.dependsOnActivityIds.map((prerequisiteId) => ({
        prerequisiteId,
        dependentId: activity.id
      }))
    )
  ];
  return direction === "forward"
    ? forward
    : [...forward].reverse().map((edge) => ({
        prerequisiteId: edge.dependentId,
        dependentId: edge.prerequisiteId
      }));
}

export function checkKpChoreographyEnvelopeLaws(
  plan: KpChoreographyPlan
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const classifications = new Map(
    plan.vocabulary.motionClassifications.map((entry) => [
      entry.id,
      entry.motionClass
    ])
  );

  plan.activities.forEach((activity, index) => {
    const path = `activities[${index}]`;
    if (
      isMeaningful(activity, classifications) &&
      !hasCheckpointPrerequisite(plan, activity, "focus-ready")
    ) {
      failures.push({
        path,
        message: `Meaningful activity ${activity.id} requires a focus-ready checkpoint before motion.`
      });
    }
    if (
      activity.kind === "move-continuant" &&
      !hasCheckpointPrerequisite(plan, activity, "space-reserved")
    ) {
      failures.push({
        path,
        message: `Continuant reflow ${activity.id} requires reserved destination and transit space.`
      });
    }
    if (
      activity.phaseId === "act" &&
      !hasCheckpointPrerequisite(plan, activity, "phase-complete") &&
      !hasGovernedReflowOverlap(plan, activity)
    ) {
      failures.push({
        path,
        message: `Act activity ${activity.id} must wait for reflow completion or declare governed causal overlap.`
      });
    }
  });

  const release = plan.phases.find((phase) => phase.id === "release");
  if (
    release !== undefined &&
    release.mode === "active" &&
    !release.prerequisiteCheckpointIds.some((id) =>
      plan.checkpoints.some(
        (checkpoint) =>
          checkpoint.id === id &&
          checkpoint.kind === "recognition" &&
          checkpoint.stable
      )
    )
  ) {
    failures.push({
      path: "phases[release]",
      message:
        "Release must require a stable recognition checkpoint from settle."
    });
  }

  const forward = kpChoreographyDependencyEdges(plan, "forward");
  const rewind = kpChoreographyDependencyEdges(plan, "rewind");
  const expectedRewind = [...forward].reverse().map((edge) => ({
    prerequisiteId: edge.dependentId,
    dependentId: edge.prerequisiteId
  }));
  if (JSON.stringify(rewind) !== JSON.stringify(expectedRewind)) {
    failures.push({
      path: "dependencies.rewind",
      message: "Rewind dependencies must exactly mirror forward dependencies."
    });
  }

  return {
    lawId: "animation.choreography-envelope",
    passed: failures.length === 0,
    failures
  };
}

function isMeaningful(
  activity: KpChoreographyActivity,
  classifications: ReadonlyMap<string, string>
): boolean {
  return activity.motionClassificationIds.some(
    (id) => classifications.get(id) === "meaningful"
  );
}

function hasCheckpointPrerequisite(
  plan: KpChoreographyPlan,
  activity: KpChoreographyActivity,
  kind: "focus-ready" | "space-reserved" | "phase-complete"
): boolean {
  const phase = plan.phases.find((candidate) => candidate.id === activity.phaseId);
  const ids = new Set([
    ...activity.prerequisiteCheckpointIds,
    ...(phase?.prerequisiteCheckpointIds ?? [])
  ]);
  return plan.checkpoints.some(
    (checkpoint) => ids.has(checkpoint.id) && checkpoint.kind === kind
  );
}

function hasGovernedReflowOverlap(
  plan: KpChoreographyPlan,
  activity: KpChoreographyActivity
): boolean {
  if (activity.governedOverlap === undefined) return false;
  const peer = plan.activities.find(
    (candidate) => candidate.id === activity.governedOverlap?.withActivityId
  );
  return (
    peer?.phaseId === "reflow" &&
    activity.governedOverlap.reason.trim().length > 0
  );
}
