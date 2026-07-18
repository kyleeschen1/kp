import assert from "node:assert/strict";
import test from "node:test";
import {
  claimSceneNodes,
  validateKpClaimSceneGraphBundle,
  type KpClaimSceneGraphBundle
} from "../src/tutorial/claim-scene-graphs.ts";

function fixture(): KpClaimSceneGraphBundle {
  return {
    claimGraph: {
      id: "claims.ftc",
      nodes: [
        { id: "claim.area", statement: "A accumulates area.", evidenceIds: [] },
        {
          id: "claim.derivative",
          statement: "A prime equals f.",
          evidenceIds: ["evidence.strip"]
        }
      ],
      edges: [
        {
          id: "claim-edge.strip",
          sourceClaimId: "claim.derivative",
          targetClaimId: "claim.area",
          relation: "evidenced-by"
        }
      ]
    },
    sceneGraph: {
      id: "scene.ftc",
      nodes: [
        { id: "scene-node.graph", kind: "view" },
        {
          id: "scene-node.strip",
          kind: "semantic-object",
          semanticObjectId: "region.added-strip"
        },
        { id: "scene-node.decorative", kind: "annotation" }
      ],
      edges: [
        {
          id: "scene-edge.strip",
          parentNodeId: "scene-node.graph",
          childNodeId: "scene-node.strip"
        },
        {
          id: "scene-edge.decorative",
          parentNodeId: "scene-node.graph",
          childNodeId: "scene-node.decorative"
        }
      ]
    },
    bindings: [
      {
        id: "binding.derivative.strip",
        claimId: "claim.derivative",
        sceneNodeIds: ["scene-node.strip"],
        role: "evidence"
      }
    ]
  };
}

test("claim-to-scene bindings are explicit and ignore nearby render nodes", () => {
  const bundle = fixture();

  assert.deepEqual(validateKpClaimSceneGraphBundle(bundle), []);
  assert.deepEqual(
    claimSceneNodes(bundle, "claim.derivative").map((node) => node.id),
    ["scene-node.strip"]
  );
});

test("claim and scene graphs validate their references independently", () => {
  const bundle = fixture();
  const diagnostics = validateKpClaimSceneGraphBundle({
    ...bundle,
    claimGraph: {
      ...bundle.claimGraph,
      edges: [
        {
          ...bundle.claimGraph.edges[0]!,
          targetClaimId: "claim.missing"
        }
      ]
    },
    sceneGraph: {
      ...bundle.sceneGraph,
      edges: [
        {
          ...bundle.sceneGraph.edges[0]!,
          childNodeId: "scene-node.missing"
        }
      ]
    }
  });

  assert.deepEqual(
    diagnostics.map((diagnostic) => diagnostic.path),
    [
      "claimGraph.edges[0].targetClaimId",
      "sceneGraph.edges[0].childNodeId"
    ]
  );
});
