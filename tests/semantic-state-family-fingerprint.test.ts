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
import {
  createKpSemanticDerivationFingerprint,
  type KpSemanticDerivationFingerprint,
  type KpSemanticTransientDerivationDependencyToken
} from "../src/semantic-state/derived-fingerprint.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("equivalent exact progress produces one transient fingerprint", () => {
  const fixture = createFixture();
  const first = fingerprintAt(fixture, fixture.application, 1n, 2n);
  const equivalent = fingerprintAt(fixture, fixture.application, 2n, 4n);
  const transient = readTransientToken(first);

  assert.deepEqual(equivalent, first);
  assert.equal(transient.driver.progress, "1/2");
  assert.equal(
    transient.driver.definitionId,
    fixture.application.definitionId
  );
  assert.equal(
    transient.driver.transformationId,
    fixture.application.transformationId
  );
  assert.equal(transient.driver.applicationId, "first");
  assert.equal(transient.driver.declarationId, fixture.transition.id);
  assert.equal("value" in transient, false);
  assert.equal("value" in transient.driver, false);
  assert.equal(Object.isFrozen(transient), true);
  assert.equal(Object.isFrozen(transient.driver), true);
});

test("changed progress changes only the affected authority chain", () => {
  const fixture = createFixture();
  const midpoint = fingerprintAt(fixture, fixture.application, 1n, 2n);
  const later = fingerprintAt(fixture, fixture.application, 3n, 4n);
  const midpointTransient = readTransientToken(midpoint);
  const laterTransient = readTransientToken(later);
  const midpointStable = readConcreteToken(midpoint);
  const laterStable = readConcreteToken(later);

  assert.notEqual(laterTransient.key, midpointTransient.key);
  assert.equal(midpointTransient.driver.progress, "1/2");
  assert.equal(laterTransient.driver.progress, "3/4");
  assert.notEqual(later.key, midpoint.key);
  assert.deepEqual(laterStable, midpointStable);
});

test("application and parameter branches keep distinct fingerprints", () => {
  const fixture = createFixture();
  const sameParameters = fixture.definition.apply(fixture.initial, {
    applicationId: "same-parameters",
    parameters: { target: 6 },
    sourceId: "lesson.family-fingerprint.application.same-parameters"
  });
  const differentParameters = fixture.definition.apply(fixture.initial, {
    applicationId: "different-parameters",
    parameters: { target: 10 },
    sourceId: "lesson.family-fingerprint.application.different-parameters"
  });
  const first = fingerprintAt(fixture, fixture.application, 1n, 2n);
  const same = fingerprintAt(fixture, sameParameters, 1n, 2n);
  const different = fingerprintAt(fixture, differentParameters, 1n, 2n);

  assert.notEqual(same.key, first.key);
  assert.notEqual(different.key, first.key);
  assert.notEqual(different.key, same.key);
  assert.notEqual(
    readTransientToken(same).driver.transformationId,
    readTransientToken(first).driver.transformationId
  );
  assert.notEqual(
    readTransientToken(different).driver.afterVersionId,
    readTransientToken(first).driver.afterVersionId
  );
});

test("nested fingerprints stay deterministic across graph order", () => {
  const fixture = createFixture();
  const source = sourceAt(fixture, fixture.application, 1n, 2n);
  const first = createKpSemanticDerivationFingerprint({
    graph: fixture.graph,
    source,
    target: fixture.handles.refs.summary
  });
  const permuted = createKpSemanticDerivationFingerprint({
    graph: fixture.permutedGraph,
    source,
    target: fixture.handles.refs.summary
  });

  assert.deepEqual(permuted, first);
  assert.equal(readTransientToken(first).driver.progress, "1/2");
});

function createFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.family-fingerprint",
    kpStateGroup({
      amount: kpStateValue<number>(2),
      stable: kpStateValue("stable"),
      doubled: kpStateDerived<number>(),
      summary: kpStateDerived<string>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const doubled = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.doubled,
    dependencies: [handles.refs.amount],
    compute: ([amount]) => amount * 2
  });
  const summary = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.summary,
    dependencies: [handles.refs.doubled, handles.refs.stable],
    compute: ([value, stable]) => `${stable}:${value}`
  });
  const definitions = [summary, doubled];
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: definitions
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  const permutedGraph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [...definitions].reverse())
  );
  const transition = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-fingerprint.amount",
    target: handles.refs.amount
  });
  const definition = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "raise-amount",
    sourceId: "lesson.family-fingerprint.raise-amount",
    parameters: kpStateFamilyParameters<{ readonly target: number }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before, after, progress }) => before +
        (after - before) * Number(progress.numerator) /
          Number(progress.denominator)
    )] as const,
    author(parameters, state) {
      state.amount.update(() => parameters.target);
    }
  });
  const application = definition.apply(initial, {
    applicationId: "first",
    parameters: { target: 6 },
    sourceId: "lesson.family-fingerprint.application.first"
  });
  return {
    application,
    definition,
    graph,
    handles,
    initial,
    permutedGraph,
    transition
  };
}

function fingerprintAt(
  fixture: ReturnType<typeof createFixture>,
  application: ReturnType<typeof createFixture>["application"],
  numerator: bigint,
  denominator: bigint
) {
  return createKpSemanticDerivationFingerprint({
    graph: fixture.graph,
    source: sourceAt(fixture, application, numerator, denominator),
    target: fixture.handles.refs.summary
  });
}

function sourceAt(
  fixture: ReturnType<typeof createFixture>,
  application: ReturnType<typeof createFixture>["application"],
  numerator: bigint,
  denominator: bigint
) {
  const sample = createKpSemanticStateFamilyEvaluator({
    definition: fixture.definition,
    application
  }).at(createKpSemanticProgress(numerator, denominator));
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an interior semantic source.");
  }
  return sample.source;
}

function readTransientToken(
  fingerprint: KpSemanticDerivationFingerprint
): KpSemanticTransientDerivationDependencyToken {
  const token = findTransientToken(fingerprint);
  if (token === undefined) {
    throw new Error("Missing transient dependency token.");
  }
  return token;
}

function findTransientToken(
  fingerprint: KpSemanticDerivationFingerprint
): KpSemanticTransientDerivationDependencyToken | undefined {
  for (const dependency of fingerprint.dependencies) {
    if (dependency.kind ===
      "semantic-transient-derivation-dependency-token") {
      return dependency;
    }
    if (dependency.kind === "semantic-derived-dependency-token") {
      const nested = findTransientToken(dependency.fingerprint);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function readConcreteToken(fingerprint: KpSemanticDerivationFingerprint) {
  const token = fingerprint.dependencies.find(({ kind }) =>
    kind === "semantic-concrete-dependency-token"
  );
  if (token?.kind !== "semantic-concrete-dependency-token") {
    throw new Error("Missing concrete dependency token.");
  }
  return token;
}
