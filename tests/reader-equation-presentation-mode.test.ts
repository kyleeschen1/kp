import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpReaderEquationPresentationAxes,
  kpReaderDefaultEquationPresentationProfileId,
  kpReaderEquationDerivationModes,
  kpReaderEquationIdentityModes,
  kpReaderEquationPresentationProfiles,
  resolveKpReaderEquationPresentationProfile,
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

test("Explain Standard and Fluent are restrained certified presets", () => {
  assert.equal(kpReaderDefaultEquationPresentationProfileId, "standard");
  assert.deepEqual(kpReaderEquationPresentationProfiles, {
    explain: {
      id: "explain",
      label: "Explain",
      derivation: "balanced-operation-v1",
      identity: "hold-until-settled-v1"
    },
    standard: {
      id: "standard",
      label: "Standard",
      derivation: "balanced-operation-v1",
      identity: "omit-transient-v1"
    },
    fluent: {
      id: "fluent",
      label: "Fluent",
      derivation: "certified-transfer-v1",
      identity: "omit-transient-v1"
    }
  });
  assert.equal(resolveKpReaderEquationPresentationProfile(undefined).id, "standard");
  assert.equal(resolveKpReaderEquationPresentationProfile("explain").id, "explain");
  assert.ok(Object.values(kpReaderEquationPresentationProfiles).every(Object.isFrozen));
});

test("unknown profile ids fail instead of silently changing pedagogy", () => {
  assert.throws(
    () => resolveKpReaderEquationPresentationProfile("magical"),
    /Unknown reader equation presentation profile magical/
  );
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
