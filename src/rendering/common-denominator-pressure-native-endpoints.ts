import {
  kpCanonicalCommonDenominatorPressurePresentationPlan,
  type KpCommonDenominatorPressureEndpointKind
} from "../animation/common-denominator-pressure-presentation-plan.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import type {
  KpSelectorAnnotatedLatex,
  KpSelectorLatexAnnotation
} from "./selector-annotated-latex.ts";

export interface KpCommonDenominatorPressureNativeNode {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly kind:
    | "operand"
    | "factor"
    | "operator"
    | "fraction-bar"
    | "structure";
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpCommonDenominatorPressureNativeEndpoint {
  readonly schemaVersion:
    "kp.common-denominator-pressure-native-endpoint.v1";
  readonly kind: KpCommonDenominatorPressureEndpointKind;
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpCommonDenominatorPressureNativeNode[];
  readonly introductionNodes:
    readonly KpCommonDenominatorPressureNativeNode[];
}

interface NativePart {
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly nodes: readonly KpCommonDenominatorPressureNativeNode[];
  readonly introductionNodes:
    readonly KpCommonDenominatorPressureNativeNode[];
}

const plan = kpCanonicalCommonDenominatorPressurePresentationPlan;
const alignment = plan.equivalence;
const local = alignment.focus.semantic;
const sourceContext = alignment.contextTransfers;
const sourceOperator = context("addition-operator");
const sourceSecondNumerator = context("untouched-numerator");
const sourceSecondDenominator = context("untouched-denominator");
const sourceSecondDivision = context("untouched-division");
const firstFactorTransfer = alignment.focus.presentation.factorTransfer;

if (firstFactorTransfer.kind !== "paired-unit-factor-transfer") {
  throw new Error(
    "Common-denominator pressure endpoints require the approved unit-factor source."
  );
}

const unitFactorDivisionId = alignment.focus.presentation
  .operationMaterialSelectorIds.find((id) =>
    id.includes("unit-factor.division")
  );
if (unitFactorDivisionId === undefined) {
  throw new Error(
    "Common-denominator pressure endpoints require a unit-factor division."
  );
}

export const kpCanonicalCommonDenominatorPressureNativeEndpoints =
  Object.freeze([
    problemEndpoint(),
    equivalenceSourceEndpoint(),
    productEndpoint(),
    evaluatedEndpoint()
  ] as const);

export function bindKpCommonDenominatorPressureNativeEndpoint(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpCommonDenominatorPressureNativeEndpoint;
}): void {
  input.root.dataset["kpSemanticEntityId"] = input.endpoint.stateId;
  input.root.dataset["kpPresentationGroupId"] =
    input.endpoint.rootPresentationGroupId;
  const bars = [...input.root.querySelectorAll<HTMLElement>(".frac-line")];
  const barNodes = input.endpoint.nodes.filter(({ kind }) =>
    kind === "fraction-bar"
  );
  if (bars.length !== barNodes.length) {
    throw new Error(
      `Pressure endpoint ${input.endpoint.kind} expected ${barNodes.length} ` +
      `fraction bars, received ${bars.length}.`
    );
  }
  barNodes.forEach((node, index) => bindNode(bars[index]!, node));
  input.endpoint.nodes.filter(({ kind }) => kind !== "fraction-bar")
    .forEach((node) => {
      const elements = [...input.root.querySelectorAll<HTMLElement>(
        `[data-kp-motion-id="${CSS.escape(node.motionId)}"]`
      )];
      if (elements.length !== 1) {
        throw new Error(
          `Pressure endpoint ${input.endpoint.kind} expected one owner for ` +
          `${node.occurrenceId}, received ${elements.length}.`
        );
      }
      bindNode(elements[0]!, node);
    });
  // Compound groups and their semantic leaves coexist in one annotated tree;
  // renderer phases select an ownership view instead of rewriting the DOM.
  input.endpoint.introductionNodes.forEach((node) => {
    const owner = input.root.querySelector<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(node.motionId)}"]`
    );
    if (owner === null) {
      throw new Error(
        `Pressure endpoint ${input.endpoint.kind} is missing introduction ` +
        `owner ${node.occurrenceId}.`
      );
    }
    bindNode(owner, node);
  });
}

