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
const ergonomicSourcePath =
  "tests/type-fixtures/typed-math-authoring-ergonomic-public-api.ts";

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

test("the ergonomic public consumer reduces every burden by at least half", () => {
  const baseline = JSON.parse(
    readFileSync(baselinePath, "utf8")
  ) as KpAuthoringErgonomicsMeasurement;
  const source = readFileSync(ergonomicSourcePath, "utf8");
  const ergonomic = measureTypedMathAuthoringErgonomics(
    source,
    ergonomicSourcePath
  );

  assert.ok(
    ergonomic.manualIdentityLiterals <= baseline.manualIdentityLiterals / 2
  );
  assert.ok(
    ergonomic.lowLevelConstructorCalls <= baseline.lowLevelConstructorCalls / 2
  );
  assert.ok(
    ergonomic.authoredSemanticSetupLines <=
      baseline.authoredSemanticSetupLines / 2
  );
  assert.deepEqual(ergonomic, {
    schemaVersion: "kp.typed-math-authoring-ergonomics.v1",
    source: ergonomicSourcePath,
    region: baseline.region,
    manualIdentityLiterals: 0,
    lowLevelConstructorCalls: 0,
    authoredSemanticSetupLines: 16,
    constructorCalls: {}
  });
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
