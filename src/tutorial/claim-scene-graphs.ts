export type KpTutorialClaimRelation =
  | "depends-on"
  | "evidenced-by"
  | "qualifies"
  | "reintegrates";

export interface KpTutorialClaimNode {
  readonly id: string;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
}

export interface KpTutorialClaimEdge {
  readonly id: string;
  readonly sourceClaimId: string;
  readonly targetClaimId: string;
  readonly relation: KpTutorialClaimRelation;
}

export interface KpTutorialClaimGraph {
  readonly id: string;
  readonly nodes: readonly KpTutorialClaimNode[];
  readonly edges: readonly KpTutorialClaimEdge[];
}

export type KpTutorialSceneNodeKind =
  | "annotation"
  | "control"
  | "semantic-object"
  | "view";

export interface KpTutorialSceneNode {
  readonly id: string;
  readonly kind: KpTutorialSceneNodeKind;
  readonly semanticObjectId?: string | undefined;
}

export interface KpTutorialSceneEdge {
  readonly id: string;
  readonly parentNodeId: string;
  readonly childNodeId: string;
}

export interface KpTutorialSceneGraph {
  readonly id: string;
  readonly nodes: readonly KpTutorialSceneNode[];
  readonly edges: readonly KpTutorialSceneEdge[];
}

export interface KpClaimSceneBinding {
  readonly id: string;
  readonly claimId: string;
  readonly sceneNodeIds: readonly string[];
  readonly role: "context" | "evidence" | "subject";
}

export interface KpClaimSceneGraphBundle {
  readonly claimGraph: KpTutorialClaimGraph;
  readonly sceneGraph: KpTutorialSceneGraph;
  readonly bindings: readonly KpClaimSceneBinding[];
}

export interface KpClaimSceneGraphDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function validateKpClaimSceneGraphBundle(
  bundle: KpClaimSceneGraphBundle
): readonly KpClaimSceneGraphDiagnostic[] {
  const diagnostics: KpClaimSceneGraphDiagnostic[] = [];
  const claimIds = uniqueIds(bundle.claimGraph.nodes, "claimGraph.nodes", diagnostics);
  const sceneNodeIds = uniqueIds(
    bundle.sceneGraph.nodes,
    "sceneGraph.nodes",
    diagnostics
  );

  uniqueIds(bundle.claimGraph.edges, "claimGraph.edges", diagnostics);
  uniqueIds(bundle.sceneGraph.edges, "sceneGraph.edges", diagnostics);
  uniqueIds(bundle.bindings, "bindings", diagnostics);

  bundle.claimGraph.edges.forEach((edge, index) => {
    requireId(
      edge.sourceClaimId,
      claimIds,
      `claimGraph.edges[${index}].sourceClaimId`,
      diagnostics
    );
    requireId(
      edge.targetClaimId,
      claimIds,
      `claimGraph.edges[${index}].targetClaimId`,
      diagnostics
    );
  });

  bundle.sceneGraph.edges.forEach((edge, index) => {
    requireId(
      edge.parentNodeId,
      sceneNodeIds,
      `sceneGraph.edges[${index}].parentNodeId`,
      diagnostics
    );
    requireId(
      edge.childNodeId,
      sceneNodeIds,
      `sceneGraph.edges[${index}].childNodeId`,
      diagnostics
    );
  });

  bundle.bindings.forEach((binding, index) => {
    requireId(binding.claimId, claimIds, `bindings[${index}].claimId`, diagnostics);
    binding.sceneNodeIds.forEach((sceneNodeId, sceneNodeIndex) => {
      requireId(
        sceneNodeId,
        sceneNodeIds,
        `bindings[${index}].sceneNodeIds[${sceneNodeIndex}]`,
        diagnostics
      );
    });
  });

  return diagnostics;
}

export function claimSceneNodes(
  bundle: KpClaimSceneGraphBundle,
  claimId: string
): readonly KpTutorialSceneNode[] {
  const boundIds = new Set(
    bundle.bindings
      .filter((binding) => binding.claimId === claimId)
      .flatMap((binding) => binding.sceneNodeIds)
  );

  // Bindings are the only authority crossing the pedagogical/render boundary;
  // spatial proximity and render-tree ancestry must never imply a claim relation.
  return bundle.sceneGraph.nodes.filter((node) => boundIds.has(node.id));
}

function uniqueIds(
  values: readonly { readonly id: string }[],
  path: string,
  diagnostics: KpClaimSceneGraphDiagnostic[]
): ReadonlySet<string> {
  const ids = new Set<string>();

  values.forEach((value, index) => {
    if (ids.has(value.id)) {
      diagnostics.push({
        path: `${path}[${index}].id`,
        message: `Duplicate id ${value.id}.`
      });
    }
    ids.add(value.id);
  });

  return ids;
}

function requireId(
  id: string,
  ids: ReadonlySet<string>,
  path: string,
  diagnostics: KpClaimSceneGraphDiagnostic[]
): void {
  if (!ids.has(id)) {
    diagnostics.push({ path, message: `Unknown id ${id}.` });
  }
}
