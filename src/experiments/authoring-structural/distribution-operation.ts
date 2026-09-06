import type { createKpAuthoredDistributionModel } from "./distribution-model.ts";
import { pinKpAuthoredStructuralSelection } from "./structural-selection.ts";
import { createKpLawfulFractionSolveMacro } from "../../semantic/fraction-solve-macro.ts";
import { createKpFractionCompositionEquationAsset } from "../../semantic/fraction-composition-equation-asset.ts";
import { resolveKpCanonicalOperation } from "../../semantic/canonical-operation-registry.ts";
import { createKpCanonicalOperationProjectPins, type KpCanonicalOperationPackPin } from "../../semantic/canonical-operation-pack.ts";
import type { KpAggregateSemanticSnapshot } from "../../semantic-state/aggregate-snapshot.ts";
import { kpStateValue } from "../../semantic-state/authoring-schema.ts";
import { requireAndFreezeKpPersistentSemanticValue } from "../../semantic-state/entity-version-store.ts";

export class KpAuthoredDistributionOperationError extends Error {
  readonly code: "kp.authoring.structural-source-gap" | "kp.authoring.structural-operation-gap" | "kp.authoring.structural-receipt-gap";
  constructor(code: KpAuthoredDistributionOperationError["code"], message: string) {
    super(message);
    this.name = "KpAuthoredDistributionOperationError";
    this.code = code;
  }
}

const operationId = "kp.algebra.distribute-multiplication";
const packs = kpStateValue([
  { packId: "kp.core", version: "1.0.0" },
  { packId: "kp.algebra", version: "0.1.0" }
]).initialValue;
const receiptKey = Symbol("bounded-distribution-receipt");
type Evidence = ReturnType<typeof prepareEvidence>;

// A private field establishes local capability identity without a global
// receipt registry. JSON and object spread cannot mint verified receipts.
class DistributionReceipt {
  readonly #evidence: Evidence;
  constructor(key: symbol, evidence: Evidence) {
    if (key !== receiptKey) throw new KpAuthoredDistributionOperationError(
      "kp.authoring.structural-receipt-gap", "Only the verified distribution factory may issue a receipt.");
    this.#evidence = evidence;
    Object.freeze(this);
  }
  static read(value: DistributionReceipt): Evidence {
    if (typeof value !== "object" || value === null || !(#evidence in value)) {
      throw new KpAuthoredDistributionOperationError("kp.authoring.structural-receipt-gap",
        "Rebuild a local verified receipt; copied or serialized receipt data is not authority.");
    }
    return value.#evidence;
  }
}

export function prepareKpAuthoredDistributionOperation(input: {
  readonly authored: ReturnType<typeof createKpAuthoredDistributionModel>;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly operationId?: string;
  readonly operationPacks?: readonly KpCanonicalOperationPackPin[];
}) {
  return new DistributionReceipt(receiptKey, prepareEvidence(input));
}

export function readKpAuthoredDistributionOperation(receipt: DistributionReceipt) {
  return DistributionReceipt.read(receipt);
}

function prepareEvidence(input: {
  readonly authored: ReturnType<typeof createKpAuthoredDistributionModel>;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly operationId?: string;
  readonly operationPacks?: readonly KpCanonicalOperationPackPin[];
}) {
  const requested = input.operationId ?? operationId;
  const requestedPacks = input.operationPacks ?? packs;
  if (requested !== operationId || JSON.stringify(requestedPacks) !== JSON.stringify(packs)) {
    throw new KpAuthoredDistributionOperationError("kp.authoring.structural-operation-gap",
      "This bridge supports only the pinned canonical distribution operation and pack versions.");
  }
  const resolution = resolveKpCanonicalOperation({ operationId: requested,
    pins: createKpCanonicalOperationProjectPins(requestedPacks) });
  if (resolution.status !== "resolved" || resolution.entry.sourceTransformType !== "distributeMultiplication") {
    throw new KpAuthoredDistributionOperationError("kp.authoring.structural-operation-gap",
      "The pinned distribution capability is unavailable.");
  }
  // Reconstruct the existing trusted fixture; caller-supplied proof-shaped
  // records never decide either endpoint. Equality here is source integrity,
  // not an invented mathematical proof or a general equation equivalence test.
  const canonical = createKpLawfulFractionSolveMacro();
  const source = canonical.states[0]!;
  const target = canonical.states[1]!;
  const { model } = input.authored;
  const current = model.handles.pin(input.snapshot).equation.read();
  if (JSON.stringify(current) !== JSON.stringify(source) ||
      JSON.stringify(input.authored.macro.states.slice(0, 2)) !== JSON.stringify([source, target])) {
    throw new KpAuthoredDistributionOperationError("kp.authoring.structural-source-gap",
      "The selected state and target must match the canonical verified distribution endpoints.");
  }
  const selection = pinKpAuthoredStructuralSelection({ model, snapshot: input.snapshot,
    side: "left", entityId: source.left.root.id });
  const declared = createKpFractionCompositionEquationAsset().transformations[0]!;
  // Legacy optional fields explicitly include undefined in their TS type; the
  // constructor omits absent fields. Validate the actual data and retain that
  // constructor's type without weakening the generic state descriptor contract.
  const transformation = requireAndFreezeKpPersistentSemanticValue(declared) as unknown as typeof declared;
  return Object.freeze({ operationId, operationPacks: packs, source, target,
    transformation, selection, verification: canonical.verification, model });
}
