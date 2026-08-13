import { kpTypeScriptFreeShippingRefactorContract } from "./typescript-free-shipping-refactor-contract.ts";
import type {
  KpTypeScriptRefactorSemanticArtifactV1,
  KpTypeScriptSemanticEntity
} from "./typescript-refactor-semantic-model.ts";

export interface KpShippingBehaviorObservation {
  readonly freeShipping: boolean;
  readonly shippingCost: number;
  readonly shippingMessage: string;
}

export interface KpTypeScriptRefactorBehaviorCaseProof {
  readonly id: string;
  readonly total: number;
  readonly expected: KpShippingBehaviorObservation;
  readonly before: KpShippingBehaviorObservation;
  readonly after: KpShippingBehaviorObservation;
  readonly equivalent: boolean;
}

export interface KpTypeScriptRefactorBehaviorCertificateV1 {
  readonly schemaVersion: "kp.typescript-refactor-behavior-certificate.v1";
  readonly contractId: "typescript-refactor.free-shipping-threshold";
  readonly status: "passed";
  readonly method: "bounded-symbolic-threshold-model";
  readonly scope: "declared-cases-only";
  readonly evidenceEntityIds: readonly string[];
  readonly cases: readonly KpTypeScriptRefactorBehaviorCaseProof[];
}

/**
 * This is a bounded certificate, not a TypeScript executor or a universal
 * equivalence proof. Source-derived entities establish that the frozen
 * exemplar contains the expected rule and helper calls; a tiny symbolic model
 * then checks only the author-declared boundary cases.
 */
export function createKpTypeScriptRefactorBehaviorCertificate(
  semantics: KpTypeScriptRefactorSemanticArtifactV1
): KpTypeScriptRefactorBehaviorCertificateV1 {
  const evidenceEntityIds = [
    "rule.shipping-cost.before",
    "rule.shipping-message.before",
    "rule.qualifies.after",
    "call.shipping-cost.after",
    "call.shipping-message.after"
  ] as const;
  const evidence = new Map(
    semantics.revisions.flatMap(({ entities }) => entities).map((entity) => [entity.id, entity])
  );
  const expectedRule = `total >= ${kpTypeScriptFreeShippingRefactorContract.threshold}`;
  evidenceEntityIds.slice(0, 3).forEach((id) =>
    assertExactEvidence(semantics, requireEntity(evidence, id), expectedRule)
  );
  evidenceEntityIds.slice(3).forEach((id) => {
    const entity = requireEntity(evidence, id);
    assertExactEvidence(semantics, entity, "qualifiesForFreeShipping(total)");
    if (entity.declarationId !== "function.qualifies.after") {
      throw new Error(`Behavior proof call ${id} must bind to function.qualifies.after.`);
    }
  });

  const cases = kpTypeScriptFreeShippingRefactorContract.behaviorCases.map((expected) => {
    const before = evaluateBefore(expected.total);
    const after = evaluateAfter(expected.total);
    const expectedObservation: KpShippingBehaviorObservation = {
      freeShipping: expected.freeShipping,
      shippingCost: expected.shippingCost,
      shippingMessage: expected.shippingMessage
    };
    const equivalent = observationsEqual(before, after) &&
      observationsEqual(after, expectedObservation);
    if (!equivalent) {
      throw new Error(`Behavior parity failed for declared case ${expected.id}.`);
    }
    return Object.freeze({
      id: expected.id,
      total: expected.total,
      expected: expectedObservation,
      before,
      after,
      equivalent
    });
  });

  return Object.freeze({
    schemaVersion: "kp.typescript-refactor-behavior-certificate.v1",
    contractId: kpTypeScriptFreeShippingRefactorContract.id,
    status: "passed",
    method: "bounded-symbolic-threshold-model",
    scope: "declared-cases-only",
    evidenceEntityIds: Object.freeze([...evidenceEntityIds]),
    cases: Object.freeze(cases)
  });
}

function evaluateBefore(total: number): KpShippingBehaviorObservation {
  const costRule = qualifies(total);
  const messageRule = qualifies(total);
  return observation(costRule, messageRule);
}

function evaluateAfter(total: number): KpShippingBehaviorObservation {
  const namedRule = qualifies(total);
  return observation(namedRule, namedRule);
}

function qualifies(total: number): boolean {
  return total >= kpTypeScriptFreeShippingRefactorContract.threshold;
}

function observation(
  costRule: boolean,
  messageRule: boolean
): KpShippingBehaviorObservation {
  return Object.freeze({
    freeShipping: costRule && messageRule,
    shippingCost: costRule ? 0 : kpTypeScriptFreeShippingRefactorContract.paidShippingCost,
    shippingMessage: messageRule ? "Free shipping" : "Shipping: $5"
  });
}

function observationsEqual(
  left: KpShippingBehaviorObservation,
  right: KpShippingBehaviorObservation
): boolean {
  return left.freeShipping === right.freeShipping &&
    left.shippingCost === right.shippingCost &&
    left.shippingMessage === right.shippingMessage;
}

function requireEntity(
  entities: ReadonlyMap<string, KpTypeScriptSemanticEntity>,
  id: string
): KpTypeScriptSemanticEntity {
  const entity = entities.get(id);
  if (entity === undefined) throw new Error(`Behavior proof requires semantic entity ${id}.`);
  return entity;
}

function assertExactEvidence(
  semantics: KpTypeScriptRefactorSemanticArtifactV1,
  entity: KpTypeScriptSemanticEntity,
  expectedText: string
): void {
  const revision = semantics.revisions.find(({ revision }) => revision === entity.revision);
  const sourceText = revision?.sourceText.slice(
    entity.sourceRange.startOffset,
    entity.sourceRange.endOffset
  );
  if (sourceText !== expectedText || entity.label !== expectedText) {
    throw new Error(
      `Behavior proof entity ${entity.id} must resolve exactly to ${JSON.stringify(expectedText)}.`
    );
  }
}
