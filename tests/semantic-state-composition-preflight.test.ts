import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import { kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition,
  type KpSemanticStateCompositionPreflightDiagnosticCode,
  type KpSemanticStateCompositionPreflightError
} from "../src/semantic-state/state-family-composition-preflight.ts";
import { validateKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

function fixture(namespace = "lesson.composition-preflight") {
  let applyCalls = 0;
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    left: kpStateValue<number>(0),
    right: kpStateValue<number>(0)
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [])
  );
  const family = (name: "left" | "right", target: typeof handles.refs.left) => {
    const transition = declareKpSemanticStateInterpolation({
      id: `${name}-change`,
      sourceId: `test.preflight.${name}.transition`,
      target
    });
    return defineKpSemanticStateFamily({
      compiled,
      handles,
      id: `change-${name}`,
      sourceId: `test.preflight.${name}.family`,
      parameters: kpStateFamilyParameters<{ readonly value: number }>(),
      transitions: builder => [builder.interpolate(
        transition,
        ({ before, after, progress }) => before +
          (after - before) * Number(progress.numerator) /
          Number(progress.denominator)
      )] as const,
      author(parameters, state) {
        applyCalls += 1;
        state[name].update(() => parameters.value);
      }
    });
  };
  const left = family("left", handles.refs.left);
  const right = family("right", handles.refs.right);
  const member = (
    name: string,
    definition: typeof left,
    applicationId = name
  ) => declareKpSemanticStateCompositionMember({
    name,
    sourceId: `test.preflight.${name}.member`,
    application: definition.prepareApplication({
      applicationId,
      parameters: { value: 1 },
      sourceId: `test.preflight.${name}.application`
    })
  });
  return {
    compiled,
    initial,
    graph,
    left,
    right,
    member,
    applyCalls: () => applyCalls
  };
}

test("preflight accepts disjoint nested members and freezes exact paths", () => {
  const data = fixture();
  const left = data.member("left", data.left);
  const right = data.member("right", data.right);
  const validated = validate(data, declareKpSemanticStateCompositionGroup({
    name: "market",
    sourceId: "test.preflight.market",
    body: declareKpSemanticStateCompositionIndependent({
      name: "joint-change",
      sourceId: "test.preflight.joint-change",
      evidence: { id: "disjoint", sourceId: "test.preflight.disjoint" },
      members: [right, left]
    })
  }));

  const preflight = preflightKpSemanticStateComposition({
    composition: validated,
    base: data.initial,
    graphBindings: [data.left, data.right].map(definition =>
      bindKpSemanticStateCompositionGraph({
        definitionId: definition.id,
        graph: data.graph
      }))
  });

  assert.deepEqual(preflight.members.map(({ path }) => path), [
    ["market", "joint-change", "right"],
    ["market", "joint-change", "left"]
  ]);
  assert.equal(preflight.members[0]?.footprint.semanticWrites.length, 1);
  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(Object.isFrozen(preflight.members), true);
  assert.equal(data.applyCalls(), 0);
});

test("independent overlap fails at the cohort path before family apply", () => {
  const data = fixture();
  const first = data.member("first", data.left);
  const second = data.member("second", data.left);
  const validated = validate(data, declareKpSemanticStateCompositionGroup({
    name: "market",
    sourceId: "test.preflight.market",
    body: declareKpSemanticStateCompositionIndependent({
      name: "conflict",
      sourceId: "test.preflight.conflict",
      evidence: { id: "claimed", sourceId: "test.preflight.claimed" },
      members: [first, second]
    })
  }));

  const diagnostics = capture(() => preflightKpSemanticStateComposition({
    composition: validated,
    base: data.initial,
    graphBindings: [bindKpSemanticStateCompositionGraph({
      definitionId: data.left.id,
      graph: data.graph
    })]
  }));

  assert.deepEqual(diagnostics.map(({ code, path }) => ({ code, path })), [{
    code: "independent-write-conflict",
    path: ["market", "conflict"]
  }]);
  assert.equal(data.applyCalls(), 0);
  assert.equal(data.initial.id, data.compiled.identityScope.initialSnapshot());
});

test("foreign base and incompatible graph authority fail together", () => {
  const data = fixture();
  const foreign = fixture("lesson.composition-preflight.foreign");
  const validated = validate(data, data.member("left", data.left));

  const diagnostics = capture(() => preflightKpSemanticStateComposition({
    composition: validated,
    base: foreign.initial,
    graphBindings: [bindKpSemanticStateCompositionGraph({
      definitionId: data.left.id,
      graph: foreign.graph
    })]
  }));

  assert.deepEqual(diagnostics.map(({ code }) => code), [
    "foreign-base-snapshot",
    "incompatible-derived-graph"
  ]);
  assert.equal(data.applyCalls(), 0);
  assert.equal(foreign.applyCalls(), 0);
});

test("duplicate bindings members and missing graph authority are explicit", () => {
  const data = fixture();
  const left = data.member("left", data.left);
  const right = data.member("right", data.right);
  const validated = validate(data, declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.preflight.timeline",
    members: [left, right]
  }));
  const reconstructed = {
    ...validated,
    declaration: {
      ...validated.declaration,
      root: {
        ...validated.declaration.root,
        members: [left, left, right]
      }
    }
  } as typeof validated;
  const repeatedBinding = bindKpSemanticStateCompositionGraph({
    definitionId: data.left.id,
    graph: data.graph
  });

  const diagnostics = capture(() => preflightKpSemanticStateComposition({
    composition: reconstructed,
    base: data.initial,
    graphBindings: [repeatedBinding, repeatedBinding]
  }));

  assert.deepEqual(diagnostics.map(({ code }) => code), [
    "duplicate-graph-binding",
    "duplicate-composition-member",
    "unresolved-transition-hazard"
  ]);
  assert.equal(data.applyCalls(), 0);
});

function validate(
  data: ReturnType<typeof fixture>,
  root: Parameters<typeof declareKpSemanticStateComposition>[0]["root"]
) {
  return validateKpSemanticStateComposition({
    identities: data.compiled.identityScope,
    declaration: declareKpSemanticStateComposition({
      namespace: data.compiled.namespace,
      localId: "preflight",
      sourceId: "test.preflight.composition",
      root
    }),
    definitions: [data.left.declaration, data.right.declaration]
  });
}

function capture(run: () => unknown): readonly {
  readonly code: KpSemanticStateCompositionPreflightDiagnosticCode;
  readonly path: readonly string[];
}[] {
  try {
    run();
  } catch (error) {
    return (error as KpSemanticStateCompositionPreflightError).diagnostics;
  }
  throw new Error("Expected composition preflight to fail.");
}
