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
  kpCanonicalLogQuotientStates,
  listKpLogQuotientExpressionNodes,
  type KpLogQuotientExpressionNode,
  type KpLogQuotientState,
  type KpLogQuotientStateId
} from "../semantic/log-quotient-states.ts";

export interface KpLogQuotientNativeEndpointNode {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly kind: KpLogQuotientExpressionNode["kind"];
  readonly parentOccurrenceId?: string | undefined;
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpLogQuotientNativeEndpoint {
  readonly schemaVersion: "kp.log-quotient-native-endpoint.v1";
  readonly stateId: KpLogQuotientStateId;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpLogQuotientNativeEndpointNode[];
}

interface RenderedNode {
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly annotations: readonly KpSelectorLatexAnnotation[];
}

export function createKpLogQuotientNativeEndpoints(
  states: readonly KpLogQuotientState[] = kpCanonicalLogQuotientStates
): readonly KpLogQuotientNativeEndpoint[] {
  return Object.freeze(states.map(createEndpoint));
}

export const kpCanonicalLogQuotientNativeEndpoints =
  createKpLogQuotientNativeEndpoints();

export function bindKpLogQuotientNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpLogQuotientNativeEndpoint;
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
        `Log-quotient endpoint ${input.endpoint.stateId} expected one native ` +
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

export async function settleAndObserveKpLogQuotientNativeEndpoint(input: {
  readonly endpointSide: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpLogQuotientNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpLogQuotientNativeEndpointOwnership({
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

function createEndpoint(
  state: KpLogQuotientState
): KpLogQuotientNativeEndpoint {
  const rendered = renderNode(state, state.root);
  if (rendered.rawLatex !== state.latex) {
    throw new Error(
      `Log-quotient endpoint ${state.id} rendered ${rendered.rawLatex}; ` +
      `expected ${state.latex}.`
    );
  }
  const parentByOccurrence = collectParentOccurrences(state.root);
  const rootPresentationGroupId = `group.${state.id}`;
  const nodes = Object.freeze(
    listKpLogQuotientExpressionNodes(state).map((node) => Object.freeze({
      occurrenceId: node.id,
      semanticId: node.semanticId,
      kind: node.kind,
      ...(parentByOccurrence.get(node.id) === undefined
        ? {}
        : { parentOccurrenceId: parentByOccurrence.get(node.id) }),
      motionId: motionId(state, node),
      presentationGroupId: `${rootPresentationGroupId}.node.${node.id}`
    }))
  );
  const annotated = Object.freeze({
    id: `log-quotient.${state.id}`,
    kind: "selector-annotated-latex" as const,
    rawLatex: rendered.rawLatex,
    annotatedLatex: rendered.annotatedLatex,
    annotations: Object.freeze(
      rendered.annotations.map((annotation) => Object.freeze(annotation))
    )
  });
  assertEndpointClosure(state, annotated, nodes);
  return Object.freeze({
    schemaVersion: "kp.log-quotient-native-endpoint.v1" as const,
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
  state: KpLogQuotientState,
  node: KpLogQuotientExpressionNode
): RenderedNode {
  if (node.kind === "fraction-bar") {
    return Object.freeze({
      rawLatex: "",
      annotatedLatex: "",
      annotations: Object.freeze([])
    });
  }
  const children = renderChildren(state, node);
  const rawLatex = nodeLatex(node, children.map(({ rawLatex: latex }) => latex));
  const motionIdValue = motionId(state, node);
  return Object.freeze({
    rawLatex,
    annotatedLatex:
      `\\htmlData{kp-motion-id=${motionIdValue}}{` +
      `${nodeLatex(node, children.map(({ annotatedLatex }) => annotatedLatex))}}`,
    annotations: Object.freeze([
      Object.freeze({
        selectorId: node.id,
        motionId: motionIdValue,
        latex: rawLatex
      }),
      ...children.flatMap(({ annotations }) => annotations)
    ])
  });
}

function renderChildren(
  state: KpLogQuotientState,
  node: KpLogQuotientExpressionNode
): readonly RenderedNode[] {
  return Object.freeze(childNodes(node)
    .filter(({ kind }) => kind !== "fraction-bar")
    .map((child) => renderNode(state, child)));
}

function nodeLatex(
  node: Exclude<KpLogQuotientExpressionNode, { readonly kind: "fraction-bar" }>,
  children: readonly string[]
): string {
  switch (node.kind) {
    case "symbol":
      return node.name;
    case "function-operator":
      return "\\ln";
    case "delimiter":
      return node.value;
    case "subtraction-operator":
      return "-";
    case "natural-log":
      return `${children[0]}${children[1]}${children[2]}${children[3]}`;
    case "difference":
      return `${children[0]}${children[1]}${children[2]}`;
    case "quotient":
      return `\\frac{${children[0]}}{${children[1]}}`;
  }
}

function motionId(
  state: KpLogQuotientState,
  node: KpLogQuotientExpressionNode
): string {
  return `log-quotient.${state.id}.${node.id}`;
}

function collectParentOccurrences(
  root: KpLogQuotientExpressionNode
): ReadonlyMap<string, string> {
  const parents = new Map<string, string>();
  const visit = (node: KpLogQuotientExpressionNode): void => {
    for (const child of childNodes(node)) {
      if (parents.has(child.id)) {
        throw new Error(`Log-quotient endpoint repeats occurrence ${child.id}.`);
      }
      parents.set(child.id, node.id);
      visit(child);
    }
  };
  visit(root);
  return parents;
}

function childNodes(
  node: KpLogQuotientExpressionNode
): readonly KpLogQuotientExpressionNode[] {
  switch (node.kind) {
    case "symbol":
    case "function-operator":
    case "delimiter":
    case "subtraction-operator":
    case "fraction-bar":
      return [];
    case "natural-log":
      return [node.operator, node.enclosure[0], node.argument, node.enclosure[1]];
    case "difference":
      return [node.left, node.operator, node.right];
    case "quotient":
      return [node.numerator, node.bar, node.denominator];
  }
}

function assertEndpointClosure(
  state: KpLogQuotientState,
  annotated: KpSelectorAnnotatedLatex,
  nodes: readonly KpLogQuotientNativeEndpointNode[]
): void {
  const expected = listKpLogQuotientExpressionNodes(state);
  const expectedTextIds = expected
    .filter(({ kind }) => kind !== "fraction-bar")
    .map(({ id }) => id);
  const annotationIds = annotated.annotations.map(({ selectorId }) => selectorId);
  const fractionBars = expected.filter(({ kind }) => kind === "fraction-bar");
  if (
    annotationIds.length !== expectedTextIds.length ||
    new Set(annotationIds).size !== expectedTextIds.length ||
    expectedTextIds.some((id) => !annotationIds.includes(id)) ||
    fractionBars.length > 1 ||
    nodes.length !== expected.length
  ) {
    throw new Error(
      `Log-quotient endpoint ${state.id} must own every text occurrence and native fraction rule exactly once.`
    );
  }
}
