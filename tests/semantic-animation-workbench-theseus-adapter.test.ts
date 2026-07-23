import assert from "node:assert/strict";
import test from "node:test";

import derivativeControl from "../docs/theseus/nodes/next-actions/next-action.kp.editor.derivative-tangent-animation-v0.json" with {
  type: "json"
};
import radicalControl from "../docs/theseus/nodes/next-actions/next-action.kp.editor.exponent-radical-visible-animations-v0.json" with {
  type: "json"
};
import workbenchRun from "../docs/theseus/nodes/run-contracts/run-contract.kp.semantic-animation-workbench-v2.json" with {
  type: "json"
};
import {
  projectKpAnimationTheseusState,
  type KpAnimationTheseusControlNode
} from "../src/editor/semantic-animation-workbench-theseus-adapter.ts";

test("Theseus adapter reads completed and planned states from durable nodes", () => {
  const projections = projectKpAnimationTheseusState([
    {
      animationId: "animation.generated.radical.square-root-as-power",
      node: radicalControl
    },
    {
      animationId: "animation.derivative-rules.tangent-graph",
      node: derivativeControl
    },
    {
      animationId: "animation.algebra.quadratic.solution-branching",
      node: workbenchRun,
      sliceId: "s22"
    }
  ]);

  assert.deepEqual(
    projections.map(({ animationId, execution, diagnostics }) => ({
      animationId,
      execution,
      diagnostics
    })),
    [
      {
        animationId: "animation.algebra.quadratic.solution-branching",
        execution: "not-scheduled",
        diagnostics: []
      },
      {
        animationId: "animation.derivative-rules.tangent-graph",
        execution: "complete",
        diagnostics: []
      },
      {
        animationId: "animation.generated.radical.square-root-as-power",
        execution: "complete",
        diagnostics: []
      }
    ]
  );
});

test("Theseus adapter exposes conflicting controls instead of choosing one", () => {
  const projections = projectKpAnimationTheseusState([
    {
      animationId: "animation.example",
      node: control("control.active", "active")
    },
    {
      animationId: "animation.example",
      node: control("control.blocked", "blocked")
    }
  ]);

  assert.equal(projections[0]!.execution, undefined);
  assert.equal(
    projections[0]!.diagnostics[0]!.code,
    "conflicting-execution-state"
  );
});

test("Theseus adapter diagnoses stale state and missing slices", () => {
  const [missing, stale] = projectKpAnimationTheseusState([
    {
      animationId: "animation.missing-slice",
      node: {
        ...control("run.missing", "ready"),
        slices: []
      },
      sliceId: "s99"
    },
    {
      animationId: "animation.stale",
      node: {
        ...control("action.stale", "resolved"),
        progress: { state: "in-progress" }
      }
    }
  ]);

  assert.equal(missing!.diagnostics[0]!.code, "missing-slice");
  assert.equal(stale!.diagnostics[0]!.code, "stale-node-state");
});

function control(
  id: string,
  status: string
): KpAnimationTheseusControlNode {
  return { id, status };
}
