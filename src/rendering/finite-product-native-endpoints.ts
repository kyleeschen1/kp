import type { KpEquationFontReadiness } from
  "./equation-font-readiness.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpSelectorAnnotatedLatex,
  KpSelectorLatexAnnotation
} from "./selector-annotated-latex.ts";
import type { KpFiniteBinderSemanticId } from
  "../domain-ir/finite-binder-vocabulary.ts";
import {
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_SOURCE_STATE_ID,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
  KP_CANONICAL_FINITE_PRODUCT_TARGET_STATE_ID,
  kpCanonicalFiniteProductExpansionOperation
} from "../semantic/canonical-finite-product-expansion.ts";

export type KpFiniteProductNativeEndpointRole =
  | "operator"
  | "binder-declaration"
  | "lower-bound"
  | "upper-bound"
  | "body-template"
  | "bound-reference"
  | "body-instance"
  | "instantiated-reference";

export interface KpFiniteProductNativeEndpointNode {
  readonly occurrenceId: KpFiniteBinderSemanticId;
  readonly semanticId: KpFiniteBinderSemanticId;
  readonly role: KpFiniteProductNativeEndpointRole;
  readonly parentOccurrenceId?: KpFiniteBinderSemanticId | undefined;
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpFiniteProductNativeEndpoint {
  readonly schemaVersion: "kp.finite-product-native-endpoint.v1";
  readonly endpoint: "source" | "target";
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpFiniteProductNativeEndpointNode[];
}

type EndpointBuilder = {
  readonly endpoint: "source" | "target";
  readonly stateId: string;
  readonly rootPresentationGroupId: string;
  readonly annotations: KpSelectorLatexAnnotation[];
  readonly nodes: KpFiniteProductNativeEndpointNode[];
};

const operation = kpCanonicalFiniteProductExpansionOperation;

export const kpCanonicalFiniteProductNativeEndpoints = Object.freeze([
  createSourceEndpoint(),
  createTargetEndpoint()
] as const);

export function bindKpFiniteProductNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpFiniteProductNativeEndpoint;
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
        `Finite-product ${input.endpoint.endpoint} endpoint expected one ` +
        `native owner for ${node.occurrenceId}, received ${elements.length}.`
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

export async function settleAndObserveKpFiniteProductNativeEndpoint(input: {
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpFiniteProductNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpFiniteProductNativeEndpointOwnership(input);
  return settleAndObserveKpNativeKatexRenderedScene({
    endpoint: input.endpoint.endpoint,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness
  });
}

function createSourceEndpoint(): KpFiniteProductNativeEndpoint {
  const source = operation.source.semantic;
  const reference = source.body.references[0]!;
  const builder = createBuilder("source");
  const operator = annotate(builder, {
    occurrenceId: source.operator.id,
    role: source.operator.role,
    latex: "\\prod",
    motionSuffix: "operator"
  });
  const lower = annotate(builder, {
    occurrenceId: source.lowerBound.id,
    role: source.lowerBound.role,
    parentOccurrenceId: source.operator.id,
    latex: String(source.lowerBound.value),
    motionSuffix: "lower"
  });
  const declaration = annotate(builder, {
    occurrenceId: source.binder.id,
    role: source.binder.role,
    parentOccurrenceId: source.operator.id,
    latex: `${source.binder.symbol}=${lower}`,
    annotationLatex: `${source.binder.symbol}=${source.lowerBound.value}`,
    motionSuffix: "declaration",
    positionBeforeOccurrenceId: source.lowerBound.id
  });
  const upper = annotate(builder, {
    occurrenceId: source.upperBound.id,
    role: source.upperBound.role,
    parentOccurrenceId: source.operator.id,
    latex: String(source.upperBound.value),
    motionSuffix: "upper"
  });
  const boundReference = annotate(builder, {
    occurrenceId: reference.id,
    role: reference.role,
    parentOccurrenceId: source.body.id,
    latex: reference.symbol,
    motionSuffix: "body-reference"
  });
  const body = annotate(builder, {
    occurrenceId: source.body.id,
    role: source.body.role,
    latex: `${source.body.freeSymbols[0]!}_{${boundReference}}`,
    annotationLatex: source.body.sourceLatex,
    motionSuffix: "body"
  });
  return finishEndpoint(builder, {
    rawLatex: KP_CANONICAL_FINITE_PRODUCT_SOURCE_LATEX,
    annotatedLatex:
      `\\mathop{${operator}}\\limits_{${declaration}}^{${upper}} ${body}`,
    accessibleText: "the product from k equals zero to two of x sub k"
  });
}

function createTargetEndpoint(): KpFiniteProductNativeEndpoint {
  const builder = createBuilder("target");
  const parts = operation.target.instances.map((instance, ordinal) => {
    const reference = instance.references[0]!;
    const referenceLatex = annotate(builder, {
      occurrenceId: reference.id,
      role: reference.role,
      parentOccurrenceId: instance.id,
      latex: String(reference.value),
      motionSuffix: `reference-${ordinal}`
    });
    return annotate(builder, {
      occurrenceId: instance.id,
      role: instance.role,
      latex: `x_{${referenceLatex}}`,
      annotationLatex: `x_${reference.value}`,
      motionSuffix: `instance-${ordinal}`
    });
  });
  return finishEndpoint(builder, {
    rawLatex: KP_CANONICAL_FINITE_PRODUCT_TARGET_LATEX,
    annotatedLatex: parts.join(""),
    accessibleText: "x sub zero times x sub one times x sub two"
  });
}

function createBuilder(endpoint: "source" | "target"): EndpointBuilder {
  const stateId = endpoint === "source"
    ? KP_CANONICAL_FINITE_PRODUCT_SOURCE_STATE_ID
    : KP_CANONICAL_FINITE_PRODUCT_TARGET_STATE_ID;
  return {
    endpoint,
    stateId,
    rootPresentationGroupId: `group.${stateId}`,
    annotations: [],
    nodes: []
  };
}

function annotate(builder: EndpointBuilder, input: {
  readonly occurrenceId: KpFiniteBinderSemanticId;
  readonly role: KpFiniteProductNativeEndpointRole;
  readonly latex: string;
  readonly annotationLatex?: string | undefined;
  readonly parentOccurrenceId?: KpFiniteBinderSemanticId | undefined;
  readonly motionSuffix: string;
  readonly positionBeforeOccurrenceId?: KpFiniteBinderSemanticId | undefined;
}): string {
  const motionId = `${builder.stateId}.${input.motionSuffix}`;
  const annotation = {
    selectorId: input.occurrenceId,
    motionId,
    latex: input.annotationLatex ?? input.latex
  };
  const node = {
    occurrenceId: input.occurrenceId,
    semanticId: input.occurrenceId,
    role: input.role,
    ...(input.parentOccurrenceId === undefined
      ? {}
      : { parentOccurrenceId: input.parentOccurrenceId }),
    motionId,
    presentationGroupId:
      `${builder.rootPresentationGroupId}.node.${input.motionSuffix}`
  };
  const insertionIndex = input.positionBeforeOccurrenceId === undefined
    ? -1
    : builder.nodes.findIndex(({ occurrenceId }) =>
        occurrenceId === input.positionBeforeOccurrenceId
      );
  if (insertionIndex < 0) {
    builder.annotations.push(annotation);
    builder.nodes.push(node);
  } else {
    builder.annotations.splice(insertionIndex, 0, annotation);
    builder.nodes.splice(insertionIndex, 0, node);
  }
  return `\\htmlData{kp-motion-id=${motionId}}{${input.latex}}`;
}

function finishEndpoint(builder: EndpointBuilder, input: {
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly accessibleText: string;
}): KpFiniteProductNativeEndpoint {
  const ids = builder.nodes.map(({ occurrenceId }) => occurrenceId);
  if (new Set(ids).size !== ids.length ||
      builder.annotations.length !== ids.length) {
    throw new Error(
      `Finite-product ${builder.endpoint} endpoint must own every paint role once.`
    );
  }
  const annotated = Object.freeze({
    id: builder.stateId,
    kind: "selector-annotated-latex" as const,
    rawLatex: input.rawLatex,
    annotatedLatex: input.annotatedLatex,
    annotations: Object.freeze([...builder.annotations])
  });
  return Object.freeze({
    schemaVersion: "kp.finite-product-native-endpoint.v1" as const,
    endpoint: builder.endpoint,
    stateId: builder.stateId,
    accessibleText: input.accessibleText,
    rootPresentationGroupId: builder.rootPresentationGroupId,
    annotated,
    nativeHtmlAndMathml: renderLatexToHtml(annotated.annotatedLatex, {
      displayMode: true,
      output: "htmlAndMathml",
      trust: true
    }),
    nodes: Object.freeze([...builder.nodes])
  });
}
