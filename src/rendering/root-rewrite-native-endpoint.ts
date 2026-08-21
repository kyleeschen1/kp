import type { KpRootRewriteOccurrence } from
  "../semantic/root-rewrite-plan.ts";
import type { KpEquationFontReadiness } from
  "./equation-font-readiness.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import {
  type KpSettleAndObserveNativeKatexScene,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpSelectorAnnotatedLatex,
  KpSelectorLatexAnnotation
} from "./selector-annotated-latex.ts";

export type KpRootRewriteEndpointRole =
  | "expression"
  | "radical"
  | "radicand"
  | "root-index"
  | "carrier"
  | "operator"
  | "enclosure"
  | "enclosure-leading"
  | "enclosure-trailing"
  | "value"
  | "coefficient"
  | "residual"
  | "exponent";

interface KpRootRewriteEndpointNodeBase {
  readonly occurrence: KpRootRewriteOccurrence;
  readonly role: KpRootRewriteEndpointRole;
}

export type KpRootRewriteEndpointExpressionNode =
  | KpRootRewriteTokenNode
  | KpRootRewriteSequenceNode
  | KpRootRewriteParenthesizedNode
  | KpRootRewritePowerNode
  | KpRootRewriteRadicalNode
  | KpRootRewriteAbsoluteValueNode;

export interface KpRootRewriteTokenNode extends
  KpRootRewriteEndpointNodeBase {
  readonly kind: "token";
  readonly latex: string;
}

export interface KpRootRewriteSequenceNode extends
  KpRootRewriteEndpointNodeBase {
  readonly kind: "sequence";
  readonly children: readonly KpRootRewriteEndpointExpressionNode[];
}

export interface KpRootRewriteParenthesizedNode extends
  KpRootRewriteEndpointNodeBase {
  readonly kind: "parenthesized";
  readonly body: KpRootRewriteEndpointExpressionNode;
}

export interface KpRootRewritePowerNode extends KpRootRewriteEndpointNodeBase {
  readonly kind: "power";
  readonly base: KpRootRewriteEndpointExpressionNode;
  readonly exponent: KpRootRewriteEndpointExpressionNode;
}

export interface KpRootRewriteRadicalNode extends KpRootRewriteEndpointNodeBase {
  readonly kind: "radical";
  readonly radicand: KpRootRewriteEndpointExpressionNode;
  readonly index?: KpRootRewriteEndpointExpressionNode | undefined;
}

export interface KpRootRewriteAbsoluteValueNode extends
  KpRootRewriteEndpointNodeBase {
  readonly kind: "absolute-value";
  readonly body: KpRootRewriteEndpointExpressionNode;
}

export interface KpRootRewriteNativeEndpointNode {
  readonly occurrence: KpRootRewriteOccurrence;
  readonly role: KpRootRewriteEndpointRole;
  readonly expressionKind: KpRootRewriteEndpointExpressionNode["kind"];
  readonly parentEntityId?: string | undefined;
  readonly motionId: string;
  readonly presentationGroupId: string;
}

export interface KpRootRewriteNativeEndpoint {
  readonly schemaVersion: "kp.root-rewrite-native-endpoint.v1";
  readonly endpoint: "source" | "target";
  readonly stateId: string;
  readonly accessibleText: string;
  readonly rootPresentationGroupId: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly nativeHtmlAndMathml: string;
  readonly nodes: readonly KpRootRewriteNativeEndpointNode[];
}

interface RenderedRootNode {
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly annotations: readonly KpSelectorLatexAnnotation[];
}

interface KpRootRewriteEndpointNodeProtocolEntry<
  Node extends KpRootRewriteEndpointExpressionNode
> {
  readonly children: (
    node: Node
  ) => readonly KpRootRewriteEndpointExpressionNode[];
  readonly project: (
    node: Node,
    children: readonly RenderedRootNode[]
  ) => string;
}

type KpRootRewriteEndpointNodeProtocol = {
  readonly [Kind in KpRootRewriteEndpointExpressionNode["kind"]]:
    KpRootRewriteEndpointNodeProtocolEntry<Extract<
      KpRootRewriteEndpointExpressionNode,
      { readonly kind: Kind }
    >>;
};

/**
 * Node traversal and LaTeX projection are registry-driven so adding a bounded
 * root shape extends one protocol table rather than editing every visitor.
 */
