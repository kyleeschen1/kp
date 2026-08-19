import type { KpEquationFontReadiness } from "./equation-font-readiness.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpSelectorAnnotatedLatex,
  KpSelectorLatexAnnotation
} from "./selector-annotated-latex.ts";
import {
  compileKpFractionEquivalencePresentationPlan,
  kpCanonicalCompactFractionEquivalencePresentationPlan,
  kpCanonicalFractionEquivalencePresentationPlan,
  type KpFractionEquivalencePresentationMode,
  type KpFractionEquivalencePresentationPlan,
  type KpFractionEquivalenceProductNotation
} from "../animation/fraction-equivalence-presentation-plan.ts";
import {
  kpCanonicalFractionEquivalence,
  type KpFractionEquivalenceScalar,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";

export type KpFractionEquivalenceEndpointSide = "source" | "target";

export interface KpFractionEquivalenceNativeEndpointNode {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly kind: "operand" | "factor" | "operator" | "fraction-bar";
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpFractionEquivalenceNativeEndpoint {
  readonly schemaVersion: "kp.fraction-equivalence-native-endpoint.v1";
  readonly mode: KpFractionEquivalencePresentationMode;
  readonly side: KpFractionEquivalenceEndpointSide;
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpFractionEquivalenceNativeEndpointNode[];
}

export function createKpFractionEquivalenceNativeEndpoints(
  semantic: KpVerifiedFractionEquivalence,
  presentation: KpFractionEquivalencePresentationPlan =
    compileKpFractionEquivalencePresentationPlan(semantic)
): readonly [
  KpFractionEquivalenceNativeEndpoint,
  KpFractionEquivalenceNativeEndpoint
] {
  if (presentation.semanticContractId !== semantic.id) {
    throw new Error(
      "Fraction-equivalence endpoints require matching semantic and presentation authority."
    );
  }
  const numerator = scalarLatex(semantic.source.numerator);
  const denominator = scalarLatex(semantic.source.denominator);
  const factor = scalarLatex(semantic.factor);
  const numeratorProduct = createTargetProduct({
    productEntityId: semantic.target.numeratorProductEntityId,
    factorOccurrenceEntityId:
      semantic.target.numeratorFactorOccurrenceEntityId,
    factorSemanticId: semantic.factor.semanticId,
    factor,
    sourceOccurrenceEntityId:
      semantic.target.numeratorSourceOccurrenceEntityId,
    sourceSemanticId: semantic.source.numerator.semanticId,
    source: numerator,
    notation: presentation.targetProducts.notation.numerator
  });
  const denominatorProduct = createTargetProduct({
    productEntityId: semantic.target.denominatorProductEntityId,
    factorOccurrenceEntityId:
      semantic.target.denominatorFactorOccurrenceEntityId,
    factorSemanticId: semantic.factor.semanticId,
    factor,
    sourceOccurrenceEntityId:
      semantic.target.denominatorSourceOccurrenceEntityId,
    sourceSemanticId: semantic.source.denominator.semanticId,
    source: denominator,
    notation: presentation.targetProducts.notation.denominator
  });
  const source = presentation.mode === "explain-unit-factor"
    ? createExplanatorySourceEndpoint({
        semantic,
        presentation,
        numerator,
        denominator,
        factor
      })
    : createCompactSourceEndpoint({
        semantic,
        presentation,
        numerator,
        denominator,
        factor
      });
  return Object.freeze([
    source,
    createEndpoint({
      mode: presentation.mode,
      side: "target",
      stateId: semantic.target.stateId,
      accessibleText:
        `${numeratorProduct.accessibleText} over ` +
        denominatorProduct.accessibleText,
      rawLatex:
        `\\frac{${numeratorProduct.rawLatex}}` +
        `{${denominatorProduct.rawLatex}}`,
      parts: [
        ...numeratorProduct.parts,
        ...denominatorProduct.parts,
        part(semantic.target.divisionEntityId,
          "semantic.fraction-equivalence.division", "fraction-bar", "")
      ],
      compose(parts) {
        const numeratorParts = parts.slice(0, numeratorProduct.parts.length);
        const denominatorParts = parts.slice(
          numeratorProduct.parts.length,
          numeratorProduct.parts.length + denominatorProduct.parts.length
        );
        return `\\frac{${numeratorParts.join("")}}` +
          `{${denominatorParts.join("")}}`;
      }
    })
  ] as const);
}

export const kpCanonicalFractionEquivalenceNativeEndpoints =
  createKpFractionEquivalenceNativeEndpoints(
    kpCanonicalFractionEquivalence,
    kpCanonicalFractionEquivalencePresentationPlan
  );

export const kpCanonicalCompactFractionEquivalenceNativeEndpoints =
  createKpFractionEquivalenceNativeEndpoints(
    kpCanonicalFractionEquivalence,
    kpCanonicalCompactFractionEquivalencePresentationPlan
  );

export function bindKpFractionEquivalenceNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpFractionEquivalenceNativeEndpoint;
}): void {
  input.root.dataset["kpSemanticEntityId"] = input.endpoint.stateId;
  input.root.dataset["kpPresentationGroupId"] =
    input.endpoint.rootPresentationGroupId;
  const fractionBars = [...input.root.querySelectorAll<HTMLElement>(".frac-line")];
  const fractionBarNodes = input.endpoint.nodes.filter(({ kind }) =>
    kind === "fraction-bar"
  );
  if (fractionBars.length !== fractionBarNodes.length) {
    throw new Error(
      `Fraction-equivalence endpoint ${input.endpoint.stateId} expected ${fractionBarNodes.length} native fraction bars, received ${fractionBars.length}.`
    );
  }
  fractionBarNodes.forEach((node, index) => {
    bindOwnedElement(fractionBars[index]!, node);
  });
  for (const node of input.endpoint.nodes) {
    if (node.kind === "fraction-bar") continue;
    const elements = [...input.root.querySelectorAll<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(node.motionId)}"]`
    )];
    if (elements.length !== 1) {
      throw new Error(
        `Fraction-equivalence endpoint ${input.endpoint.stateId} expected one native owner for ${node.occurrenceId}, received ${elements.length}.`
      );
    }
    bindOwnedElement(elements[0]!, node);
  }
}

