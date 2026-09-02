import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  measureTypedMathAuthoringErgonomics,
  type KpAuthoringErgonomicsMeasurement
} from "../scripts/measure-typed-math-authoring-ergonomics.ts";

const sourcePath = "tests/type-fixtures/typed-math-authoring-public-api.ts";
const baselinePath =
  "tests/fixtures/typed-math-authoring-ergonomics-baseline.json";

test("typed math public authoring has a stable ergonomics baseline", () => {
  const source = readFileSync(sourcePath, "utf8");
  const expected = JSON.parse(
    readFileSync(baselinePath, "utf8")
  ) as KpAuthoringErgonomicsMeasurement;

  assert.deepEqual(
    measureTypedMathAuthoringErgonomics(source, sourcePath),
    expected
  );
  assert.ok(expected.manualIdentityLiterals > 0);
  assert.ok(expected.lowLevelConstructorCalls > 0);
  assert.ok(expected.authoredSemanticSetupLines > 0);
});

test("the ergonomics measure rejects missing or duplicated region markers", () => {
  assert.throws(
    () => measureTypedMathAuthoringErgonomics("const x = 1;", "missing.ts"),
    /Expected one ordered/
  );

  const duplicated = [
    "// KP_AUTHORING_ERGONOMICS_START: affine-jacobian-and-quadratic-hessian",
    "const first = 1;",
    "// KP_AUTHORING_ERGONOMICS_START: affine-jacobian-and-quadratic-hessian",
    "const second = 2;",
    "// KP_AUTHORING_ERGONOMICS_END: affine-jacobian-and-quadratic-hessian"
  ].join("\n");
  assert.throws(
    () => measureTypedMathAuthoringErgonomics(duplicated, "duplicated.ts"),
    /Expected exactly one/
  );
});
