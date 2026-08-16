import type {
  KpEquationFontReadiness
} from "./equation-font-readiness.ts";
import {
  renderLatexToHtml
} from "./katex-adapter.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpSelectorAnnotatedLatex,
  KpSelectorLatexAnnotation
} from "./selector-annotated-latex.ts";
import {
  kpCanonicalLogExponentSolveStates,
  listKpLogExponentExpressionNodes,
  renderKpLogExponentExpressionNodeLatex,
  type KpLogExponentExpressionNode,
  type KpLogExponentSolveState,
  type KpLogExponentSolveStateId
} from "../semantic/log-exponent-solve-states.ts";
import {
  defineKpExpressionProjection
} from "../semantic/expression-node-protocol.ts";
import {
  kpLogExponentExpressionProtocol
} from "../semantic/log-exponent-expression-protocol.ts";

export interface KpLogExponentNativeEndpointNode {
  readonly occurrenceId: string;
  readonly semanticId: string;
  readonly parentOccurrenceId?: string | undefined;
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpLogExponentNativeEndpoint {
  readonly schemaVersion: "kp.log-exponent-native-endpoint.v1";
  readonly stateId: KpLogExponentSolveStateId;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpLogExponentNativeEndpointNode[];
}

interface RenderedNode {
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly annotations: readonly KpSelectorLatexAnnotation[];
}

const kpLogExponentAnnotatedLatexProjection =
  defineKpExpressionProjection<KpLogExponentExpressionNode, string>({
    id: "kp.log-exponent.projection.annotated-latex.v1",
    protocol: kpLogExponentExpressionProtocol,
    handlers: {
      number: { project: (node) => String(node.value) },
      symbol: { project: (node) => node.name },
      "function-operator": { project: () => "\\ln" },
      delimiter: { project: (node) => node.value },
      // KaTeX annotation commands need a group when they become superscripts.
      power: {
        project: (_node, children) => `${children[0]}^{${children[1]}}`
      },
      "natural-log": {
        project: (node, children) => node.enclosure === undefined
          ? `${children[0]} ${children[1]}`
          : `${children[0]}${children[1]}${children[2]}${children[3]}`
      },
      product: { project: (_node, children) => children.join("") },
      quotient: {
        project: (_node, children) =>
          `\\frac{${children[0]}}{${children[1]}}`
      },
      equality: {
        project: (_node, children) => `${children[0]}=${children[1]}`
      }
    }
  });

export function createKpLogExponentNativeEndpoints(
  states: readonly KpLogExponentSolveState[] =
    kpCanonicalLogExponentSolveStates
): readonly KpLogExponentNativeEndpoint[] {
  return Object.freeze(states.map(createEndpoint));
}

export const kpCanonicalLogExponentNativeEndpoints =
  createKpLogExponentNativeEndpoints();

export function bindKpLogExponentNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpLogExponentNativeEndpoint;
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
        `Log-exponent endpoint ${input.endpoint.stateId} expected one native ` +
        `owner for ${node.occurrenceId}, received ${elements.length}.`
      );
    }
    const element = elements[0]!;
    element.dataset["kpSemanticEntityId"] = node.occurrenceId;
    element.dataset["kpSemanticIdentityId"] = node.semanticId;
    element.dataset["kpSemanticSelectorId"] = node.occurrenceId;
    element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
  }
}

