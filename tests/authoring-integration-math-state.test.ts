import assert from "node:assert/strict";
import test from "node:test";
import { assembleKpSemanticStateModel } from "../src/semantic-state/authoring-model-assembly.ts";
import { kpStateGroup, kpStateValue } from "../src/semantic-state/authoring-schema.ts";
import { constant, power } from "../src/math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrix, evaluateKpTypedMatrix,
  createKpScalarParameter, defineKpTypedFunction, deriveKpHessian } from
  "../src/math/typed-semantic-math.ts";
import { createKpTypedMathStateValue, KpTypedMathStateValueError } from "../src/math/typed-math-state-value.ts";
import {
  createKpTypedMathLocalCapabilities, recoverKpTypedMathCapability, KpTypedMathCapabilityError
} from "../src/math/typed-math-local-capabilities.ts";
import { createKpCartesianSpace } from "../src/math/algebra/standard-spaces.ts";
import { createKpLinearMap } from "../src/math/algebra/linear-map.ts";

test("typed matrix values retain static dimensions through immutable state and data round trips", () => {
  const matrix = createKpTypedMatrix({ id: "state.matrix", rows: [[
    createKpScalarExpression({ id: "state.matrix.a", expression: constant(2) }),
    createKpScalarExpression({ id: "state.matrix.b", expression: constant(3) })
  ]] as const });
  const value = createKpTypedMathStateValue(matrix);
  const model = assembleKpSemanticStateModel({ namespace: "lesson.math-state",
    schema: kpStateGroup({ matrix: kpStateValue(value) }) });
  const recovered = model.handles.pin(model.initial).matrix.read();
  const rows: 1 = recovered.rowCount;
  const columns: 2 = recovered.columnCount;
  assert.deepEqual([rows, columns], [1, 2]);
  assert.deepEqual(evaluateKpTypedMatrix(recovered, {}), [[2, 3]]);
  assert.deepEqual(JSON.parse(JSON.stringify(recovered)), recovered);
  assert.ok(Object.isFrozen(recovered.rows[0]?.[0]?.expression));
  assert.notEqual(recovered, matrix);
});

function capability() {
  const space = createKpCartesianSpace({ id: "state.space", dimension: 2 });
  return createKpLinearMap({ id: "state.map", domain: space, codomain: space,
    apply: (value): readonly [number, number] => [value[0]! * 2, value[1]! * 3],
    linearity: { kind: "tested", suiteId: "state.map.test", equalityId: space.vectors.equality.id } });
}

test("only explicit capability references persist while typed callables remain version-local", () => {
  const registry = createKpTypedMathLocalCapabilities("lesson.math-local");
  const source = capability();
  const first = registry.register({ version: "v1", capability: source });
  const model = assembleKpSemanticStateModel({ namespace: "lesson.map-reference",
    schema: kpStateGroup({ map: kpStateValue(first.reference) }) });
  const stored = model.handles.pin(model.initial).map.read();
  assert.deepEqual(JSON.parse(JSON.stringify(stored)), first.reference);
  const recovered = recoverKpTypedMathCapability(stored, first);
  assert.equal(recovered, source);
  assert.deepEqual(recovered.apply([4, 5]), [8, 15]);
  assert.throws(() => registry.register({ version: "v1", capability: capability() }),
    error => error instanceof KpTypedMathCapabilityError && error.code === "kp.math.duplicate-capability-version");
  const second = registry.register({ version: "v2", capability: capability() });
  assert.throws(() => recoverKpTypedMathCapability(stored, second),
    error => error instanceof KpTypedMathCapabilityError && error.code === "kp.math.stale-capability-version");
  assert.equal(recoverKpTypedMathCapability(stored, first), source);
  assert.throws(() => recoverKpTypedMathCapability(stored, undefined),
    error => error instanceof KpTypedMathCapabilityError && error.code === "kp.math.missing-capability");
  assert.throws(() => first.resolve({ ...stored, scope: "another-owner" }),
    error => error instanceof KpTypedMathCapabilityError && error.code === "kp.math.foreign-capability");
  registry.dispose();
  assert.equal(registry.inspect().entries, 0);
  assert.throws(() => first.resolve(stored), /disposed/);
  assert.deepEqual(model.handles.pin(model.initial).map.read(), stored);
});

test("structural storage rejects accidentally embedded callables rather than serializing them", () => {
  const value = createKpScalarExpression({ id: "state.invalid", expression: constant(1) });
  assert.throws(() => createKpTypedMathStateValue({ ...value, accidentalEvaluate: () => 1 }),
    error => error instanceof KpTypedMathStateValueError && error.code === "kp.math.nonpersistent-state-value");
  const registry = createKpTypedMathLocalCapabilities("lesson.invalid-capability");
  assert.throws(() => registry.register({ version: "v1",
    capability: Object.freeze({ id: "not-a-map", kind: "linear-map" }) }),
    error => error instanceof KpTypedMathCapabilityError && error.code === "kp.math.invalid-capability");
  registry.dispose();
});

test("state data round trips retain the existing non-enumerable Hessian symmetry evidence", () => {
  const x = createKpScalarParameter({ id: "state.hessian.x", name: "x" });
  const source = defineKpTypedFunction({ id: "state.hessian.function", name: "f",
    parameters: [x] as const, output: createKpScalarExpression({
      id: "state.hessian.output", expression: power(x.expression, 2)
    }) });
  const hessian = deriveKpHessian({ id: "state.hessian", source });
  assert.equal(Object.getOwnPropertyDescriptor(hessian, "symmetryEvidence")?.enumerable, false);
  const value = createKpTypedMathStateValue(hessian);
  assert.deepEqual(value.symmetryEvidence, hessian.symmetryEvidence);
  assert.deepEqual(JSON.parse(JSON.stringify(value)), value);
  assert.deepEqual(value.macro, hessian.macro);
  assert.deepEqual(value.correspondenceMap, hessian.correspondenceMap);
  const hiddenCallable = Object.create(Object.getPrototypeOf(hessian), {
    ...Object.getOwnPropertyDescriptors(hessian),
    accidentalEvaluate: { value: () => 1, enumerable: false }
  });
  assert.throws(() => createKpTypedMathStateValue(hiddenCallable),
    error => error instanceof KpTypedMathStateValueError);
});
