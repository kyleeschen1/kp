import {
  createKpAggregateSemanticSnapshot,
  createKpSemanticSlotAbsence
} from "../../../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticDerivedBindingDeclaration
} from "../../../src/semantic-state/derived-binding.ts";
import {
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue
} from "../../../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../../../src/semantic-state/identity.ts";
import {
  beginKpSemanticTransaction
} from "../../../src/semantic-state/transaction.ts";

export interface RawMarketCurve {
  readonly intercept: number;
  readonly slope: number;
}

export function createRawMarketAuthoringBaseline() {
  // authoring-baseline:start
  const identities = createKpSemanticStateIdentityScope("lesson.tax");
  const supplySlot = identities.slot("market.supply");
  const demandSlot = identities.slot("market.demand");
  const equilibriumSlot = identities.slot("market.equilibrium");
  const governmentRevenueSlot = identities.slot("market.government-revenue");
  const supply = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("supply"),
    value: { intercept: 2, slope: 1 },
    sourceId: "lesson.initial-supply"
  });
  const demand = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("demand"),
    value: { intercept: 12, slope: -1 },
    sourceId: "lesson.initial-demand"
  });
  const equilibrium = createKpSemanticDerivedBindingDeclaration({
    identities,
    derivationId: identities.derivation("market.equilibrium"),
    slotId: equilibriumSlot,
    dependencySlotIds: [demandSlot, supplySlot],
    sourceId: "lesson.solve-equilibrium"
  });
  const before = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [supplySlot, demandSlot, equilibriumSlot],
    optionalSlotIds: [governmentRevenueSlot],
    bindings: [
      {
        slotId: supplySlot,
        entityId: supply.entityId,
        versionId: supply.latestVersionId
      },
      {
        slotId: demandSlot,
        entityId: demand.entityId,
        versionId: demand.latestVersionId
      }
    ],
    absences: [createKpSemanticSlotAbsence({
      slotId: governmentRevenueSlot,
      reason: "not-introduced",
      sourceId: "lesson.initial-market"
    })],
    derivedBindings: [equilibrium],
    entityStores: [supply, demand]
  });
  const transformationId = identities.appliedTransformation(
    identities.transformation("add-tax"),
    "first"
  );
  const transaction = beginKpSemanticTransaction({
    identities,
    before,
    transformationId
  });
  transaction.update(transaction.scope, {
    id: "update.taxed-supply",
    sourceId: "lesson.add-tax",
    revisionId: "taxed-supply",
    slotId: supplySlot,
    update(previous) {
      const curve = readRawMarketCurve(previous);
      return { ...curve, intercept: curve.intercept + 4 };
    }
  });
  const committed = transaction.commit(transaction.scope);
  // authoring-baseline:end

  return Object.freeze({
    identities,
    slots: Object.freeze({
      supply: supplySlot,
      demand: demandSlot,
      equilibrium: equilibriumSlot,
      governmentRevenue: governmentRevenueSlot
    }),
    committed
  });
}

function readRawMarketCurve(value: KpPersistentSemanticValue): RawMarketCurve {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a market curve record.");
  }
  const record = value as Readonly<Record<string, KpPersistentSemanticValue>>;
  const intercept = record["intercept"];
  const slope = record["slope"];
  if (typeof intercept !== "number" || typeof slope !== "number") {
    throw new Error("Expected numeric market curve fields.");
  }
  return { intercept, slope };
}
