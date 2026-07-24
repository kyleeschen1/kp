import {
  compileKpFissionFusionPlan,
  sampleKpFissionFusion,
  type KpFissionFusionFrame,
  type KpFissionFusionPlan
} from "./fission-fusion.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import type { KpQuadraticMethodId } from "../semantic/quadratic-solution-method-graph.ts";

export interface KpQuadraticBranchChoreography {
  readonly schemaVersion: "kp.quadratic-branch-choreography.v1";
  readonly methodId: KpQuadraticMethodId;
  readonly fission: KpFissionFusionPlan;
  readonly fusion: KpFissionFusionPlan;
  readonly branchLabels: readonly ["x = 2", "x = 3"];
  readonly responsiveSeparation: {
    readonly wide: number;
    readonly narrow: number;
  };
  readonly nativeSolutionSetId: "katex.quadratic.solution-set.native";
}

export interface KpQuadraticBranchChoreographyFrame {
  readonly methodId: KpQuadraticMethodId;
  readonly semanticProgress: number;
  readonly stage: "fission" | "fusion";
  readonly motion: KpFissionFusionFrame;
  readonly nativeEndpoint: boolean;
}

export function createKpQuadraticBranchChoreography(
  methodId: KpQuadraticMethodId
): KpQuadraticBranchChoreography {
  const origin = `branch-origin.${methodId}`;
  const branches = [
    `branch.${methodId}.minus`,
    `branch.${methodId}.plus`
  ];
  const native = "katex.quadratic.solution-set.native";
  const fission = compileKpFissionFusionPlan({
    id: `motion.${methodId}.plus-minus-fission`,
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: `lineage.${methodId}.plus-minus-fission`,
      sourceEntityIds: [origin],
      targetEntityIds: branches,
      edges: [{
        id: `split.${methodId}.plus-minus`,
        relation: "split",
        sourceEntityIds: [origin],
        targetEntityIds: branches,
        summary: "One semantic plus-minus origin creates two exact root branches."
      }]
    }),
    semanticOrder: branches,
    microStaggerSpan: 0.06,
    junctionScale: 0.8
  });
  const fusion = compileKpFissionFusionPlan({
    id: `motion.${methodId}.native-reunion`,
    mode: "fusion",
    lineageGraph: createKpSemanticLineageGraph({
      id: `lineage.${methodId}.native-reunion`,
      sourceEntityIds: branches,
      targetEntityIds: [native],
      edges: [{
        id: `merge.${methodId}.solution-set`,
        relation: "merge",
        sourceEntityIds: branches,
        targetEntityIds: [native],
        summary: "Both exact branches reunite into one native solution-set owner."
      }]
    }),
    semanticOrder: branches,
    microStaggerSpan: 0.06,
    junctionScale: 0.8
  });
  return Object.freeze({
    schemaVersion: "kp.quadratic-branch-choreography.v1" as const,
    methodId,
    fission,
    fusion,
    branchLabels: Object.freeze(["x = 2", "x = 3"]) as readonly ["x = 2", "x = 3"],
    responsiveSeparation: Object.freeze({ wide: 144, narrow: 72 }),
    nativeSolutionSetId: native
  });
}

export function sampleKpQuadraticBranchChoreography(input: {
  readonly choreography: KpQuadraticBranchChoreography;
  readonly progress: number;
  readonly direction?: "forward" | "rewind";
}): KpQuadraticBranchChoreographyFrame {
  if (!Number.isFinite(input.progress) || input.progress < 0 || input.progress > 1) {
    throw new Error("Quadratic branch choreography progress must be normalized.");
  }
  const semanticProgress = normalize(
    input.direction === "rewind" ? 1 - input.progress : input.progress
  );
  const stage = semanticProgress < 0.55 ? "fission" : "fusion";
  const localProgress = stage === "fission"
    ? semanticProgress / 0.55
    : (semanticProgress - 0.55) / 0.45;
  const motion = sampleKpFissionFusion({
    plan: stage === "fission"
      ? input.choreography.fission
      : input.choreography.fusion,
    progress: localProgress
  });
  return Object.freeze({
    methodId: input.choreography.methodId,
    semanticProgress,
    stage,
    motion,
    nativeEndpoint:
      semanticProgress === 1 &&
      motion.settled &&
      motion.ownership.ownerEntityIds[0] === input.choreography.nativeSolutionSetId
  });
}

function normalize(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}
