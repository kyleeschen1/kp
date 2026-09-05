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
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  areKpSemanticStateCompositionLogicalAddressesEqual,
  createKpInTransitionSemanticStateCompositionAddress,
  createKpSettledSemanticStateCompositionAddress,
  decodeKpSemanticStateCompositionLogicalAddress,
  encodeKpSemanticStateCompositionLogicalAddress,
  type KpSemanticStateCompositionLogicalAddress,
  KpSemanticStateCompositionLogicalAddressError
} from "../src/semantic-state/state-family-composition-address.ts";
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import { createKpSemanticStateCompositionHandleSet } from
  "../src/semantic-state/state-family-composition-handles.ts";
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

function fixture(namespace = "lesson.composition-address") {
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    alpha: kpStateValue<number>(0),
    beta: kpStateValue<number>(0)
  }));
  const state = createKpSemanticStateHandleSet(schema);
  const initial = materializeKpSemanticStateInitialSnapshot(schema);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [])
  );
  const family = (name: "alpha" | "beta") => {
    const definition = defineKpSemanticStateFamily({
      compiled: schema,
      handles: state,
      id: `change-${name}`,
      sourceId: `test.composition-address.${name}.family`,
      parameters: kpStateFamilyParameters<{ readonly value: number }>(),
      transitions: builder => [builder.interpolate(
        declareKpSemanticStateInterpolation({
          id: `${name}-change`,
          sourceId: `test.composition-address.${name}.transition`,
          target: state.refs[name]
        }),
        ({ before }) => before
      )] as const,
      author(parameters, draft) {
        draft[name].update(() => parameters.value);
      }
    });
    return { definition, member: declareKpSemanticStateCompositionMember({
      name,
      sourceId: `test.composition-address.${name}.member`,
      application: definition.prepareApplication({
        applicationId: name,
        parameters: { value: name === "alpha" ? 3 : 5 },
        sourceId: `test.composition-address.${name}.application`
      })
    }) };
  };
  const alpha = family("alpha");
  const beta = family("beta");
  const root = declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-address.timeline",
    members: [alpha.member, declareKpSemanticStateCompositionIndependent({
      name: "policy",
      sourceId: "test.composition-address.policy",
      evidence: {
        id: "disjoint",
        sourceId: "test.composition-address.disjoint"
      },
      members: [beta.member]
    })]
  });
  const declaration = declareKpSemanticStateComposition({
    namespace: schema.namespace,
    localId: "lesson-change",
    sourceId: "test.composition-address.composition",
    root
  });
  const validated = validateKpSemanticStateComposition({
    identities: schema.identityScope,
    declaration,
    definitions: [alpha.definition.declaration, beta.definition.declaration]
  });
  const preflight = preflightKpSemanticStateComposition({
    composition: validated,
    base: initial,
    graphBindings: [alpha.definition, beta.definition].map(definition =>
      bindKpSemanticStateCompositionGraph({
        definitionId: definition.id,
        graph
      }))
  });
  return createKpSemanticStateCompositionHandleSet(
    compileKpSemanticStateComposition({
      identities: schema.identityScope,
      preflight
    })
  );
}

test("settled and transition addresses remain disjoint canonical values", () => {
  const handles = fixture();
  const settled = createKpSettledSemanticStateCompositionAddress({
    handles,
    boundary: handles.composition.before
  });
  const member = createKpInTransitionSemanticStateCompositionAddress({
    handles,
    target: handles.root.children.alpha,
    progress: createKpSemanticProgress(2n, 4n)
  });
  const cohort = createKpInTransitionSemanticStateCompositionAddress({
    handles,
    target: handles.root.children.policy,
    progress: createKpSemanticProgress(1n, 3n)
  });

  assert.deepEqual(Object.keys(settled), [
    "schemaVersion", "kind", "compositionId", "boundary"
  ]);
  assert.deepEqual(Object.keys(member), [
    "schemaVersion", "kind", "compositionId", "target", "progress"
  ]);
  assert.equal(member.progress, "1/2");
  assert.equal(cohort.target.kind,
    "semantic-state-composition-group-handle");
  assert.equal(cohort.target.nodeKind, "independent");
  assert.equal(Object.isFrozen(settled), true);
  assert.equal(Object.isFrozen(member), true);
  assert.doesNotThrow(() => JSON.stringify([settled, member, cohort]));
  assert.equal(JSON.stringify([settled, member, cohort]).includes("snapshot"),
    false);

  if (false) {
    // @ts-expect-error Negative type fixtures remain unreachable.
    createKpSettledSemanticStateCompositionAddress({
      handles,
      boundary: handles.composition.before,
      // @ts-expect-error Settled addresses cannot carry progress.
      progress: createKpSemanticProgress(1n, 2n)
    });
    createKpInTransitionSemanticStateCompositionAddress({
      handles,
      // @ts-expect-error Ordered containers are not transition targets.
      target: handles.root,
      progress: createKpSemanticProgress(1n, 2n)
    });
  }
});

