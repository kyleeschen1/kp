import {
  createKpFractionCompositionEndpointSpecs
} from "./fraction-composition-endpoint-spec.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetMetadataValue,
  type KpAssetSelector
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type {
  SelectorCorrespondenceRecord,
  SelectorCorrespondenceRelationId
} from "./correspondence.ts";
import {
  createKpLawfulFractionSolveMacro
} from "./fraction-solve-macro.ts";

export interface KpFractionCompositionEquationAsset {
  readonly sourceTraceId: "macro.fraction.two-thirds-x-plus-six-equals-ten";
  readonly bundle: ReturnType<typeof createKpAssetBundle>;
  readonly transformations: readonly KpSemanticTransformation[];
}

interface TransitionLineageSpec {
  readonly stepId: string;
  readonly records: readonly SelectorCorrespondenceRecord[];
}

const sourceTraceId = "macro.fraction.two-thirds-x-plus-six-equals-ten";

export function createKpFractionCompositionEquationAsset():
KpFractionCompositionEquationAsset {
  const macro = createKpLawfulFractionSolveMacro();
  const endpoints = createKpFractionCompositionEndpointSpecs();
  const specs = createTransitionLineageSpecs();
  const specByStepId = new Map(specs.map((spec) => [spec.stepId, spec]));
  const transformations = Object.freeze(macro.steps.map((step) => {
    const spec = specByStepId.get(step.id);
    if (spec === undefined) {
      throw new Error(`Fraction composition step ${step.id} lacks authored lineage.`);
    }
    return createKpSemanticTransformation({
      id: step.id,
      transformType: step.transformType,
      title: titleForTransform(step.transformType),
      sourceObjectIds: [step.sourceStateId],
      targetObjectIds: [step.targetStateId],
      preserves: ["identity", "value", "structure"],
      correspondenceMap: {
        id: `${step.id}.correspondence`,
        records: spec.records
      },
      lawRefs: step.authorityIds.map((id) => ({ id, level: "strict" }))
    });
  }));
  const successorMetadata = createSuccessorMetadata(transformations, endpoints);
  const bundle = createKpAssetBundle({
    id: "asset.fraction-composition-equation",
    title: "Distribute and solve with a fraction",
    objects: endpoints.map((endpoint, index) =>
      createKpSemanticAssetObject({
        id: endpoint.stateId,
        objectType: "equation",
        title: endpoint.label,
        value: { latex: endpoint.segments.map(({ latex }) => latex).join("") },
        selectors: [
          ...endpoint.segments.flatMap((segment) => segment.kind === "selector"
            ? [{
                id: segment.selectorId,
                kind: selectorKind(segment.latex),
                label: readableLabel(segment.latex),
                metadata: {
                  equationStructureRole: selectorKind(segment.latex),
                  nativeEndpoint: true,
                  ...(successorMetadata.get(segment.selectorId) ?? {})
                }
              }]
            : []),
          ...endpoint.structuralAnchors.map((anchor) => ({
            id: anchor.id,
            kind: "artifact",
            label: "fraction rule",
            metadata: {
              equationStructureRole: "fraction-rule",
              nativeEndpoint: true,
              ...(successorMetadata.get(anchor.id) ?? {})
            }
          }))
        ],
        provenance: index === 0
          ? {
              kind: "authored",
              sourceIds: [sourceTraceId],
              summary: "Certified initial equation."
            }
          : {
              kind: "transformed",
              sourceIds: [endpoints[index - 1]!.stateId],
              transformationId: macro.steps[index - 1]!.id
            }
      })
    )
  });
  return Object.freeze({ sourceTraceId, bundle, transformations });
}

