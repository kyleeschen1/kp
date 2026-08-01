import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  compileKpAnimationAssetSemanticRefs,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  createEconomicsEquilibriumAnimationAsset,
  economicsEquilibriumAnimationId,
  economicsEquilibriumTransformationId
} from "../src/animation/economics-equilibrium-adapter.ts";

test("economics equilibrium asset defines persistent graph surface semantics", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const target = animation.renderTargets[0];

  assert.equal(animation.id, economicsEquilibriumAnimationId);
  assert.deepEqual(
    animation.bundle.objects.map(({ id, objectType }) => [id, objectType]),
    [
      ["graph.economics.supply-demand", "graph-2d"],
      ["axis.economics.quantity", "axis-2d"],
      ["axis.economics.price", "axis-2d"],
      ["curve.economics.supply", "economics-linear-supply-curve"],
      ["curve.economics.demand", "economics-linear-demand-curve"],
      ["parameter.economics.demand-price-intercept", "economics-parameter"],
      ["equilibrium.economics.supply-demand", "economics-equilibrium"],
      ["market-sides.economics.supply-demand", "economics-market-sides"],
      ["state.economics.supply-demand.before", "economics-supply-demand-state"],
      ["state.economics.supply-demand.after", "economics-supply-demand-state"]
    ]
  );
  assert.equal(target?.kind, "graph");
  assert.deepEqual(target?.metadata, {
    graphMotionKind: "economics-supply-demand-equilibrium-shift",
    graphId: "graph.economics.supply-demand",
    supplyCurveId: "curve.economics.supply",
    demandCurveId: "curve.economics.demand",
    equilibriumId: "equilibrium.economics.supply-demand",
    interceptParameterId: "parameter.economics.demand-price-intercept",
    beforeStateId: "state.economics.supply-demand.before",
    afterStateId: "state.economics.supply-demand.after"
  });
});

test("economics shift transformation preserves model identities and roles", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const transformation = animation.transformations[0]!;
  const correspondence = new Map(
    transformation.correspondence.map((record) => [
      record.sourceSelectorId,
      record
    ])
  );

  assert.equal(transformation.id, economicsEquilibriumTransformationId);
  assert.deepEqual(transformation.preserves, ["identity", "role", "structure"]);
  assert.deepEqual(
    correspondence.get("curve.economics.supply.body"),
    {
      sourceSelectorId: "curve.economics.supply.body",
      targetSelectorId: "curve.economics.supply.body",
      preserves: ["identity", "value", "presentation"]
    }
  );
  assert.deepEqual(
    correspondence.get("curve.economics.demand.body"),
    {
      sourceSelectorId: "curve.economics.demand.body",
      targetSelectorId: "curve.economics.demand.body",
      preserves: ["identity", "role"]
    }
  );
  assert.equal(
    correspondence.get("equilibrium.economics.supply-demand.before")
      ?.targetSelectorId,
    "equilibrium.economics.supply-demand.after"
  );
  assert.equal(
    correspondence.get("market-sides.economics.supply-demand.surplus")
      ?.targetSelectorId,
    "market-sides.economics.supply-demand.surplus"
  );
});

test("economics graph asset closes semantic and runtime references", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);

  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
  assert.equal(refs.renderTargetRefs[0]?.kind, "graph");
  assert.ok(
    refs.semanticObjectRefs.some(
      ({ objectId }) => objectId === "equilibrium.economics.supply-demand"
    )
  );
});

