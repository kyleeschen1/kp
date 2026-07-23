import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type {
  CorrespondenceMap,
  SelectorCorrespondenceRecord
} from "./correspondence.ts";
import { kpDistributionAreaExemplarContract } from "./distribution-area-exemplar-contract.ts";
import type { KpStructuredExpression } from "./structured-expression.ts";

export type KpDistributionAreaExemplarStateId =
  | "factored"
  | "distributed"
  | "expanded";

export interface KpDistributionAreaExemplarTransition {
  readonly id: string;
  readonly operationId: string;
  readonly authority: "canonical" | "exemplar-local";
  readonly sourceStateId: KpDistributionAreaExemplarStateId;
  readonly targetStateId: KpDistributionAreaExemplarStateId;
  readonly transformation: KpSemanticTransformation;
}

export interface KpDistributionAreaExemplarSemanticTrace {
  readonly id: string;
  readonly contractId: string;
  readonly bundle: KpAssetBundle;
  readonly stateObjectIds: Readonly<
    Record<KpDistributionAreaExemplarStateId, string>
  >;
  readonly forward: readonly KpDistributionAreaExemplarTransition[];
  readonly reverse: readonly KpDistributionAreaExemplarTransition[];
}

const baseId = kpDistributionAreaExemplarContract.id;
const stateObjectIds = Object.freeze({
  factored: `${baseId}.state.factored`,
  distributed: `${baseId}.state.distributed`,
  expanded: `${baseId}.state.expanded`
});

/**
 * The explicit 3x+3·2 state prevents presentation code from pretending that
 * distribution also evaluated the constant product.
 */
export function createKpDistributionAreaExemplarSemanticTrace():
  KpDistributionAreaExemplarSemanticTrace {
  const bundle = createKpAssetBundle({
    id: `${baseId}.semantic-trace.bundle`,
    title: "Three times x plus two reversible semantic trace",
    objects: [
      expression(stateObjectIds.factored, "Factored expression", kpDistributionAreaExemplarContract.algebra.expressions.factored, [
        selector(stateObjectIds.factored, "factor.3", "factor", "3", "distribution.factored.factor.3"),
        selector(stateObjectIds.factored, "left-paren", "delimiter", "("),
        selector(stateObjectIds.factored, "term.x", "term", "x", "distribution.factored.addend.x"),
        selector(stateObjectIds.factored, "plus", "operator", "+"),
        selector(stateObjectIds.factored, "term.2", "term", "2", "distribution.factored.addend.2"),
        selector(stateObjectIds.factored, "right-paren", "delimiter", ")")
      ]),
      expression(
        stateObjectIds.distributed,
        "Distributed expression",
        kpDistributionAreaExemplarContract.algebra.expressions.distributed,
        [
          selector(stateObjectIds.distributed, "left.factor.3", "factor", "3", "distribution.distributed.factor.3.x"),
          selector(stateObjectIds.distributed, "left.term.x", "term", "x", "distribution.distributed.addend.x"),
          selector(stateObjectIds.distributed, "plus", "operator", "+"),
          selector(stateObjectIds.distributed, "right.factor.3", "factor", "3", "distribution.distributed.factor.3.2"),
          selector(stateObjectIds.distributed, "right.times", "operator", "\\cdot"),
          selector(stateObjectIds.distributed, "right.term.2", "term", "2", "distribution.distributed.addend.2")
        ]
      ),
      expression(stateObjectIds.expanded, "Expanded expression", kpDistributionAreaExemplarContract.algebra.expressions.expanded, [
        selector(stateObjectIds.expanded, "left.factor.3", "factor", "3", "distribution.expanded.factor.3.x"),
        selector(stateObjectIds.expanded, "left.term.x", "term", "x", "distribution.expanded.addend.x"),
        selector(stateObjectIds.expanded, "plus", "operator", "+"),
        selector(stateObjectIds.expanded, "right.product.6", "derived-product", "6", "distribution.expanded.product.6")
      ])
    ]
  });

  const distribute = transition({
    id: `${baseId}.transition.distribute`,
    operationId: kpDistributionAreaExemplarContract.algebra.forwardOperationId,
    authority: "canonical",
    transformType: "distributeMultiplication",
    title: "Distribute three across x plus two",
    sourceStateId: "factored",
    targetStateId: "distributed",
    records: [
      record("factor-fans-out", "fan-out", "factored", ["factor.3"], "distributed", ["left.factor.3", "right.factor.3"], "The shared factor derives one factor for each addend."),
      record("x-persists", "identity", "factored", ["term.x"], "distributed", ["left.term.x"], "The variable term persists into the left product."),
      record("two-persists", "identity", "factored", ["term.2"], "distributed", ["right.term.2"], "The constant term persists into the right product."),
      record("plus-persists", "identity", "factored", ["plus"], "distributed", ["plus"], "Addition persists between the products."),
      record("grouping-exits", "removal", "factored", ["left-paren", "right-paren"], "distributed", [], "Grouping exits after both product positions exist."),
      record("multiplication-enters", "introduction", "factored", [], "distributed", ["right.times"], "Explicit multiplication enters where adjacent numerals would be ambiguous.")
    ]
  });

  const evaluate = transition({
    id: `${baseId}.transition.evaluate-three-times-two`,
    operationId: `${baseId}.evaluate-three-times-two`,
    authority: "exemplar-local",
    transformType: "simplifyConstantProduct",
    title: "Evaluate three times two",
    sourceStateId: "distributed",
    targetStateId: "expanded",
    records: [
      record("left-factor-persists", "identity", "distributed", ["left.factor.3"], "expanded", ["left.factor.3"], "The left factor persists."),
      record("x-persists", "identity", "distributed", ["left.term.x"], "expanded", ["left.term.x"], "The variable term persists."),
      record("plus-persists", "identity", "distributed", ["plus"], "expanded", ["plus"], "Addition persists."),
      record("constant-product-derives", "fan-in", "distributed", ["right.factor.3", "right.term.2"], "expanded", ["right.product.6"], "Three and two derive their product, six."),
      record("multiplication-exits", "removal", "distributed", ["right.times"], "expanded", [], "The multiplication artifact exits when the product settles.")
    ]
  });

  const decompose = transition({
    id: `${baseId}.transition.decompose-six`,
    operationId: `${baseId}.decompose-six-as-three-times-two`,
    authority: "exemplar-local",
    transformType: "decomposeConstantProduct",
    title: "Decompose six as three times two",
    sourceStateId: "expanded",
    targetStateId: "distributed",
    records: [
      record("left-factor-persists", "identity", "expanded", ["left.factor.3"], "distributed", ["left.factor.3"], "The left factor persists."),
      record("x-persists", "identity", "expanded", ["left.term.x"], "distributed", ["left.term.x"], "The variable term persists."),
      record("plus-persists", "identity", "expanded", ["plus"], "distributed", ["plus"], "Addition persists."),
      record("constant-product-decomposes", "fan-out", "expanded", ["right.product.6"], "distributed", ["right.factor.3", "right.term.2"], "Six decomposes into the factor pair three and two."),
      record("multiplication-enters", "introduction", "expanded", [], "distributed", ["right.times"], "Explicit multiplication enters between the factor pair.")
    ]
  });

  const factor = transition({
    id: `${baseId}.transition.factor`,
    operationId: kpDistributionAreaExemplarContract.algebra.reverseOperationId,
    authority: "canonical",
    transformType: "factorCommonTerm",
    title: "Factor the common three",
    sourceStateId: "distributed",
    targetStateId: "factored",
    records: [
      record("factors-merge", "fan-in", "distributed", ["left.factor.3", "right.factor.3"], "factored", ["factor.3"], "The repeated threes derive one shared factor."),
      record("x-persists", "identity", "distributed", ["left.term.x"], "factored", ["term.x"], "The variable term persists inside the group."),
      record("two-persists", "identity", "distributed", ["right.term.2"], "factored", ["term.2"], "The constant term persists inside the group."),
      record("plus-persists", "identity", "distributed", ["plus"], "factored", ["plus"], "Addition persists inside the group."),
      record("multiplication-exits", "removal", "distributed", ["right.times"], "factored", [], "The explicit multiplication artifact exits when the factor becomes shared."),
      record("grouping-enters", "introduction", "distributed", [], "factored", ["left-paren", "right-paren"], "Grouping enters around the addends after the shared factor settles.")
    ]
  });

  return {
    id: `${baseId}.semantic-trace`,
    contractId: baseId,
    bundle,
    stateObjectIds,
    forward: [distribute, evaluate],
    reverse: [decompose, factor]
  };
}

