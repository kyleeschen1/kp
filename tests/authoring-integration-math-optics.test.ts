import assert from "node:assert/strict";
import test from "node:test";
import { assembleKpSemanticStateModel } from "../src/semantic-state/authoring-model-assembly.ts";
import { kpStateGroup, kpStateValue } from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticSnapshotRecoveryIndex } from "../src/semantic-state/pinned-recovery.ts";
import { constant } from "../src/math/expression.ts";
import { createKpScalarExpression, createKpTypedMatrix } from "../src/math/typed-semantic-math.ts";
import { createKpMatrixOptics } from "../src/math/typed-semantic-optics.ts";
import { createKpTypedMathStateValue } from "../src/math/typed-math-state-value.ts";
import { createKpTypedMathSceneHandle, recoverKpTypedMathObjectAtStep } from "../src/math/typed-math-scene.ts";
import {
  pinKpTypedMathStateSelection, projectKpAggregateMathScene, KpTypedMathStateOpticError
} from "../src/math/typed-math-state-optics.ts";

function fixture() {
  const matrix = createKpTypedMatrix({ id: "optics.matrix", rows: [[
    createKpScalarExpression({ id: "optics.a", expression: constant(2) }),
    createKpScalarExpression({ id: "optics.b", expression: constant(3) })
  ]] as const });
  const model = assembleKpSemanticStateModel({ namespace: "lesson.math-optics",
    schema: kpStateGroup({ matrix: kpStateValue(createKpTypedMathStateValue(matrix)) }) });
  const optic = createKpMatrixOptics(matrix).cols.slice(0, 1);
  const pin = pinKpTypedMathStateSelection({ model, snapshot: model.initial,
    target: model.handles.refs.matrix, optic });
  const operation = { id: "canonicalize-column", relation: "identity" as const,
    authorityIds: ["kp.math.canonical-form.v1"], summary: "Retain the exact expression in canonical form." };
  return { matrix, model, optic, pin, operation };
}

test("pinned selected rewrites retain aggregate identity, correspondence and exact history", () => {
  const data = fixture();
  const result = data.pin.rewrite({ before: data.model.initial, applicationId: "first", operation: data.operation,
    transform: entry => createKpScalarExpression({ id: `${entry.id}.canonical`, expression: entry.expression }) });
  assert.equal(result.source.entityId, result.target.entityId);
  assert.notEqual(result.source.versionId, result.target.versionId);
  assert.equal(result.commit.journal[0]?.operation.kind, "update");
  assert.deepEqual(result.rewrite.correspondenceMap.records[0]?.sourceSelectorIds, ["optics.a"]);
  assert.deepEqual(result.rewrite.correspondenceMap.records[0]?.targetSelectorIds, ["optics.a.canonical"]);
  assert.ok(Object.isFrozen(result.rewrite.correspondenceMap));
  const nextPin = pinKpTypedMathStateSelection({ model: data.model, snapshot: result.commit.after,
    target: data.model.handles.refs.matrix, optic: data.optic });
  const index = createKpSemanticSnapshotRecoveryIndex([data.model.initial, result.commit.after]);
  assert.deepEqual(data.pin.recover(index).refs.map(ref => ref.entityId), ["optics.a"]);
  assert.deepEqual(nextPin.recover(index).refs.map(ref => ref.entityId), ["optics.a.canonical"]);
  const scene = projectKpAggregateMathScene({ id: "compatibility", index,
    steps: [{ id: "before", objects: [data.pin] }, { id: "after", objects: [nextPin] }] });
  const handle = createKpTypedMathSceneHandle(data.matrix);
  assert.equal(recoverKpTypedMathObjectAtStep(scene, "before", handle), data.pin.recover(index).root);
  assert.equal(recoverKpTypedMathObjectAtStep(scene, "after", handle), nextPin.recover(index).root);
});

test("stale and foreign pins fail before rewrite callbacks run", () => {
  const data = fixture();
  const first = data.pin.rewrite({ before: data.model.initial, applicationId: "first",
    operation: data.operation, transform: entry => entry });
  let calls = 0;
  assert.throws(() => data.pin.rewrite({ before: first.commit.after, applicationId: "stale",
    operation: data.operation, transform: entry => { calls++; return entry; } }),
    error => error instanceof KpTypedMathStateOpticError && error.code === "kp.math.stale-state-selection");
  assert.throws(() => pinKpTypedMathStateSelection({ model: data.model, snapshot: data.model.initial,
    target: { ...data.model.handles.refs.matrix, namespace: "foreign" }, optic: data.optic }),
    error => error instanceof KpTypedMathStateOpticError && error.code === "kp.math.foreign-state-handle");
  assert.equal(calls, 0);
});

test("unsupported cardinality changes return typed gaps without a successor", () => {
  const data = fixture();
  const optic: typeof data.optic = { ...data.optic, replace: root => ({ ...root, rows: [] }) };
  const pin = pinKpTypedMathStateSelection({ model: data.model, snapshot: data.model.initial,
    target: data.model.handles.refs.matrix, optic });
  assert.throws(() => pin.rewrite({ before: data.model.initial, applicationId: "invalid",
    operation: data.operation, transform: entry => entry }),
    error => error instanceof KpTypedMathStateOpticError && error.code === "kp.math.unsupported-cardinality");
  assert.equal(data.model.handles.pin(data.model.initial).matrix.read().rows.length, 1);
});

test("nondeterministic selected values cannot publish an aggregate successor", () => {
  const data = fixture();
  let calls = 0;
  assert.throws(() => data.pin.rewrite({ before: data.model.initial, applicationId: "unstable",
    operation: data.operation,
    transform: entry => createKpScalarExpression({ id: entry.id, expression: constant(++calls) }) }),
    error => error instanceof KpTypedMathStateOpticError && error.code === "kp.math.rewrite-failed" &&
      error.cause instanceof Error);
  assert.equal(calls, 2);
  assert.deepEqual(data.pin.recover(createKpSemanticSnapshotRecoveryIndex([data.model.initial])).root.rows,
    data.matrix.rows);
});
