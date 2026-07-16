import type { CorrespondenceMap } from "./correspondence.ts";

export interface KpDerivativeSumRuleSemantics {
  readonly kind: "derivative-sum-rule-semantics";
  readonly termCount: number;
  readonly sourceObjectId: string;
  readonly distributedObjectId: string;
  readonly targetObjectId: string;
  readonly distribution: CorrespondenceMap;
  readonly resolution: CorrespondenceMap;
}

export function createKpDerivativeSumRuleSemantics(input: {
  readonly sourceObjectId: string;
  readonly distributedObjectId: string;
  readonly targetObjectId: string;
  readonly distributionTransformationId: string;
  readonly resolutionTransformationId: string;
  readonly termCount: number;
}): KpDerivativeSumRuleSemantics {
  if (input.termCount < 2 || !Number.isInteger(input.termCount)) {
    throw new Error("Derivative sum-rule fan-out requires at least two terms.");
  }
  const source = (suffix: string) => `${input.sourceObjectId}.${suffix}`;
  const distributed = (suffix: string) => `${input.distributedObjectId}.${suffix}`;
  const target = (suffix: string) => `${input.targetObjectId}.${suffix}`;
  const termIndexes = Array.from({ length: input.termCount }, (_, index) => index);
  const connectorIndexes = termIndexes.slice(1).map((index) => index - 1);

  return {
    kind: "derivative-sum-rule-semantics",
    termCount: input.termCount,
    sourceObjectId: input.sourceObjectId,
    distributedObjectId: input.distributedObjectId,
    targetObjectId: input.targetObjectId,
    distribution: {
      id: `${input.distributionTransformationId}.correspondence`,
      records: [
        {
          id: "derivative-operator-fans-out",
          relation: "fan-out",
          sourceSelectorIds: [source("operator")],
          targetSelectorIds: termIndexes.map((index) =>
            distributed(`operator.${index}`)
          ),
          summary: "The outer derivative operator branches into one local operator per addend."
        },
        ...termIndexes.map((index) => ({
          id: `term-${index}-persists-through-distribution`,
          relation: "identity" as const,
          sourceSelectorIds: [source(`term.${index}`)],
          targetSelectorIds: [distributed(`term.${index}`)],
          summary: `Term ${index + 1} remains unchanged while derivative notation distributes.`
        })),
        ...connectorIndexes.map((index) => ({
          id: `connector-${index}-persists-through-distribution`,
          relation: "identity" as const,
          sourceSelectorIds: [source(`connector.${index}`)],
          targetSelectorIds: [distributed(`connector.${index}`)],
          summary: `The sum connector after term ${index + 1} persists.`
        }))
      ]
    },
    resolution: {
      id: `${input.resolutionTransformationId}.correspondence`,
      records: [
        ...termIndexes.map((index) => ({
          id: `term-${index}-derivative-resolves`,
          relation: "fan-in" as const,
          sourceSelectorIds: [
            distributed(`operator.${index}`),
            distributed(`term.${index}`)
          ],
          targetSelectorIds: [target(`derived.term.${index}`)],
          summary:
            `Local derivative ${index + 1} resolves from its operator, variable, and source term.`
        })),
        ...connectorIndexes.map((index) => ({
          id: `connector-${index}-persists-through-resolution`,
          relation: "identity" as const,
          sourceSelectorIds: [distributed(`connector.${index}`)],
          targetSelectorIds: [target(`connector.${index}`)],
          summary: `The sum connector after local derivative ${index + 1} persists.`
        }))
      ]
    }
  };
}