function transition(input: {
  readonly id: string;
  readonly operationId: string;
  readonly authority: "canonical" | "exemplar-local";
  readonly transformType: string;
  readonly title: string;
  readonly sourceStateId: KpDistributionAreaExemplarStateId;
  readonly targetStateId: KpDistributionAreaExemplarStateId;
  readonly records: readonly SelectorCorrespondenceRecord[];
}): KpDistributionAreaExemplarTransition {
  const correspondenceMap: CorrespondenceMap = {
    id: `${input.id}.correspondence`,
    records: input.records
  };
  return {
    id: input.id,
    operationId: input.operationId,
    authority: input.authority,
    sourceStateId: input.sourceStateId,
    targetStateId: input.targetStateId,
    transformation: createKpSemanticTransformation({
      id: input.id,
      transformType: input.transformType,
      title: input.title,
      sourceObjectIds: [stateObjectIds[input.sourceStateId]],
      targetObjectIds: [stateObjectIds[input.targetStateId]],
      preserves: ["value", "structure"],
      correspondenceMap,
      correspondence: input.records.flatMap((candidate) =>
        candidate.relation === "identity"
          ? [{
              sourceSelectorId: candidate.sourceSelectorIds[0]!,
              targetSelectorId: candidate.targetSelectorIds[0]!,
              preserves: ["identity" as const]
            }]
          : []
      )
    })
  };
}

function expression(
  id: string,
  title: string,
  structuredExpression: KpStructuredExpression,
  selectors: readonly CreateKpAssetSelectorInput[]
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "expression",
    title,
    value: { structuredExpression },
    selectors
  });
}

function selector(
  objectId: string,
  suffix: string,
  kind: string,
  label: string,
  structuredSubtreeId?: string
): CreateKpAssetSelectorInput {
  return {
    id: `${objectId}.${suffix}`,
    kind,
    label,
    ...(structuredSubtreeId === undefined
      ? {}
      : { metadata: { structuredSubtreeId } })
  };
}

function record(
  id: string,
  relation: SelectorCorrespondenceRecord["relation"],
  sourceStateId: KpDistributionAreaExemplarStateId,
  sourceSuffixes: readonly string[],
  targetStateId: KpDistributionAreaExemplarStateId,
  targetSuffixes: readonly string[],
  summary: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation,
    sourceSelectorIds: sourceSuffixes.map(
      (suffix) => `${stateObjectIds[sourceStateId]}.${suffix}`
    ),
    targetSelectorIds: targetSuffixes.map(
      (suffix) => `${stateObjectIds[targetStateId]}.${suffix}`
    ),
    summary
  };
}
