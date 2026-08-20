import type { ParsedLatexExpression } from "../math/latex-parser.ts";
import {
  isKpExponentialHomomorphismCorrespondenceAuthority,
  type KpExponentialHomomorphismCorrespondenceAuthority,
  type KpExponentialOccurrenceRole,
  type KpExponentialSemanticOccurrence
} from "../semantic/exponential-homomorphism-correspondence.ts";
import type { KpEquationFontReadiness } from "./equation-font-readiness.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpSettleAndObserveNativeKatexScene
} from "./native-katex-feature-pack-contract.ts";

export type KpExponentialEndpointMeasurementKind =
  | "native-ink"
  | "native-group"
  | "derived-adjacency";

export interface KpExponentialNativeEndpointNode {
  readonly occurrenceId: string;
  readonly referentId: string;
  readonly role: KpExponentialOccurrenceRole;
  readonly ordinal: number;
  readonly presentationGroupId: string;
  readonly measurement: KpExponentialEndpointMeasurementKind;
  readonly motionId?: string | undefined;
}

export interface KpExponentialNativeEndpoint {
  readonly schemaVersion: "kp.exponential-native-endpoint.v1";
  readonly endpoint: "source" | "target";
  readonly authorityId: string;
  readonly accessibleText: string;
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly nativeHtmlAndMathml: string;
  readonly rootPresentationGroupId: string;
  readonly nodes: readonly KpExponentialNativeEndpointNode[];
}

export interface KpExponentialNativeEndpointSet {
  readonly authority: KpExponentialHomomorphismCorrespondenceAuthority;
  readonly source: KpExponentialNativeEndpoint;
  readonly target: KpExponentialNativeEndpoint;
}

export type KpExponentialInkAnchorRole =
  | "base"
  | "exponent-plane"
  | "operand"
  | "connector";

export interface KpExponentialInkAnchor {
  readonly occurrenceId: string;
  readonly role: KpExponentialInkAnchorRole;
  readonly ordinal: number;
  readonly measurement: KpExponentialEndpointMeasurementKind;
  readonly rect: KpStageRelativeRect;
  readonly anchorX: number;
  readonly anchorY: number;
}

export interface KpExponentialNativeInkCertificate {
  readonly kind: "exponential-native-ink-certificate";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly endpoint: "source" | "target";
  readonly authorityId: string;
  readonly fontRevision: number;
  readonly viewportKey: string;
  readonly deviceScaleFactor: number;
  readonly coordinateSpace: "stage-css-pixels";
  readonly anchors: readonly KpExponentialInkAnchor[];
  readonly toJSON: () => never;
}

/**
 * Native endpoint syntax is projected from semantic authority. Juxtaposition
 * remains glyph-free at the target: its connector is measured from the gap
 * between adjacent native power groups instead of inventing a multiplication
 * glyph or synthetic typography.
 */
export function createKpExponentialHomomorphismNativeEndpoints(
  authority: KpExponentialHomomorphismCorrespondenceAuthority
): KpExponentialNativeEndpointSet {
  if (!isKpExponentialHomomorphismCorrespondenceAuthority(authority)) {
    throw new Error(
      "Exponential native endpoints require minted correspondence authority."
    );
  }
  const operands = authority.source.superscriptRegion.combination.operands
    .map(renderParsedLatexExpression);
  const baseLatex = authority.source.base.rawLatex;
  const source = createSourceEndpoint(authority, baseLatex, operands);
  const target = createTargetEndpoint(authority, baseLatex, operands);
  return Object.freeze({ authority, source, target });
}

export function bindKpExponentialNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpExponentialNativeEndpoint;
}): void {
  input.root.dataset["kpSemanticEntityId"] = input.endpoint.authorityId;
  input.root.dataset["kpPresentationGroupId"] =
    input.endpoint.rootPresentationGroupId;
  for (const node of input.endpoint.nodes) {
    if (node.motionId === undefined) continue;
    const elements = input.root.querySelectorAll<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(node.motionId)}"]`
    );
    if (elements.length !== 1) {
      throw new Error(
        `Exponential ${input.endpoint.endpoint} endpoint expected one native ` +
        `owner for ${node.occurrenceId}, received ${elements.length}.`
      );
    }
    const element = elements[0]!;
    element.dataset["kpMotionId"] = node.motionId;
    element.dataset["kpSemanticEntityId"] = node.occurrenceId;
    element.dataset["kpSemanticIdentityId"] = node.referentId;
    element.dataset["kpSemanticSelectorId"] = node.occurrenceId;
    element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
  }
}

