import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpLogExponentExemplarIdentity,
  kpLogExponentPreservationBoundary,
  kpLogExponentReferenceInventory,
  kpLogExponentRollbackUnits,
  kpLogExponentVisualAcceptance
} from "../src/architecture/log-exponent-exemplar-contract.ts";

test("log-exponent exemplar contract points only at present source authority", async () => {
  for (const reference of kpLogExponentReferenceInventory) {
    assert.ok((await readFile(reference.path, "utf8")).length > 0, reference.path);
  }
});

test("log-exponent exemplar contract freezes exact endpoints and review laws", () => {
  assert.deepEqual(kpLogExponentExemplarIdentity, {
    animationId: "animation.algebra.log-exponent.solve-two-power-x",
    fixtureId: "log-exponent.solve-two-power-x",
    familyId: "family.algebra.exponent-log-laws",
    sourceLatex: "2^x=7",
    wrappedLatex: "\\ln(2^x)=\\ln 7",
    extractedLatex: "x\\ln 2=\\ln 7",
    solvedLatex: "x=\\frac{\\ln 7}{\\ln 2}",
    pressureCallerId: "animation.algebra.log-quotient.difference-to-quotient"
  });
  assert.equal(kpLogExponentVisualAcceptance.length, 9);
  assert.ok(kpLogExponentVisualAcceptance.some((item) =>
    item.includes("visibly distinct")
  ));
  assert.ok(kpLogExponentVisualAcceptance.some((item) =>
    item.includes("no generic opacity fade")
  ));
  assert.ok(kpLogExponentPreservationBoundary.includes(
    "one deterministic host clock and pure progress sampling"
  ));
  assert.deepEqual(kpLogExponentRollbackUnits, [
    "canonical solve-two-power-x asset and its family-local compiler",
    "log-difference-to-quotient pressure caller",
    "bounded linearity pressure caller",
    "optional operation-transport promotion"
  ]);
});

