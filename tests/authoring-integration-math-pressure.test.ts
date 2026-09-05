import assert from "node:assert/strict";
import test from "node:test";
import { assembleKpSemanticStateModel } from "../src/semantic-state/authoring-model-assembly.ts";
import { kpStateGroup, kpStateValue } from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticSnapshotRecoveryIndex } from "../src/semantic-state/pinned-recovery.ts";
import { add, constant, multiply, power } from "../src/math/expression.ts";
import {
  createKpScalarExpression, createKpScalarParameter, createKpTypedVector,
  createKpTypedMatrixFromRows, defineKpTypedFunction, deriveKpJacobian, deriveKpHessian,
  evaluateKpTypedMatrix, type KpDerivativeMatrix, type KpScalarValue, type KpTypedMatrix
} from "../src/math/typed-semantic-math.ts";
import { createKpMatrixOptics, type KpTraversal } from "../src/math/typed-semantic-optics.ts";
import { createKpTypedMathStateValue } from "../src/math/typed-math-state-value.ts";
import { pinKpTypedMathStateSelection } from "../src/math/typed-math-state-optics.ts";
import { createKpTypedMathLocalCapabilities, recoverKpTypedMathCapability } from "../src/math/typed-math-local-capabilities.ts";
import { createKpCartesianSpace, createKpStandardScalarSpace } from "../src/math/algebra/standard-spaces.ts";
import { createKpDifferentiableMap } from "../src/math/algebra/differentiable-map.ts";
import { createKpLinearMap } from "../src/math/algebra/linear-map.ts";
import { createKpSecondDerivativeMap } from "../src/math/algebra/second-derivative-map.ts";
import { projectKpDerivativeAtToJacobian } from "../src/math/algebra/jacobian-projection.ts";
import { projectKpSecondDerivativeToHessian } from "../src/math/algebra/hessian-projection.ts";

function fixture() {
  const x = createKpScalarParameter({ id: "pressure.x", name: "x" });
  const y = createKpScalarParameter({ id: "pressure.y", name: "y" });
  const affine = defineKpTypedFunction({ id: "pressure.affine", name: "f", parameters: [x, y] as const,
    output: createKpTypedVector({ id: "pressure.affine.output", entries: [
      createKpScalarExpression({ id: "pressure.affine.a", expression: add(multiply(constant(2), x.expression), y.expression) }),
      createKpScalarExpression({ id: "pressure.affine.b", expression: add(multiply(constant(4), x.expression), multiply(constant(-3), y.expression)) })
    ] as const }) });
  const quadratic = defineKpTypedFunction({ id: "pressure.quadratic", name: "q", parameters: [x, y] as const,
    output: createKpScalarExpression({ id: "pressure.quadratic.output",
      expression: add(power(x.expression, 2), multiply(x.expression, y.expression), power(y.expression, 2)) }) });
  const jacobian = deriveKpJacobian({ id: "pressure.jacobian", source: affine });
  const hessian = deriveKpHessian({ id: "pressure.hessian", source: quadratic });
  const model = assembleKpSemanticStateModel({ namespace: "lesson.math-pressure",
    schema: kpStateGroup({ jacobian: kpStateValue(createKpTypedMathStateValue(jacobian)),
      hessian: kpStateValue(createKpTypedMathStateValue(hessian)) }) });
  return { jacobian, hessian, model };
}

function firstColumn<Kind extends "jacobian" | "hessian">(
  derivative: KpDerivativeMatrix<Kind, 2, 2>
): KpTraversal<KpDerivativeMatrix<Kind, 2, 2>, KpScalarValue> {
  const matrix = createKpMatrixOptics(derivative.matrix).cols.slice(0, 1);
  return { ...matrix, id: `${derivative.id}.first-column`,
    descriptor: { ...matrix.descriptor, segments: [{ kind: "field", name: "matrix" }, ...matrix.descriptor.segments] },
    resolve: root => matrix.resolve(root.matrix).map(ref => ({ ...ref, path: `matrix.${ref.path}` })),
    replace: (root, replacements) => ({ ...root, matrix: matrix.replace(root.matrix, replacements) }) };
}

test("affine Jacobian and quadratic Hessian retain macro and shape evidence through pinned state", () => {
  const { jacobian, hessian, model } = fixture();
  const state = model.handles.pin(model.initial);
  const rows: 2 = state.jacobian.read().matrix.rowCount;
  const columns: 2 = state.hessian.read().matrix.columnCount;
  assert.deepEqual([rows, columns], [2, 2]);
  // @ts-expect-error Static derivative dimensions must not widen to an unrelated shape.
  const wrongShape: KpTypedMatrix<3, 2> = state.jacobian.read().matrix;
  void wrongShape;
  assert.deepEqual(evaluateKpTypedMatrix(state.jacobian.read().matrix, {}), [[2, 1], [4, -3]]);
  assert.deepEqual(evaluateKpTypedMatrix(state.hessian.read().matrix, {}), [[2, 1], [1, 2]]);
  for (const value of [state.jacobian.read(), state.hessian.read()]) {
    assert.deepEqual(JSON.parse(JSON.stringify(value)), value);
    assert.equal(value.macro.id, `kp.math.macro.${value.derivativeKind}.v1`);
    assert.equal(value.correspondenceMap.records[0]?.relation, "fan-out");
  }
  const pin = pinKpTypedMathStateSelection({ model, snapshot: model.initial,
    target: model.handles.refs.jacobian, optic: firstColumn(jacobian) });
  const result = pin.rewrite({ before: model.initial, applicationId: "retain-column",
    operation: { id: "retain-jacobian", relation: "identity", authorityIds: [jacobian.macro.id],
      summary: "Retain the existing exact derivative entries and their identities." },
    transform: entry => entry });
  const index = createKpSemanticSnapshotRecoveryIndex([model.initial, result.commit.after]);
  assert.deepEqual(pin.recover(index).refs.map(ref => ref.entityId),
    ["pressure.jacobian.entry.0.0", "pressure.jacobian.entry.1.0"]);
  const after = model.handles.pin(result.commit.after);
  assert.deepEqual(after.jacobian.read().macro, jacobian.macro);
  assert.deepEqual(after.jacobian.read().correspondenceMap, jacobian.correspondenceMap);
  assert.deepEqual(after.hessian.read().symmetryEvidence, hessian.symmetryEvidence);
  const hessianPin = pinKpTypedMathStateSelection({ model, snapshot: result.commit.after,
    target: model.handles.refs.hessian, optic: firstColumn(hessian) });
  assert.deepEqual(hessianPin.recover(index).refs.map(ref => ref.entityId),
    ["pressure.hessian.entry.0.0", "pressure.hessian.entry.1.0"]);
});

