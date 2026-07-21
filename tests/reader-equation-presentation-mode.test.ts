import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpReaderEquationPresentationAxes,
  kpReaderEquationDerivationModes,
  kpReaderEquationIdentityModes,
  type KpReaderEquationPresentationAxes
} from "../src/reader/runtime/equation-presentation-mode.ts";

test("derivation and identity presentation axes remain independent", () => {
  const combinations = kpReaderEquationDerivationModes.flatMap((derivation) =>
    kpReaderEquationIdentityModes.map((identity) =>
      defineKpReaderEquationPresentationAxes({ derivation, identity })
    )
  );

  assert.deepEqual(combinations, [
    { derivation: "balanced-operation-v1", identity: "hold-until-settled-v1" },
    { derivation: "balanced-operation-v1", identity: "omit-transient-v1" },
    { derivation: "certified-transfer-v1", identity: "hold-until-settled-v1" },
    { derivation: "certified-transfer-v1", identity: "omit-transient-v1" }
  ]);
  assert.ok(combinations.every(Object.isFrozen));
});

test("presentation axes reject provider-invented modes", () => {
  assert.throws(() => defineKpReaderEquationPresentationAxes({
    derivation: "teleport-v9",
    identity: "omit-transient-v1"
  } as unknown as KpReaderEquationPresentationAxes), /Unknown reader equation derivation mode teleport-v9/);

  assert.throws(() => defineKpReaderEquationPresentationAxes({
    derivation: "balanced-operation-v1",
    identity: "flash-v9"
  } as unknown as KpReaderEquationPresentationAxes), /Unknown reader equation identity mode flash-v9/);
});