export async function settleAndObserveKpExponentialNativeEndpoint(input: {
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpExponentialNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
  readonly observe: KpSettleAndObserveNativeKatexScene;
  readonly geometryTolerancePx?: number | undefined;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpExponentialNativeEndpointOwnership(input);
  return input.observe({
    endpoint: input.endpoint.endpoint,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.authorityId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness,
    ...(input.geometryTolerancePx === undefined
      ? {}
      : { geometryTolerancePx: input.geometryTolerancePx })
  });
}

export function certifyKpExponentialNativeEndpointInk(input: {
  readonly endpoint: KpExponentialNativeEndpoint;
  readonly scene: KpNativeKatexRenderedSceneObservation;
  readonly deviceScaleFactor: number;
}): KpExponentialNativeInkCertificate {
  if (input.scene.endpoint !== input.endpoint.endpoint) {
    throw new Error("Exponential ink certification received the wrong endpoint.");
  }
  if (!Number.isFinite(input.deviceScaleFactor) || input.deviceScaleFactor <= 0) {
    throw new Error("Exponential ink certification requires a positive DPR.");
  }
  const groups = new Map(input.scene.groups.map((group) => [group.id, group]));
  const anchors = input.endpoint.nodes.flatMap((node) => {
    const role = anchorRole(node.role);
    if (role === undefined) return [];
    if (node.measurement === "derived-adjacency") {
      return [deriveTargetConnectorAnchor(input.endpoint, node, groups)];
    }
    const group = groups.get(node.presentationGroupId);
    if (group === undefined) {
      throw new Error(
        `Native endpoint is missing measured group ${node.presentationGroupId}.`
      );
    }
    return [anchor(node, role, group.rect)];
  });
  const expected = input.endpoint.nodes.filter(({ role }) =>
    anchorRole(role) !== undefined
  );
  if (anchors.length !== expected.length) {
    throw new Error("Exponential native endpoint did not certify every ink role.");
  }
  const certificate = Object.freeze({
    kind: "exponential-native-ink-certificate" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    endpoint: input.endpoint.endpoint,
    authorityId: input.endpoint.authorityId,
    fontRevision: input.scene.fontRevision,
    viewportKey: input.scene.viewportKey,
    deviceScaleFactor: input.deviceScaleFactor,
    coordinateSpace: "stage-css-pixels" as const,
    anchors: Object.freeze(anchors),
    toJSON(): never {
      throw new Error(
        "Exponential native ink certificates cannot enter durable state."
      );
    }
  });
  return certificate;
}

function createSourceEndpoint(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  baseLatex: string,
  operands: readonly string[]
): KpExponentialNativeEndpoint {
  const nodes = endpointNodes(authority, "source");
  const base = nativeNode(nodes, "base", 0, baseLatex);
  const payloads = operands.map((latex, index) =>
    nativeNode(nodes, "exponent-payload", index, latex)
  );
  const connectors = operands.slice(1).map((_latex, index) =>
    nativeNode(nodes, "combination-connector", index, "+")
  );
  const combinationLatex = interleave(payloads, connectors);
  const combination = nativeNode(
    nodes,
    "combination-root",
    0,
    combinationLatex
  );
  const superscript = nativeNode(
    nodes,
    "superscript-region",
    0,
    combination
  );
  const annotatedLatex = nativeNode(
    nodes,
    "power-application",
    0,
    `${base}^{${superscript}}`
  );
  return endpoint(authority, "source", authority.source.rawLatex,
    annotatedLatex, nodes);
}

function createTargetEndpoint(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  baseLatex: string,
  operands: readonly string[]
): KpExponentialNativeEndpoint {
  const nodes = endpointNodes(authority, "target");
  const powers = operands.map((operand, index) => {
    const base = nativeNode(nodes, "base", index, baseLatex);
    const payload = nativeNode(nodes, "exponent-payload", index, operand);
    const superscript = nativeNode(
      nodes,
      "superscript-region",
      index,
      payload
    );
    return nativeNode(
      nodes,
      "power-application",
      index,
      `${base}^{${superscript}}`
    );
  });
  const annotatedLatex = nativeNode(
    nodes,
    "combination-root",
    0,
    powers.join("")
  );
  const rawLatex = operands.map((operand) =>
    `${baseLatex}^{${operand}}`
  ).join("");
  return endpoint(authority, "target", rawLatex, annotatedLatex, nodes);
}

function endpoint(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  side: "source" | "target",
  rawLatex: string,
  annotatedLatex: string,
  nodes: readonly KpExponentialNativeEndpointNode[]
): KpExponentialNativeEndpoint {
  const rootPresentationGroupId = `group.${authority.id}.${side}`;
  return Object.freeze({
    schemaVersion: "kp.exponential-native-endpoint.v1" as const,
    endpoint: side,
    authorityId: authority.id,
    accessibleText: rawLatex,
    rawLatex,
    annotatedLatex,
    nativeHtmlAndMathml: renderLatexToHtml(annotatedLatex, {
      displayMode: true,
      output: "htmlAndMathml",
      trust: true
    }),
    rootPresentationGroupId,
    nodes
  });
}

function endpointNodes(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  side: "source" | "target"
): readonly KpExponentialNativeEndpointNode[] {
  const root = `group.${authority.id}.${side}`;
  return Object.freeze(authority.occurrences
    .filter(({ endpoint: occurrenceSide }) => occurrenceSide === side)
    .map((occurrence) => Object.freeze({
      occurrenceId: occurrence.id,
      referentId: occurrence.referentId,
      role: occurrence.role,
      ordinal: occurrence.ordinal,
      presentationGroupId:
        `${root}.node.${occurrence.role}.${occurrence.ordinal}`,
      measurement: measurementKind(occurrence),
      ...(measurementKind(occurrence) === "derived-adjacency"
        ? {}
        : { motionId: `exponential.${authority.id}.${side}.` +
          `${occurrence.role}.${occurrence.ordinal}` })
    })));
}

function measurementKind(
  occurrence: KpExponentialSemanticOccurrence
): KpExponentialEndpointMeasurementKind {
  if (
    occurrence.endpoint === "target" &&
    occurrence.role === "combination-connector"
  ) return "derived-adjacency";
  if (
    occurrence.role === "power-application" ||
    occurrence.role === "superscript-region" ||
    occurrence.role === "combination-root"
  ) return "native-group";
  return "native-ink";
}

function nativeNode(
  nodes: readonly KpExponentialNativeEndpointNode[],
  role: KpExponentialOccurrenceRole,
  ordinal: number,
  latex: string
): string {
  const node = findNode(nodes, role, ordinal);
  if (node.motionId === undefined) {
    throw new Error(`Node ${node.occurrenceId} has no native paint owner.`);
  }
  return `\\htmlData{kp-motion-id=${node.motionId}}{${latex}}`;
}

function findNode(
  nodes: readonly KpExponentialNativeEndpointNode[],
  role: KpExponentialOccurrenceRole,
  ordinal: number
): KpExponentialNativeEndpointNode {
  const matches = nodes.filter((node) =>
    node.role === role && node.ordinal === ordinal
  );
  if (matches.length !== 1) {
    throw new Error(
      `Exponential endpoint expected one ${role}[${ordinal}] occurrence.`
    );
  }
  return matches[0]!;
}

function interleave(
  values: readonly string[],
  connectors: readonly string[]
): string {
  return values.map((value, index) =>
    index === 0 ? value : `${connectors[index - 1]}${value}`
  ).join("");
}

function anchorRole(
  role: KpExponentialOccurrenceRole
): KpExponentialInkAnchorRole | undefined {
  if (role === "base") return "base";
  if (role === "superscript-region") return "exponent-plane";
  if (role === "exponent-payload") return "operand";
  if (role === "combination-connector") return "connector";
  return undefined;
}

function anchor(
  node: KpExponentialNativeEndpointNode,
  role: KpExponentialInkAnchorRole,
  rect: KpStageRelativeRect
): KpExponentialInkAnchor {
  return Object.freeze({
    occurrenceId: node.occurrenceId,
    role,
    ordinal: node.ordinal,
    measurement: node.measurement,
    rect: Object.freeze({ ...rect }),
    anchorX: rect.left + rect.width / 2,
    anchorY: role === "exponent-plane" ? rect.top : rect.top + rect.height / 2
  });
}

function deriveTargetConnectorAnchor(
  endpointValue: KpExponentialNativeEndpoint,
  node: KpExponentialNativeEndpointNode,
  groups: ReadonlyMap<string, { readonly rect: KpStageRelativeRect }>
): KpExponentialInkAnchor {
  const leftNode = findNode(
    endpointValue.nodes,
    "power-application",
    node.ordinal
  );
  const rightNode = findNode(
    endpointValue.nodes,
    "power-application",
    node.ordinal + 1
  );
  const left = groups.get(leftNode.presentationGroupId)?.rect;
  const right = groups.get(rightNode.presentationGroupId)?.rect;
  if (left === undefined || right === undefined) {
    throw new Error(
      `Target connector ${node.occurrenceId} requires both adjacent native powers.`
    );
  }
  const leftEdge = left.left + left.width;
  const rightEdge = right.left;
  if (rightEdge < leftEdge) {
    throw new Error(
      `Target connector ${node.occurrenceId} has overlapping native powers.`
    );
  }
  return anchor(node, "connector", {
    left: leftEdge,
    top: Math.min(left.top, right.top),
    width: rightEdge - leftEdge,
    height: Math.max(left.top + left.height, right.top + right.height) -
      Math.min(left.top, right.top)
  });
}

function renderParsedLatexExpression(expression: ParsedLatexExpression): string {
  switch (expression.kind) {
    case "identifier": return expression.name;
    case "number": return String(expression.value);
    case "unary": return `-${renderParsedLatexExpression(expression.value)}`;
    case "binary": {
      const left = renderParsedLatexExpression(expression.left);
      const right = renderParsedLatexExpression(expression.right);
      if (expression.operator === "/") return `\\frac{${left}}{${right}}`;
      if (expression.operator === "^") return `${left}^{${right}}`;
      return `${left}${expression.operator}${right}`;
    }
    case "call": {
      const argument = renderParsedLatexExpression(expression.argument);
      if (expression.name === "log") {
        return `\\log_{${renderParsedLatexExpression(expression.base)}}(${argument})`;
      }
      return `\\${expression.name}(${argument})`;
    }
  }
}
