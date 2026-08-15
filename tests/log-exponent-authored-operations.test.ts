import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalLogExponentAuthoredProgram,
  kpCanonicalLogExponentAuthoredProgram,
  type KpLogExponentAuthoredOperation
} from "../src/semantic/log-exponent-authored-operations.ts";
import { kpCanonicalLogExponentDomainContract } from "../src/semantic/log-exponent-domain-assumptions.ts";
import { kpCanonicalLogExponentSolveStates } from "../src/semantic/log-exponent-solve-states.ts";

test("canonical authored program assigns one typed operation to every state seam", () => {
  assert.deepEqual(
    kpCanonicalLogExponentAuthoredProgram.operations.map(({ kind }) => kind),
    [
      "apply-natural-log-both-sides",
      "extract-log-power-exponent",
      "divide-both-sides-by-log-base"
    ]
  );
  assert.equal(kpCanonicalLogExponentAuthoredProgram.stateIds.length, 4);
  kpCanonicalLogExponentAuthoredProgram.operations.forEach((operation, index) => {
    assert.equal(operation.sourceStateId, kpCanonicalLogExponentAuthoredProgram.stateIds[index]);
    assert.equal(operation.targetStateId, kpCanonicalLogExponentAuthoredProgram.stateIds[index + 1]);
  });
});

test("authored operations remain mathematically distinct and exhaustively inspectable", () => {
  const descriptions = kpCanonicalLogExponentAuthoredProgram.operations.map(describe);
  assert.deepEqual(descriptions, [
    "wrap semantic.power.two-to-x and semantic.value.seven",
    "extract semantic.unknown.x from semantic.power.two-to-x",
    "divide by semantic.value.log-two"
  ]);
});

test("authored program fails closed when required domain evidence is absent", () => {
  const incompleteDomain = {
    ...kpCanonicalLogExponentDomainContract,
    assumptions: kpCanonicalLogExponentDomainContract.assumptions.filter(
      ({ id }) => id !== "assumption.log-exponent.log-base-nonzero"
    )
  };
  assert.throws(
    () => createKpCanonicalLogExponentAuthoredProgram({
      states: kpCanonicalLogExponentSolveStates,
      domain: incompleteDomain
    }),
    /lacks assumption/
  );
});

function describe(operation: KpLogExponentAuthoredOperation): string {
  switch (operation.kind) {
    case "apply-natural-log-both-sides":
      return `wrap ${operation.argumentSemanticIds.join(" and ")}`;
    case "extract-log-power-exponent":
      return `extract ${operation.exponentSemanticId} from ${operation.powerSemanticId}`;
    case "divide-both-sides-by-log-base":
      return `divide by ${operation.divisorSemanticId}`;
  }
}
