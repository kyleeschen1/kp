import assert from "node:assert/strict";
import test from "node:test";

import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";

interface Curve {
  readonly intercept: number;
  readonly slope: number;
}

interface Crossing {
  readonly x: number;
  readonly y: number;
}

test("typed derivations pair explicit dependencies with a durable declaration", () => {
  const { compiled, handles } = createFixture("lesson.typed-derivation");
  let computeCalls = 0;
  const definition = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.crossing,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: ([left, right]) => {
      computeCalls += 1;
      const x = (right.intercept - left.intercept) /
        (left.slope - right.slope);
      return { x, y: left.intercept + left.slope * x };
    }
  });

  const snapshot = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [definition]
  });

  assert.equal(computeCalls, 0);
  assert.equal(definition.id, definition.declaration.derivationId);
  assert.deepEqual(
    definition.declaration.dependencies.map(dependency => dependency.slotId),
    definition.dependencies.map(dependency => dependency.slotId)
  );
  assert.deepEqual(snapshot.derivedBindings, [definition.declaration]);
  assert.equal(Object.isFrozen(definition.dependencies), true);
  assert.deepEqual(definition.compute([
    { intercept: 2, slope: 1 },
    { intercept: 12, slope: -1 }
  ]), { x: 5, y: 7 });
});

test("compute closures cannot enter serialized semantic authority", () => {
  const { compiled, handles } = createFixture("lesson.serialization-boundary");
  const first = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.crossing,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: () => ({ x: 1, y: 2 })
  });
  const second = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.crossing,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: () => ({ x: 99, y: 100 })
  });

  assert.equal(first.id, second.id);
  assert.deepEqual(first.declaration, second.declaration);
  assert.equal(JSON.stringify(first.declaration).includes("compute"), false);
  assert.equal(JSON.stringify(first).includes("compute"), false);
});

test("derivation definitions reject handles from another schema", () => {
  const local = createFixture("lesson.local-derivation");
  const foreign = createFixture("lesson.foreign-derivation");

  assert.throws(
    () => defineKpSemanticStateDerivation({
      compiled: local.compiled,
      target: local.handles.refs.crossing,
      dependencies: [local.handles.refs.left, foreign.handles.refs.right],
      compute: ([left, right]) => ({
        x: left.intercept + right.intercept,
        y: 0
      })
    }),
    /belongs to "lesson\.foreign-derivation"/u
  );
});

function createFixture(namespace: string) {
  const schema = kpStateGroup({
    left: kpStateValue<Curve>({ intercept: 2, slope: 1 }),
    right: kpStateValue<Curve>({ intercept: 12, slope: -1 }),
    crossing: kpStateDerived<Crossing>()
  });
  const compiled = compileKpSemanticStateSchema(namespace, schema);
  return Object.freeze({
    compiled,
    handles: createKpSemanticStateHandleSet(compiled)
  });
}
