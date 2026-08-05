import type {
  KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import type { KpEconomicsGraphViewport } from "./economics-equilibrium-svg.ts";
import {
  renderKpEconomicsEquilibriumRuntimeContent
} from "./economics-equilibrium-svg.ts";

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

export interface KpEconomicsEquilibriumMountedScaffold {
  readonly content: SVGGElement;
  readonly view: SVGGElement;
  readonly status: "mounted" | "disposed";
  dispose(): void;
}

const mountedScaffolds = new WeakMap<
  SVGGElement,
  KpEconomicsEquilibriumMountedScaffold
>();

export function mountKpEconomicsEquilibriumRuntimeScaffold(
  input: KpEconomicsEquilibriumRuntimeSessionInput
): KpEconomicsEquilibriumMountedScaffold {
  const extant = mountedScaffolds.get(input.content);
  if (extant?.status === "mounted") return extant;

  // Complete markup remains the deterministic mount and export authority;
  // later progress patches retain this parsed tree instead of rebuilding it.
  input.content.innerHTML = renderKpEconomicsEquilibriumRuntimeContent({
    frame: input.frame,
    viewport: input.viewport
  });
  const view = input.content.querySelector<SVGGElement>(
    ":scope > [data-kp-economics-equilibrium-view]"
  );
  if (view === null) {
    throw new Error("Economics runtime scaffold did not mount its view root.");
  }

  let disposed = false;
  const scaffold: KpEconomicsEquilibriumMountedScaffold = Object.freeze({
    content: input.content,
    view,
    get status() {
      return disposed ? "disposed" as const : "mounted" as const;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      view.remove();
      mountedScaffolds.delete(input.content);
    }
  });
  mountedScaffolds.set(input.content, scaffold);
  return scaffold;
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