function createSuccessorMetadata(
  transformations: readonly KpSemanticTransformation[],
  endpoints: ReturnType<typeof createKpFractionCompositionEndpointSpecs>
): ReadonlyMap<string, Readonly<Record<string, KpAssetMetadataValue>>> {
  const kindBySelectorId = new Map(endpoints.flatMap((endpoint) => [
    ...endpoint.segments.flatMap((segment) => segment.kind === "selector"
      ? [[segment.selectorId, selectorKind(segment.latex)] as const]
      : []),
    ...endpoint.structuralAnchors.map(({ id }) => [id, "artifact"] as const)
  ]));
  const metadata = new Map<string, Readonly<Record<string, KpAssetMetadataValue>>>();
  transformations
    .filter(({ transformType }) => transformType.startsWith("simplifyConstant"))
    .forEach((transformation) => {
      transformation.correspondenceMap?.records
        .filter(({ relation }) => relation === "fan-in")
        .forEach((record) => {
          let materialRank = 0;
          record.sourceSelectorIds.forEach((selectorId) => {
            const kind = kindBySelectorId.get(selectorId);
            const catalyst = kind === "operator" || kind === "artifact";
            metadata.set(selectorId, {
              ...(metadata.get(selectorId) ?? {}),
              successorContribution: catalyst ? "catalyst" : "material-input",
              successorRole: catalyst ? "operation-structure" : "operand",
              successorRank: catalyst ? 0 : materialRank++
            });
          });
          record.targetSelectorIds.forEach((selectorId, successorRank) => {
            metadata.set(selectorId, {
              ...(metadata.get(selectorId) ?? {}),
              successorTarget: true,
              successorRole: "exact-successor",
              successorRank
            });
          });
        });
    });
  return metadata;
}

