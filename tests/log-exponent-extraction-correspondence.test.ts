import assert from "node:assert/strict";
import test from "node:test";

import { kpCanonicalLogExponentAuthoredProgram } from "../src/semantic/log-exponent-authored-operations.ts";
import {
  compileKpExtractLogPowerExponent,
  isKpCompiledLogExponentOperation
} from "../src/semantic/log-exponent-transformation-compiler.ts";
import { kpCanonicalLogExponentSolveStates } from "../src/semantic/log-exponent-solve-states.ts";

test("exponent extraction compiles x continuity and explicit container lifecycle", () => {
  const operation = kpCanonicalLogExponentAuthoredProgram.operations[1]!;
  assert.equal(operation.kind, "extract-log-power-exponent");
  if (operation.kind !== "extract-log-power-exponent") return;
  const compiled = compileKpExtractLogPowerExponent({
    operation,
    source: kpCanonicalLogExponentSolveStates[1]!,
    target: kpCanonicalLogExponentSolveStates[2]!
  });
  assert.equal(isKpCompiledLogExponentOperation(compiled), true);
  const records = compiled.transformation.correspondenceMap?.records ?? [];
  assert.deepEqual(
    records.map(({ id, relation }) => ({ id, relation })),
    [
      { id: "correspondence.extract-exponent.equality", relation: "identity" },
      { id: "correspondence.extract-exponent.base", relation: "identity" },
      { id: "correspondence.extract-exponent.unknown-x", relation: "role-change" },
      { id: "correspondence.extract-exponent.log-left-operator", relation: "identity" },
      { id: "correspondence.extract-exponent.log-right-value", relation: "identity" },
      { id: "correspondence.extract-exponent.log-right-operator", relation: "identity" },
      { id: "correspondence.extract-exponent.right-value", relation: "identity" },
      { id: "correspondence.extract-exponent.logged-power-value", relation: "role-change" },
      { id: "correspondence.extract-exponent.retire-log-enclosure", relation: "removal" },
      { id: "correspondence.extract-exponent.retire-power-container", relation: "removal" },
      { id: "correspondence.extract-exponent.introduce-product-container", relation: "introduction" }
    ]
  );
  const x = records.find(({ id }) => id.endsWith("unknown-x"));
  assert.deepEqual(x?.sourceSelectorIds, ["logged.exponent"]);
  assert.deepEqual(x?.targetSelectorIds, ["extracted.coefficient"]);
  const operator = records.find(({ id }) => id.endsWith("log-left-operator"));
  assert.deepEqual(operator?.sourceSelectorIds, ["logged.left.log.operator"]);
  assert.deepEqual(operator?.targetSelectorIds, ["extracted.left.log.operator"]);
  const enclosure = records.find(({ id }) =>
    id.endsWith("retire-log-enclosure")
  );
  assert.deepEqual(enclosure?.sourceSelectorIds, [
    "logged.left.log.open",
    "logged.left.log.close"
  ]);
  assert.deepEqual(compiled.transformation.lawRefs?.map(({ id }) => id), [
    "law.logarithm.power"
  ]);
});

test("exponent extraction refuses noncanonical endpoint order", () => {
  const operation = kpCanonicalLogExponentAuthoredProgram.operations[1]!;
  if (operation.kind !== "extract-log-power-exponent") return;
  assert.throws(
    () => compileKpExtractLogPowerExponent({
      operation,
      source: kpCanonicalLogExponentSolveStates[0]!,
      target: kpCanonicalLogExponentSolveStates[2]!
    }),
    /canonical logged and extracted endpoint/
  );
});
