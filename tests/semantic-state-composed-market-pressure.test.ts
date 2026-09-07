import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpParameterizedDemandInterceptAndPerUnitTax
} from "../domains/economics/per-unit-tax-parameterized.ts";
import {
  addExactRationals,
  createExactRational,
  multiplyExactRationals,
  subtractExactRationals
} from "../protocols/exact-rational.ts";
import type { ExactRationalDto } from "../protocols/public-api.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  createKpInTransitionSemanticStateCompositionAddress,
  createKpSettledSemanticStateCompositionAddress
} from "../src/semantic-state/state-family-composition-address.ts";
import {
  continueKpSemanticStateCompositionFromBoundary
} from "../src/semantic-state/state-family-composition-branch.ts";
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../src/semantic-state/state-family-composition-endpoints.ts";
import {
  createKpSemanticStateCompositionEvaluator
} from "../src/semantic-state/state-family-composition-evaluator.ts";
import { createKpSemanticStateCompositionHandleSet } from
  "../src/semantic-state/state-family-composition-handles.ts";
import { bindKpSemanticStateCompositionMemberEvaluator } from
  "../src/semantic-state/state-family-composition-member-resolver.ts";
import {
  bindKpSemanticStateCompositionGraph,
  KpSemanticStateCompositionPreflightError,
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
import {
  createKpSemanticStateComposedMarketPacket
} from "../src/tutorial/typed-linear-supply-demand/semantic-state-composed-market.ts";

test("independent and ordered market composition reach the same exact truth", () => {
  const packet = createKpSemanticStateComposedMarketPacket();
  const cohort = createIndependentCohort(packet);

  assert.equal(cohort.chain.confluence.length, 1);
  assert.equal(cohort.chain.confluence[0]?.valueEquivalent, true);
  assert.equal(cohort.chain.confluence[0]?.affectedSlotIds.length, 2);
  assert.equal(cohort.chain.boundaries.length, 2);
  assert.equal(packet.chain.boundaries.length, 3);
  assert.deepEqual(
    readEvaluation(packet, cohort.chain.after),
    readEvaluation(packet, packet.chain.after)
  );
  assert.deepEqual(readEvaluation(packet, cohort.chain.after),
    evaluateKpParameterizedDemandInterceptAndPerUnitTax({
      model: packet.sourceModel,
      demandPriceIntercept: exact("14"),
      taxAmount: exact("2")
    }));
});

test("a 257-address cohort corpus is exact, rewindable, and allocation bounded", () => {
  const packet = createKpSemanticStateComposedMarketPacket();
  const cohort = createIndependentCohort(packet);
  const evaluator = createKpSemanticStateCompositionEvaluator({
    chain: cohort.chain,
    compositionHandles: cohort.handles,
    stateHandles: packet.stateHandles,
    bindings: cohort.bindings,
    cacheCapacity: 7
  });
  const boundaryReferences = cohort.chain.boundaries.map(boundary =>
    boundary.snapshot);
  const applicationReferences = [...cohort.chain.applications];
  const historyBefore = JSON.stringify({
    boundaries: cohort.chain.boundaries,
    applications: cohort.chain.applications
  });
  let persistentSamples = 0;
  let ephemeralSamples = 0;

  const sample = (index: number) => {
    const progress = createKpSemanticProgress(BigInt(index), 256n);
    const address = createKpInTransitionSemanticStateCompositionAddress({
      handles: cohort.handles,
      target: cohort.handles.root,
      progress
    });
    const resolution = evaluator.resolveAddress(address);
    assert.equal(resolution.kind,
      "semantic-state-composition-cohort-resolution");
    if (resolution.kind !==
      "semantic-state-composition-cohort-resolution") {
      throw new Error("Expected an independent market cohort resolution.");
    }
    if (resolution.sample.kind === "persistent-endpoint") {
      persistentSamples += 1;
    } else {
      ephemeralSamples += 1;
    }
    const actual = evaluateKpSemanticDerivedValue({
      graph: packet.graph,
      source: resolution.sample.source,
      target: packet.stateHandles.refs.outcomes.evaluation
    });
    const expected =
      evaluateKpParameterizedDemandInterceptAndPerUnitTax({
        model: packet.sourceModel,
        demandPriceIntercept: interpolateExact(
          exact("12"), exact("14"), index, 256
        ),
        taxAmount: interpolateExact(exact("0"), exact("2"), index, 256)
      });

    assert.deepEqual(actual, expected);
    assert.deepEqual(actual.market.priceWedge, actual.taxAmount);
    assert.equal(actual.market.marketClearsExactly, true);
    assert.equal(actual.market.wedgeEqualsTaxExactly, true);
    return actual;
  };

  const forward = Array.from({ length: 257 }, (_, index) => sample(index));
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-composition-evaluator-stats.v1",
    kind: "semantic-state-composition-evaluator-stats",
    status: "active",
    capacity: 7,
    entries: 7,
    hits: 0,
    misses: 257
  });
  const reverse = Array.from({ length: 257 }, (_, offset) =>
    sample(256 - offset));
  assert.deepEqual(reverse, [...forward].reverse());

  const metrics = Object.freeze({
    addresses: forward.length,
    persistentSamples,
    ephemeralSamples,
    cache: evaluator.inspect(),
    retainedBoundaries: cohort.chain.boundaries.length,
    retainedApplications: cohort.chain.applications.length,
    confluenceCertificates: cohort.chain.confluence.length,
    graphDefinitions: packet.graph.input.definitions.length,
    schemaLeaves: packet.compiled.leaves.length
  });
  assert.deepEqual(metrics, {
    addresses: 257,
    persistentSamples: 4,
    ephemeralSamples: 510,
    cache: {
      schemaVersion: "kp.semantic-state-composition-evaluator-stats.v1",
      kind: "semantic-state-composition-evaluator-stats",
      status: "active",
      capacity: 7,
      entries: 7,
      hits: 7,
      misses: 507
    },
    retainedBoundaries: 2,
    retainedApplications: 2,
    confluenceCertificates: 1,
    graphDefinitions: 3,
    schemaLeaves: 6
  });
  assert.equal(Object.isFrozen(metrics), true);
  assert.equal(cohort.chain.boundaries.every((boundary, index) =>
    boundary.snapshot === boundaryReferences[index]), true);
  assert.equal(cohort.chain.applications.every((application, index) =>
    application === applicationReferences[index]), true);
  assert.equal(JSON.stringify({
    boundaries: cohort.chain.boundaries,
    applications: cohort.chain.applications
  }), historyBefore);
});

