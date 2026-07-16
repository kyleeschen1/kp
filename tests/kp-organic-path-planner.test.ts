import assert from "node:assert/strict";
import test from "node:test";

import {
  planKpOrganicPath,
  sampleKpOrganicPath,
  type KpOrganicPathPlanInput
} from "../src/animation/organic-path-planner.ts";
import { planKpMotionField } from "../src/animation/motion-field.ts";

const radicalField = planKpMotionField({
  id: "field.radical-representation",
  groupEntityIds: ["exponent", "radical"],
  purpose: "representational-succession",
  sourceRegion: "upper-right",
  targetRegion: "center",
  readingDirection: "left-to-right",
  cohesion: {
    anchorEntityIds: ["exponent"],
    maximumSeparation: 0.3,
    maximumStaggerSpan: 0.2,
    preserveTokenOrder: true,
    maximumCrossings: 0,
    minimumVisibleMaterial: 0.12,
    exactTargetRegrouping: true
  }
});

const radicalInput: KpOrganicPathPlanInput = {
  id: "path.radical-opposite-corner",
  motionField: radicalField,
  sourceAnchor: { x: 110, y: 10 },
  targetAnchor: { x: 70, y: 55 },
  targetBounds: { left: 50, top: 35, width: 40, height: 40 },
  readingContext: {
    direction: "left-to-right",
    baselineY: 55
  },
  canonicalRequirement: {
    motifId: "radical.rewrite-power-as-root",
    requiredPathFamily: "opposite-corner",
    requireOppositeCornerReconciliation: true
  }
};

test("radical succession reconciles through the target corner opposite its source", () => {
  const plan = planKpOrganicPath(radicalInput);
  assert.equal(plan.selected.variant, "opposite-corner");
  assert.equal(plan.promotable, true);
  assert.equal(plan.selected.geometry.kind, "opposite-corner-reconciliation");
  if (plan.selected.geometry.kind !== "opposite-corner-reconciliation") return;
  assert.deepEqual(plan.selected.geometry.reconciliation, { x: 50, y: 75 });
  assert.deepEqual(
    sampleKpOrganicPath(
      plan.selected,
      plan.selected.geometry.reconciliationProgress
    ),
    { x: 50, y: 75 }
  );
});

test("canonical motif requirements outrank shorter generic paths", () => {
  const plan = planKpOrganicPath(radicalInput);
  const direct = plan.candidates.find(
    (candidate) => candidate.variant === "direct"
  )!;
  assert.ok(direct.travelDistance < plan.selected.travelDistance);
  assert.equal(direct.canonicalConformant, false);
  assert.ok(direct.score > plan.selected.score);
});

test("collision scoring rejects a blocked preferred family when no motif requires it", () => {
  const plan = planKpOrganicPath({
    ...radicalInput,
    canonicalRequirement: undefined,
    obstacles: [{ left: 46, top: 70, width: 10, height: 10 }]
  });
  const opposite = plan.candidates.find(
    (candidate) => candidate.variant === "opposite-corner"
  )!;
  assert.ok(opposite.collisionCount > 0);
  assert.notEqual(plan.selected.variant, "opposite-corner");
  assert.equal(plan.selected.safe, true);
});

test("a blocked canonical motif remains explicit and non-promotable", () => {
  const plan = planKpOrganicPath({
    ...radicalInput,
    obstacles: [{ left: 46, top: 70, width: 10, height: 10 }]
  });
  assert.equal(plan.selected.variant, "opposite-corner");
  assert.equal(plan.selected.canonicalConformant, true);
  assert.equal(plan.selected.safe, false);
  assert.equal(plan.promotable, false);
  assert.match(plan.diagnostics[0]!, /intersects measured obstacles/);
});

test("reading context deterministically selects the upper or lower diagonal arc", () => {
  const diagonalField = planKpMotionField({
    ...{
      id: "field.meaningful-transform",
      groupEntityIds: ["term"],
      purpose: "meaningful-transform" as const,
      sourceRegion: "upper-left" as const,
      targetRegion: "lower-right" as const,
      readingDirection: "left-to-right" as const,
      cohesion: {
        anchorEntityIds: ["term"],
        maximumSeparation: 0.2,
        maximumStaggerSpan: 0.15,
        preserveTokenOrder: true,
        maximumCrossings: 0,
        minimumVisibleMaterial: 0.2,
        exactTargetRegrouping: true as const
      }
    }
  });
  const common = {
    id: "path.meaningful",
    motionField: diagonalField,
    sourceAnchor: { x: 0, y: 20 },
    targetAnchor: { x: 100, y: 20 },
    targetBounds: { left: 90, top: 10, width: 20, height: 20 },
    readingContext: {
      direction: "left-to-right" as const,
      baselineY: 20
    }
  };
  const forward = planKpOrganicPath(common);
  const reverseContext = planKpOrganicPath({
    ...common,
    id: "path.meaningful.reverse-context",
    readingContext: {
      ...common.readingContext,
      direction: "right-to-left"
    }
  });
  assert.equal(forward.selected.variant, "diagonal-arc-above");
  assert.equal(reverseContext.selected.variant, "diagonal-arc-below");
  assert.deepEqual(forward, planKpOrganicPath(common));
});

test("sampling preserves exact endpoints and the planner rejects authored routes", () => {
  const plan = planKpOrganicPath(radicalInput);
  assert.deepEqual(sampleKpOrganicPath(plan.selected, -1),
    radicalInput.sourceAnchor);
  assert.deepEqual(sampleKpOrganicPath(plan.selected, 2),
    radicalInput.targetAnchor);
  assert.throws(
    () =>
      planKpOrganicPath({
        ...radicalInput,
        controlPoints: [{ x: 0, y: 0 }]
      } as KpOrganicPathPlanInput & { controlPoints: unknown }),
    /authored routing is not allowed/
  );
});
