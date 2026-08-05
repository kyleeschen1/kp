import type {
  KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import type { KpEconomicsGraphViewport } from "./economics-equilibrium-svg.ts";

export interface KpEconomicsEquilibriumRuntimeSessionInput {
  readonly content: SVGGElement;
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}

export interface KpEconomicsEquilibriumRuntimeSession {
  readonly content: SVGGElement;
  readonly status: "mounted" | "disposed";
  apply(input: {
    readonly frame: KpEconomicsEquilibriumRuntimeFrame;
    readonly viewport: KpEconomicsGraphViewport;
  }): void;
  dispose(): void;
}

export const kpEconomicsEquilibriumRuntimeSessionContract = Object.freeze({
  scope: "economics-equilibrium-exemplar",
  staticRendererAuthority: "pure-deterministic-markup",
  mountPolicy: "one-runtime-tree-per-content-owner",
  ordinaryProgressPolicy: "patch-retained-nodes",
  topologyPolicy: "keyed-discrete-lifecycle",
  labelPolicy: "retain-static-katex-and-screen-label-nodes",
  seekPolicy: "history-independent",
  disposalPolicy: "explicit-idempotent"
} as const);
