import assert from "node:assert/strict";
import test from "node:test";

import {
  createFractionalLinearEquationKpAsset,
  fractionalLinearEquationAssetIds as ids
} from "../src/semantic/fractional-linear-equation-asset.ts";
import {
  createFractionalLinearCertifiedTransferProjection
} from "../src/semantic/fractional-linear-certified-transfer.ts";

test("fluent transfer is a projection over the exact balanced proof", () => {
  const projection = createFractionalLinearCertifiedTransferProjection();

  assert.deepEqual({
    source: projection.sourceObjectId,
    bridge: projection.bridgeObjectId,
    target: projection.targetObjectId,
    proof: projection.proofTransformationIds
  }, {
    source: ids.rightSimplified,
    bridge: ids.denominatorCancelled,
    target: ids.solved,
    proof: [ids.multiply, ids.cancelDenominator, ids.simplifyProduct]
  });
  assert.equal(projection.kind, "certified-fluent-transfer-projection");
  assert.equal("transformType" in projection, false);
  assert.equal("correspondenceMap" in projection, false);
  assert.ok(Object.isFrozen(projection));
});

test("the denominator motion remains a presentation proxy with explicit witnesses", () => {
  const projection = createFractionalLinearCertifiedTransferProjection();

  assert.deepEqual(projection.denominatorProxy, {
    kind: "presentation-proxy",
    sourceSelectorId: `${ids.rightSimplified}.fraction.denominator.2`,
    bridgeSelectorId: `${ids.denominatorCancelled}.rhs.multiplier.2`,
    balancedFactorSelectorIds: [
      `${ids.multiplied}.lhs.multiplier.2`,
      `${ids.multiplied}.rhs.multiplier.2`
    ],
    cancellationSelectorIds: [
      `${ids.multiplied}.lhs.multiplier.2`,
      `${ids.multiplied}.fraction.denominator.2`
    ]
  });
});

test("certification rejects a presentation projected from non-strict proof", () => {
  const asset = createFractionalLinearEquationKpAsset();
  const transformations = asset.transformations.map((transformation) =>
    transformation.id === ids.multiply
      ? { ...transformation, lawRefs: [{ id: "law.sampled", level: "sampled" as const }] }
      : transformation
  );

  assert.throws(
    () => createFractionalLinearCertifiedTransferProjection({
      ...asset,
      transformations
    }),
    /requires a strict law/
  );
});

test("certification rejects a discontinuous proof chain", () => {
  const asset = createFractionalLinearEquationKpAsset();
  const transformations = asset.transformations.map((transformation) =>
    transformation.id === ids.cancelDenominator
      ? { ...transformation, sourceObjectIds: [ids.rightSimplified] }
      : transformation
  );

  assert.throws(
    () => createFractionalLinearCertifiedTransferProjection({
      ...asset,
      transformations
    }),
    /proof is discontinuous/
  );
});
