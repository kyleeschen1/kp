import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  validateKpAssetBundle,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  validateKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  validateCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRelationId
} from "./correspondence.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageEdge,
  type KpSemanticLineageGraph
} from "./semantic-lineage-graph.ts";
import type {
  KpPythonRefactorSemanticArtifactV1,
  KpPythonSemanticEntity
} from "./python-refactor-semantic-model.ts";

export interface KpPythonRefactorOperationSet {
  readonly id: "operations.python.free-shipping-threshold";
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly lineage: KpSemanticLineageGraph;
}

export function createKpPythonRefactorOperationSet(
  semantics: KpPythonRefactorSemanticArtifactV1
): KpPythonRefactorOperationSet {
  const bundle = createKpAssetBundle({
    id: "asset.python.free-shipping-threshold",
    title: "Extract one free-shipping rule in Python",
    objects: semantics.revisions.map((revision) =>
      createKpSemanticAssetObject({
        id: objectId(revision.revision),
        objectType: "python-source-revision",
        title: revision.revision === "before" ? "Duplicated rule" : "Extracted rule",
        value: revision,
        selectors: revision.entities.map((entity) => ({
          id: selectorId(entity.id),
          kind: `python-${entity.kind}`,
          label: entity.label,
          metadata: {
            semanticEntityId: entity.id,
            revision: entity.revision,
            startOffset: entity.sourceRange.startOffset,
            endOffset: entity.sourceRange.endOffset
          }
        })),
        provenance: {
          kind: revision.revision === "before" ? "authored" : "transformed",
          sourceIds: revision.revision === "before"
            ? [semantics.contractId]
            : ["program.before"],
          ...(revision.revision === "after"
            ? { transformationId: "transform.python.recompose-program" }
            : {}),
          summary: "Build-time Python AST supplies identity and source ranges; paint does not."
        }
      })
    )
  });
  const transformations = Object.freeze([
    transformation(
      "transform.python.extract-shared-rule",
      "extractSharedRule",
      "Extract the shared threshold rule",
      map("correspondence.python.extract-shared-rule", [
        record("merge-duplicate-rules", "fan-in", [
          "rule.shipping-cost.before",
          "rule.shipping-message.before"
        ], ["rule.qualifies.after"], "Both duplicate decisions derive the one helper rule."),
        record("introduce-helper", "introduction", [], [
          "function.qualifies.after"
        ], "The named helper is introduced as the single owner of the decision.")
      ]),
      ["structure", "value", "role"]
    ),
    transformation(
      "transform.python.replace-cost-call",
      "replaceWithNamedRuleCall",
      "Replace the price rule with a helper call",
      map("correspondence.python.replace-cost-call", [
        record("cost-function-persists", "identity", [
          "function.shipping-cost.before"
        ], ["function.shipping-cost.after"], "The price function persists."),
        record("cost-rule-becomes-call", "role-change", [
          "rule.shipping-cost.before"
        ], ["call.shipping-cost.after"], "The inline decision becomes a call to its named owner.")
      ]),
      ["identity", "structure", "value"]
    ),
    transformation(
      "transform.python.replace-message-call",
      "replaceWithNamedRuleCall",
      "Replace the message rule with a helper call",
      map("correspondence.python.replace-message-call", [
        record("message-function-persists", "identity", [
          "function.shipping-message.before"
        ], ["function.shipping-message.after"], "The message function persists."),
        record("message-rule-becomes-call", "role-change", [
          "rule.shipping-message.before"
        ], ["call.shipping-message.after"], "The inline decision becomes a call to its named owner.")
      ]),
      ["identity", "structure", "value"]
    ),
    transformation(
      "transform.python.recompose-program",
      "recomposeSourceRevision",
      "Settle the refactored program",
      map("correspondence.python.recompose-program", [
        record("program-succeeds-program", "role-change", ["program.before"], [
          "program.after"
        ], "The after revision succeeds the before revision under the refactor contract.")
      ]),
      ["value", "role"]
    )
  ]);
  const lineage = createKpSemanticLineageGraph({
    id: "lineage.python.free-shipping-threshold",
    sourceEntityIds: entityIds(semantics, "before"),
    targetEntityIds: entityIds(semantics, "after"),
    edges: [
      lineageEdge("program-succeeds", "representation-succession", ["program.before"], ["program.after"], "The refactored source is the next representation of the same program.", semantics.contractId),
      lineageEdge("cost-function-persists", "persist", ["function.shipping-cost.before"], ["function.shipping-cost.after"], "The price function keeps its role."),
      lineageEdge("message-function-persists", "persist", ["function.shipping-message.before"], ["function.shipping-message.after"], "The message function keeps its role."),
      lineageEdge("duplicate-rules-merge", "merge", ["rule.shipping-cost.before", "rule.shipping-message.before"], ["rule.qualifies.after"], "Two copies of one decision merge into the helper's rule."),
      lineageEdge("helper-introduced", "introduction", [], ["function.qualifies.after"], "The named helper is introduced."),
      lineageEdge("cost-call-introduced", "introduction", [], ["call.shipping-cost.after"], "The price caller now asks the helper."),
      lineageEdge("message-call-introduced", "introduction", [], ["call.shipping-message.after"], "The message caller now asks the helper.")
    ]
  });

  assertValid(bundle, transformations);
  return Object.freeze({
    id: "operations.python.free-shipping-threshold",
    bundle,
    transformations,
    lineage
  });
}

