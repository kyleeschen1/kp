import type { KpLispLambdaApplicationAsset } from "../semantic/lisp-lambda-application-asset.ts";

export type KpLispBotanicalRole =
  | "enclosure"
  | "branch"
  | "leaf"
  | "root"
  | "bud"
  | "fruit";

export interface KpLispBotanicalNode {
  readonly id: string;
  readonly selectorId: string;
  readonly role: KpLispBotanicalRole;
  readonly label: string;
}

export interface KpLispBotanicalPath {
  readonly id: string;
  readonly sourceNodeIds: readonly string[];
  readonly targetNodeIds: readonly string[];
  readonly materialIds: readonly string[];
  readonly semanticReason: string;
}

export interface KpLispBotanicalPresentationPlan {
  readonly id: "presentation.lisp.lambda-application.botanical-local-v0";
  readonly status: "experimental-local";
  readonly nodes: readonly KpLispBotanicalNode[];
  readonly paths: readonly KpLispBotanicalPath[];
  readonly settledAuthority: "native-code";
  readonly reducedMotion: "checkpoint-crossfade";
}

export function createKpLispBotanicalPresentationPlan(
  asset: KpLispLambdaApplicationAsset
): KpLispBotanicalPresentationPlan {
  const nodes = Object.freeze([
    node("botanical.application", "selector.lisp.input.application", "enclosure", "Application enclosure"),
    node("botanical.lambda", "selector.lisp.input.lambda", "branch", "Lambda branch"),
    node("botanical.binder", "selector.lisp.input.binder-x", "bud", "Parameter bud"),
    node("botanical.argument", "selector.lisp.input.argument-four", "leaf", "Argument leaf"),
    node("botanical.reference", "selector.lisp.input.body-reference-x", "bud", "Reference destination"),
    node("botanical.environment", "selector.lisp.environment.binding-x", "root", "Lexical root"),
    node("botanical.reconstructed", "selector.lisp.reconstructed.body", "branch", "Reconstructed branch"),
    node("botanical.result", "selector.lisp.result.five", "fruit", "Result fruit")
  ]);
  const paths = Object.freeze([
    path(
      "botanical.path.bind",
      ["botanical.argument", "botanical.binder"],
      ["botanical.environment", "botanical.reference"],
      ["material.argument"],
      "The certified lexical binding connects argument four to the exact x reference destination."
    ),
    path(
      "botanical.path.reconstruct",
      ["botanical.reference", "botanical.environment", "botanical.lambda"],
      ["botanical.reconstructed"],
      ["material.plus", "material.argument", "material.literal", "material.lambda-shell"],
      "The body persists while four gathers into its reference and the consumed application shell exits."
    ),
    path(
      "botanical.path.evaluate",
      ["botanical.reconstructed"],
      ["botanical.result"],
      ["material.result"],
      "The exact reconstructed form evaluates and gathers into value five."
    )
  ]);

  validatePlan(asset, nodes, paths);
  return Object.freeze({
    id: "presentation.lisp.lambda-application.botanical-local-v0",
    status: "experimental-local",
    nodes,
    paths,
    settledAuthority: "native-code",
    reducedMotion: "checkpoint-crossfade"
  });
}

function validatePlan(
  asset: KpLispLambdaApplicationAsset,
  nodes: readonly KpLispBotanicalNode[],
  paths: readonly KpLispBotanicalPath[]
): void {
  const selectors = new Set(asset.bundle.objects.flatMap(({ selectors }) =>
    selectors.map(({ id }) => id)
  ));
  const nodeIds = new Set(nodes.map(({ id }) => id));
  const materialIds = new Set(asset.materialLedger.map(({ id }) => id));
  for (const node of nodes) {
    if (!selectors.has(node.selectorId)) {
      throw new Error(`Botanical node ${node.id} names unknown selector ${node.selectorId}.`);
    }
  }
  for (const path of paths) {
    for (const id of [...path.sourceNodeIds, ...path.targetNodeIds]) {
      if (!nodeIds.has(id)) {
        throw new Error(`Botanical path ${path.id} names unknown node ${id}.`);
      }
    }
    for (const id of path.materialIds) {
      if (!materialIds.has(id)) {
        throw new Error(`Botanical path ${path.id} names unknown material ${id}.`);
      }
    }
  }
  const accounted = new Set(paths.flatMap(({ materialIds: ids }) => ids));
  for (const id of materialIds) {
    if (!accounted.has(id)) {
      throw new Error(`Botanical plan omits material reason ${id}.`);
    }
  }
}

function node(
  id: string,
  selectorId: string,
  role: KpLispBotanicalRole,
  label: string
): KpLispBotanicalNode {
  return Object.freeze({ id, selectorId, role, label });
}

function path(
  id: string,
  sourceNodeIds: readonly string[],
  targetNodeIds: readonly string[],
  materialIds: readonly string[],
  semanticReason: string
): KpLispBotanicalPath {
  return Object.freeze({
    id,
    sourceNodeIds: Object.freeze([...sourceNodeIds]),
    targetNodeIds: Object.freeze([...targetNodeIds]),
    materialIds: Object.freeze([...materialIds]),
    semanticReason
  });
}