function createTransitionLineageSpecs(): readonly TransitionLineageSpec[] {
  return Object.freeze([
    spec("fraction-solve.step.distribute", [
      fanOut("factor-numerator", "fraction-fan-out.source.factor.numerator", [
        "fraction-fan-out.target.factor.x.numerator",
        "fraction-fan-out.target.factor.6.numerator"
      ]),
      fanOut("factor-denominator", "fraction-fan-out.source.factor.denominator", [
        "fraction-fan-out.target.factor.x.denominator",
        "fraction-fan-out.target.factor.6.denominator"
      ]),
      fanOut("factor-rule", "fraction-fan-out.source.factor.fraction-rule", [
        "fraction-fan-out.target.factor.x.fraction-rule",
        "fraction-fan-out.target.factor.6.fraction-rule"
      ]),
      role("x-persists", "fraction-fan-out.source.addend.x",
        "fraction-fan-out.target.addend.x"),
      role("six-persists", "fraction-fan-out.source.addend.6",
        "fraction-fan-out.target.addend.6"),
      role("sum-operator-persists", "fraction-fan-out.source.grouped-sum.operator.1",
        "fraction-fan-out.target.root.operator.1"),
      remove("left-parenthesis-retires",
        "fraction-fan-out.source.grouped-sum.left-parenthesis"),
      remove("right-parenthesis-retires",
        "fraction-fan-out.source.grouped-sum.right-parenthesis"),
      introduce("x-product-operator-enters",
        "fraction-fan-out.target.term.x.operator.1"),
      introduce("six-product-operator-enters",
        "fraction-fan-out.target.term.6.operator.1"),
      equationContext("factored", "distributed")
    ]),
    spec("fraction-solve.step.normalize", [
      role("x-factor-enters-numerator", "fraction-fan-out.target.factor.x.numerator",
        "fraction-normalization.target.x.factor"),
      role("x-addend-enters-numerator", "fraction-fan-out.target.addend.x",
        "fraction-normalization.target.x.addend"),
      identity("x-denominator-persists", "fraction-fan-out.target.factor.x.denominator",
        "fraction-normalization.target.x.denominator"),
      identity("x-rule-persists", "fraction-fan-out.target.factor.x.fraction-rule",
        "fraction-normalization.target.x.fraction-rule"),
      remove("x-product-operator-retires", "fraction-fan-out.target.term.x.operator.1"),
      role("six-factor-enters-numerator", "fraction-fan-out.target.factor.6.numerator",
        "fraction-normalization.target.6.factor"),
      role("six-addend-enters-numerator", "fraction-fan-out.target.addend.6",
        "fraction-normalization.target.6.addend"),
      role("six-product-operator-enters-numerator",
        "fraction-fan-out.target.term.6.operator.1",
        "fraction-normalization.target.6.numerator.operator.1"),
      identity("six-denominator-persists", "fraction-fan-out.target.factor.6.denominator",
        "fraction-normalization.target.6.denominator"),
      identity("six-rule-persists", "fraction-fan-out.target.factor.6.fraction-rule",
        "fraction-normalization.target.6.fraction-rule"),
      identity("outer-plus-persists", "fraction-fan-out.target.root.operator.1",
        "fraction-composition.target.sum.operator.1"),
      equationContext("distributed", "normalized")
    ]),
    spec("fraction-solve.step.constant-product", [
      identity("variable-two-persists", "fraction-normalization.target.x.factor",
        "constant-product.left.variable.numerator.2"),
      identity("variable-x-persists", "fraction-normalization.target.x.addend",
        "constant-product.left.variable.numerator.x"),
      identity("variable-denominator-persists",
        "fraction-normalization.target.x.denominator",
        "constant-product.left.variable.denominator"),
      identity("variable-rule-persists", "fraction-normalization.target.x.fraction-rule",
        "constant-product.left.variable.fraction-rule"),
      fanIn("two-times-six-becomes-twelve", [
        "fraction-normalization.target.6.factor",
        "fraction-normalization.target.6.numerator.operator.1",
        "fraction-normalization.target.6.addend"
      ], "constant-product.left.12"),
      identity("constant-denominator-persists",
        "fraction-normalization.target.6.denominator",
        "constant-product.left.constant.denominator"),
      identity("constant-rule-persists", "fraction-normalization.target.6.fraction-rule",
        "constant-product.left.constant.fraction-rule"),
      identity("outer-plus-persists", "fraction-composition.target.sum.operator.1",
        "constant-product.left.operator.1"),
      equationContext("normalized", "constant-product")
    ]),
    spec("fraction-solve.step.constant-quotient", [
      fractionIdentity("constant-product.left.variable",
        "constant-quotient.left.variable"),
      identity("outer-plus-persists", "constant-product.left.operator.1",
        "constant-quotient.left.operator.1"),
      fanIn("twelve-over-three-becomes-four", [
        "constant-product.left.12",
        "constant-product.left.constant.fraction-rule",
        "constant-product.left.constant.denominator"
      ], "constant-quotient.left.4"),
      equationContext("constant-product", "constant-quotient")
    ]),
    spec("fraction-solve.step.subtract-four", [
      fractionIdentity("constant-quotient.left.variable",
        "balanced-subtraction.left.variable"),
      identity("left-plus-persists", "constant-quotient.left.operator.1",
        "balanced-subtraction.left.source.operator.1"),
      identity("left-four-persists", "constant-quotient.left.4",
        "balanced-subtraction.left.4"),
      identity("right-ten-persists", "constant-quotient.right",
        "balanced-subtraction.right.10"),
      introduce("left-minus-enters", "balanced-subtraction.left.minus4.minus"),
      introduce("left-four-enters", "balanced-subtraction.left.minus4.value"),
      introduce("right-minus-enters", "balanced-subtraction.right.minus4.minus"),
      introduce("right-four-enters", "balanced-subtraction.right.minus4.value"),
      equals("constant-quotient", "balanced-subtraction")
    ]),
    spec("fraction-solve.step.cancel-additive-inverses", [
      fractionIdentity("balanced-subtraction.left.variable",
        "additive-cancelled.left"),
      cancel("left-fours-cancel", [
        "balanced-subtraction.left.source.operator.1",
        "balanced-subtraction.left.4",
        "balanced-subtraction.left.minus4.minus",
        "balanced-subtraction.left.minus4.value"
      ]),
      identity("right-ten-persists", "balanced-subtraction.right.10",
        "additive-cancelled.right.10"),
      identity("right-minus-persists", "balanced-subtraction.right.minus4.minus",
        "additive-cancelled.right.minus4.minus"),
      identity("right-four-persists", "balanced-subtraction.right.minus4.value",
        "additive-cancelled.right.minus4.value"),
      equals("balanced-subtraction", "additive-cancelled")
    ]),
    spec("fraction-solve.step.simplify-difference", [
      fractionIdentity("additive-cancelled.left", "difference-simplified.left"),
      fanIn("ten-minus-four-becomes-six", [
        "additive-cancelled.right.10",
        "additive-cancelled.right.minus4.minus",
        "additive-cancelled.right.minus4.value"
      ], "difference-simplified.right"),
      equals("additive-cancelled", "difference-simplified")
    ]),
    spec("fraction-solve.step.multiply-by-three", [
      fractionIdentity("difference-simplified.left",
        "balanced-multiplication.left.fraction"),
      identity("right-six-persists", "difference-simplified.right",
        "balanced-multiplication.right.6"),
      introduce("left-three-enters", "balanced-multiplication.left.3"),
      introduce("left-product-operator-enters",
        "balanced-multiplication.left.operator.1"),
      introduce("right-three-enters", "balanced-multiplication.right.3"),
      introduce("right-product-operator-enters",
        "balanced-multiplication.right.operator.1"),
      equals("difference-simplified", "balanced-multiplication")
    ]),
    spec("fraction-solve.step.cancel-denominator", [
      identity("two-persists", "balanced-multiplication.left.fraction.numerator.2",
        "denominator-cancelled.left.2"),
      identity("x-persists", "balanced-multiplication.left.fraction.numerator.x",
        "denominator-cancelled.left.x"),
      cancel("threes-cancel", [
        "balanced-multiplication.left.3",
        "balanced-multiplication.left.operator.1",
        "balanced-multiplication.left.fraction.denominator"
      ]),
      remove("fraction-rule-retires",
        "balanced-multiplication.left.fraction.fraction-rule"),
      identity("right-three-persists", "balanced-multiplication.right.3",
        "denominator-cancelled.right.3"),
      identity("right-product-operator-persists",
        "balanced-multiplication.right.operator.1",
        "denominator-cancelled.right.operator.1"),
      identity("right-six-persists", "balanced-multiplication.right.6",
        "denominator-cancelled.right.6"),
      equals("balanced-multiplication", "denominator-cancelled")
    ]),
    spec("fraction-solve.step.simplify-right-product", [
      identity("left-two-persists", "denominator-cancelled.left.2",
        "right-product-simplified.left.2"),
      identity("left-x-persists", "denominator-cancelled.left.x",
        "right-product-simplified.left.x"),
      fanIn("three-times-six-becomes-eighteen", [
        "denominator-cancelled.right.3",
        "denominator-cancelled.right.operator.1",
        "denominator-cancelled.right.6"
      ], "right-product-simplified.right"),
      equals("denominator-cancelled", "right-product-simplified")
    ]),
    spec("fraction-solve.step.divide-by-two", [
      identity("left-two-enters-numerator", "right-product-simplified.left.2",
        "balanced-division.left.numerator.2"),
      identity("left-x-enters-numerator", "right-product-simplified.left.x",
        "balanced-division.left.numerator.x"),
      identity("right-eighteen-enters-numerator", "right-product-simplified.right",
        "balanced-division.right.18"),
      introduce("left-denominator-enters", "balanced-division.left.denominator"),
      introduce("left-rule-enters", "balanced-division.left.fraction-rule"),
      introduce("right-denominator-enters", "balanced-division.right.denominator"),
      introduce("right-rule-enters", "balanced-division.right.fraction-rule"),
      equals("right-product-simplified", "balanced-division")
    ]),
    spec("fraction-solve.step.cancel-coefficient", [
      cancel("twos-cancel", [
        "balanced-division.left.numerator.2",
        "balanced-division.left.denominator"
      ]),
      identity("x-persists", "balanced-division.left.numerator.x",
        "coefficient-cancelled.left.x"),
      remove("left-rule-retires", "balanced-division.left.fraction-rule"),
      identity("right-eighteen-persists", "balanced-division.right.18",
        "coefficient-cancelled.right.18"),
      identity("right-denominator-persists", "balanced-division.right.denominator",
        "coefficient-cancelled.right.denominator"),
      identity("right-rule-persists", "balanced-division.right.fraction-rule",
        "coefficient-cancelled.right.fraction-rule"),
      equals("balanced-division", "coefficient-cancelled")
    ]),
    spec("fraction-solve.step.simplify-solution", [
      identity("x-persists", "coefficient-cancelled.left.x", "solved.left.x"),
      fanIn("eighteen-over-two-becomes-nine", [
        "coefficient-cancelled.right.18",
        "coefficient-cancelled.right.fraction-rule",
        "coefficient-cancelled.right.denominator"
      ], "solved.right"),
      equals("coefficient-cancelled", "solved")
    ])
  ]);
}

