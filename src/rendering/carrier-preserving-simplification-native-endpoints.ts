import { renderLatexToHtml } from "./katex-adapter.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex
} from "./selector-annotated-latex.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type { KpEquationFontReadiness } from "./equation-font-readiness.ts";
import {
  createKpTwoTimesOneCarrierExemplar,
  kpTwoTimesOneCarrierSelectorIds
} from "../semantic/carrier-preserving-simplification-exemplar.ts";

export interface KpCarrierPreservingSimplificationNativeEndpointNode {
  readonly selectorId: string;
  readonly motionId: string;
  readonly presentationGroupId: string;
  readonly role: "carrier" | "removed-operator" | "identity-witness";
}

export interface KpCarrierPreservingSimplificationNativeEndpoint {
  readonly schemaVersion:
    "kp.carrier-preserving-simplification-native-endpoint.v1";
  readonly side: "source" | "target";
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes:
    readonly KpCarrierPreservingSimplificationNativeEndpointNode[];
}

const exemplar = createKpTwoTimesOneCarrierExemplar();
const [sourceObject, targetObject] = exemplar.bundle.objects;
if (sourceObject === undefined || targetObject === undefined) {
  throw new Error("Two-times-one Native endpoints require both semantic states.");
}

export const kpCanonicalCarrierPreservingSimplificationNativeEndpoints =
  Object.freeze([
    createEndpoint({
      side: "source",
      stateId: sourceObject.id,
      expectedLatex: latexValue(sourceObject.value),
      accessibleText: "Two times one",
      parts: [
        {
          selectorId: kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
          latex: "2",
          role: "carrier"
        },
        { latex: " " },
        {
          selectorId: kpTwoTimesOneCarrierSelectorIds.sourceOperator,
          latex: "\\times",
          role: "removed-operator"
        },
        { latex: " " },
        {
          selectorId:
            kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness,
          latex: "1",
          role: "identity-witness"
        }
      ]
    }),
    createEndpoint({
      side: "target",
      stateId: targetObject.id,
      expectedLatex: latexValue(targetObject.value),
      accessibleText: "Two",
      parts: [{
        selectorId: kpTwoTimesOneCarrierSelectorIds.targetCarrier,
        latex: "2",
        role: "carrier"
      }]
    })
  ] as const);

export function bindKpCarrierPreservingSimplificationNativeEndpoint(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpCarrierPreservingSimplificationNativeEndpoint;
}): void {
  input.root.dataset["kpSemanticEntityId"] = input.endpoint.stateId;
  input.root.dataset["kpPresentationGroupId"] =
    input.endpoint.rootPresentationGroupId;
  for (const node of input.endpoint.nodes) {
    const elements = input.root.querySelectorAll<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(node.motionId)}"]`
    );
    if (elements.length !== 1) {
      throw new Error(
        `Carrier endpoint ${input.endpoint.side} expected one native owner ` +
        `for ${node.selectorId}, received ${elements.length}.`
      );
    }
    const element = elements[0]!;
    element.dataset["kpMotionId"] = node.motionId;
    element.dataset["kpSemanticEntityId"] = node.selectorId;
    element.dataset["kpSemanticSelectorId"] = node.selectorId;
    element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
  }
}

export async function settleAndObserveKpCarrierPreservingSimplificationEndpoint(
  input: {
    readonly stage: HTMLElement;
    readonly root: HTMLElement;
    readonly endpoint: KpCarrierPreservingSimplificationNativeEndpoint;
    readonly fontReadiness: KpEquationFontReadiness;
    readonly viewportRevision?: number | undefined;
  }
): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpCarrierPreservingSimplificationNativeEndpoint(input);
  return settleAndObserveKpNativeKatexRenderedScene({
    endpoint: input.endpoint.side,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness,
    viewportRevision: input.viewportRevision
  });
}

type EndpointPart =
  | { readonly latex: string }
  | {
      readonly selectorId: string;
      readonly latex: string;
      readonly role:
        KpCarrierPreservingSimplificationNativeEndpointNode["role"];
    };

function createEndpoint(input: {
  readonly side: "source" | "target";
  readonly stateId: string;
  readonly expectedLatex: string;
  readonly accessibleText: string;
  readonly parts: readonly EndpointPart[];
}): KpCarrierPreservingSimplificationNativeEndpoint {
  const id = `carrier-preserving-simplification.${input.side}`;
  const expectedSelectorIds = input.parts.flatMap((part) =>
    "selectorId" in part ? [part.selectorId] : []
  );
  const annotated = Object.freeze(createKpSelectorAnnotatedLatex({
    id,
    expectedSelectorIds,
    segments: input.parts.map((part) =>
      "selectorId" in part
        ? { kind: "selector" as const, selectorId: part.selectorId, latex: part.latex }
        : { kind: "latex" as const, latex: part.latex }
    )
  }));
  if (annotated.rawLatex !== input.expectedLatex) {
    throw new Error(
      `Carrier endpoint ${input.side} rendered ${annotated.rawLatex}; ` +
      `expected semantic endpoint ${input.expectedLatex}.`
    );
  }
  const rootPresentationGroupId = `group.${input.stateId}`;
  const roles = new Map(input.parts.flatMap((part) =>
    "selectorId" in part ? [[part.selectorId, part.role] as const] : []
  ));
  const nodes = Object.freeze(annotated.annotations.map((annotation) =>
    Object.freeze({
      selectorId: annotation.selectorId,
      motionId: annotation.motionId,
      presentationGroupId:
        `${rootPresentationGroupId}.selector.${annotation.selectorId}`,
      role: requiredRole(roles, annotation.selectorId)
    })
  ));
  return Object.freeze({
    schemaVersion:
      "kp.carrier-preserving-simplification-native-endpoint.v1" as const,
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

function requiredRole(
  roles: ReadonlyMap<string,
    KpCarrierPreservingSimplificationNativeEndpointNode["role"]>,
  selectorId: string
): KpCarrierPreservingSimplificationNativeEndpointNode["role"] {
  const role = roles.get(selectorId);
  if (role === undefined) {
    throw new Error(`Carrier endpoint selector ${selectorId} has no role.`);
  }
  return role;
}

function latexValue(value: unknown): string {
  if (
    typeof value !== "object" ||
    value === null ||
    !("latex" in value) ||
    typeof value.latex !== "string"
  ) {
    throw new Error("Carrier endpoint semantic state requires LaTeX.");
  }
  return value.latex;
}
