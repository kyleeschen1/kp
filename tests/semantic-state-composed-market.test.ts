import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import {
  createKpSemanticStateComposedMarketPacket
} from "../src/tutorial/typed-linear-supply-demand/semantic-state-composed-market.ts";

const SOURCE =
  "src/tutorial/typed-linear-supply-demand/semantic-state-composed-market.ts";

test("two market families author distinct exact drivers", () => {
  const packet = createKpSemanticStateComposedMarketPacket();
  const demand = packet.chain.applications[0]!.application;
  const tax = packet.chain.applications[1]!.application;

  assert.deepEqual(
    packet.families.demand.declaration.transitionPlan.declarations.map(
      declaration => ({
        mode: declaration.transitionMode,
        target: declaration.target.path
      })
    ),
    [{
      mode: "semantic-interpolation",
      target: ["drivers", "demandPriceIntercept"]
    }]
  );
  assert.deepEqual(
    packet.families.tax.declaration.transitionPlan.declarations.map(
      declaration => ({
        mode: declaration.transitionMode,
        target: declaration.target.path
      })
    ),
    [{ mode: "semantic-interpolation", target: ["drivers", "taxAmount"] }]
  );
  assert.equal(demand.commit.journal.length, 1);
  assert.equal(tax.commit.journal.length, 1);
  assert.equal(demand.commit.journal[0]?.operation.kind, "update");
  assert.equal(tax.commit.journal[0]?.operation.kind, "update");
  const demandOperation = demand.commit.journal[0]?.operation;
  const taxOperation = tax.commit.journal[0]?.operation;
  if (demandOperation?.kind !== "update" || taxOperation?.kind !== "update") {
    throw new Error("Expected one exact update from each market family.");
  }
  assert.equal(demandOperation.slotId,
    packet.stateHandles.refs.drivers.demandPriceIntercept.slotId);
  assert.equal(taxOperation.slotId,
    packet.stateHandles.refs.drivers.taxAmount.slotId);
  assert.notEqual(demandOperation.slotId, taxOperation.slotId);
});

test("the endpoint chain derives exact joint market truth from one graph", () => {
  const packet = createKpSemanticStateComposedMarketPacket();
  const [initial, afterDemand, afterTax] = packet.chain.boundaries.map(
    boundary => boundary.snapshot
  );

  assert.equal(initial, packet.initial);
  assert.equal(afterDemand,
    packet.chain.applications[0]?.application.commit.after);
  assert.equal(afterTax,
    packet.chain.applications[1]?.application.commit.after);
  assert.equal(packet.chain.applications[0]?.application.commit.before,
    initial);
  assert.equal(packet.chain.applications[1]?.application.commit.before,
    afterDemand);
  assert.equal(packet.chain.after, afterTax);

  assert.deepEqual(readDrivers(packet, initial!), {
    demandPriceIntercept: exact("12"),
    taxAmount: exact("0")
  });
  assert.deepEqual(readDrivers(packet, afterDemand!), {
    demandPriceIntercept: exact("14"),
    taxAmount: exact("0")
  });
  assert.deepEqual(readDrivers(packet, afterTax!), {
    demandPriceIntercept: exact("14"),
    taxAmount: exact("2")
  });

  assert.deepEqual(readOutcome(packet, initial!), {
    market: {
      quantity: exact("5"),
      consumerPrice: exact("7"),
      producerPrice: exact("7"),
      priceWedge: exact("0")
    },
    accounting: {
      consumerSurplus: exact("25", "2"),
      producerSurplus: exact("25", "2"),
      governmentRevenue: exact("0"),
      totalSurplus: exact("25")
    }
  });
  assert.deepEqual(readOutcome(packet, afterDemand!), {
    market: {
      quantity: exact("6"),
      consumerPrice: exact("8"),
      producerPrice: exact("8"),
      priceWedge: exact("0")
    },
    accounting: {
      consumerSurplus: exact("18"),
      producerSurplus: exact("18"),
      governmentRevenue: exact("0"),
      totalSurplus: exact("36")
    }
  });
  assert.deepEqual(readOutcome(packet, afterTax!), {
    market: {
      quantity: exact("5"),
      consumerPrice: exact("9"),
      producerPrice: exact("7"),
      priceWedge: exact("2")
    },
    accounting: {
      consumerSurplus: exact("25", "2"),
      producerSurplus: exact("25", "2"),
      governmentRevenue: exact("10"),
      totalSurplus: exact("35")
    }
  });
  assert.equal(packet.preflight.members.every(member =>
    member.graph === packet.graph), true);
  assert.equal(packet.composition.graphSignature,
    packet.preflight.graphSignature);
});