test("a second tax writer conflicts before either family can apply", () => {
  const packet = createKpSemanticStateComposedMarketPacket();
  let applyCount = 0;
  const transition = declareKpSemanticStateInterpolation({
    id: "conflicting-tax-interpolation",
    sourceId: "economics.composed-market.conflicting-tax.transition",
    target: packet.stateHandles.refs.drivers.taxAmount
  });
  const conflictFamily = defineKpSemanticStateFamily({
    compiled: packet.compiled,
    handles: packet.stateHandles,
    id: "set-conflicting-tax",
    sourceId: "economics.composed-market.conflicting-tax.family",
    parameters: kpStateFamilyParameters<{
      readonly taxAmount: ExactRationalDto;
    }>(),
    transitions: builder => Object.freeze([builder.interpolate(
      transition,
      ({ after }) => after
    )]),
    author(parameters, state) {
      applyCount += 1;
      state.drivers.taxAmount.update(() => parameters.taxAmount);
    }
  });
  const conflictApplication = conflictFamily.prepareApplication({
    applicationId: "conflicting-tax",
    parameters: { taxAmount: exact("4") },
    sourceId: "economics.composed-market.conflicting-tax.application"
  });
  const conflictMember = declareKpSemanticStateCompositionMember({
    name: "conflicting-tax",
    sourceId: "economics.composed-market.conflicting-tax.member",
    application: conflictApplication
  });
  const declaration = declareKpSemanticStateComposition({
    namespace: packet.compiled.namespace,
    localId: "conflicting-tax-cohort",
    sourceId: "economics.composed-market.conflicting-tax.composition",
    root: declareKpSemanticStateCompositionIndependent({
      name: "conflicting-tax-cohort",
      sourceId: "economics.composed-market.conflicting-tax.cohort",
      evidence: {
        id: "claimed-independent-tax-writes",
        sourceId: "economics.composed-market.conflicting-tax.evidence"
      },
      members: [packet.members.tax, conflictMember]
    })
  });
  const validated = validateKpSemanticStateComposition({
    identities: packet.compiled.identityScope,
    declaration,
    definitions: [
      packet.families.tax.declaration,
      conflictFamily.declaration
    ]
  });
  const boundaries = packet.chain.boundaries.length;
  const applications = packet.chain.applications.length;

  assert.throws(() => preflightKpSemanticStateComposition({
    composition: validated,
    base: packet.initial,
    graphBindings: [
      bindKpSemanticStateCompositionGraph({
        definitionId: packet.families.tax.id,
        graph: packet.graph
      }),
      bindKpSemanticStateCompositionGraph({
        definitionId: conflictFamily.id,
        graph: packet.graph
      })
    ]
  }), (error: unknown) => {
    assert.equal(error instanceof KpSemanticStateCompositionPreflightError,
      true);
    if (!(error instanceof KpSemanticStateCompositionPreflightError)) {
      return false;
    }
    assert.deepEqual(error.diagnostics.map(diagnostic => ({
      code: diagnostic.code,
      path: diagnostic.path
    })), [{
      code: "independent-write-conflict",
      path: ["conflicting-tax-cohort"]
    }]);
    return true;
  });
  assert.equal(applyCount, 0);
  assert.equal(packet.chain.boundaries.length, boundaries);
  assert.equal(packet.chain.applications.length, applications);
});