test("runtime matrix dimensions remain existential through storage and pinned optics", () => {
  const matrix = createKpTypedMatrixFromRows({ id: "pressure.dynamic",
    rows: [[createKpScalarExpression({ id: "pressure.dynamic.a", expression: constant(7) })]] });
  const model = assembleKpSemanticStateModel({ namespace: "lesson.dynamic-pressure",
    schema: kpStateGroup({ matrix: kpStateValue(createKpTypedMathStateValue(matrix)) }) });
  const stored = model.handles.pin(model.initial).matrix.read();
  // @ts-expect-error Runtime validation does not prove a literal dimension to the type system.
  const inventedDimension: 1 = stored.rowCount;
  void inventedDimension;
  const pin = pinKpTypedMathStateSelection({ model, snapshot: model.initial,
    target: model.handles.refs.matrix, optic: createKpMatrixOptics(matrix).cols.slice(0, 1) });
  const recovered = pin.recover(createKpSemanticSnapshotRecoveryIndex([model.initial])).root;
  // @ts-expect-error Recovery must not refine an existential dimension without evidence.
  const inventedRecovery: KpTypedMatrix<1, 1> = recovered;
  void inventedRecovery;
  assert.deepEqual(evaluateKpTypedMatrix(recovered, {}), [[7]]);
});

test("recovered calculus capabilities execute existing maps but do not invent basis authority", () => {
  const domain = createKpCartesianSpace({ id: "pressure.space", dimension: 2 });
  const scalar = createKpStandardScalarSpace({ id: "pressure.scalar" });
  const affine = createKpDifferentiableMap({ id: "pressure.affine-map", domain, codomain: domain,
    evaluate: (v): readonly [number, number] => [2 * v[0]! + v[1]!, 4 * v[0]! - 3 * v[1]!],
    derivativeAt: () => createKpLinearMap({ id: "pressure.affine-derivative", domain, codomain: domain,
      apply: (v): readonly [number, number] => [2 * v[0]! + v[1]!, 4 * v[0]! - 3 * v[1]!],
      linearity: { kind: "tested", suiteId: "pressure.affine-laws", equalityId: domain.vectors.equality.id } }) });
  const evidence = { kind: "tested" as const, suiteId: "pressure.quadratic-laws", equalityId: scalar.vectors.equality.id };
  const quadratic = createKpSecondDerivativeMap({ id: "pressure.quadratic-map", domain, codomain: scalar,
    apply: (a, b) => 2 * a[0]! * b[0]! + a[0]! * b[1]! + a[1]! * b[0]! + 2 * a[1]! * b[1]!,
    leftLinearity: evidence, rightLinearity: evidence, sourceFunctionIds: ["pressure.quadratic"] });
  const capabilities = createKpTypedMathLocalCapabilities("lesson.calculus-pressure");
  const j = capabilities.register({ version: "v1", capability: affine });
  const h = capabilities.register({ version: "v1", capability: quadratic });
  const model = assembleKpSemanticStateModel({ namespace: "lesson.calculus-pressure",
    schema: kpStateGroup({ j: kpStateValue(j.reference), h: kpStateValue(h.reference) }) });
  const state = model.handles.pin(model.initial);
  const source = recoverKpTypedMathCapability(state.j.read(), j);
  const secondDerivative = recoverKpTypedMathCapability(state.h.read(), h);
  assert.deepEqual(source.evaluate([3, 4]), [10, 0]);
  assert.deepEqual(source.derivativeAt([3, 4]).apply([5, 2]), [12, 14]);
  assert.equal(secondDerivative.apply([1, 0], [0, 1]), 1);
  const missingJ = projectKpDerivativeAtToJacobian({ id: "pressure.missing-j", source, at: [3, 4] });
  const missingH = projectKpSecondDerivativeToHessian({ id: "pressure.missing-h",
    sourceFunctionId: "pressure.quadratic", secondDerivative, symmetryEvidence: evidence });
  assert.equal(missingJ.status, "repair-required");
  assert.equal(missingH.status, "repair-required");
  if (missingJ.status === "repair-required") assert.equal(missingJ.code, "kp.calculus.basis-required");
  if (missingH.status === "repair-required") assert.equal(missingH.code, "kp.calculus.basis-required");
  assert.throws(() => recoverKpTypedMathCapability(state.h.read(), undefined), /exact version/);
  capabilities.dispose();
});
