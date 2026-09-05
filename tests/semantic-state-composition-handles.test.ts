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
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence,
  type KpSemanticStateCompositionNodeDeclaration
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  createKpSemanticStateCompositionHandleSet,
  type KpSemanticStateCompositionMemberHandleParameters
} from "../src/semantic-state/state-family-composition-handles.ts";
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
  const schema = compileKpSemanticStateSchema(
    "lesson.composition-handles",
    kpStateGroup({
      alpha: kpStateValue<number>(0),
      beta: kpStateValue<number>(0),
      gamma: kpStateValue<number>(0)
    })
  );
  const state = createKpSemanticStateHandleSet(schema);
  const initial = materializeKpSemanticStateInitialSnapshot(schema);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [])
  );
  const family = (name: "alpha" | "beta" | "gamma") => {
    const transition = declareKpSemanticStateInterpolation({
      id: `${name}-change`,
      sourceId: `test.composition-handles.${name}.transition`,
      target: state.refs[name]
    });
    return defineKpSemanticStateFamily({
      compiled: schema,
      handles: state,
      id: `change-${name}`,
      sourceId: `test.composition-handles.${name}.family`,
      parameters: kpStateFamilyParameters<{
        readonly value: number;
        readonly reason: "lesson";
      }>(),
      transitions: builder => [builder.interpolate(
        transition,
        ({ before }) => before
      )] as const,
      author(parameters, draft) {
        draft[name].update(() => parameters.value);
      }
    });
  };
  const families = {
    alpha: family("alpha"),
    beta: family("beta"),
    gamma: family("gamma")
  } as const;
  const member = <const Name extends "alpha" | "beta" | "gamma">(
    name: Name
  ) => {
    const values = { alpha: 1, beta: 2, gamma: 3 } as const;
    const definition = families[name];
    return declareKpSemanticStateCompositionMember({
      name,
      sourceId: `test.composition-handles.${name}.member`,
      application: definition.prepareApplication({
        applicationId: name,
        parameters: { value: values[name], reason: "lesson" },
        sourceId: `test.composition-handles.${name}.application`
      })
    });
  };
  const compile = <const Root extends KpSemanticStateCompositionNodeDeclaration>(
    root: Root
  ) => {
    const declaration = declareKpSemanticStateComposition({
      namespace: schema.namespace,
      localId: "lesson-change",
      sourceId: "test.composition-handles.composition",
      root
    });
    const validated = validateKpSemanticStateComposition({
      identities: schema.identityScope,
      declaration,
      definitions: Object.values(families).map(
        ({ declaration }) => declaration
      )
    });
    const preflight = preflightKpSemanticStateComposition({
      composition: validated,
      base: initial,
      graphBindings: Object.values(families).map(definition =>
        bindKpSemanticStateCompositionGraph({
          definitionId: definition.id,
          graph
        }))
    });
    return compileKpSemanticStateComposition({
      identities: schema.identityScope,
      preflight
    });
  };
  return { compile, member };
}

test("compiled plans generate inferred nested group and member handles", () => {
  const data = fixture();
  const plan = data.compile(declareKpSemanticStateCompositionGroup({
    name: "market",
    sourceId: "test.composition-handles.market",
    body: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.composition-handles.timeline",
      members: [data.member("alpha"),
        declareKpSemanticStateCompositionIndependent({
          name: "policy",
          sourceId: "test.composition-handles.policy",
          evidence: {
            id: "disjoint",
            sourceId: "test.composition-handles.disjoint"
          },
          members: [data.member("beta"), data.member("gamma")]
        })]
    })
  }));
  const handles = createKpSemanticStateCompositionHandleSet(plan);
  const timeline = handles.root.children.timeline;
  const alpha = timeline.children.alpha;
  const policy = timeline.children.policy;
  const beta = policy.children.beta;
  type AlphaParameters =
    KpSemanticStateCompositionMemberHandleParameters<typeof alpha>;
  const inferred: AlphaParameters = { value: 4, reason: "lesson" };

  assert.deepEqual(inferred, { value: 4, reason: "lesson" });
  assert.equal(handles.root.name, "market");
  assert.equal(timeline.nodeKind, "sequence");
  assert.equal(alpha.name, "alpha");
  assert.equal(beta.name, "beta");
  assert.deepEqual(beta.path, ["market", "timeline", "policy", "beta"]);
  assert.equal(policy.nodeKind, "independent");
  assert.equal(handles.groups.length, 3);
  assert.equal(handles.members.length, 3);
  assert.equal(Object.isFrozen(handles), true);
  assert.equal(Object.isFrozen(handles.root.children), true);

  if (false) {
    // @ts-expect-error Unknown scoped names cannot become handles.
    handles.root.children.missing;
    // @ts-expect-error A transition member has no nested children.
    alpha.children;
    // @ts-expect-error Literal parameter values remain exact.
    const invalid: AlphaParameters = { value: 4, reason: "other" };
    assert.ok(invalid);
  }
});

test("composition before, after, and every settled boundary are generated", () => {
  const data = fixture();
  const plan = data.compile(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-handles.timeline",
    members: [data.member("alpha"), data.member("beta")]
  }));
  const handles = createKpSemanticStateCompositionHandleSet(plan);

  assert.equal(handles.composition.id, plan.id);
  assert.equal(handles.composition.before, handles.boundaries[0]);
  assert.equal(handles.composition.after, handles.boundaries[2]);
  assert.deepEqual(handles.boundaries.map(boundary => ({
    kind: boundary.boundaryKind,
    id: boundary.id,
    path: boundary.path,
    memberIds: boundary.memberIds
  })), plan.boundaries.map(boundary => ({
    kind: boundary.kind,
    id: boundary.id,
    path: boundary.path,
    memberIds: boundary.memberIds
  })));
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(handles)));
  assert.equal(JSON.stringify(handles).includes("parameters"), false);
});

test("existing generated handles remain stable when an unrelated sibling appears", () => {
  const data = fixture();
  const before = createKpSemanticStateCompositionHandleSet(data.compile(
    declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.composition-handles.timeline",
      members: [data.member("alpha"), data.member("gamma")]
    })
  ));
  const after = createKpSemanticStateCompositionHandleSet(data.compile(
    declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.composition-handles.timeline",
      members: [
        data.member("alpha"),
        data.member("beta"),
        data.member("gamma")
      ]
    })
  ));
  const beforeAlpha = before.root.children.alpha;
  const afterAlpha = after.root.children.alpha;
  const beforeAlphaBoundary = before.boundaries.find(boundary =>
    boundary.path.at(-1) === "alpha")!;
  const afterAlphaBoundary = after.boundaries.find(boundary =>
    boundary.path.at(-1) === "alpha")!;

  assert.equal(before.root.id, after.root.id);
  assert.equal(beforeAlpha.id, afterAlpha.id);
  assert.equal(beforeAlpha.transformationId, afterAlpha.transformationId);
  assert.equal(beforeAlphaBoundary.id, afterAlphaBoundary.id);
});