test("a middle-boundary branch recovers exact alternate market truth", () => {
  const packet = createKpSemanticStateComposedMarketPacket();
  const sourceBoundary = packet.chain.boundaries[1]!;
  const sourceHistory = JSON.stringify({
    boundaries: packet.chain.boundaries,
    applications: packet.chain.applications
  });
  const branchApplication = packet.families.tax.prepareApplication({
    applicationId: "branch-tax-three",
    parameters: { taxAmount: exact("3") },
    sourceId: "economics.composed-market.branch-tax-three.application"
  });
  const branchMember = declareKpSemanticStateCompositionMember({
    name: "branch-tax-three",
    sourceId: "economics.composed-market.branch-tax-three.member",
    application: branchApplication
  });
  const declaration = declareKpSemanticStateComposition({
    namespace: packet.compiled.namespace,
    localId: "middle-tax-three-branch",
    sourceId: "economics.composed-market.middle-tax-three-branch",
    root: declareKpSemanticStateCompositionSequence({
      name: "branch-timeline",
      sourceId: "economics.composed-market.branch-timeline",
      members: [branchMember]
    })
  });
  const validated = validateKpSemanticStateComposition({
    identities: packet.compiled.identityScope,
    declaration,
    definitions: [packet.families.tax.declaration]
  });
  const preflight = preflightKpSemanticStateComposition({
    composition: validated,
    base: sourceBoundary.snapshot,
    graphBindings: [bindKpSemanticStateCompositionGraph({
      definitionId: packet.families.tax.id,
      graph: packet.graph
    })]
  });
  const composition = compileKpSemanticStateComposition({
    identities: packet.compiled.identityScope,
    preflight
  });
  const handles = createKpSemanticStateCompositionHandleSet(composition);
  const binding = bindKpSemanticStateCompositionEndpoint({
    definition: packet.families.tax,
    application: branchApplication
  });
  const sourceAddress = createKpSettledSemanticStateCompositionAddress({
    handles: packet.compositionHandles,
    boundary: packet.compositionHandles.boundaries[1]!
  });
  const branch = continueKpSemanticStateCompositionFromBoundary({
    sourceChain: packet.chain,
    sourceHandles: packet.compositionHandles,
    stateHandles: packet.stateHandles,
    sourceAddress,
    composition,
    bindings: [binding]
  });
  const recovered = createKpSettledSemanticStateCompositionResolver({
    chain: branch.chain,
    compositionHandles: handles,
    stateHandles: packet.stateHandles
  }).resolveBoundary(handles.composition.after);

  assert.equal(branch.lineage.sourceChain, packet.chain);
  assert.equal(branch.lineage.sourceBoundary, sourceBoundary);
  assert.equal(branch.lineage.sourceSnapshot, sourceBoundary.snapshot);
  assert.equal(branch.chain.before, sourceBoundary.snapshot);
  assert.equal(recovered.snapshot, branch.chain.after);
  assert.deepEqual(recovered.state.drivers.demandPriceIntercept.read(),
    exact("14"));
  assert.deepEqual(recovered.state.drivers.taxAmount.read(), exact("3"));
  assert.deepEqual(readEvaluation(packet, recovered.snapshot),
    evaluateKpParameterizedDemandInterceptAndPerUnitTax({
      model: packet.sourceModel,
      demandPriceIntercept: exact("14"),
      taxAmount: exact("3")
    }));
  assert.equal(JSON.stringify({
    boundaries: packet.chain.boundaries,
    applications: packet.chain.applications
  }), sourceHistory);
});

