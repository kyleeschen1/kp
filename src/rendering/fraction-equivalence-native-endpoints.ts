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
  kpCanonicalFractionEquivalence,
  type KpFractionEquivalenceScalar,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";

export type KpFractionEquivalenceEndpointSide = "source" | "target";

export interface KpFractionEquivalenceNativeEndpointNode {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly kind: "operand" | "factor" | "fraction-bar";
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpFractionEquivalenceNativeEndpoint {
  readonly schemaVersion: "kp.fraction-equivalence-native-endpoint.v1";
  readonly side: KpFractionEquivalenceEndpointSide;
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpFractionEquivalenceNativeEndpointNode[];
}

export function createKpFractionEquivalenceNativeEndpoints(
  semantic: KpVerifiedFractionEquivalence
): readonly [
  KpFractionEquivalenceNativeEndpoint,
  KpFractionEquivalenceNativeEndpoint
] {
  const numerator = scalarLatex(semantic.source.numerator);
  const denominator = scalarLatex(semantic.source.denominator);
  const factor = scalarLatex(semantic.factor);
  return Object.freeze([
    createEndpoint({
      side: "source",
      stateId: semantic.source.stateId,
      accessibleText:
        `${numerator} over ${denominator}, with shared nonzero factor ${factor}`,
      rawLatex: `\\frac{${numerator}}{${denominator}}\\qquad ${factor}`,
      parts: [
        part(semantic.source.numerator.entityId,
          semantic.source.numerator.semanticId, "operand", numerator),
        part(semantic.source.denominator.entityId,
          semantic.source.denominator.semanticId, "operand", denominator),
        part(semantic.source.divisionEntityId,
          "semantic.fraction-equivalence.division", "fraction-bar", ""),
        part(semantic.factor.entityId,
          semantic.factor.semanticId, "factor", factor)
      ],
      compose(parts) {
        return `\\frac{${parts[0]}}{${parts[1]}}\\qquad ${parts[3]}`;
      }
    }),
    createEndpoint({
      side: "target",
      stateId: semantic.target.stateId,
      accessibleText:
        `${factor} ${numerator} over ${factor} ${denominator}`,
      rawLatex:
        `\\frac{${factor}${numerator}}{${factor}${denominator}}`,
      parts: [
        part(semantic.target.numeratorFactorOccurrenceEntityId,
          semantic.factor.semanticId, "factor", factor),
        part(semantic.target.numeratorSourceOccurrenceEntityId,
          semantic.source.numerator.semanticId, "operand", numerator),
        part(semantic.target.denominatorFactorOccurrenceEntityId,
          semantic.factor.semanticId, "factor", factor),
        part(semantic.target.denominatorSourceOccurrenceEntityId,
          semantic.source.denominator.semanticId, "operand", denominator),
        part(semantic.target.divisionEntityId,
          "semantic.fraction-equivalence.division", "fraction-bar", "")
      ],
      compose(parts) {
        return `\\frac{${parts[0]}${parts[1]}}{${parts[2]}${parts[3]}}`;
      }
    })
  ] as const);
}

export const kpCanonicalFractionEquivalenceNativeEndpoints =
  createKpFractionEquivalenceNativeEndpoints(kpCanonicalFractionEquivalence);

export function bindKpFractionEquivalenceNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpFractionEquivalenceNativeEndpoint;
}): void {
  input.root.dataset["kpSemanticEntityId"] = input.endpoint.stateId;
  input.root.dataset["kpPresentationGroupId"] =
    input.endpoint.rootPresentationGroupId;
  const fractionBars = [...input.root.querySelectorAll<HTMLElement>(".frac-line")];
  for (const node of input.endpoint.nodes) {
    const elements = node.kind === "fraction-bar"
      ? fractionBars
      : [...input.root.querySelectorAll<HTMLElement>(
          `[data-kp-motion-id="${CSS.escape(node.motionId)}"]`
        )];
    if (elements.length !== 1) {
      throw new Error(
        `Fraction-equivalence endpoint ${input.endpoint.stateId} expected one native owner for ${node.occurrenceId}, received ${elements.length}.`
      );
    }
    const element = elements[0]!;
    element.dataset["kpMotionId"] = node.motionId;
    element.dataset["kpSemanticEntityId"] = node.occurrenceId;
    element.dataset["kpSemanticIdentityId"] = node.semanticId;
    element.dataset["kpSemanticSelectorId"] = node.occurrenceId;
    element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
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

function createEndpoint(input: {
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