function problemEndpoint(): KpCommonDenominatorPressureNativeEndpoint {
  return endpoint("problem", "One third plus one sixth", sequence(
    fraction(
      atom(local.source.numerator.entityId,
        local.source.numerator.semanticId, "operand", "1", "problem"),
      atom(local.source.denominator.entityId,
        local.source.denominator.semanticId, "operand", "3", "problem"),
      bar(local.source.divisionEntityId, "problem")
    ),
    atom(sourceOperator.sourceEntityId,
      "semantic.operation.addition", "operator", "+", "problem"),
    secondFraction("source", "problem")
  ));
}

function equivalenceSourceEndpoint():
KpCommonDenominatorPressureNativeEndpoint {
  const [factorNumeratorId, factorDenominatorId] =
    firstFactorTransfer.sourceOccurrenceEntityIds;
  return endpoint(
    "equivalence-source",
    "Two over two times one third, plus one sixth",
    sequence(
      introductionGroup(fraction(
        atom(factorNumeratorId, local.factor.semanticId,
          "factor", "2", "equivalence-source"),
        atom(factorDenominatorId, local.factor.semanticId,
          "factor", "2", "equivalence-source"),
        bar(requiredUnitFactorDivisionId(), "equivalence-source")
      ), `${local.source.stateId}.unit-factor`,
      "semantic.fraction-equivalence.unit-factor", "equivalence-source"),
      atom(`${local.source.stateId}.unit-factor-multiplication`,
        "semantic.operation.multiplication", "operator", "\\cdot",
        "equivalence-source"),
      fraction(
        atom(local.source.numerator.entityId,
          local.source.numerator.semanticId, "operand", "1",
          "equivalence-source"),
        atom(local.source.denominator.entityId,
          local.source.denominator.semanticId, "operand", "3",
          "equivalence-source"),
        bar(local.source.divisionEntityId, "equivalence-source")
      ),
      atom(sourceOperator.sourceEntityId,
        "semantic.operation.addition", "operator", "+",
        "equivalence-source"),
      secondFraction("source", "equivalence-source")
    )
  );
}

function productEndpoint(): KpCommonDenominatorPressureNativeEndpoint {
  const target = local.target;
  return endpoint(
    "product",
    "Two times one over two times three, plus one sixth",
    sequence(
      fraction(
        sequence(
          atom(target.numeratorFactorOccurrenceEntityId,
            local.factor.semanticId, "factor", "2", "product"),
          atom(`${target.numeratorProductEntityId}.operator`,
            "semantic.operation.multiplication", "operator", "\\cdot",
            "product"),
          atom(target.numeratorSourceOccurrenceEntityId,
            local.source.numerator.semanticId, "operand", "1", "product")
        ),
        sequence(
          atom(target.denominatorFactorOccurrenceEntityId,
            local.factor.semanticId, "factor", "2", "product"),
          atom(`${target.denominatorProductEntityId}.operator`,
            "semantic.operation.multiplication", "operator", "\\cdot",
            "product"),
          atom(target.denominatorSourceOccurrenceEntityId,
            local.source.denominator.semanticId, "operand", "3", "product")
        ),
        bar(target.divisionEntityId, "product")
      ),
      atom(sourceOperator.targetEntityId,
        "semantic.operation.addition", "operator", "+", "product"),
      secondFraction("target", "product")
    )
  );
}

