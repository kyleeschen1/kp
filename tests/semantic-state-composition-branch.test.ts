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
import type { KpAggregateSemanticSnapshot } from
  "../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpInTransitionSemanticStateCompositionAddress,
  createKpSettledSemanticStateCompositionAddress,
  encodeKpSemanticStateCompositionLogicalAddress
} from "../src/semantic-state/state-family-composition-address.ts";
import {
  continueKpSemanticStateCompositionFromBoundary,
  KpSemanticStateCompositionBranchError
} from "../src/semantic-state/state-family-composition-branch.ts";
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../src/semantic-state/state-family-composition-endpoints.ts";
import { createKpSemanticStateCompositionEvaluator } from
  "../src/semantic-state/state-family-composition-evaluator.ts";
import { createKpSemanticStateCompositionHandleSet } from
  "../src/semantic-state/state-family-composition-handles.ts";
import { bindKpSemanticStateCompositionMemberEvaluator } from
  "../src/semantic-state/state-family-composition-member-resolver.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition
} from "../src/semantic-state/state-family-composition-preflight.ts";
import { createKpSettledSemanticStateCompositionResolver } from
  "../src/semantic-state/state-family-composition-settled-resolver.ts";
import { validateKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("root middle and final continuations retain exact source lineage", () => {
  const data = fixture();
  const sourceBoundaryReferences = data.source.chain.boundaries.map(
    boundary => boundary.snapshot
  );
  const branches = [0, 2, 3].map((ordinal, index) =>
    data.branch(ordinal, `branch-${index}`, 10 + index)
  );

  assert.equal(new Set(branches.map(branch => branch.id)).size, 3);
  branches.forEach((branch, index) => {
    const ordinal = [0, 2, 3][index]!;
    const sourceBoundary = data.source.chain.boundaries[ordinal]!;
    assert.equal(branch.lineage.sourceChain, data.source.chain);
    assert.equal(branch.lineage.sourceBoundary, sourceBoundary);
    assert.equal(branch.lineage.sourceSnapshot, sourceBoundary.snapshot);
    assert.equal(branch.chain.before, sourceBoundary.snapshot);
    assert.equal(branch.chain.boundaries[0]!.snapshot, sourceBoundary.snapshot);
    assert.equal(encodeKpSemanticStateCompositionLogicalAddress(
      branch.lineage.sourceAddress
    ), encodeKpSemanticStateCompositionLogicalAddress(
      data.source.settledAddress(ordinal)
    ));
    assert.equal(Object.isFrozen(branch), true);
    assert.equal(Object.isFrozen(branch.lineage), true);
  });

  assert.equal(data.source.chain.after, sourceBoundaryReferences[3]);
  assert.equal(data.source.chain.boundaries.every((boundary, ordinal) =>
    boundary.snapshot === sourceBoundaryReferences[ordinal]), true);
});

test("branch endpoints recover directly from their independent histories", () => {
  const data = fixture();
  const branches = [
    data.branch(0, "root-recovery", 10),
    data.branch(2, "middle-recovery", 20),
    data.branch(3, "final-recovery", 30)
  ];

  branches.forEach((branch, index) => {
    const resolver = createKpSettledSemanticStateCompositionResolver({
      chain: branch.chain,
      compositionHandles: branch.handles,
      stateHandles: data.stateHandles
    });
    const result = resolver.resolveBoundary(branch.handles.boundaries[1]!);
    assert.equal(result.snapshot, branch.chain.after);
    assert.equal(result.state.value.read(), [10, 20, 30][index]);
  });
});

test("branch evaluator caches remain caller and branch local", () => {
  const data = fixture();
  const root = data.branch(0, "root-cache", 10);
  const middle = data.branch(2, "middle-cache", 20);
  const rootEvaluator = data.evaluator(root, 1);
  const middleEvaluator = data.evaluator(middle, 1);
  const rootAddress = data.halfAddress(root);
  const middleAddress = data.halfAddress(middle);

  rootEvaluator.resolveAddress(rootAddress);
  assert.equal(rootEvaluator.inspect().entries, 1);
  assert.equal(middleEvaluator.inspect().entries, 0);
  middleEvaluator.resolveAddress(middleAddress);
  assert.equal(rootEvaluator.inspect().entries, 1);
  assert.equal(middleEvaluator.inspect().entries, 1);
  assert.notEqual(rootEvaluator.resolveAddress(rootAddress),
    middleEvaluator.resolveAddress(middleAddress));
});

test("ephemeral sources and reused composition identities cannot branch", () => {
  const data = fixture();
  const candidate = data.prepareBranch(0, "invalid-source", 10);
  const transitionAddress = createKpInTransitionSemanticStateCompositionAddress({
    handles: data.source.handles,
    target: data.source.handles.members[0]!,
    progress: createKpSemanticProgress(1n, 2n)
  });

  assert.throws(() => continueKpSemanticStateCompositionFromBoundary({
    sourceChain: data.source.chain,
    sourceHandles: data.source.handles,
    stateHandles: data.stateHandles,
    sourceAddress: transitionAddress,
    composition: candidate.composition,
    bindings: candidate.bindings
  }), (error: unknown) => error instanceof
    KpSemanticStateCompositionBranchError &&
      error.code === "branch-source-must-be-settled");
  assert.throws(() => continueKpSemanticStateCompositionFromBoundary({
    sourceChain: data.source.chain,
    sourceHandles: data.source.handles,
    stateHandles: data.stateHandles,
    sourceAddress: data.source.settledAddress(0),
    composition: data.source.composition,
    bindings: data.source.bindings
  }), (error: unknown) => error instanceof
    KpSemanticStateCompositionBranchError &&
      error.code === "branch-composition-id-reused");
});

function fixture() {
  const namespace = "lesson.composition-branch";
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    value: kpStateValue<number>(0)
  }));
  const stateHandles = createKpSemanticStateHandleSet(schema);
  const initial = materializeKpSemanticStateInitialSnapshot(schema);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [])
  );
  const transition = declareKpSemanticStateInterpolation({
    id: "value-interpolation",
    sourceId: `${namespace}.transition`,
    target: stateHandles.refs.value
  });
  const family = defineKpSemanticStateFamily({
    compiled: schema,
    handles: stateHandles,
    id: "set-value",
    sourceId: `${namespace}.family`,
    parameters: kpStateFamilyParameters<{ readonly target: number }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before, after, progress }) => before +
        (after - before) * Number(progress.numerator) /
        Number(progress.denominator)
    )] as const,
    author(parameters, draft) {
      draft.value.update(() => parameters.target);
    }
  });
  const prepare = (applicationId: string, target: number) =>
    family.prepareApplication({
      applicationId,
      parameters: { target },
      sourceId: `${namespace}.${applicationId}.application`
    });
  const compile = (
    localId: string,
    base: KpAggregateSemanticSnapshot,
    applications: readonly ReturnType<typeof prepare>[]
  ) => {
    const root = declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: `${namespace}.${localId}.timeline`,
      members: applications.map((application, index) =>
        declareKpSemanticStateCompositionMember({
          name: `change-${index}`,
          sourceId: `${namespace}.${localId}.change-${index}`,
          application
        })
      )
    });
    const declaration = declareKpSemanticStateComposition({
      namespace,
      localId,
      sourceId: `${namespace}.${localId}.composition`,
      root
    });
    const validated = validateKpSemanticStateComposition({
      identities: schema.identityScope,
      declaration,
      definitions: [family.declaration]
    });
    const preflight = preflightKpSemanticStateComposition({
      composition: validated,
      base,
      graphBindings: [bindKpSemanticStateCompositionGraph({
        definitionId: family.id,
        graph
      })]
    });
    const composition = compileKpSemanticStateComposition({
      identities: schema.identityScope,
      preflight
    });
    const bindings = applications.map(application =>
      bindKpSemanticStateCompositionEndpoint({ definition: family, application })
    );
    const chain = assembleKpSemanticStateCompositionEndpointChain({
      composition,
      base,
      bindings
    });
    const handles = createKpSemanticStateCompositionHandleSet(composition);
    return { applications, bindings, chain, composition, handles };
  };
  const source = compile("source", initial, [
    prepare("source-one", 1),
    prepare("source-two", 2),
    prepare("source-three", 3)
  ]);
  const settledAddress = (ordinal: number) =>
    createKpSettledSemanticStateCompositionAddress({
      handles: source.handles,
      boundary: source.handles.boundaries[ordinal]!
    });
  const prepareBranch = (ordinal: number, localId: string, target: number) => {
    const application = prepare(`${localId}-application`, target);
    return compile(
      localId,
      source.chain.boundaries[ordinal]!.snapshot,
      [application]
    );
  };
  const branch = (ordinal: number, localId: string, target: number) => {
    const prepared = prepareBranch(ordinal, localId, target);
    return Object.freeze({
      ...continueKpSemanticStateCompositionFromBoundary({
        sourceChain: source.chain,
        sourceHandles: source.handles,
        stateHandles,
        sourceAddress: settledAddress(ordinal),
        composition: prepared.composition,
        bindings: prepared.bindings
      }),
      application: prepared.applications[0]!,
      handles: prepared.handles
    });
  };
  type Branch = ReturnType<typeof branch>;
  const evaluator = (candidate: Branch, cacheCapacity: number) => {
    const handle = candidate.handles.members[0]!;
    const applied = candidate.chain.applications[0]!;
    return createKpSemanticStateCompositionEvaluator({
      chain: candidate.chain,
      compositionHandles: candidate.handles,
      stateHandles,
      bindings: [bindKpSemanticStateCompositionMemberEvaluator({
        handle,
        applied,
        definition: family
      })],
      cacheCapacity
    });
  };
  return {
    branch,
    evaluator,
    halfAddress: (candidate: Branch) =>
      createKpInTransitionSemanticStateCompositionAddress({
        handles: candidate.handles,
        target: candidate.handles.members[0]!,
        progress: createKpSemanticProgress(1n, 2n)
      }),
    prepareBranch,
    source: { ...source, settledAddress },
    stateHandles
  };
}
