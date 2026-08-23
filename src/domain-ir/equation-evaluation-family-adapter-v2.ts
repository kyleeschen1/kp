import {
  isKpVerifiedEquationEvaluationFamilyCertificateV2,
  type KpVerifiedEquationEvaluationFamilyCertificateV2
} from "./equation-evaluation-family-certificate-v2.ts";
import {
  isKpCompiledEquationPresentationPlanV2,
  type KpCompiledEquationPresentationPlanV2,
  type KpCompiledEquationPresentationTransitionV2,
  type KpEquationPresentationDomainPayloadV2
} from "./equation-presentation-plan-v2.ts";

export interface KpEquationEvaluationFamilyAdapterInputV2<
  Payload extends KpEquationPresentationDomainPayloadV2 =
    KpEquationPresentationDomainPayloadV2
> {
  readonly transition: KpCompiledEquationPresentationTransitionV2<Payload>;
  readonly certificate: KpVerifiedEquationEvaluationFamilyCertificateV2;
}

export interface KpEquationEvaluationFamilyAdapterV2<
  Payload extends KpEquationPresentationDomainPayloadV2,
  Output
> {
  readonly id: string;
  readonly kind: "equation-evaluation-family-adapter-v2";
  readonly compile: (
    input: KpEquationEvaluationFamilyAdapterInputV2<Payload>
  ) => Output;
}

/**
 * Evaluation adapters receive the compiler-owned certificate by reference.
 * This seam deliberately exposes no family, transform-kind, or asset lookup.
 */
export function consumeKpEquationEvaluationFamilyTransitionsV2<
  Payload extends KpEquationPresentationDomainPayloadV2,
  Output
>(input: {
  readonly plan: KpCompiledEquationPresentationPlanV2<Payload>;
  readonly adapter: KpEquationEvaluationFamilyAdapterV2<Payload, Output>;
}): readonly Output[] {
  if (!isKpCompiledEquationPresentationPlanV2(input.plan)) {
    throw new Error(
      "Evaluation-family adapters require a nominal presentation plan."
    );
  }

  const outputs: Output[] = [];
  input.plan.transitions.forEach((transition) => {
    const certificate = transition.evaluationFamilyCertificate;
    if (certificate === undefined) return;
    if (!isKpVerifiedEquationEvaluationFamilyCertificateV2(certificate)) {
      throw new Error(
        `Transition ${transition.id} has a non-nominal family certificate.`
      );
    }
    if (
      certificate.transformationId !==
        transition.semanticOperation.transformationId ||
      certificate.operationId !== transition.semanticOperation.operationId
    ) {
      throw new Error(
        `Transition ${transition.id} does not match its family certificate.`
      );
    }
    outputs.push(input.adapter.compile({ transition, certificate }));
  });
  return Object.freeze(outputs);
}
