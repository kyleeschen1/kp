import type {
  KpFissionFusionFrame,
  KpFissionFusionPlan
} from "./fission-fusion.ts";
import type { KpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";

export interface KpFissionFusionRuntime {
  readonly compile: (input: {
    readonly id: string;
    readonly mode: "fission" | "fusion";
    readonly lineageGraph: KpSemanticLineageGraph;
    readonly lineageEdgeId?: string | undefined;
    readonly semanticOrder?: readonly string[] | undefined;
    readonly microStaggerSpan?: number | undefined;
    readonly junctionScale?: number | undefined;
  }) => KpFissionFusionPlan;
  readonly sample: (input: {
    readonly plan: KpFissionFusionPlan;
    readonly progress: number;
  }) => KpFissionFusionFrame;
}

let registeredRuntime: KpFissionFusionRuntime | undefined;

export function registerKpFissionFusionRuntime(runtime: KpFissionFusionRuntime): void {
  registeredRuntime = runtime;
}

export function kpFissionFusionRuntime(): KpFissionFusionRuntime {
  if (registeredRuntime === undefined) {
    throw new Error("Missing fission/fusion capability runtime.");
  }
  return registeredRuntime;
}