export const kpRootRewriteEndpointNodeProtocol = Object.freeze({
  token: Object.freeze({
    children: (_node: KpRootRewriteTokenNode) => [],
    project: (node: KpRootRewriteTokenNode) => node.latex
  }),
  sequence: Object.freeze({
    children: (node: KpRootRewriteSequenceNode) => node.children,
    project: (_node: KpRootRewriteSequenceNode,
      children: readonly RenderedRootNode[]) =>
      children.map(({ annotatedLatex }) => annotatedLatex).join("")
  }),
  parenthesized: Object.freeze({
    children: (node: KpRootRewriteParenthesizedNode) => [node.body],
    project: (_node: KpRootRewriteParenthesizedNode,
      children: readonly RenderedRootNode[]) =>
      `(${children[0]!.annotatedLatex})`
  }),
  power: Object.freeze({
    children: (node: KpRootRewritePowerNode) => [node.base, node.exponent],
    project: (_node: KpRootRewritePowerNode,
      children: readonly RenderedRootNode[]) =>
      `${children[0]!.annotatedLatex}^{${children[1]!.annotatedLatex}}`
  }),
  radical: Object.freeze({
    children: (node: KpRootRewriteRadicalNode) =>
      node.index === undefined
        ? [node.radicand]
        : [node.index, node.radicand],
    project: (node: KpRootRewriteRadicalNode,
      children: readonly RenderedRootNode[]) => {
      const index = node.index === undefined
        ? ""
        : `[${children[0]!.annotatedLatex}]`;
      const radicand = children[node.index === undefined ? 0 : 1]!;
      return `\\sqrt${index}{${radicand.annotatedLatex}}`;
    }
  }),
  "absolute-value": Object.freeze({
    children: (node: KpRootRewriteAbsoluteValueNode) => [node.body],
    project: (_node: KpRootRewriteAbsoluteValueNode,
      children: readonly RenderedRootNode[]) =>
      `\\left\\lvert ${children[0]!.annotatedLatex}\\right\\rvert`
  })
} satisfies KpRootRewriteEndpointNodeProtocol);

export function createKpRootRewriteNativeEndpoint(input: {
  readonly endpoint: "source" | "target";
  readonly stateId: string;
  readonly accessibleText: string;
  readonly root: KpRootRewriteEndpointExpressionNode;
}): KpRootRewriteNativeEndpoint {
  assertSafeId(input.stateId, "Root endpoint state");
  if (input.accessibleText.trim().length === 0) {
    throw new Error("Root endpoint requires accessible text.");
  }
  const rootPresentationGroupId = `group.root-rewrite.${input.stateId}`;
  const nodes = collectNodes(input.root, rootPresentationGroupId);
  const rendered = renderNode(input.stateId, input.root);
  const annotated = Object.freeze({
    id: `root-rewrite.${input.stateId}`,
    kind: "selector-annotated-latex" as const,
    rawLatex: rendered.rawLatex,
    annotatedLatex: rendered.annotatedLatex,
    annotations: rendered.annotations
  });
  assertEndpointClosure(input.stateId, nodes, annotated);
  return Object.freeze({
    schemaVersion: "kp.root-rewrite-native-endpoint.v1" as const,
    endpoint: input.endpoint,
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

export function bindKpRootRewriteNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpRootRewriteNativeEndpoint;
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
        `Root endpoint ${input.endpoint.stateId} expected one owner for ` +
        `${node.occurrence.entityId}, received ${elements.length}.`
      );
    }
    const element = elements[0]!;
    element.dataset["kpMotionId"] = node.motionId;
    element.dataset["kpSemanticEntityId"] = node.occurrence.entityId;
    element.dataset["kpSemanticIdentityId"] = node.occurrence.semanticId;
    element.dataset["kpSemanticSelectorId"] = node.occurrence.entityId;
    element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
  }
}

