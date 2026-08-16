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
  kpLogProductExpressionProtocol,
  kpLogProductLatexProjection
} from "../semantic/log-product-expression-protocol.ts";
import {
  kpCanonicalLogProductFamily,
  kpCanonicalLogProductStates,
  kpLogProductFamilies,
  kpMultiFactorLogProductFamily,
  listKpLogProductExpressionNodes,
  type KpLogProductFamily,
  type KpLogProductExpressionNode,
  type KpLogProductState,
  type KpLogProductStateId
} from "../semantic/log-product-states.ts";

export interface KpLogProductNativeEndpointNode {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly kind: KpLogProductExpressionNode["kind"];
  readonly parentOccurrenceId?: string | undefined;
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpLogProductNativeEndpoint {
  readonly schemaVersion: "kp.log-product-native-endpoint.v1";
  readonly stateId: KpLogProductStateId;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpLogProductNativeEndpointNode[];
}

export interface KpLogProductNativeEndpointSet {
  readonly animationId: KpLogProductFamily["animationId"];
  readonly family: KpLogProductFamily;
  readonly endpoints: readonly [
    KpLogProductNativeEndpoint,
    KpLogProductNativeEndpoint
  ];
}

interface RenderedNode {
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly annotations: readonly KpSelectorLatexAnnotation[];
}

export const kpCanonicalLogProductNativeEndpoints = Object.freeze(
  kpCanonicalLogProductStates.map(createEndpoint)
) as readonly [KpLogProductNativeEndpoint, KpLogProductNativeEndpoint];

export function createKpLogProductNativeEndpoints(
  family: KpLogProductFamily
): readonly [KpLogProductNativeEndpoint, KpLogProductNativeEndpoint] {
  return Object.freeze(family.states.map(createEndpoint)) as readonly [
    KpLogProductNativeEndpoint,
    KpLogProductNativeEndpoint
  ];
}

export const kpMultiFactorLogProductNativeEndpoints =
  createKpLogProductNativeEndpoints(kpMultiFactorLogProductFamily);

export const kpLogProductNativeEndpointSets:
readonly KpLogProductNativeEndpointSet[] = Object.freeze(
  kpLogProductFamilies.map((family) => Object.freeze({
    animationId: family.animationId,
    family,
    endpoints: family === kpCanonicalLogProductFamily
      ? kpCanonicalLogProductNativeEndpoints
      : family === kpMultiFactorLogProductFamily
        ? kpMultiFactorLogProductNativeEndpoints
      : createKpLogProductNativeEndpoints(family)
  }))
);

export function bindKpLogProductNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpLogProductNativeEndpoint;
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
        `Log-product endpoint ${input.endpoint.stateId} expected one native ` +
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

export async function settleAndObserveKpLogProductNativeEndpoint(input: {
  readonly endpointSide: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpLogProductNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpLogProductNativeEndpointOwnership({
    root: input.root,
    endpoint: input.endpoint
  });
  return settleAndObserveKpNativeKatexRenderedScene({
    endpoint: input.endpointSide,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness
  });
}

function createEndpoint(state: KpLogProductState): KpLogProductNativeEndpoint {
  const rendered = renderNode(state, state.root);
  if (rendered.rawLatex !== state.latex) {
    throw new Error(
      `Log-product endpoint ${state.id} rendered ${rendered.rawLatex}; ` +
      `expected ${state.latex}.`
    );
  }
  const parents = collectParentOccurrences(state.root);
  const rootPresentationGroupId = `group.${state.id}`;
  const nodes = Object.freeze(
    listKpLogProductExpressionNodes(state).map((node) => Object.freeze({
      occurrenceId: node.id,
      semanticId: node.semanticId,
      kind: node.kind,
      ...(parents.get(node.id) === undefined
        ? {}
        : { parentOccurrenceId: parents.get(node.id) }),
      motionId: motionId(state, node),
      presentationGroupId: `${rootPresentationGroupId}.node.${node.id}`
    }))
  );
  const annotated = Object.freeze({
    id: `log-product.${state.id}`,
    kind: "selector-annotated-latex" as const,
    rawLatex: rendered.rawLatex,
    annotatedLatex: rendered.annotatedLatex,
    annotations: rendered.annotations
  });
  assertEndpointClosure(state, annotated, nodes);
  return Object.freeze({
    schemaVersion: "kp.log-product-native-endpoint.v1" as const,
    stateId: state.id,
    accessibleText: state.accessibleText,
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

function renderNode(
  state: KpLogProductState,
  node: KpLogProductExpressionNode
): RenderedNode {
  const children = kpLogProductExpressionProtocol.children(node).map(
    (child) => renderNode(state, child)
  );
  const rawLatex = kpLogProductLatexProjection.project(
    node,
    children.map(({ rawLatex: latex }) => latex)
  );
  const motionIdValue = motionId(state, node);
  return Object.freeze({
    rawLatex,
    annotatedLatex:
      `\\htmlData{kp-motion-id=${motionIdValue}}{` +
      `${kpLogProductLatexProjection.project(
        node,
        children.map(({ annotatedLatex }) => annotatedLatex)
      )}}`,
    annotations: Object.freeze([{
      selectorId: node.id,
      motionId: motionIdValue,
      latex: rawLatex
    }, ...children.flatMap(({ annotations }) => annotations)])
  });
}

function collectParentOccurrences(
  root: KpLogProductExpressionNode
): ReadonlyMap<string, string> {
  const parents = new Map<string, string>();
  const visit = (node: KpLogProductExpressionNode): void => {
    for (const child of kpLogProductExpressionProtocol.children(node)) {
      if (parents.has(child.id)) {
        throw new Error(`Log-product endpoint repeats occurrence ${child.id}.`);
      }
      parents.set(child.id, node.id);
      visit(child);
    }
  };
  visit(root);
  return parents;
}

function motionId(
  state: KpLogProductState,
  node: KpLogProductExpressionNode
): string {
  return `log-product.${state.id}.${node.id}`;
}

function assertEndpointClosure(
  state: KpLogProductState,
  annotated: KpSelectorAnnotatedLatex,
  nodes: readonly KpLogProductNativeEndpointNode[]
): void {
  const expected = listKpLogProductExpressionNodes(state).map(({ id }) => id);
  const actual = annotated.annotations.map(({ selectorId }) => selectorId);
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== expected.length ||
    expected.some((id) => !actual.includes(id)) ||
    nodes.length !== expected.length
  ) {
    throw new Error(
      `Log-product endpoint ${state.id} must annotate every occurrence exactly once.`
    );
  }
}
