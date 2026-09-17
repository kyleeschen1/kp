import {
  kpCanonicalCommonDenominatorPressurePresentationPlan,
  isKpCommonDenominatorPressurePresentationPlan,
  type KpCommonDenominatorPressurePresentationPlan,
  type KpCommonDenominatorPressureEquivalencePlan,
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

export const kpCanonicalCommonDenominatorPressureNativeEndpoints =
  createKpCommonDenominatorPressureNativeEndpoints(kpCanonicalCommonDenominatorPressurePresentationPlan);

/** Values and occurrence identities come from the same issued authority. */
export function createKpCommonDenominatorPressureNativeEndpoints(plan: KpCommonDenominatorPressurePresentationPlan) {
  if (!isKpCommonDenominatorPressurePresentationPlan(plan)) throw new TypeError("Expected an issued pressure presentation plan.");
  const values = plan.values;
  const context = (role: KpCommonDenominatorPressureEquivalencePlan["contextTransfers"][number]["role"]) => {
    const result = plan.equivalence.contextTransfers.find(entry => entry.role === role);
    if (!result) throw new Error(`Missing common-denominator context ${role}.`);
    return result;
  };
  const sourceOperator = context(plan.operator === "+" ? "addition-operator" : "subtraction-operator");
  const kinds = ["problem", "equivalence-source", "product", "evaluated"] as const;
  const endpoints = kinds.map(kind => {
    const source = kind === "problem" || kind === "equivalence-source";
    const part = (position: 0 | 1) => {
      const primary = plan.equivalence.focus.position === (position === 0 ? "first-term" : "second-term");
      const branch = primary ? plan.equivalence : plan.companion;
      const numerator = position === 0 ? values.firstNumerator : values.secondNumerator;
      const denominator = position === 0 ? values.firstDenominator : values.secondDenominator;
      return branch ? focusedFraction(branch, kind, numerator, denominator,
        position === 0 ? values.factor : values.secondFactor,
        position === 0 ? values.targetNumerator : values.secondTargetNumerator,
        position === 0 ? values.targetDenominator : values.secondTargetDenominator, primary ? 0 : 2)
        : fraction(
          atom(context("untouched-numerator")[source ? "sourceEntityId" : "targetEntityId"],
            "semantic.fraction.common-denominator.context.numerator", "operand", numerator, kind),
          atom(context("untouched-denominator")[source ? "sourceEntityId" : "targetEntityId"],
            "semantic.fraction.common-denominator.context.denominator", "operand", denominator, kind),
          bar(context("untouched-division")[source ? "sourceEntityId" : "targetEntityId"], kind));
    };
    const first = part(0), second = part(1);
    return endpoint(kind, sequence(first,
      atom(sourceOperator[source ? "sourceEntityId" : "targetEntityId"], plan.operator === "+" ? "semantic.operation.addition" : "semantic.operation.subtraction", "operator", plan.operator, kind), second));
  });
  return Object.freeze([endpoints[0]!, endpoints[1]!, endpoints[2]!, endpoints[3]!] as const);

  function focusedFraction(branch: KpCommonDenominatorPressureEquivalencePlan,
    kind: KpCommonDenominatorPressureEndpointKind, numerator: string, denominator: string,
    factor: string, resultNumerator: string, resultDenominator: string, bindingOffset: number): NativePart {
    const local = branch.focus.semantic;
    const sourceFraction = () => fraction(
      atom(local.source.numerator.entityId, local.source.numerator.semanticId, "operand", numerator, kind),
      atom(local.source.denominator.entityId, local.source.denominator.semanticId, "operand", denominator, kind),
      bar(local.source.divisionEntityId, kind));
    if (kind === "problem") return sourceFraction();
    if (kind === "equivalence-source") {
      const transfer = branch.focus.presentation.factorTransfer;
      if (transfer.kind !== "paired-unit-factor-transfer") throw new Error("Expected the approved unit-factor source.");
      const division = branch.focus.presentation.operationMaterialSelectorIds.find(id => id.includes("unit-factor.division"));
      if (!division) throw new Error("Missing unit-factor division.");
      return sequence(
        introductionGroup(fraction(
          atom(transfer.sourceOccurrenceEntityIds[0], local.factor.semanticId, "factor", factor, kind),
          atom(transfer.sourceOccurrenceEntityIds[1], local.factor.semanticId, "factor", factor, kind),
          bar(division, kind)), `${local.source.stateId}.unit-factor`, "semantic.fraction-equivalence.unit-factor", kind),
        atom(`${local.source.stateId}.unit-factor-multiplication`, "semantic.operation.multiplication", "operator", "\\cdot", kind),
        sourceFraction());
    }
    const target = local.target;
    if (kind === "product") return fraction(
      sequence(
        atom(target.numeratorFactorOccurrenceEntityId, local.factor.semanticId, "factor", factor, kind),
        atom(`${target.numeratorProductEntityId}.operator`, "semantic.operation.multiplication", "operator", "\\cdot", kind),
        atom(target.numeratorSourceOccurrenceEntityId, local.source.numerator.semanticId, "operand", numerator, kind)),
      sequence(
        atom(target.denominatorFactorOccurrenceEntityId, local.factor.semanticId, "factor", factor, kind),
        atom(`${target.denominatorProductEntityId}.operator`, "semantic.operation.multiplication", "operator", "\\cdot", kind),
        atom(target.denominatorSourceOccurrenceEntityId, local.source.denominator.semanticId, "operand", denominator, kind)),
      bar(target.divisionEntityId, kind));
    const targetId = (offset: number) => plan.evaluation.bindings[bindingOffset + offset]!.targetAnnotations[0]!.selectorIds[0]!;
    return fraction(
      atom(targetId(0), local.source.numerator.semanticId, "operand", resultNumerator, kind),
      atom(targetId(1), local.source.denominator.semanticId, "operand", resultDenominator, kind),
      bar(target.divisionEntityId, kind));
  }

  function endpoint(kind: KpCommonDenominatorPressureEndpointKind, content: NativePart): KpCommonDenominatorPressureNativeEndpoint {
    const authority = plan.endpoints.find(entry => entry.kind === kind);
    if (!authority || authority.latex !== content.rawLatex)
      throw new Error(`Pressure ${kind} endpoint rendered ${content.rawLatex}; expected ${authority?.latex ?? "missing authority"}.`);
    const annotations: readonly KpSelectorLatexAnnotation[] = Object.freeze(
      [...content.nodes, ...content.introductionNodes].flatMap(node => node.kind === "fraction-bar" ? [] : [{
        selectorId: node.occurrenceId, motionId: node.motionId, latex: latexForMotion(content.annotatedLatex, node.motionId)
      }]));
    const annotated = Object.freeze({ id: `common-denominator-pressure.${kind}`, kind: "selector-annotated-latex" as const,
      rawLatex: content.rawLatex, annotatedLatex: content.annotatedLatex, annotations });
    const accessibleText = kind === "problem" ? `${values.firstNumerator} over ${values.firstDenominator} ${plan.operator === "+" ? "plus" : "minus"} ${values.secondNumerator} over ${values.secondDenominator}`
      : kind === "evaluated" ? `${values.targetNumerator} over ${values.targetDenominator} ${plan.operator === "+" ? "plus" : "minus"} ${values.secondTargetNumerator} over ${values.secondTargetDenominator}`
      : kind === "equivalence-source" ? `Introduce ${plan.equivalence.focus.position === "first-term" ? values.factor : values.secondFactor} over ${plan.equivalence.focus.position === "first-term" ? values.factor : values.secondFactor}${plan.companion ? ` and ${values.secondFactor} over ${values.secondFactor}` : ""}; each factor equals one`
      : "Multiply each selected numerator and denominator by its same factor";
    return Object.freeze({ schemaVersion: "kp.common-denominator-pressure-native-endpoint.v1" as const,
      kind, stateId: authority.stateId, accessibleText, rootPresentationGroupId: `group.${authority.stateId}`, annotated,
      nativeHtmlAndMathml: renderLatexToHtml(annotated.annotatedLatex, { displayMode: true, output: "htmlAndMathml", trust: true }),
      nodes: content.nodes, introductionNodes: content.introductionNodes });
  }
}

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