function fractionIdentity(sourceRootId: string, targetRootId: string):
readonly SelectorCorrespondenceRecord[] {
  return [
    identity(`${sourceRootId}.numerator.two-persists`,
      `${sourceRootId}.numerator.2`, `${targetRootId}.numerator.2`),
    identity(`${sourceRootId}.numerator.x-persists`,
      `${sourceRootId}.numerator.x`, `${targetRootId}.numerator.x`),
    identity(`${sourceRootId}.denominator-persists`,
      `${sourceRootId}.denominator`, `${targetRootId}.denominator`),
    identity(`${sourceRootId}.rule-persists`,
      `${sourceRootId}.fraction-rule`, `${targetRootId}.fraction-rule`)
  ];
}

function equationContext(sourceSuffix: string, targetSuffix: string):
readonly SelectorCorrespondenceRecord[] {
  return [
    equals(sourceSuffix, targetSuffix),
    identity(`${sourceSuffix}.right-persists`,
      `${sourceSuffix}.right`, `${targetSuffix}.right`)
  ];
}

function equals(sourceSuffix: string, targetSuffix: string) {
  return identity(`${sourceSuffix}.equals-persists`,
    `fraction-solve.state.${sourceSuffix}.equals`,
    `fraction-solve.state.${targetSuffix}.equals`);
}

