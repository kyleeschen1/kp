import { createKpTwoTimesOneCarrierExemplar, createKpTwoTimesOneCarrierEvidenceCandidate } from "../../semantic/carrier-preserving-simplification-exemplar.ts";
import { verifyKpCarrierPreservingSimplificationEvidence, type KpCarrierPreservingSimplificationEvidenceCandidate } from "../../semantic/carrier-preserving-simplification-evidence.ts";
import { resolveKpOperationEvaluationFamilyCandidate } from "../../animation/operation-evaluation-family-profile.ts";
import { compileKpCarrierPreservingSimplificationRecipe } from "../../animation/carrier-preserving-simplification-recipe.ts";

export class KpAuthoredSimplificationOperationError extends Error {
  readonly code: "kp.authoring.simplification-source-gap" | "kp.authoring.simplification-evidence-gap" | "kp.authoring.simplification-receipt-gap";
  constructor(code: KpAuthoredSimplificationOperationError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "KpAuthoredSimplificationOperationError";
  }
}

const receiptKey = Symbol("bounded-simplification-receipt");
type Evidence = ReturnType<typeof prepareEvidence>;

// Like distribution, proof is a local capability, never a serialized state
// value. Each domain keeps its own verifier and endpoint representation.
class SimplificationReceipt {
  readonly #evidence: Evidence;
  constructor(key: symbol, evidence: Evidence) {
    if (key !== receiptKey) throw new KpAuthoredSimplificationOperationError(
      "kp.authoring.simplification-receipt-gap", "Only verified simplification may issue this receipt.");
    this.#evidence = evidence;
    Object.freeze(this);
  }
  static read(value: SimplificationReceipt) {
    if (typeof value !== "object" || value === null || !(#evidence in value)) {
      throw new KpAuthoredSimplificationOperationError("kp.authoring.simplification-receipt-gap",
        "Rebuild local verified authority; copied receipt data is not proof.");
    }
    return value.#evidence;
  }
}

export function prepareKpAuthoredSimplificationOperation(input: {
  readonly exemplar?: ReturnType<typeof createKpTwoTimesOneCarrierExemplar>;
  readonly candidate?: KpCarrierPreservingSimplificationEvidenceCandidate;
} = {}) {
  return new SimplificationReceipt(receiptKey, prepareEvidence(input));
}

export function readKpAuthoredSimplificationOperation(receipt: SimplificationReceipt) {
  return SimplificationReceipt.read(receipt);
}

function prepareEvidence(input: NonNullable<Parameters<typeof prepareKpAuthoredSimplificationOperation>[0]>) {
  const canonical = createKpTwoTimesOneCarrierExemplar();
  const exemplar = input.exemplar ?? canonical;
  // The existing verifier checks correspondence topology, not arbitrary
  // arithmetic. Exact trusted-source integrity prevents forged values from
  // borrowing lawful-looking identity records.
  if (JSON.stringify(exemplar) !== JSON.stringify(canonical)) {
    throw new KpAuthoredSimplificationOperationError("kp.authoring.simplification-source-gap",
      "This adapter supports only the reviewed two-times-one semantic source.");
  }
  const verified = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: input.candidate ?? createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: canonical.bundle, transformation: canonical.transformation
  });
  if (verified.status !== "verified") throw new KpAuthoredSimplificationOperationError(
    "kp.authoring.simplification-evidence-gap", JSON.stringify(verified.issues));
  const compiled = compileKpCarrierPreservingSimplificationRecipe(resolveKpOperationEvaluationFamilyCandidate({
    family: "carrier-preserving-simplification", handoff: "persistent-carrier-transfer",
    transformationKind: canonical.transformation.transformType, evidence: verified.evidence
  }));
  if (compiled.status !== "compiled") throw new KpAuthoredSimplificationOperationError(
    "kp.authoring.simplification-evidence-gap", compiled.message);
  return Object.freeze({ exemplar: canonical, verification: verified.evidence, recipe: compiled.recipe,
    operationId: "kp.algebra.simplify-multiplicative-identity" as const,
    source: canonical.bundle.objects.find(object => object.id === verified.evidence.endpoints.sourceObjectId)!,
    target: canonical.bundle.objects.find(object => object.id === verified.evidence.endpoints.targetObjectId)!,
    transformation: canonical.transformation });
}