function createIndependentCohort(
  packet: ReturnType<typeof createKpSemanticStateComposedMarketPacket>
) {
  const declaration = declareKpSemanticStateComposition({
    namespace: packet.compiled.namespace,
    localId: "independent-demand-and-tax",
    sourceId: "economics.composed-market.independent-composition",
    root: declareKpSemanticStateCompositionIndependent({
      name: "joint-market-change",
      sourceId: "economics.composed-market.independent-cohort",
      evidence: {
        id: "disjoint-demand-and-tax-drivers",
        sourceId: "economics.composed-market.independence-evidence"
      },
      members: [packet.members.demand, packet.members.tax]
    })
  });
  const validated = validateKpSemanticStateComposition({
    identities: packet.compiled.identityScope,
    declaration,
    definitions: [
      packet.families.demand.declaration,
      packet.families.tax.declaration
    ]
  });
  const preflight = preflightKpSemanticStateComposition({
    composition: validated,
    base: packet.initial,
    graphBindings: [
      bindKpSemanticStateCompositionGraph({
        definitionId: packet.families.demand.id,
        graph: packet.graph
      }),
      bindKpSemanticStateCompositionGraph({
        definitionId: packet.families.tax.id,
        graph: packet.graph
      })
    ]
  });
  const composition = compileKpSemanticStateComposition({
    identities: packet.compiled.identityScope,
    preflight
  });
  const handles = createKpSemanticStateCompositionHandleSet(composition);
  const endpointBindings = Object.freeze([
    bindKpSemanticStateCompositionEndpoint({
      definition: packet.families.demand,
      application: packet.applications.demand
    }),
    bindKpSemanticStateCompositionEndpoint({
      definition: packet.families.tax,
      application: packet.applications.tax
    })
  ]);
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: packet.initial,
    graph: packet.graph,
    bindings: endpointBindings
  });
  const demandApplied = chain.applications.find(application =>
    application.memberId === handles.root.children["raise-demand"].id);
  const taxApplied = chain.applications.find(application =>
    application.memberId === handles.root.children["add-tax"].id);
  if (demandApplied === undefined || taxApplied === undefined) {
    throw new Error("Independent market cohort lost an applied member.");
  }
  const bindings = Object.freeze([
    bindKpSemanticStateCompositionMemberEvaluator({
      handle: handles.root.children["raise-demand"],
      applied: demandApplied,
      definition: packet.families.demand
    }),
    bindKpSemanticStateCompositionMemberEvaluator({
      handle: handles.root.children["add-tax"],
      applied: taxApplied,
      definition: packet.families.tax
    })
  ]);

  return Object.freeze({ chain, handles, bindings });
}

function readEvaluation(
  packet: ReturnType<typeof createKpSemanticStateComposedMarketPacket>,
  snapshot: Parameters<typeof packet.stateHandles.pin>[0]
) {
  return evaluateKpSemanticDerivedValue({
    graph: packet.graph,
    snapshot,
    target: packet.stateHandles.refs.outcomes.evaluation
  });
}

function interpolateExact(
  before: ExactRationalDto,
  after: ExactRationalDto,
  numerator: number,
  denominator: number
): ExactRationalDto {
  const progress = createExactRational(BigInt(numerator), BigInt(denominator));
  const beforeValue = createExactRational(
    BigInt(before.numerator), BigInt(before.denominator)
  );
  const afterValue = createExactRational(
    BigInt(after.numerator), BigInt(after.denominator)
  );
  const value = addExactRationals(
    beforeValue,
    multiplyExactRationals(
      subtractExactRationals(afterValue, beforeValue),
      progress
    )
  );
  return exact(value.numerator.toString(), value.denominator.toString());
}

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}