export function kpPythonRefactorSelectorId(entityId: string): string {
  return selectorId(entityId);
}

export function findKpPythonSemanticEntity(
  operations: KpPythonRefactorOperationSet,
  entityId: string
): KpPythonSemanticEntity | undefined {
  return operations.bundle.objects
    .flatMap(({ value }) =>
      (value as KpPythonRefactorSemanticArtifactV1["revisions"][number]).entities
    )
    .find(({ id }) => id === entityId);
}

function transformation(
  id: string,
  transformType: string,
  title: string,
  correspondenceMap: CorrespondenceMap,
  preserves: KpSemanticTransformation["preserves"]
): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id,
    definitionId: `definition.python.${transformType}`,
    transformType,
    title,
    sourceObjectIds: [objectId("before")],
    targetObjectIds: [objectId("after")],
    preserves,
    correspondenceMap,
    lawRefs: [{ id: "kp.python.ast-derived-identity", level: "strict" }]
  });
}

function map(id: string, records: CorrespondenceMap["records"]): CorrespondenceMap {
  return { id, records };
}

function record(
  id: string,
  relation: SelectorCorrespondenceRelationId,
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  summary: string
): CorrespondenceMap["records"][number] {
  return {
    id,
    relation,
    sourceSelectorIds: sourceEntityIds.map(selectorId),
    targetSelectorIds: targetEntityIds.map(selectorId),
    summary
  };
}

function lineageEdge(
  id: string,
  relation: KpSemanticLineageEdge["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  summary: string,
  representationAuthorityId?: string
): KpSemanticLineageEdge {
  return {
    id,
    relation,
    sourceEntityIds,
    targetEntityIds,
    summary,
    ...(representationAuthorityId === undefined ? {} : { representationAuthorityId })
  };
}

function selectorId(entityId: string): string {
  return `selector.python.${entityId}`;
}

function objectId(revision: "before" | "after"): string {
  return `object.python.${revision}`;
}

function entityIds(
  semantics: KpPythonRefactorSemanticArtifactV1,
  revision: "before" | "after"
): readonly string[] {
  return semantics.revisions.find((candidate) => candidate.revision === revision)
    ?.entities.map(({ id }) => id) ?? [];
}

function assertValid(
  bundle: KpAssetBundle,
  transformations: readonly KpSemanticTransformation[]
): void {
  const issues = [
    ...validateKpAssetBundle(bundle),
    ...transformations.flatMap((candidate) => [
      ...validateKpSemanticTransformation(candidate, bundle),
      ...(candidate.correspondenceMap === undefined
        ? []
        : validateCorrespondenceMap(candidate.correspondenceMap))
    ])
  ];
  if (issues.length > 0) throw new Error(issues[0]!.message);
}