test("named nested composition produces stable scoped handles", () => {
  const packet = createKpSemanticStateComposedMarketPacket();
  const timeline = packet.compositionHandles.root.children.timeline;
  const demand = timeline.children["demand-shift"].children["raise-demand"];
  const tax = timeline.children["tax-policy"].children["add-tax"];

  assert.equal(packet.compositionHandles.root.name, "market-policy");
  assert.equal(timeline.nodeKind, "sequence");
  assert.deepEqual(demand.path, [
    "market-policy", "timeline", "demand-shift", "raise-demand"
  ]);
  assert.deepEqual(tax.path, [
    "market-policy", "timeline", "tax-policy", "add-tax"
  ]);
  assert.equal(demand.definitionId, packet.families.demand.id);
  assert.equal(tax.definitionId, packet.families.tax.id);
  assert.notEqual(demand.definitionId, tax.definitionId);
  assert.equal(packet.validated.memberCount, 2);
  assert.equal(packet.composition.steps.length, 2);
  assert.equal(packet.compositionHandles.boundaries.length, 3);
});

test("the composed market packet stays compact and delegates economics", () => {
  const authoring = readAuthoringRegion();
  const metrics = {
    familyDefinitions: countMatches(authoring,
      /defineKpSemanticStateModelFamily\(/gu),
    lowLevelConstructionCalls: countMatches(
      authoring,
      /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpSemanticSlotAbsence|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)\(/gu
    ),
    manualKernelMetadataFields: countMatches(
      authoring,
      /\b(?:revisionId|slotId|entityId):\s*["']/gu
    ),
    authorCasts: countMatches(authoring,
      /\bas\s+(?:Kp|Readonly|never|const)\b/gu),
    endpointUpdateCalls: countMatches(authoring, /\.update\(/gu),
    authoredSetupLines: authoring.split("\n")
      .filter(line => line.trim().length > 0).length
  };

  assert.deepEqual(metrics, {
    familyDefinitions: 2,
    lowLevelConstructionCalls: 0,
    manualKernelMetadataFields: 0,
    authorCasts: 0,
    endpointUpdateCalls: 2,
    authoredSetupLines: 158
  });
  assert.match(authoring,
    /evaluateKpParameterizedDemandInterceptAndPerUnitTax/u);
  assert.doesNotMatch(authoring,
    /(?:consumerPrice|producerPrice|governmentRevenue)\s*[-+*/]/u);
  assert.doesNotMatch(authoring, /render|canvas|svg|katex/iu);
});

function readDrivers(
  packet: ReturnType<typeof createKpSemanticStateComposedMarketPacket>,
  snapshot: Parameters<typeof packet.stateHandles.pin>[0]
) {
  const state = packet.stateHandles.pin(snapshot);
  return {
    demandPriceIntercept: state.drivers.demandPriceIntercept.read(),
    taxAmount: state.drivers.taxAmount.read()
  };
}

function readOutcome(
  packet: ReturnType<typeof createKpSemanticStateComposedMarketPacket>,
  snapshot: Parameters<typeof packet.stateHandles.pin>[0]
) {
  const market = evaluateKpSemanticDerivedValue({
    graph: packet.graph,
    snapshot,
    target: packet.stateHandles.refs.outcomes.equilibrium
  });
  const accounting = evaluateKpSemanticDerivedValue({
    graph: packet.graph,
    snapshot,
    target: packet.stateHandles.refs.outcomes.accounting
  });
  return {
    market: {
      quantity: market.quantity,
      consumerPrice: market.consumerPrice,
      producerPrice: market.producerPrice,
      priceWedge: market.priceWedge
    },
    accounting: {
      consumerSurplus: accounting.consumerSurplus,
      producerSurplus: accounting.producerSurplus,
      governmentRevenue: accounting.governmentRevenue,
      totalSurplus: accounting.totalSurplus
    }
  };
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

function readAuthoringRegion(): string {
  const source = readFileSync(SOURCE, "utf8");
  const match = /\/\/ composed-market-packet:start\n([\s\S]*?)\/\/ composed-market-packet:end/u
    .exec(source);
  assert.ok(match);
  return match[1]!;
}

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}
