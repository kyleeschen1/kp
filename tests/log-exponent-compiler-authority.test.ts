import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLogExponentStateRoles,
  findKpLogExponentRoleBinding,
  isKpCompiledLogExponentStateRoles
} from "../src/semantic/log-exponent-compiler-authority.ts";
import { kpCanonicalLogExponentSolveStates } from "../src/semantic/log-exponent-solve-states.ts";

test("compiler mints exhaustive semantic roles for each canonical state", () => {
  const compiled = kpCanonicalLogExponentSolveStates.map(
    compileKpLogExponentStateRoles
  );
  assert.ok(compiled.every(isKpCompiledLogExponentStateRoles));
  assert.equal(
    findKpLogExponentRoleBinding(compiled[0]!, "power")?.occurrenceIds[0],
    "source.left"
  );
  assert.equal(
    findKpLogExponentRoleBinding(compiled[1]!, "logged-power-value")?.occurrenceIds[0],
    "logged.left.log"
  );
  assert.equal(
    findKpLogExponentRoleBinding(compiled[2]!, "extracted-product")?.occurrenceIds[0],
    "extracted.left"
  );
  assert.equal(
    findKpLogExponentRoleBinding(compiled[3]!, "solved-quotient")?.occurrenceIds[0],
    "solved.right"
  );
});

test("serialized and spread role shapes cannot inherit compiler authority", () => {
  const compiled = compileKpLogExponentStateRoles(
    kpCanonicalLogExponentSolveStates[0]!
  );
  assert.equal(isKpCompiledLogExponentStateRoles({ ...compiled }), false);
  assert.equal(
    isKpCompiledLogExponentStateRoles(JSON.parse(JSON.stringify(compiled))),
    false
  );
  assert.throws(
    () => findKpLogExponentRoleBinding(
      { ...compiled } as typeof compiled,
      "base"
    ),
    /nominal compiler authority/
  );
});
