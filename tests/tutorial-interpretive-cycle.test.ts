import assert from "node:assert/strict";
import test from "node:test";
import type { KpClaimSceneGraphBundle } from "../src/tutorial/claim-scene-graphs.ts";
import type { KpHermeneuticTutorialModule } from "../src/tutorial/hermeneutic-module.ts";
import {
  kpInterpretivePhaseOrder,
  validateKpInterpretiveCycle,
  type KpInterpretiveCycle
} from "../src/tutorial/interpretive-cycle.ts";

const module = {
  id: "tutorial.test",
  version: 1,
  title: "Test",
  clockId: "clock.test",
  canonicalSceneIds: ["scene.test"],
  views: [],
  scenes: [
    {
      id: "scene.test",
      title: "Test",
      viewIds: [],
      checkpointIds: kpInterpretivePhaseOrder.map((kind) => `checkpoint.${kind}`)
    }
  ],
  checkpoints: kpInterpretivePhaseOrder.map((kind, index) => ({
    id: `checkpoint.${kind}`,
    sceneId: "scene.test",
    progress: index / 3,
    viewIds: [],
    label: kind
  }))
} satisfies KpHermeneuticTutorialModule;

const graphBundle = {
  claimGraph: {
    id: "claims.test",
    nodes: kpInterpretivePhaseOrder.map((kind) => ({
      id: `claim.${kind}`,
      statement: kind,
      evidenceIds: []
    })),
    edges: []
  },
  sceneGraph: {
    id: "scene-graph.test",
    nodes: kpInterpretivePhaseOrder.map((kind) => ({
      id: `scene-node.${kind}`,
      kind: "semantic-object" as const
    })),
    edges: []
  },
  bindings: kpInterpretivePhaseOrder.map((kind) => ({
    id: `binding.${kind}`,
    claimId: `claim.${kind}`,
    sceneNodeIds: [`scene-node.${kind}`],
    role: "subject" as const
  }))
} satisfies KpClaimSceneGraphBundle;

function cycle(): KpInterpretiveCycle {
  return {
    id: "cycle.test",
    title: "From whole to part and back",
    phases: kpInterpretivePhaseOrder.map((kind) => ({
      id: `phase.${kind}`,
      kind,
      claimIds: [`claim.${kind}`],
      checkpointIds: [`checkpoint.${kind}`],
      focusBindingIds: [`binding.${kind}`]
    }))
  };
}

test("interpretive cycles require the authored whole-part-relation-reintegration order", () => {
  assert.deepEqual(
    validateKpInterpretiveCycle({ cycle: cycle(), module, graphBundle }),
    []
  );
});

test("animation order cannot substitute for a missing pedagogical phase", () => {
  const input = cycle();
  const diagnostics = validateKpInterpretiveCycle({
    cycle: { ...input, phases: input.phases.slice(1) },
    module,
    graphBundle
  });

  assert.equal(diagnostics[0]?.path, "phases");
  assert.equal(diagnostics[1]?.path, "phases[0].kind");
});
