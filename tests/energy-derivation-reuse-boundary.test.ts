import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource, momentumEnergyDerivationStates } from "../domains/public-api.ts";
import { renderEnergyDerivationPassage } from "../src/tutorial/mechanics-relations/momentum-energy-derivation-publication.ts";

// An independent scalar reading, not a relabelled proof carrying physics
// authority. These tests protect the old owner when a scalar owner is added.
const scalarStates = [
  String.raw`Q=\frac{1}{2}x u^2`,
  String.raw`Q=\frac{1}{2}x\left(\frac{y}{x}\right)^2`,
  String.raw`Q=\frac{1}{2}x\frac{y^2}{x^2}`,
  String.raw`Q=\frac{y^2}{2x}`
];
const chain = (states: readonly string[]) => String.raw`$$\begin{aligned}${states.join(String.raw`\\`)}\end{aligned}$$`;

test("physics authority rejects an independent real-scalar source with a typed gap", () => {
  const requested = { schema: "kp.algebra.scalar-cancellation.proposal", positiveScalar: "x", realScalars: ["u", "y"],
    relation: "y=x*u", states: scalarStates };
  assert.deepEqual(checkMomentumEnergyDerivation(requested), {
    status: "repair-required", code: "physics.derivation.unsupported-source", path: "$"
  });
  // Keeping the physics schema tag must not launder scalar assumptions.
  assert.deepEqual(checkMomentumEnergyDerivation({ ...momentumEnergyDerivationSource, velocity: "real-scalar" }), {
    status: "repair-required", code: "physics.derivation.unsupported-source", path: "$.velocity"
  });
});

test("physics publication refuses a different scalar argument rather than animating the original one", () => {
  assert.throws(() => renderEnergyDerivationPassage(chain(scalarStates), "reuse.scalar.probe"),
    /source changed: repair the bounded semantic binding/);
});

test("editorial reuse of the same checked physics argument is already supported", () => {
  const before = "## Why does one mass factor remain?\n\n";
  const after = "\n\nThe nonzero assumption licenses cancellation; the squared momentum stays unchanged.";
  const result = renderEnergyDerivationPassage(before + chain(momentumEnergyDerivationStates) + after, "reuse.editorial.probe");
  assert.match(result, /Why does one mass factor remain/);
  assert.match(result, /nonzero assumption licenses cancellation/);
  assert.match(result, /data-derivation-revision="reuse.editorial.probe"/);
  assert.match(result, /data-refinement-view/);
});