function spec(
  stepId: string,
  records: readonly (SelectorCorrespondenceRecord | readonly SelectorCorrespondenceRecord[])[]
): TransitionLineageSpec {
  return {
    stepId,
    records: Object.freeze(records.flatMap((record) => Array.isArray(record)
      ? record
      : [record as SelectorCorrespondenceRecord]))
  };
}

function identity(id: string, source: string, target: string) {
  return record(id, "identity", [source], [target], "Semantic material persists.");
}

function role(id: string, source: string, target: string) {
  return record(id, "role-change", [source], [target], "Semantic material changes role.");
}

function introduce(id: string, target: string) {
  return record(id, "introduction", [], [target], "Operation material enters.");
}

function remove(id: string, source: string) {
  return record(id, "removal", [source], [], "Completed structure retires.");
}

function cancel(id: string, sources: readonly string[]) {
  return record(id, "cancelation", sources, [], "Certified inverse material cancels.");
}

function fanIn(id: string, sources: readonly string[], target: string) {
  return record(id, "fan-in", sources, [target], "Contributors derive one exact successor.");
}

function fanOut(id: string, source: string, targets: readonly string[]) {
  return record(id, "fan-out", [source], targets, "One verified factor branches.");
}

function record(
  id: string,
  relation: SelectorCorrespondenceRelationId,
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
): SelectorCorrespondenceRecord {
  return { id, relation, sourceSelectorIds, targetSelectorIds, summary };
}

function selectorKind(latex: string): KpAssetSelector["kind"] {
  if (latex === "=") return "relation";
  if (latex === "+" || latex === "-" || latex === "\\cdot") return "operator";
  if (latex === "(" || latex === ")") return "artifact";
  return "term";
}

function readableLabel(latex: string): string {
  if (latex === "\\cdot") return "multiplication";
  if (latex === "(") return "left parenthesis";
  if (latex === ")") return "right parenthesis";
  return latex;
}

function titleForTransform(transformType: string): string {
  return transformType.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}
