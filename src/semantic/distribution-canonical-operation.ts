import type { KpSemanticTransformation } from "./asset-transformation.ts";
import {
  createKpCanonicalOperationSpec,
  type KpCanonicalOperationSpec
} from "./canonical-operation-spec.ts";
import {
  executeKpCanonicalOperationBinding,
  type KpCanonicalOperationExecutionResult,
  type KpCanonicalOperationRoleBindings
} from "./transformation-definition-binding.ts";

export const kpDistributionCanonicalOperationSpec: KpCanonicalOperationSpec =
  createKpCanonicalOperationSpec({
    id: "kp.algebra.distribute-multiplication.v1",
    pack: { packId: "kp.algebra", version: "0.1.0" },
    canonicalOperationId: "kp.algebra.distribute-multiplication",
    title: "Distribute multiplication over a sum",
    summary:
      "Copy one common factor to each addend while addends and connectors persist and grouping artifacts leave.",
    roles: [
      role("common-factor", "source", "semantic-entity", "exactly-one"),
      role("source-addends", "source", "semantic-entity", "one-or-more"),
      role("source-connectors", "source", "semantic-entity", "one-or-more"),
      role("grouping-artifacts", "source", "structural-artifact", "one-or-more"),
      role("factor-copies", "target", "semantic-entity", "one-or-more"),
      role("distributed-addends", "target", "semantic-entity", "one-or-more"),
      role("target-connectors", "target", "semantic-entity", "one-or-more")
    ],
    sourcePattern: {
      id: "distribution.source.product-over-sum",
      rootRoleId: "common-factor",
      requiredRoleIds: [
        "common-factor",
        "source-addends",
        "source-connectors",
        "grouping-artifacts"
      ],
      summary: "A common factor multiplies a grouped sum with explicit addends and connectors."
    },
    targetPattern: {
      id: "distribution.target.sum-of-products",
      rootRoleId: "factor-copies",
      requiredRoleIds: [
        "factor-copies",
        "distributed-addends",
        "target-connectors"
      ],
      summary: "One factor copy is adjacent to each persistent addend in an ungrouped sum."
    },
    invariants: [
      {
        id: "distribution.factor-copy-count",
        kind: "postcondition",
        roleIds: ["source-addends", "factor-copies"],
        summary: "The number of factor copies equals the number of addends."
      },
      {
        id: "distribution.addends-persist",
        kind: "preservation",
        roleIds: ["source-addends", "distributed-addends"],
        summary: "Every addend retains semantic identity and order."
      },
      {
        id: "distribution.connectors-persist",
        kind: "preservation",
        roleIds: ["source-connectors", "target-connectors"],
        summary: "The sum connectors retain their semantic identity and order."
      }
    ],
    lineage: [
      {
        id: "factor-fans-out",
        relation: "fan-out",
        sourceRoleIds: ["common-factor"],
        targetRoleIds: ["factor-copies"],
        summary: "The common factor causes one lineage-bearing copy per addend."
      },
      {
        id: "addends-persist",
        relation: "identity",
        mapping: "pairwise",
        sourceRoleIds: ["source-addends"],
        targetRoleIds: ["distributed-addends"],
        summary: "Each addend moves into its product without replacement."
      },
      {
        id: "connectors-persist",
        relation: "identity",
        mapping: "pairwise",
        sourceRoleIds: ["source-connectors"],
        targetRoleIds: ["target-connectors"],
        summary: "Each connector persists between the distributed products."
      },
      {
        id: "grouping-exits",
        relation: "artifact",
        sourceRoleIds: ["grouping-artifacts"],
        targetRoleIds: [],
        summary: "Grouping artifacts leave only after addends have reserved product positions."
      }
    ],
    motif: [
      motif("contract-factor", "copy", "contract-source", ["common-factor"], ["factor-copies"]),
      motif("branch-factor-copies", "copy", "branch-descendants", ["common-factor"], ["factor-copies"]),
      motif("move-addends", "shift", "transit-descendants", ["source-addends"], ["distributed-addends"]),
      motif("transit-factor-copies", "copy", "transit-descendants", ["common-factor"], ["factor-copies"]),
      motif("remove-grouping", "vanish", "arrive-descendants", ["grouping-artifacts"], []),
      motif("settle-products", "shift", "settle-descendants", ["source-addends"], ["factor-copies", "distributed-addends"])
    ],
    examples: [
      {
        id: "distribution.binary-sum",
        kind: "positive",
        roleBindings: {
          "common-factor": "a",
          "source-addends": ["b", "c"],
          "source-connectors": ["+"],
          "grouping-artifacts": ["(", ")"],
          "factor-copies": ["a.left", "a.right"],
          "distributed-addends": ["b", "c"],
          "target-connectors": ["+"]
        },
        expected: "accepted",
        summary: "a(b+c) becomes ab+ac with two factor descendants."
      },
      {
        id: "distribution.missing-factor-copy",
        kind: "counterexample",
        roleBindings: {
          "common-factor": "a",
          "source-addends": ["b", "c"],
          "source-connectors": ["+"],
          "grouping-artifacts": ["(", ")"],
          "factor-copies": ["a.left"],
          "distributed-addends": ["b", "c"],
          "target-connectors": ["+"]
        },
        expected: "rejected",
        summary: "ab+c is not a complete distribution because c lacks a factor descendant."
      }
    ],
    rewind: {
      operationId: "kp.algebra.factor-common-term",
      preservesPhaseIds: [
        "contract-source",
        "branch-descendants",
        "transit-descendants",
        "arrive-descendants",
        "settle-descendants"
      ]
    },
    accessibility: (["full-motion", "reduced-motion", "static", "narrated"] as const).map(
      (mode) => ({
        mode,
        preservesPhaseIds: [
          "contract-source",
          "branch-descendants",
          "transit-descendants",
          "arrive-descendants",
          "settle-descendants"
        ],
        summary: `${mode} preserves factor-copy causality, addend persistence, and product settlement.`
      })
    )
  });

