import assert from "node:assert/strict";
import test from "node:test";

import {
  kpLogProductKineticFigureStateIds,
  kpLogProductKineticFigureStates,
  readKpLogProductKineticFigureState
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-model.ts";
import {
  isKpLogProductKineticFigureRoute,
  KP_LOG_PRODUCT_KINETIC_FIGURE_PATH
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-route.ts";

test("log-product Kinetic Figure exposes four ordered conceptual states", () => {
  assert.deepEqual(kpLogProductKineticFigureStateIds, [
    "whole",
    "product",
    "transform",
    "result"
  ]);
  assert.deepEqual(
    kpLogProductKineticFigureStates.map(({ ordinal, pose }) => ({ ordinal, pose })),
    [
      { ordinal: 1, pose: "source" },
      { ordinal: 2, pose: "source" },
      { ordinal: 3, pose: "target" },
      { ordinal: 4, pose: "target" }
    ]
  );
  assert.equal(
    readKpLogProductKineticFigureState("transform").entryTransitionId,
    "transition.log-product.split"
  );
  assert.equal(
    readKpLogProductKineticFigureState("transform").attentionTargetId,
    "semantic.log-product.introduced-structure"
  );
  assert.equal(new Set(
    kpLogProductKineticFigureStates.map(({ proseTargetId }) => proseTargetId)
  ).size, 4);
});

test("unknown state references repair to the whole-expression state", () => {
  assert.equal(readKpLogProductKineticFigureState("result").id, "result");
  assert.equal(readKpLogProductKineticFigureState("missing").id, "whole");
  assert.equal(readKpLogProductKineticFigureState(undefined).id, "whole");
});

test("the experiment owns one exact isolated route", () => {
  assert.equal(KP_LOG_PRODUCT_KINETIC_FIGURE_PATH,
    "/experiments/kinetic-figure/log-product/");
  assert.equal(isKpLogProductKineticFigureRoute(
    "/experiments/kinetic-figure/log-product"), true);
  assert.equal(isKpLogProductKineticFigureRoute(
    "/experiments/kinetic-figure/log-product/extra"), false);
});