test("logical address encoding round-trips every form canonically", () => {
  const handles = fixture();
  const addresses: readonly KpSemanticStateCompositionLogicalAddress[] = [
    createKpSettledSemanticStateCompositionAddress({
      handles,
      boundary: handles.boundaries[1]!
    }),
    createKpInTransitionSemanticStateCompositionAddress({
      handles,
      target: handles.root.children.alpha,
      progress: createKpSemanticProgress(1n, 2n)
    }),
    createKpInTransitionSemanticStateCompositionAddress({
      handles,
      target: handles.root.children.policy,
      progress: createKpSemanticProgress(2n, 3n)
    })
  ];

  for (const address of addresses) {
    const encoding = encodeKpSemanticStateCompositionLogicalAddress(address);
    const decoded = decodeKpSemanticStateCompositionLogicalAddress({
      handles,
      encoding
    });
    assert.equal(
      areKpSemanticStateCompositionLogicalAddressesEqual(address, decoded),
      true
    );
    assert.equal(
      encodeKpSemanticStateCompositionLogicalAddress(decoded),
      encoding
    );
  }
  assert.equal(areKpSemanticStateCompositionLogicalAddressesEqual(
    addresses[0]!, addresses[1]!
  ), false);
});

test("logical address decoding rejects malformed foreign and mixed forms", () => {
  const handles = fixture();
  const foreign = fixture("lesson.composition-address-foreign");
  const valid = createKpSettledSemanticStateCompositionAddress({
    handles: foreign,
    boundary: foreign.composition.before
  });
  assert.equal(captureCode(handles, "not json"), "malformed-address");
  assert.equal(captureCode(
    handles,
    encodeKpSemanticStateCompositionLogicalAddress(valid)
  ), "foreign-composition");
  assert.equal(captureCode(handles, JSON.stringify([
    "kp.semantic-state-composition-logical-address.v1",
    "settled",
    handles.composition.id,
    "missing"
  ])), "unknown-boundary");
  assert.equal(captureCode(handles, JSON.stringify([
    "kp.semantic-state-composition-logical-address.v1",
    "in-transition",
    handles.composition.id,
    "member",
    handles.root.children.alpha.id,
    "2/4"
  ])), "invalid-transition-progress");
  assert.equal(captureCode(handles, JSON.stringify([
    "kp.semantic-state-composition-logical-address.v1",
    "settled",
    handles.composition.id,
    handles.composition.before.id,
    "1/2"
  ])), "malformed-address");
  const canonical = encodeKpSemanticStateCompositionLogicalAddress(
    createKpSettledSemanticStateCompositionAddress({
      handles,
      boundary: handles.composition.before
    })
  );
  assert.equal(captureCode(
    handles,
    JSON.stringify(JSON.parse(canonical), undefined, 2)
  ), "noncanonical-address");
});

test("the logical address union narrows exhaustively", () => {
  const summarize = (
    address: KpSemanticStateCompositionLogicalAddress
  ): string => {
    switch (address.kind) {
      case "settled": return address.boundary.id;
      case "in-transition": return `${address.target.id}@${address.progress}`;
      default: return assertNever(address);
    }
  };
  const handles = fixture();
  assert.equal(summarize(createKpSettledSemanticStateCompositionAddress({
    handles,
    boundary: handles.composition.after
  })), handles.composition.after.id);
});

function captureCode(
  handles: ReturnType<typeof fixture>,
  encoding: string
): KpSemanticStateCompositionLogicalAddressError["code"] {
  try {
    decodeKpSemanticStateCompositionLogicalAddress({ handles, encoding });
  } catch (error) {
    return (error as KpSemanticStateCompositionLogicalAddressError).code;
  }
  throw new Error("Expected logical address decoding to fail.");
}

function assertNever(value: never): never {
  throw new Error(`Unexpected logical address ${JSON.stringify(value)}.`);
}
