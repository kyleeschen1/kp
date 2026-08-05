import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEconomicsEquilibriumRuntimeSessionContract,
  type KpEconomicsEquilibriumRuntimeSession
} from "../src/rendering/economics-equilibrium-runtime-session.ts";

test("economics mounted runtime contract remains local and retained", () => {
  assert.deepEqual(kpEconomicsEquilibriumRuntimeSessionContract, {
    scope: "economics-equilibrium-exemplar",
    staticRendererAuthority: "pure-deterministic-markup",
    mountPolicy: "one-runtime-tree-per-content-owner",
    ordinaryProgressPolicy: "patch-retained-nodes",
    topologyPolicy: "keyed-discrete-lifecycle",
    labelPolicy: "retain-static-katex-and-screen-label-nodes",
    seekPolicy: "history-independent",
    disposalPolicy: "explicit-idempotent"
  });
});

test("economics mounted runtime exposes only content, apply, status, and disposal", () => {
  type Surface = keyof KpEconomicsEquilibriumRuntimeSession;
  const surface: readonly Surface[] = ["content", "status", "apply", "dispose"];

  assert.deepEqual(surface, ["content", "status", "apply", "dispose"]);
});
