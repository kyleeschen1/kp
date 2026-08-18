import type {
  KpEquationFontReadiness
} from "./equation-font-readiness.ts";
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
  kpCanonicalLogarithmChangeOfBase,
  type KpLogarithmChangeOfBaseAtom,
  type KpVerifiedLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";

export type KpLogarithmChangeOfBaseEndpointSide = "source" | "target";

export interface KpLogarithmChangeOfBaseNativeEndpointNode {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly kind: "operator" | "argument" | "base" | "delimiter" | "fraction-bar";
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpLogarithmChangeOfBaseNativeEndpoint {
  readonly schemaVersion: "kp.logarithm-change-of-base-native-endpoint.v1";
  readonly side: KpLogarithmChangeOfBaseEndpointSide;
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpLogarithmChangeOfBaseNativeEndpointNode[];
}

export function createKpLogarithmChangeOfBaseNativeEndpoints(
  semantic: KpVerifiedLogarithmChangeOfBase
): readonly [
  KpLogarithmChangeOfBaseNativeEndpoint,
  KpLogarithmChangeOfBaseNativeEndpoint
] {
  const base = atomLatex(semantic.source.base);
  const argument = atomLatex(semantic.source.argument);
  return Object.freeze([
  createEndpoint({
    side: "source",
    stateId: semantic.source.stateId,
    accessibleText: `log base ${base} of ${argument}`,
    rawLatex: `\\log_{${base}} ${argument}`,
    parts: [
      part(semantic.source.operatorEntityId, "semantic.logarithm.operator.source", "operator", "\\log"),
      part(semantic.source.base.entityId, semantic.source.base.semanticId, "base", base),
      part(semantic.source.argument.entityId, semantic.source.argument.semanticId, "argument", argument)
    ],
    compose(parts) {
      return `${parts[0]}_{${parts[1]}} ${parts[2]}`;
    }
  }),
  createEndpoint({
    side: "target",
    stateId: semantic.target.stateId,
    accessibleText:
      `natural log of ${argument} divided by natural log of ${base}`,
    rawLatex: `\\frac{\\ln ${argument}}{\\ln ${base}}`,
    parts: [
      part(semantic.target.numerator.operatorEntityId, "semantic.logarithm.operator.natural", "operator", "\\ln"),
      part(semantic.target.numerator.argument.entityId, semantic.target.numerator.argument.semanticId, "argument", argument),
      part(semantic.target.denominator.operatorEntityId, "semantic.logarithm.operator.natural", "operator", "\\ln"),
      part(semantic.target.denominator.argument.entityId, semantic.target.denominator.argument.semanticId, "base", base),
      part(semantic.target.divisionEntityId, "semantic.logarithm.change-of-base.division", "fraction-bar", "")
    ],
    compose(parts) {
      return `\\frac{${parts[0]} ${parts[1]}}{${parts[2]} ${parts[3]}}`;
    }
  })
  ] as const);
}

export const kpCanonicalLogarithmChangeOfBaseNativeEndpoints =
  createKpLogarithmChangeOfBaseNativeEndpoints(
    kpCanonicalLogarithmChangeOfBase
  );

export function bindKpLogarithmChangeOfBaseNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpLogarithmChangeOfBaseNativeEndpoint;
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
        `Change-of-base endpoint ${input.endpoint.stateId} expected one native owner for ${node.occurrenceId}, received ${elements.length}.`
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

export async function settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint(input: {
  readonly endpointSide: KpLogarithmChangeOfBaseEndpointSide;
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpLogarithmChangeOfBaseNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpLogarithmChangeOfBaseNativeEndpointOwnership(input);
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
  readonly kind: KpLogarithmChangeOfBaseNativeEndpointNode["kind"];
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

function atomLatex(atom: KpLogarithmChangeOfBaseAtom): string {
  if (atom.kind === "number") return String(atom.value);
  if (/^[A-Za-z]$/.test(atom.symbol)) return atom.symbol;
  throw new Error("Native change-of-base endpoints require scalar atoms.");
}

function createEndpoint(input: {
  readonly side: KpLogarithmChangeOfBaseEndpointSide;
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rawLatex: string;
  readonly parts: readonly EndpointPart[];
  readonly compose: (parts: readonly string[]) => string;
}): KpLogarithmChangeOfBaseNativeEndpoint {
  const rootPresentationGroupId = `group.${input.stateId}`;
  const nodes = Object.freeze(input.parts.map((entry) => Object.freeze({
    occurrenceId: entry.occurrenceId,
    semanticId: entry.semanticId,
    kind: entry.kind,
    motionId: `change-of-base.${input.side}.${entry.occurrenceId}`,
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
      `Change-of-base endpoint ${input.stateId} rendered ${rawLatex}; expected ${input.rawLatex}.`
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
    id: `logarithm-change-of-base.${input.side}`,
    kind: "selector-annotated-latex" as const,
    rawLatex,
    annotatedLatex: input.compose(annotatedParts),
    annotations
  });
  return Object.freeze({
    schemaVersion: "kp.logarithm-change-of-base-native-endpoint.v1" as const,
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
