import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpTransformationDrillDownHook,
  resolveKpTransformationDrillDowns,
  validateKpTransformationDrillDownHooks
} from "../src/semantic/asset-decomposition.ts";
import {
  inspectKpBehaviorAt
} from "../src/semantic/asset-inspection.ts";
import {
  createLinearSolveKpAssetBundle
} from "../src/semantic/linear-solve-asset.ts";
import { createLinearSolveKpBehavior } from
  "../src/tutorial/linear-solve-card-behavior.ts";

const cancelExplainerAsset = createKpAssetBundle({
  id: "asset.cancel-additive-inverse-explainer",
  title: "Why +3 and -3 cancel",
  objects: [
    createKpSemanticAssetObject({
      id: "identity.additive-inverse",
      objectType: "equation",
      title: "Additive inverse identity",
      value: { latex: "a + (-a) = 0" },
      selectors: [
        { id: "identity.additive-inverse.a", kind: "term", label: "a" },
        { id: "identity.additive-inverse.zero", kind: "term", label: "0" }
      ]
    })
  ]
});

test("resolveKpTransformationDrillDowns maps active inspection transforms to hooks", () => {
  const hook = createKpTransformationDrillDownHook({
    id: "drilldown.cancel-additive-inverse",
    transformationId: "transform.linear-solve.cancel-left-additive-inverse",
    title: "Explain cancellation",
    summary: "Drill into why +3 and -3 collapse to zero.",
    asset: cancelExplainerAsset
  });
  const behavior = createLinearSolveKpBehavior();
  const inspection = inspectKpBehaviorAt({
    behavior,
    timeMs: 1200,
    activeTransformationIds: (frame) =>
      frame.cardFrame.parentTimelineFrame.tracks
        .filter((track) => track.kind === "transformation" && track.active)
        .map((track) => track.targetId)
  });

  const drillDowns = resolveKpTransformationDrillDowns({
    inspection,
    hooks: [hook]
  });

  assert.equal(drillDowns.length, 1);
  assert.equal(drillDowns[0]?.id, "drilldown.cancel-additive-inverse");
  assert.equal(drillDowns[0]?.asset.id, "asset.cancel-additive-inverse-explainer");
});

test("validateKpTransformationDrillDownHooks reports missing and duplicate hooks", () => {
  const linearSolve = createLinearSolveKpAssetBundle();
  const first = createKpTransformationDrillDownHook({
    id: "drilldown.cancel",
    transformationId: "transform.linear-solve.cancel-left-additive-inverse",
    title: "Explain cancellation",
    asset: cancelExplainerAsset
  });
  const duplicateId = createKpTransformationDrillDownHook({
    id: "drilldown.cancel",
    transformationId: "transform.linear-solve.simplify-right-difference",
    title: "Explain simplification",
    asset: cancelExplainerAsset
  });
  const duplicateTransformation = createKpTransformationDrillDownHook({
    id: "drilldown.cancel-again",
    transformationId: "transform.linear-solve.cancel-left-additive-inverse",
    title: "Explain cancellation again",
    asset: cancelExplainerAsset
  });
  const missingTransformation = createKpTransformationDrillDownHook({
    id: "drilldown.missing",
    transformationId: "transform.missing",
    title: "Missing transform",
    asset: cancelExplainerAsset
  });

  assert.deepEqual(
    validateKpTransformationDrillDownHooks(
      [first, duplicateId, duplicateTransformation, missingTransformation],
      { transformations: linearSolve.transformations }
    ),
    [
      {
        path: "hooks[1].id",
        message: "Duplicate drill-down hook id: drilldown.cancel."
      },
      {
        path: "hooks[2].transformationId",
        message:
          "Duplicate drill-down hook for transformation transform.linear-solve.cancel-left-additive-inverse."
      },
      {
        path: "hooks[3].transformationId",
        message:
          "Drill-down hook drilldown.missing references missing transformation transform.missing."
      }
    ]
  );
});