export async function settleAndObserveKpFractionEquivalenceNativeEndpoint(input: {
  readonly endpointSide: KpFractionEquivalenceEndpointSide;
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpFractionEquivalenceNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpFractionEquivalenceNativeEndpointOwnership(input);
  return settleAndObserveKpNativeKatexRenderedScene({
    endpoint: input.endpointSide,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness
  });
}

interface EndpointPart {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly kind: KpFractionEquivalenceNativeEndpointNode["kind"];
  readonly latex: string;
}

interface TargetProduct {
  readonly rawLatex: string;
  readonly accessibleText: string;
  readonly parts: readonly EndpointPart[];
}

function part(
  occurrenceId: string,
  semanticId: string,
  kind: EndpointPart["kind"],
  latex: string
): EndpointPart {
  return Object.freeze({ occurrenceId, semanticId, kind, latex });
}

function scalarLatex(scalar: KpFractionEquivalenceScalar): string {
  if (scalar.kind === "number") return String(scalar.value);
  if (/^[A-Za-z]$/.test(scalar.symbol)) return scalar.symbol;
  throw new Error("Native fraction-equivalence endpoints require scalar atoms.");
}

function createTargetProduct(input: {
  readonly productEntityId: string;
  readonly factorOccurrenceEntityId: string;
  readonly factorSemanticId: string;
  readonly factor: string;
  readonly sourceOccurrenceEntityId: string;
  readonly sourceSemanticId: string;
  readonly source: string;
  readonly notation: KpFractionEquivalenceProductNotation;
}): TargetProduct {
  const factorPart = part(
    input.factorOccurrenceEntityId,
    input.factorSemanticId,
    "factor",
    input.factor
  );
  const sourcePart = part(
    input.sourceOccurrenceEntityId,
    input.sourceSemanticId,
    "operand",
    input.source
  );
  if (input.notation === "implicit-juxtaposition") {
    return Object.freeze({
      rawLatex: `${input.factor}${input.source}`,
      accessibleText: `${input.factor} ${input.source}`,
      parts: Object.freeze([factorPart, sourcePart])
    });
  }
  const operatorPart = part(
    `${input.productEntityId}.operator`,
    "semantic.operation.multiplication",
    "operator",
    "\\cdot"
  );
  return Object.freeze({
    rawLatex: `${input.factor}\\cdot${input.source}`,
    accessibleText: `${input.factor} times ${input.source}`,
    parts: Object.freeze([factorPart, operatorPart, sourcePart])
  });
}

function createEndpoint(input: {
  readonly mode: KpFractionEquivalencePresentationMode;
  readonly side: KpFractionEquivalenceEndpointSide;
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rawLatex: string;
  readonly parts: readonly EndpointPart[];
  readonly compose: (parts: readonly string[]) => string;
}): KpFractionEquivalenceNativeEndpoint {
  const rootPresentationGroupId = `group.${input.stateId}`;
  const nodes = Object.freeze(input.parts.map((entry) => Object.freeze({
    occurrenceId: entry.occurrenceId,
    semanticId: entry.semanticId,
    kind: entry.kind,
    motionId: `fraction-equivalence.${input.side}.${entry.occurrenceId}`,
    presentationGroupId:
      `${rootPresentationGroupId}.node.${entry.occurrenceId}`
  })));
  const annotatedParts = input.parts.map((entry, index) => {
    if (entry.kind === "fraction-bar") return "";
    return `\\htmlData{kp-motion-id=${nodes[index]!.motionId}}{${entry.latex}}`;
  });
  const rawLatex = input.compose(input.parts.map(({ latex }) => latex));
  if (rawLatex !== input.rawLatex) {
    throw new Error(
      `Fraction-equivalence endpoint ${input.stateId} rendered ${rawLatex}; expected ${input.rawLatex}.`
    );
  }
  const annotations: readonly KpSelectorLatexAnnotation[] = Object.freeze(
    input.parts.flatMap((entry, index) => entry.kind === "fraction-bar" ? [] : [
      Object.freeze({
        selectorId: entry.occurrenceId,
        motionId: nodes[index]!.motionId,
        latex: entry.latex
      })
    ])
  );
  const annotated = Object.freeze({
    id: `fraction-equivalence.${input.side}`,
    kind: "selector-annotated-latex" as const,
    rawLatex,
    annotatedLatex: input.compose(annotatedParts),
    annotations
  });
  return Object.freeze({
    schemaVersion: "kp.fraction-equivalence-native-endpoint.v1" as const,
    mode: input.mode,
    side: input.side,
    stateId: input.stateId,
    accessibleText: input.accessibleText,
    rootPresentationGroupId,
    annotated,
    nativeHtmlAndMathml: renderLatexToHtml(annotated.annotatedLatex, {
      displayMode: true,
      output: "htmlAndMathml",
      trust: true
    }),
    nodes
  });
}

function createExplanatorySourceEndpoint(input: {
  readonly semantic: KpVerifiedFractionEquivalence;
  readonly presentation: KpFractionEquivalencePresentationPlan;
  readonly numerator: string;
  readonly denominator: string;
  readonly factor: string;
}): KpFractionEquivalenceNativeEndpoint {
  if (input.presentation.factorTransfer.kind !==
      "paired-unit-factor-transfer") {
    throw new Error("Explanatory fraction staging requires a unit factor.");
  }
  const [unitNumeratorId, unitDenominatorId] =
    input.presentation.factorTransfer.sourceOccurrenceEntityIds;
  const unitDivisionId =
    input.presentation.operationMaterialSelectorIds.find((id) =>
      id.includes("unit-factor.division")
    );
  if (unitDivisionId === undefined) {
    throw new Error("Explanatory fraction staging requires a unit fraction bar.");
  }
  return createEndpoint({
    mode: input.presentation.mode,
    side: "source",
    stateId: input.semantic.source.stateId,
    accessibleText:
      `${input.factor} over ${input.factor}, multiplied by ` +
      `${input.numerator} over ${input.denominator}`,
    rawLatex:
      `\\frac{${input.factor}}{${input.factor}}` +
      `\\cdot\\frac{${input.numerator}}{${input.denominator}}`,
    parts: [
      part(unitNumeratorId, input.semantic.factor.semanticId,
        "factor", input.factor),
      part(unitDenominatorId, input.semantic.factor.semanticId,
        "factor", input.factor),
      part(unitDivisionId, "semantic.fraction-equivalence.unit-factor.division",
        "fraction-bar", ""),
      part(input.semantic.source.numerator.entityId,
        input.semantic.source.numerator.semanticId, "operand", input.numerator),
      part(input.semantic.source.denominator.entityId,
        input.semantic.source.denominator.semanticId,
        "operand", input.denominator),
      part(input.semantic.source.divisionEntityId,
        "semantic.fraction-equivalence.division", "fraction-bar", "")
    ],
    compose(parts) {
      return `\\frac{${parts[0]}}{${parts[1]}}` +
        `\\cdot\\frac{${parts[3]}}{${parts[4]}}`;
    }
  });
}

function createCompactSourceEndpoint(input: {
  readonly semantic: KpVerifiedFractionEquivalence;
  readonly presentation: KpFractionEquivalencePresentationPlan;
  readonly numerator: string;
  readonly denominator: string;
  readonly factor: string;
}): KpFractionEquivalenceNativeEndpoint {
  if (input.presentation.factorTransfer.kind !==
      "paired-operation-transfer") {
    throw new Error("Compact fraction staging requires paired operations.");
  }
  const [numeratorFactorId, denominatorFactorId] =
    input.presentation.factorTransfer.sourceOccurrenceEntityIds;
  return createEndpoint({
    mode: input.presentation.mode,
    side: "source",
    stateId: input.semantic.source.stateId,
    accessibleText:
      `Multiply numerator and denominator of ${input.numerator} over ` +
      `${input.denominator} by ${input.factor}`,
    rawLatex:
      `\\begin{matrix}${input.factor}\\times\\\\${input.factor}\\times` +
      `\\end{matrix}\\qquad\\frac{${input.numerator}}{${input.denominator}}`,
    parts: [
      part(numeratorFactorId, input.semantic.factor.semanticId,
        "factor", input.factor),
      part(denominatorFactorId, input.semantic.factor.semanticId,
        "factor", input.factor),
      part(input.semantic.source.numerator.entityId,
        input.semantic.source.numerator.semanticId, "operand", input.numerator),
      part(input.semantic.source.denominator.entityId,
        input.semantic.source.denominator.semanticId,
        "operand", input.denominator),
      part(input.semantic.source.divisionEntityId,
        "semantic.fraction-equivalence.division", "fraction-bar", "")
    ],
    compose(parts) {
      return `\\begin{matrix}${parts[0]}\\times\\\\${parts[1]}\\times` +
        `\\end{matrix}\\qquad\\frac{${parts[2]}}{${parts[3]}}`;
    }
  });
}

function bindOwnedElement(
  element: HTMLElement,
  node: KpFractionEquivalenceNativeEndpointNode
): void {
  element.dataset["kpMotionId"] = node.motionId;
  element.dataset["kpSemanticEntityId"] = node.occurrenceId;
  element.dataset["kpSemanticIdentityId"] = node.semanticId;
  element.dataset["kpSemanticSelectorId"] = node.occurrenceId;
  element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
}
