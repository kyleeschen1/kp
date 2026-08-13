import { kpPythonFreeShippingRefactorContract } from
  "./python-free-shipping-refactor-contract.ts";
import type {
  KpPythonRefactorSemanticArtifactV1,
  KpPythonSemanticEntity
} from "./python-refactor-semantic-model.ts";

export interface KpPythonShippingBehaviorObservation {
  readonly freeShipping: boolean;
  readonly shippingCost: number;
  readonly shippingMessage: string;
}

export interface KpPythonRefactorBehaviorCaseProof {
  readonly id: string;
  readonly total: number;
  readonly expected: KpPythonShippingBehaviorObservation;
  readonly before: KpPythonShippingBehaviorObservation;
  readonly after: KpPythonShippingBehaviorObservation;
  readonly equivalent: boolean;
}

export interface KpPythonRefactorBehaviorCertificateV1 {
  readonly schemaVersion: "kp.python-refactor-behavior-certificate.v1";
  readonly contractId: "python-refactor.free-shipping-threshold";
  readonly status: "passed";
  readonly method: "bounded-symbolic-threshold-model";
  readonly scope: "declared-cases-only";
  readonly evidenceEntityIds: readonly string[];
  readonly cases: readonly KpPythonRefactorBehaviorCaseProof[];
}

/**
 * This bounded certificate verifies authored cases against AST-derived source
 * evidence. It deliberately models the tiny rule instead of executing either
 * learner program, so no runtime evaluator becomes semantic authority.
 */
export function createKpPythonRefactorBehaviorCertificate(
  semantics: KpPythonRefactorSemanticArtifactV1
): KpPythonRefactorBehaviorCertificateV1 {
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
  const expectedRule = `total >= ${kpPythonFreeShippingRefactorContract.threshold}`;
  evidenceEntityIds.slice(0, 3).forEach((id) =>
    assertExactEvidence(semantics, requireEntity(evidence, id), expectedRule)
  );
  evidenceEntityIds.slice(3).forEach((id) => {
    const entity = requireEntity(evidence, id);
    assertExactEvidence(semantics, entity, "qualifies_for_free_shipping(total)");
    if (entity.declarationId !== "function.qualifies.after") {
      throw new Error(`Python behavior proof call ${id} must bind to function.qualifies.after.`);
    }
  });

  const cases = kpPythonFreeShippingRefactorContract.behaviorCases.map((expected) => {
    const before = evaluateBefore(expected.total);
    const after = evaluateAfter(expected.total);
    const expectedObservation: KpPythonShippingBehaviorObservation = {
      freeShipping: expected.freeShipping,
      shippingCost: expected.shippingCost,
      shippingMessage: expected.shippingMessage
    };
    const equivalent = observationsEqual(before, after) &&
      observationsEqual(after, expectedObservation);
    if (!equivalent) throw new Error(`Python behavior parity failed for ${expected.id}.`);
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
    schemaVersion: "kp.python-refactor-behavior-certificate.v1",
    contractId: kpPythonFreeShippingRefactorContract.id,
    status: "passed",
    method: "bounded-symbolic-threshold-model",
    scope: "declared-cases-only",
    evidenceEntityIds: Object.freeze([...evidenceEntityIds]),
    cases: Object.freeze(cases)
  });
}

function evaluateBefore(total: number): KpPythonShippingBehaviorObservation {
  return observation(qualifies(total), qualifies(total));
}

function evaluateAfter(total: number): KpPythonShippingBehaviorObservation {
  const namedRule = qualifies(total);
  return observation(namedRule, namedRule);
}

function qualifies(total: number): boolean {
  return total >= kpPythonFreeShippingRefactorContract.threshold;
}

function observation(
  costRule: boolean,
  messageRule: boolean
): KpPythonShippingBehaviorObservation {
  return Object.freeze({
    freeShipping: costRule && messageRule,
    shippingCost: costRule ? 0 : kpPythonFreeShippingRefactorContract.paidShippingCost,
    shippingMessage: messageRule ? "Free shipping" : "Shipping: $5"
  });
}

function observationsEqual(
  left: KpPythonShippingBehaviorObservation,
  right: KpPythonShippingBehaviorObservation
): boolean {
  return left.freeShipping === right.freeShipping &&
    left.shippingCost === right.shippingCost &&
    left.shippingMessage === right.shippingMessage;
}

function requireEntity(
  entities: ReadonlyMap<string, KpPythonSemanticEntity>,
  id: string
): KpPythonSemanticEntity {
  const entity = entities.get(id);
  if (entity === undefined) throw new Error(`Python behavior proof requires ${id}.`);
  return entity;
}

function assertExactEvidence(
  semantics: KpPythonRefactorSemanticArtifactV1,
  entity: KpPythonSemanticEntity,
  expectedText: string
): void {
  const revision = semantics.revisions.find(({ revision }) => revision === entity.revision);
  const sourceText = revision?.sourceText.slice(
    entity.sourceRange.startOffset,
    entity.sourceRange.endOffset
  );
  if (sourceText !== expectedText || entity.label !== expectedText) {
    throw new Error(
      `Python behavior proof entity ${entity.id} must resolve exactly to ${JSON.stringify(expectedText)}.`
    );
  }
}