function evaluatedEndpoint(): KpCommonDenominatorPressureNativeEndpoint {
  const target = plan.equivalence.focus.targetTermEntityId;
  const firstTerm = plan.equivalence.focus.semantic.target;
  const alignmentTarget =
    plan.evaluation.bindings.map((binding) =>
      binding.targetAnnotations[0]!.selectorIds[0]!
    );
  if (alignmentTarget.length !== 2) {
    throw new Error(`Pressure target ${target} requires two evaluated owners.`);
  }
  return endpoint(
    "evaluated",
    "Two sixths plus one sixth",
    sequence(
      fraction(
        atom(alignmentTarget[0]!,
          local.source.numerator.semanticId, "operand", "2", "evaluated"),
        atom(alignmentTarget[1]!,
          local.source.denominator.semanticId, "operand", "6", "evaluated"),
        bar(firstTerm.divisionEntityId, "evaluated")
      ),
      atom(sourceOperator.targetEntityId,
        "semantic.operation.addition", "operator", "+", "evaluated"),
      secondFraction("target", "evaluated")
    )
  );
}

function secondFraction(
  side: "source" | "target",
  endpointKind: KpCommonDenominatorPressureEndpointKind
): NativePart {
  return fraction(
    atom(
      side === "source"
        ? sourceSecondNumerator.sourceEntityId
        : sourceSecondNumerator.targetEntityId,
      "semantic.fraction.common-denominator.second.numerator",
      "operand",
      "1",
      endpointKind
    ),
    atom(
      side === "source"
        ? sourceSecondDenominator.sourceEntityId
        : sourceSecondDenominator.targetEntityId,
      "semantic.fraction.common-denominator.second.denominator",
      "operand",
      "6",
      endpointKind
    ),
    bar(
      side === "source"
        ? sourceSecondDivision.sourceEntityId
        : sourceSecondDivision.targetEntityId,
      endpointKind
    )
  );
}

function endpoint(
  kind: KpCommonDenominatorPressureEndpointKind,
  accessibleText: string,
  content: NativePart
): KpCommonDenominatorPressureNativeEndpoint {
  const authority = plan.endpoints.find((entry) => entry.kind === kind);
  if (authority === undefined || authority.latex !== content.rawLatex) {
    throw new Error(
      `Pressure ${kind} endpoint rendered ${content.rawLatex}; expected ` +
      `${authority?.latex ?? "missing authority"}.`
    );
  }
  const annotations: readonly KpSelectorLatexAnnotation[] = Object.freeze(
    [...content.nodes, ...content.introductionNodes]
      .flatMap((node) => node.kind === "fraction-bar" ? [] : [{
      selectorId: node.occurrenceId,
      motionId: node.motionId,
      latex: latexForMotion(content.annotatedLatex, node.motionId)
      }])
  );
  const annotated = Object.freeze({
    id: `common-denominator-pressure.${kind}`,
    kind: "selector-annotated-latex" as const,
    rawLatex: content.rawLatex,
    annotatedLatex: content.annotatedLatex,
    annotations
  });
  return Object.freeze({
    schemaVersion:
      "kp.common-denominator-pressure-native-endpoint.v1" as const,
    kind,
    stateId: authority.stateId,
    accessibleText,
    rootPresentationGroupId: `group.${authority.stateId}`,
    annotated,
    nativeHtmlAndMathml: renderLatexToHtml(annotated.annotatedLatex, {
      displayMode: true,
      output: "htmlAndMathml",
      trust: true
    }),
    nodes: content.nodes,
    introductionNodes: content.introductionNodes
  });
}

function atom(
  occurrenceId: string,
  semanticId: string,
  kind: Exclude<KpCommonDenominatorPressureNativeNode["kind"],
    "fraction-bar">,
  latex: string,
  endpointKind: KpCommonDenominatorPressureEndpointKind
): NativePart {
  const motionId =
    `common-denominator-pressure.${endpointKind}.${occurrenceId}`;
  const node = Object.freeze({
    occurrenceId,
    semanticId,
    kind,
    motionId,
    presentationGroupId:
      `group.common-denominator-pressure.${endpointKind}.${occurrenceId}`
  });
  return Object.freeze({
    rawLatex: latex,
    annotatedLatex: `\\htmlData{kp-motion-id=${motionId}}{${latex}}`,
    nodes: Object.freeze([node]),
    introductionNodes: Object.freeze([])
  });
}