export function executeKpDistributionCanonicalOperation(input: {
  readonly transformation: KpSemanticTransformation;
  readonly roleBindings: KpCanonicalOperationRoleBindings;
}): KpCanonicalOperationExecutionResult {
  const addendCount = bindingCount(input.roleBindings["source-addends"]);
  const distributedAddendCount = bindingCount(
    input.roleBindings["distributed-addends"]
  );
  const factorCopyCount = bindingCount(input.roleBindings["factor-copies"]);
  const sourceConnectorCount = bindingCount(input.roleBindings["source-connectors"]);
  const targetConnectorCount = bindingCount(input.roleBindings["target-connectors"]);
  if (addendCount < 2) {
    throw new Error("Distribution requires at least two addends.");
  }
  if (
    addendCount !== distributedAddendCount ||
    addendCount !== factorCopyCount
  ) {
    throw new Error(
      `Distribution requires one persistent addend and factor copy per source addend; ` +
      `received ${addendCount}:${distributedAddendCount}:${factorCopyCount}.`
    );
  }
  if (
    sourceConnectorCount !== targetConnectorCount ||
    sourceConnectorCount !== Math.max(0, addendCount - 1)
  ) {
    throw new Error(
      `Distribution requires one persistent connector between adjacent addends; ` +
      `received ${sourceConnectorCount}:${targetConnectorCount} for ${addendCount} addends.`
    );
  }
  return executeKpCanonicalOperationBinding({
    transformation: input.transformation,
    operationSpec: kpDistributionCanonicalOperationSpec,
    roleBindings: input.roleBindings
  });
}

function role(
  id: string,
  endpoint: "source" | "target",
  kind: "semantic-entity" | "structural-artifact",
  cardinality: "exactly-one" | "one-or-more"
) {
  return { id, endpoint, kind, cardinality, summary: `${endpoint} ${id}.` } as const;
}

function motif(
  id: string,
  primitiveId: string,
  phaseId: string,
  sourceRoleIds: readonly string[],
  targetRoleIds: readonly string[]
) {
  return {
    id,
    primitiveId,
    phaseId,
    sourceRoleIds,
    targetRoleIds,
    summary: `${phaseId} advances ${id}.`
  };
}

function bindingCount(binding: string | readonly string[] | undefined): number {
  return binding === undefined ? 0 : typeof binding === "string" ? 1 : binding.length;
}
