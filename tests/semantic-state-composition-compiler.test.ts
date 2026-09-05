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
import { createKpSemanticStateIdentityScope } from
  "../src/semantic-state/identity.ts";
import {
  compileKpSemanticStateComposition,
  type KpSemanticStateCompositionCompileError
} from "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence,
  type KpSemanticStateCompositionNodeDeclaration
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition
} from "../src/semantic-state/state-family-composition-preflight.ts";
import { validateKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

function fixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.composition-compiler",
    kpStateGroup({
      alpha: kpStateValue<number>(0),
      beta: kpStateValue<number>(0),
      gamma: kpStateValue<number>(0)
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [])
  );
  const family = (name: "alpha" | "beta" | "gamma") => {
    const transition = declareKpSemanticStateInterpolation({
      id: `${name}-change`,
      sourceId: `test.composition-compiler.${name}.transition`,
      target: handles.refs[name]
    });
    return defineKpSemanticStateFamily({
      compiled,
      handles,
      id: `change-${name}`,
      sourceId: `test.composition-compiler.${name}.family`,
      parameters: kpStateFamilyParameters<{ readonly value: number }>(),
      transitions: builder => [builder.interpolate(
        transition,
        ({ before }) => before
      )] as const,
      author(parameters, state) {
        state[name].update(() => parameters.value);
      }
    });
  };
  const families = [family("alpha"), family("beta"), family("gamma")] as const;
  const member = (index: 0 | 1 | 2) => {
    const definition = families[index];
    const name = ["alpha", "beta", "gamma"][index]!;
    return declareKpSemanticStateCompositionMember({
      name,
      sourceId: `test.composition-compiler.${name}.member`,
      application: definition.prepareApplication({
        applicationId: name,
        parameters: { value: index + 1 },
        sourceId: `test.composition-compiler.${name}.application`
      })
    });
  };
  const compile = (root: KpSemanticStateCompositionNodeDeclaration) => {
    const declaration = declareKpSemanticStateComposition({
      namespace: compiled.namespace,
      localId: "lesson-change",
      sourceId: "test.composition-compiler.composition",
      root
    });
    const composition = validateKpSemanticStateComposition({
      identities: compiled.identityScope,
      declaration,
      definitions: families.map(({ declaration }) => declaration)
    });
    const preflight = preflightKpSemanticStateComposition({
      composition,
      base: initial,
      graphBindings: families.map(definition =>
        bindKpSemanticStateCompositionGraph({
          definitionId: definition.id,
          graph
        }))
    });
    return compileKpSemanticStateComposition({
      identities: compiled.identityScope,
      preflight
    });
  };
  return { compiled, member, compile };
}

test("independent cohort compilation is permutation deterministic", () => {
  const data = fixture();
  const alpha = data.member(0);
  const beta = data.member(1);
  const cohort = (members: readonly [typeof alpha, typeof beta]) =>
    declareKpSemanticStateCompositionIndependent({
      name: "cohort",
      sourceId: "test.composition-compiler.cohort",
      evidence: {
        id: "disjoint-writes",
        sourceId: "test.composition-compiler.disjoint-writes"
      },
      members
    });

  const forward = data.compile(cohort([alpha, beta]));
  const reversed = data.compile(cohort([beta, alpha]));

  assert.deepEqual(forward, reversed);
  assert.deepEqual(forward.steps.map(step => step.members.map(({ encodedPath }) =>
    encodedPath)), [["cohort.alpha", "cohort.beta"]]);
  assert.equal(forward.steps[0]?.kind, "independent-step");
});

test("explicit sequence order remains authored meaning", () => {
  const data = fixture();
  const alpha = data.member(0);
  const beta = data.member(1);
  const sequence = (members: readonly [typeof alpha, typeof beta]) =>
    declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.composition-compiler.timeline",
      members
    });
  const forward = data.compile(sequence([alpha, beta]));
  const reversed = data.compile(sequence([beta, alpha]));

  assert.notDeepEqual(forward, reversed);
  assert.deepEqual(forward.steps.map(step => step.path.at(-1)), [
    "alpha",
    "beta"
  ]);
  assert.deepEqual(reversed.steps.map(step => step.path.at(-1)), [
    "beta",
    "alpha"
  ]);
});

test("nested groups retain stable scope and settled boundary specifications", () => {
  const data = fixture();
  const root = declareKpSemanticStateCompositionGroup({
    name: "market",
    sourceId: "test.composition-compiler.market",
    body: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.composition-compiler.timeline",
      members: [data.member(0), data.member(2)]
    })
  });
  const compiled = data.compile(root);

  assert.deepEqual(compiled.groups.map(({ encodedPath }) => encodedPath), [
    "market",
    "market.timeline"
  ]);
  assert.equal(compiled.boundaries.length, compiled.steps.length + 1);
  assert.deepEqual(compiled.boundaries.map(({ kind, path }) => ({ kind, path })), [
    { kind: "before", path: [] },
    { kind: "after-member", path: ["market", "timeline", "alpha"] },
    { kind: "after-member", path: ["market", "timeline", "gamma"] }
  ]);
  assert.equal(
    compiled.steps[1]?.beforeBoundaryId,
    compiled.boundaries[1]?.id
  );
  assert.equal(Object.isFrozen(compiled.root), true);
  assert.equal(Object.isFrozen(compiled.steps), true);
  assert.equal(Object.isFrozen(compiled.boundaries), true);
});

test("equivalent reconstruction produces the same frozen compiled plan", () => {
  const first = fixture();
  const firstPlan = first.compile(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-compiler.timeline",
    members: [first.member(0), first.member(1)]
  }));
  const second = fixture();
  const secondPlan = second.compile(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-compiler.timeline",
    members: [second.member(0), second.member(1)]
  }));

  assert.deepEqual(firstPlan, secondPlan);
  assert.equal(Object.isFrozen(firstPlan), true);
  assert.equal(Object.isFrozen(firstPlan.groups), true);
  assert.equal(Object.isFrozen(firstPlan.members), true);
});

test("foreign identity authority cannot compile a preflight plan", () => {
  const data = fixture();
  const declaration = data.compile(data.member(0));
  assert.throws(() => compileKpSemanticStateComposition({
    identities: createKpSemanticStateIdentityScope("lesson.foreign"),
    preflight: {
      schemaVersion: "kp.semantic-state-composition-preflight.v1",
      kind: "semantic-state-composition-preflight",
      composition: {
        schemaVersion: "kp.validated-semantic-state-composition.v1",
        kind: "validated-semantic-state-composition",
        id: declaration.id,
        namespace: declaration.namespace,
        declaration: declareKpSemanticStateComposition({
          namespace: data.compiled.namespace,
          localId: "lesson-change",
          sourceId: "test.composition-compiler.composition",
          root: data.member(0)
        }),
        scopePaths: Object.freeze(["alpha"]),
        memberCount: 1
      },
      base: materializeKpSemanticStateInitialSnapshot(data.compiled),
      graphSignature: declaration.graphSignature,
      members: Object.freeze([])
    }
  }), (error: unknown) =>
    (error as KpSemanticStateCompositionCompileError).code ===
      "foreign-composition-authority");
});
