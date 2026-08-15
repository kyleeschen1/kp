import assert from "node:assert/strict";
import test from "node:test";

import { kpCanonicalLogExponentAuthoredProgram } from "../src/semantic/log-exponent-authored-operations.ts";
import {
  compileKpApplyNaturalLogBothSides,
  isKpCompiledLogExponentOperation
} from "../src/semantic/log-exponent-transformation-compiler.ts";
import { kpCanonicalLogExponentSolveStates } from "../src/semantic/log-exponent-solve-states.ts";

test("apply-log compilation preserves all material and introduces one balanced wrapper pair", () => {
  const operation = kpCanonicalLogExponentAuthoredProgram.operations[0]!;
  assert.equal(operation.kind, "apply-natural-log-both-sides");
  if (operation.kind !== "apply-natural-log-both-sides") return;
  const compiled = compileKpApplyNaturalLogBothSides({
    operation,
    source: kpCanonicalLogExponentSolveStates[0]!,
    target: kpCanonicalLogExponentSolveStates[1]!
  });
  assert.equal(isKpCompiledLogExponentOperation(compiled), true);
  assert.deepEqual(
    compiled.transformation.correspondenceMap?.records.map((record) => ({
      id: record.id,
      relation: record.relation,
      source: record.sourceSelectorIds,
      target: record.targetSelectorIds
    })),
    [
      { id: "correspondence.apply-log.equality", relation: "identity", source: ["source.equality"], target: ["logged.equality"] },
      { id: "correspondence.apply-log.power", relation: "role-change", source: ["source.left"], target: ["logged.left.power"] },
      { id: "correspondence.apply-log.base", relation: "identity", source: ["source.base"], target: ["logged.base"] },
      { id: "correspondence.apply-log.unknown-x", relation: "identity", source: ["source.exponent"], target: ["logged.exponent"] },
      { id: "correspondence.apply-log.right-value", relation: "role-change", source: ["source.right"], target: ["logged.right"] },
      {
        id: "correspondence.apply-log.introduce-balanced-wrappers",
        relation: "introduction",
        source: [],
        target: ["logged.left.log", "logged.right.log"]
      }
    ]
  );
  assert.deepEqual(compiled.transformation.assumptions, operation.assumptionIds);
});

test("spread compiled transformations cannot inherit executable authority", () => {
  const operation = kpCanonicalLogExponentAuthoredProgram.operations[0]!;
  if (operation.kind !== "apply-natural-log-both-sides") return;
  const compiled = compileKpApplyNaturalLogBothSides({
    operation,
    source: kpCanonicalLogExponentSolveStates[0]!,
    target: kpCanonicalLogExponentSolveStates[1]!
  });
  assert.equal(isKpCompiledLogExponentOperation({ ...compiled }), false);
});
