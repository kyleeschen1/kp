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
import type { KpFiniteBinderSemanticId } from
  "../domain-ir/finite-binder-vocabulary.ts";
import {
  KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID,
  KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
  KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID,
  kpCanonicalFiniteSumExpansionOperation
} from "../semantic/canonical-finite-sum-expansion.ts";

export type KpFiniteSumNativeEndpointRole =
  | "operator"
  | "binder-declaration"
  | "lower-bound"
  | "upper-bound"
  | "body-template"
  | "bound-reference"
  | "body-instance"
  | "instantiated-reference"
  | "additive-connector";

export interface KpFiniteSumNativeEndpointNode {
  readonly occurrenceId: KpFiniteBinderSemanticId;
  readonly semanticId: KpFiniteBinderSemanticId;
  readonly role: KpFiniteSumNativeEndpointRole;
  readonly parentOccurrenceId?: KpFiniteBinderSemanticId | undefined;
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpFiniteSumNativeEndpoint {
  readonly schemaVersion: "kp.finite-sum-native-endpoint.v1";
  readonly endpoint: "source" | "target";
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpFiniteSumNativeEndpointNode[];
}

type EndpointBuilder = {
  readonly endpoint: "source" | "target";
  readonly stateId: string;
  readonly rootPresentationGroupId: string;
  readonly annotations: KpSelectorLatexAnnotation[];
  readonly nodes: KpFiniteSumNativeEndpointNode[];
};

const operation = kpCanonicalFiniteSumExpansionOperation;

export const kpCanonicalFiniteSumNativeEndpoints = Object.freeze([
  createSourceEndpoint(),
  createTargetEndpoint()
]) as readonly [KpFiniteSumNativeEndpoint, KpFiniteSumNativeEndpoint];

export function bindKpFiniteSumNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpFiniteSumNativeEndpoint;
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
        `Finite-sum ${input.endpoint.endpoint} endpoint expected one native ` +
        `owner for ${node.occurrenceId}, received ${elements.length}.`
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

export async function settleAndObserveKpFiniteSumNativeEndpoint(input: {
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpFiniteSumNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpFiniteSumNativeEndpointOwnership(input);
  return settleAndObserveKpNativeKatexRenderedScene({
    endpoint: input.endpoint.endpoint,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness
  });
}

function createSourceEndpoint(): KpFiniteSumNativeEndpoint {
  const source = operation.source.semantic;
  const reference = source.body.references[0]!;
  const builder = createBuilder("source");
  const operator = annotate(builder, {
    occurrenceId: source.operator.id,
    role: source.operator.role,
    latex: "\\sum",
    motionSuffix: "operator"
  });
  const declaration = annotate(builder, {
    occurrenceId: source.binder.id,
    role: source.binder.role,
    parentOccurrenceId: source.operator.id,
    latex: source.binder.symbol,
    motionSuffix: "declaration"
  });
  const lower = annotate(builder, {
    occurrenceId: source.lowerBound.id,
    role: source.lowerBound.role,
    parentOccurrenceId: source.operator.id,
    latex: String(source.lowerBound.value),
    motionSuffix: "lower"
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
  const bodySymbol = source.body.freeSymbols[0]!;
  const body = annotate(builder, {
    occurrenceId: source.body.id,
    role: source.body.role,
    latex: `${bodySymbol}_{${boundReference}}`,
    annotationLatex: source.body.sourceLatex,
    motionSuffix: "body"
  });
  return finishEndpoint(builder, {
    rawLatex: KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
    annotatedLatex:
      `${operator}_{${declaration}=${lower}}^{${upper}} ${body}`,
    accessibleText: "the sum from i equals one to three of a sub i"
  });
}

function createTargetEndpoint(): KpFiniteSumNativeEndpoint {
  const builder = createBuilder("target");
  const parts: string[] = [];
  for (const [ordinal, instance] of operation.target.instances.entries()) {
    const reference = instance.references[0]!;
    const referenceLatex = annotate(builder, {
      occurrenceId: reference.id,
      role: reference.role,
      parentOccurrenceId: instance.id,
      latex: String(reference.value),
      motionSuffix: `reference-${ordinal}`
    });
    parts.push(annotate(builder, {
      occurrenceId: instance.id,
      role: instance.role,
      latex: `a_{${referenceLatex}}`,
      annotationLatex: `a_${reference.value}`,
      motionSuffix: `instance-${ordinal}`
    }));
    const connector = operation.target.connectors[ordinal];
    if (connector !== undefined) {
      parts.push(annotate(builder, {
        occurrenceId: connector.id,
        role: connector.role,
        latex: connector.rawLatex,
        motionSuffix: `connector-${ordinal}`
      }));
    }
  }
  return finishEndpoint(builder, {
    rawLatex: KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
    annotatedLatex: parts.join(""),
    accessibleText: "a sub one plus a sub two plus a sub three"
  });
}

function createBuilder(endpoint: "source" | "target"): EndpointBuilder {
  const stateId = endpoint === "source"
    ? KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID
    : KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID;
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
  readonly role: KpFiniteSumNativeEndpointRole;
  readonly latex: string;
  readonly annotationLatex?: string | undefined;
  readonly parentOccurrenceId?: KpFiniteBinderSemanticId | undefined;
  readonly motionSuffix: string;
}): string {
  const motionId = `${builder.stateId}.${input.motionSuffix}`;
  builder.annotations.push({
    selectorId: input.occurrenceId,
    motionId,
    latex: input.annotationLatex ?? input.latex
  });
  builder.nodes.push({
    occurrenceId: input.occurrenceId,
    semanticId: input.occurrenceId,
    role: input.role,
    ...(input.parentOccurrenceId === undefined
      ? {}
      : { parentOccurrenceId: input.parentOccurrenceId }),
    motionId,
    presentationGroupId:
      `${builder.rootPresentationGroupId}.node.${input.motionSuffix}`
  });
  return `\\htmlData{kp-motion-id=${motionId}}{${input.latex}}`;
}

function finishEndpoint(builder: EndpointBuilder, input: {
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly accessibleText: string;
}): KpFiniteSumNativeEndpoint {
  const ids = builder.nodes.map(({ occurrenceId }) => occurrenceId);
  if (new Set(ids).size !== ids.length ||
      builder.annotations.length !== ids.length) {
    throw new Error(
      `Finite-sum ${builder.endpoint} endpoint must own every role exactly once.`
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
    schemaVersion: "kp.finite-sum-native-endpoint.v1" as const,
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