export async function settleAndObserveKpLogExponentNativeEndpoint(input: {
  readonly endpointSide: "source" | "target";
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpLogExponentNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
  readonly geometryTolerancePx?: number | undefined;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpLogExponentNativeEndpointOwnership({
    root: input.root,
    endpoint: input.endpoint
  });
  return settleAndObserveKpNativeKatexRenderedScene({
    endpoint: input.endpointSide,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness,
    ...(input.geometryTolerancePx === undefined
      ? {}
      : { geometryTolerancePx: input.geometryTolerancePx })
  });
}

function createEndpoint(
  state: KpLogExponentSolveState
): KpLogExponentNativeEndpoint {
  const rendered = renderNode(state, state.equation);
  if (rendered.rawLatex !== state.latex) {
    throw new Error(
      `Log-exponent endpoint ${state.id} rendered ${rendered.rawLatex}; ` +
      `expected ${state.latex}.`
    );
  }
  const parentByOccurrence = collectParentOccurrences(state.equation);
  const rootPresentationGroupId = `group.${state.id}`;
  const nodes = Object.freeze(
    listKpLogExponentExpressionNodes(state).map((node) => Object.freeze({
      occurrenceId: node.id,
      semanticId: node.semanticId,
      ...(parentByOccurrence.get(node.id) === undefined
        ? {}
        : { parentOccurrenceId: parentByOccurrence.get(node.id) }),
      motionId: motionId(state, node),
      presentationGroupId: `${rootPresentationGroupId}.node.${node.id}`
    }))
  );
  const annotated = Object.freeze({
    id: `log-exponent.${state.id}`,
    kind: "selector-annotated-latex" as const,
    rawLatex: rendered.rawLatex,
    annotatedLatex: rendered.annotatedLatex,
    annotations: Object.freeze(
      rendered.annotations.map((annotation) => Object.freeze(annotation))
    )
  });
  assertEndpointAnnotationClosure(state, annotated, nodes);
  return Object.freeze({
    schemaVersion: "kp.log-exponent-native-endpoint.v1" as const,
    stateId: state.id,
    accessibleText: state.latex,
    rootPresentationGroupId,
    annotated,
    // One native render retains both MathML accessibility and KaTeX paint.
    // The trusted command is generated solely from validated semantic IDs.
    nativeHtmlAndMathml: renderLatexToHtml(annotated.annotatedLatex, {
      displayMode: true,
      output: "htmlAndMathml",
      trust: true
    }),
    nodes
  });
}

function renderNode(
  state: KpLogExponentSolveState,
  node: KpLogExponentExpressionNode
): RenderedNode {
  const children = renderChildren(state, node);
  const rawLatex = renderKpLogExponentExpressionNodeLatex(node);
  const motionIdValue = motionId(state, node);
  const annotation = Object.freeze({
    selectorId: node.id,
    motionId: motionIdValue,
    latex: rawLatex
  });
  return Object.freeze({
    rawLatex,
    annotatedLatex:
      `\\htmlData{kp-motion-id=${motionIdValue}}{` +
      `${annotatedNodeLatex(node, children)}}`,
    annotations: Object.freeze([
      annotation,
      ...children.flatMap(({ annotations }) => annotations)
    ])
  });
}

function renderChildren(
  state: KpLogExponentSolveState,
  node: KpLogExponentExpressionNode
): readonly RenderedNode[] {
  return Object.freeze(
    kpLogExponentExpressionProtocol.children(node).map((child) =>
      renderNode(state, child)
    )
  );
}

function annotatedNodeLatex(
  node: KpLogExponentExpressionNode,
  children: readonly RenderedNode[]
): string {
  return kpLogExponentAnnotatedLatexProjection.project(
    node,
    children.map(({ annotatedLatex }) => annotatedLatex)
  );
}

function motionId(
  state: KpLogExponentSolveState,
  node: KpLogExponentExpressionNode
): string {
  return `log-exponent.${state.id}.${node.id}`;
}

function collectParentOccurrences(
  root: KpLogExponentExpressionNode
): ReadonlyMap<string, string> {
  const parents = new Map<string, string>();
  const visit = (node: KpLogExponentExpressionNode): void => {
    for (const child of kpLogExponentExpressionProtocol.children(node)) {
      if (parents.has(child.id)) {
        throw new Error(`Log-exponent endpoint repeats occurrence ${child.id}.`);
      }
      parents.set(child.id, node.id);
      visit(child);
    }
  };
  visit(root);
  return parents;
}

function assertEndpointAnnotationClosure(
  state: KpLogExponentSolveState,
  annotated: KpSelectorAnnotatedLatex,
  nodes: readonly KpLogExponentNativeEndpointNode[]
): void {
  const expected = listKpLogExponentExpressionNodes(state).map(({ id }) => id);
  const actual = annotated.annotations.map(({ selectorId }) => selectorId);
  if (
    actual.length !== expected.length ||
    new Set(actual).size !== expected.length ||
    expected.some((id) => !actual.includes(id)) ||
    nodes.length !== expected.length
  ) {
    throw new Error(
      `Log-exponent endpoint ${state.id} must annotate every occurrence exactly once.`
    );
  }
}