export async function settleAndObserveKpRootRewriteNativeEndpoint(input: {
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpRootRewriteNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
  readonly observe: KpSettleAndObserveNativeKatexScene;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpRootRewriteNativeEndpointOwnership(input);
  return input.observe({
    endpoint: input.endpoint.endpoint,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness
  });
}

function renderNode(
  stateId: string,
  node: KpRootRewriteEndpointExpressionNode
): RenderedRootNode {
  const protocol = protocolFor(node);
  const children = protocol.children(node).map((child) =>
    renderNode(stateId, child));
  const rawChildren = children.map((child) => ({
    ...child,
    annotatedLatex: child.rawLatex
  }));
  const rawLatex = protocol.project(node, rawChildren);
  assertSafeAuthoredLatex(rawLatex, node.occurrence.entityId);
  const motionId = motionIdFor(stateId, node.occurrence.entityId);
  const innerAnnotated = protocol.project(node, children);
  return Object.freeze({
    rawLatex,
    annotatedLatex:
      `\\htmlData{kp-motion-id=${motionId}}{${innerAnnotated}}`,
    annotations: Object.freeze([{
      selectorId: node.occurrence.entityId,
      motionId,
      latex: rawLatex
    }, ...children.flatMap(({ annotations }) => annotations)])
  });
}

function collectNodes(
  root: KpRootRewriteEndpointExpressionNode,
  rootPresentationGroupId: string
): readonly KpRootRewriteNativeEndpointNode[] {
  const seenNodes = new WeakSet<object>();
  const seenEntityIds = new Set<string>();
  const nodes: KpRootRewriteNativeEndpointNode[] = [];
  const visit = (
    node: KpRootRewriteEndpointExpressionNode,
    parentEntityId?: string
  ): void => {
    if (seenNodes.has(node)) {
      throw new Error("Root endpoint expression cannot repeat or cycle nodes.");
    }
    seenNodes.add(node);
    validateOccurrence(node.occurrence);
    if (seenEntityIds.has(node.occurrence.entityId)) {
      throw new Error(
        `Root endpoint repeats entity ${node.occurrence.entityId}.`
      );
    }
    seenEntityIds.add(node.occurrence.entityId);
    nodes.push(Object.freeze({
      occurrence: Object.freeze({ ...node.occurrence }),
      role: node.role,
      expressionKind: node.kind,
      ...(parentEntityId === undefined ? {} : { parentEntityId }),
      motionId: motionIdFor(rootPresentationGroupId,
        node.occurrence.entityId),
      presentationGroupId:
        `${rootPresentationGroupId}.node.${node.occurrence.entityId}`
    }));
    for (const child of protocolFor(node).children(node)) {
      visit(child, node.occurrence.entityId);
    }
  };
  visit(root);
  // Motion IDs use the state ID in rendered LaTeX. Replace the temporary root
  // prefix only after traversal has validated every recursive occurrence.
  const stateId = rootPresentationGroupId.replace("group.root-rewrite.", "");
  return Object.freeze(nodes.map((node) => Object.freeze({
    ...node,
    motionId: motionIdFor(stateId, node.occurrence.entityId)
  })));
}

function protocolFor(
  node: KpRootRewriteEndpointExpressionNode
): KpRootRewriteEndpointNodeProtocolEntry<
  KpRootRewriteEndpointExpressionNode> {
  return kpRootRewriteEndpointNodeProtocol[node.kind] as unknown as
    KpRootRewriteEndpointNodeProtocolEntry<
      KpRootRewriteEndpointExpressionNode>;
}

function motionIdFor(stateId: string, entityId: string): string {
  return `root-rewrite.${stateId}.${entityId}`;
}

function validateOccurrence(occurrence: KpRootRewriteOccurrence): void {
  for (const [label, value] of [
    ["entity", occurrence.entityId],
    ["semantic", occurrence.semanticId],
    ["subtree", occurrence.subtreeId]
  ] as const) {
    assertSafeId(value, `Root endpoint ${label}`);
  }
}

function assertEndpointClosure(
  stateId: string,
  nodes: readonly KpRootRewriteNativeEndpointNode[],
  annotated: KpSelectorAnnotatedLatex
): void {
  const expected = nodes.map(({ occurrence }) => occurrence.entityId);
  const actual = annotated.annotations.map(({ selectorId }) => selectorId);
  if (actual.length !== expected.length ||
    new Set(actual).size !== expected.length ||
    expected.some((id) => !actual.includes(id))) {
    throw new Error(
      `Root endpoint ${stateId} must annotate every occurrence exactly once.`
    );
  }
  const ids = new Set(expected);
  for (const node of nodes) {
    if (node.parentEntityId !== undefined && !ids.has(node.parentEntityId)) {
      throw new Error(
        `Root endpoint ${stateId} node ${node.occurrence.entityId} has no parent.`
      );
    }
  }
}

function assertSafeId(value: string, label: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(value)) {
    throw new Error(`${label} requires a data-attribute-safe ID.`);
  }
}

function assertSafeAuthoredLatex(latex: string, entityId: string): void {
  if (latex.trim().length === 0 ||
    /\\(?:htmlData|htmlClass|htmlId|href|url|includegraphics)\b/u.test(latex)) {
    throw new Error(
      `Root endpoint ${entityId} contains empty or privileged authored LaTeX.`
    );
  }
}