function bar(
  occurrenceId: string,
  endpointKind: KpCommonDenominatorPressureEndpointKind
): KpCommonDenominatorPressureNativeNode {
  return Object.freeze({
    occurrenceId,
    semanticId: "semantic.fraction.common-denominator.division",
    kind: "fraction-bar" as const,
    motionId:
      `common-denominator-pressure.${endpointKind}.${occurrenceId}`,
    presentationGroupId:
      `group.common-denominator-pressure.${endpointKind}.${occurrenceId}`
  });
}

function fraction(
  numerator: NativePart,
  denominator: NativePart,
  division: KpCommonDenominatorPressureNativeNode
): NativePart {
  return Object.freeze({
    rawLatex:
      `\\frac{${numerator.rawLatex}}{${denominator.rawLatex}}`,
    annotatedLatex:
      `\\frac{${numerator.annotatedLatex}}{${denominator.annotatedLatex}}`,
    nodes: Object.freeze([
      ...numerator.nodes,
      ...denominator.nodes,
      division
    ]),
    introductionNodes: Object.freeze([
      ...numerator.introductionNodes,
      ...denominator.introductionNodes
    ])
  });
}

function introductionGroup(
  content: NativePart,
  occurrenceId: string,
  semanticId: string,
  endpointKind: KpCommonDenominatorPressureEndpointKind
): NativePart {
  const motionId =
    `common-denominator-pressure.${endpointKind}.${occurrenceId}`;
  const node = Object.freeze({
    occurrenceId,
    semanticId,
    kind: "structure" as const,
    motionId,
    presentationGroupId:
      `group.common-denominator-pressure.${endpointKind}.${occurrenceId}`
  });
  return Object.freeze({
    rawLatex: content.rawLatex,
    annotatedLatex:
      `\\htmlData{kp-motion-id=${motionId}}{${content.annotatedLatex}}`,
    nodes: content.nodes,
    introductionNodes: Object.freeze([node])
  });
}

function sequence(...parts: readonly NativePart[]): NativePart {
  return Object.freeze({
    rawLatex: parts.map(({ rawLatex }) => rawLatex).join(""),
    annotatedLatex: parts.map(({ annotatedLatex }) =>
      annotatedLatex
    ).join(""),
    nodes: Object.freeze(parts.flatMap(({ nodes }) => nodes)),
    introductionNodes: Object.freeze(parts.flatMap(
      ({ introductionNodes }) => introductionNodes
    ))
  });
}

function context(
  role: typeof sourceContext[number]["role"]
) {
  const result = sourceContext.find((entry) => entry.role === role);
  if (result === undefined) {
    throw new Error(`Missing common-denominator context ${role}.`);
  }
  return result;
}

function requiredUnitFactorDivisionId(): string {
  if (unitFactorDivisionId === undefined) {
    throw new Error(
      "Common-denominator pressure endpoints require a unit-factor division."
    );
  }
  return unitFactorDivisionId;
}

function bindNode(
  element: HTMLElement,
  node: KpCommonDenominatorPressureNativeNode
): void {
  element.dataset["kpMotionId"] = node.motionId;
  element.dataset["kpSemanticEntityId"] = node.occurrenceId;
  element.dataset["kpSemanticIdentityId"] = node.semanticId;
  element.dataset["kpSemanticSelectorId"] = node.occurrenceId;
  element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
}

function latexForMotion(annotatedLatex: string, motionId: string): string {
  const marker = `\\htmlData{kp-motion-id=${motionId}}{`;
  const start = annotatedLatex.indexOf(marker);
  if (start < 0) return "";
  const bodyStart = start + marker.length;
  let depth = 0;
  for (let index = bodyStart; index < annotatedLatex.length; index += 1) {
    const character = annotatedLatex[index];
    if (character === "{") depth += 1;
    if (character !== "}") continue;
    if (depth === 0) return annotatedLatex.slice(bodyStart, index);
    depth -= 1;
  }
  return "";
}
