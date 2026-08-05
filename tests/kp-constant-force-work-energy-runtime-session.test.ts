import assert from "node:assert/strict";
import test from "node:test";

import {
  kpConstantForceWorkEnergyRuntimeSessionContract,
  type KpConstantForceWorkEnergyRuntimeSession
} from "../src/rendering/constant-force-work-energy-runtime-session.ts";

test("physics retained runtime contract remains exemplar-local", () => {
  assert.deepEqual(kpConstantForceWorkEnergyRuntimeSessionContract, {
    scope: "constant-force-work-energy-exemplar",
    staticRendererAuthority: "pure-deterministic-markup",
    mountPolicy: "one-runtime-tree-per-content-owner",
    ordinaryProgressPolicy: "patch-retained-nodes",
    topologyPolicy: "remount-only-for-viewport-structure-change",
    labelPolicy: "retain-static-and-dynamic-katex-nodes",
    seekPolicy: "history-independent",
    disposalPolicy: "explicit-idempotent"
  });
});

test("physics retained runtime exposes only content, apply, status, and disposal", () => {
  type Surface = keyof KpConstantForceWorkEnergyRuntimeSession;
  const surface: readonly Surface[] = ["content", "status", "apply", "dispose"];

  assert.deepEqual(surface, ["content", "status", "apply", "dispose"]);
});
