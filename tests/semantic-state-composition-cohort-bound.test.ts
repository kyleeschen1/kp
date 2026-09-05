import assert from "node:assert/strict";
import test from "node:test";
import { compileKpSemanticStateSchema } from "../src/semantic-state/authoring-schema-compiler.ts";
import { kpStateGroup, kpStateValue } from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from "../src/semantic-state/authoring-state-materializer.ts";
import { compileKpSemanticDerivedGraph, normalizeKpSemanticDerivedGraphInput } from "../src/semantic-state/derived-graph.ts";
import { defineKpSemanticStateFamily, kpStateFamilyParameters } from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from "../src/semantic-state/state-family-transition.ts";
import {
  declareKpSemanticStateComposition, declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember, declareKpSemanticStateCompositionSequence,
  KpSemanticStateCompositionDeclarationError
} from "../src/semantic-state/state-family-composition-declaration.ts";
import { validateKpSemanticStateComposition, KpSemanticStateCompositionValidationError } from "../src/semantic-state/state-family-composition-validation.ts";
import { bindKpSemanticStateCompositionGraph, preflightKpSemanticStateComposition } from "../src/semantic-state/state-family-composition-preflight.ts";
import { compileKpSemanticStateComposition } from "../src/semantic-state/state-family-composition-compiler.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain, bindKpSemanticStateCompositionEndpoint,
  KpSemanticStateCompositionEndpointError
} from "../src/semantic-state/state-family-composition-endpoints.ts";

function fixture() {
  let authorCalls = 0;
  const compiled = compileKpSemanticStateSchema("test.three-member-gap",
    kpStateGroup({ a: kpStateValue<number>(0), b: kpStateValue<number>(0),
      c: kpStateValue<number>(0) }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const graph = compileKpSemanticDerivedGraph(normalizeKpSemanticDerivedGraphInput(compiled, []));
  const names = ["a", "b", "c"] as const;
  const families = names.map(name => defineKpSemanticStateFamily({
    compiled, handles, id: "write-" + name, sourceId: "test.family." + name,
    parameters: kpStateFamilyParameters<{ value: number }>(),
    transitions: builder => [builder.interpolate(declareKpSemanticStateInterpolation({
      id: "change-" + name, sourceId: "test.transition." + name, target: handles.refs[name]
    }), ({ before }) => before)] as const,
    author(parameters, state) {
      authorCalls += 1;
      const value = name === "b" ? Number(state.a.read() !== state.c.read()) : parameters.value;
      state[name].update(() => value);
    }
  }));
  const applications = families.map((family, index) => family.prepareApplication({
    applicationId: names[index]!, sourceId: "test.application." + names[index],
    parameters: { value: 1 }
  }));
  const members = applications.map((application, index) =>
    declareKpSemanticStateCompositionMember({ name: names[index]!,
      sourceId: "test.member." + names[index], application }));
  const bindings = families.map((definition, index) =>
    bindKpSemanticStateCompositionEndpoint({ definition, application: applications[index]! }));
  const evidence = { id: "two-orders", sourceId: "test.evidence.two-orders" };
  const pair = declareKpSemanticStateCompositionIndependent({
    name: "cohort", sourceId: "test.cohort", evidence, members: members.slice(0, 2)
  });
  const declaration = declareKpSemanticStateComposition({
    namespace: compiled.namespace, localId: "changes", sourceId: "test.composition",
    root: declareKpSemanticStateCompositionSequence({
      name: "ordered", sourceId: "test.ordered", members
    })
  });
  const compile = (order: readonly number[]) => compileKpSemanticStateComposition({
    identities: compiled.identityScope,
    preflight: preflightKpSemanticStateComposition({
      composition: validateKpSemanticStateComposition({
        identities: compiled.identityScope,
        declaration: { ...declaration, root: { ...declaration.root,
          members: order.map(index => members[index]!) } },
        definitions: families.map(family => family.declaration)
      }),
      base: initial,
      graphBindings: families.map(family =>
        bindKpSemanticStateCompositionGraph({ definitionId: family.id, graph }))
    })
  });
  const execute = (order: readonly number[]) => {
    const chain = assembleKpSemanticStateCompositionEndpointChain({
      composition: compile(order), base: initial, bindings, graph
    });
    const state = handles.pin(chain.after);
    return { a: state.a.read(), b: state.b.read(), c: state.c.read() };
  };
  return { compiled, initial, graph, families, members, bindings, evidence,
    pair, declaration, compile, execute, authorCalls: () => authorCalls };
}

test("real ordered applications disprove arbitrary-cohort certification by two orders", () => {
  const data = fixture();
  assert.deepEqual(data.execute([0, 1, 2]), { a: 1, b: 1, c: 1 });
  assert.deepEqual(data.execute([2, 1, 0]), { a: 1, b: 1, c: 1 });
  assert.deepEqual(data.execute([0, 2, 1]), { a: 1, b: 0, c: 1 });
});

test("three-member constructor and reconstructed declaration return typed gaps before apply", () => {
  const data = fixture();
  const code = (error: unknown) => error instanceof KpSemanticStateCompositionDeclarationError
    && error.code === "unsupported-independent-cohort-size";
  assert.throws(() => declareKpSemanticStateCompositionIndependent({
    name: "cohort", sourceId: "test.cohort", evidence: data.evidence, members: data.members
  }), code);
  const rawRoot = { ...data.pair, members: data.members };
  assert.throws(() => declareKpSemanticStateComposition({
    ...data.declaration, root: rawRoot
  }), code);
  assert.throws(() => validateKpSemanticStateComposition({
    identities: data.compiled.identityScope,
    declaration: { ...data.declaration, root: rawRoot },
    definitions: data.families.map(family => family.declaration)
  }), (error: unknown) => error instanceof KpSemanticStateCompositionValidationError
    && error.diagnostics.some(diagnostic =>
      diagnostic.code === "unsupported-independent-cohort-size"
      && diagnostic.path.join(".") === "cohort"));
  assert.equal(data.authorCalls(), 0);
});

test("reconstructed oversized executable cohorts fail before any endpoint application", () => {
  const data = fixture();
  const ordered = data.compile([0, 1, 2]);
  const first = ordered.steps[0]!;
  const oversized = { ...ordered, steps: [{
    ...first, kind: "independent-step" as const,
    members: ordered.steps.flatMap(step => step.members)
  }] };
  assert.throws(() => assembleKpSemanticStateCompositionEndpointChain({
    composition: oversized, base: data.initial, bindings: data.bindings, graph: data.graph
  }), (error: unknown) => error instanceof KpSemanticStateCompositionEndpointError
    && error.code === "unsupported-independent-cohort-size");
  assert.equal(data.authorCalls(), 0);
});
