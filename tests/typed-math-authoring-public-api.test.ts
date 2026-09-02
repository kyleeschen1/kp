import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as calculus from "../src/math/authoring/calculus.ts";
import * as core from "../src/math/authoring/public-api.ts";
import * as latex from "../src/math/authoring/latex.ts";
import * as optics from "../src/math/authoring/optics.ts";
import * as scene from "../src/math/authoring/scene.ts";
import * as algebra from "../src/math/authoring/algebra.ts";
import * as units from "../src/math/authoring/units.ts";

const entrypoints = [
  "src/math/authoring/public-api.ts",
  "src/math/authoring/calculus.ts",
  "src/math/authoring/optics.ts",
  "src/math/authoring/latex.ts",
  "src/math/authoring/scene.ts",
  "src/math/authoring/algebra.ts",
  "src/math/authoring/units.ts"
] as const;

test("typed math authoring entrypoints expose exact runtime inventories", () => {
  assert.deepEqual(Object.keys(core).sort(), [
    "add",
    "composeKpFunctionSignatures",
    "constant",
    "cos",
    "createKpMathAuthoringContext",
    "createKpScalarExpression",
    "createKpScalarParameter",
    "createKpTypedEquation",
    "createKpTypedMatrix",
    "createKpTypedVector",
    "defineKpAuthoredFunction",
    "defineKpTypedFunction",
    "divide",
    "evaluateKpTypedMatrix",
    "isKpTypedVectorFunction",
    "multiply",
    "multiplyKpTypedMatrices",
    "negate",
    "power",
    "projectKpTypedMathToLatex",
    "sin",
    "variable"
  ]);
  assert.deepEqual(Object.keys(calculus).sort(), [
    "deriveKpAuthoredHessian",
    "deriveKpAuthoredJacobian",
    "deriveKpHessian",
    "deriveKpJacobian",
    "kpHessianConstructDescriptor",
    "kpJacobianConstructDescriptor",
    "projectKpDerivativeMatrixToLatex"
  ]);
  assert.deepEqual(Object.keys(optics).sort(), [
    "createKpEquationOptics",
    "createKpMatrixOptics",
    "resolveKpSemanticSelection",
    "transformKpSemanticSelection"
  ]);
  assert.deepEqual(Object.keys(latex).sort(), [
    "elaborateKpTypedLatexEquation",
    "elaborateKpTypedLatexFunction"
  ]);
  assert.deepEqual(Object.keys(scene).sort(), [
    "KpTypedMathSceneRecoveryError",
    "createKpTypedMathSceneHandle",
    "createKpTypedMathSceneTimeline",
    "recoverKpTypedMathObjectAtStep",
    "resolveKpSemanticSelectionAtStep"
  ]);
  assert.deepEqual(Object.keys(algebra).sort(), [
    "applyKpMatrixRepresentation",
    "composeKpLinearMaps",
    "createKpCartesianSpace",
    "createKpFiniteBasis",
    "createKpFloatingPointScalars",
    "createKpLinearMap",
    "createKpStandardMathAuthoringContext",
    "createKpStandardScalarSpace",
    "identityKpLinearMap",
    "representKpLinearMap",
    "sameKpFiniteBasis"
  ]);
  assert.deepEqual(Object.keys(units).sort(), [
    "createKpUnitDescriptor",
    "createKpUnitTaggedScalarSpace",
    "createKpUnitValue",
    "projectKpDerivativeUnitToLatex"
  ]);
});

test("typed math authoring entrypoints are explicit declaration-only facades", () => {
  for (const path of entrypoints) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /export\s+\*/);
    assert.doesNotMatch(source, /\bfunction\b|\bclass\b|=>/);
  }
});
