import assert from "node:assert/strict";
import test from "node:test";
import {
  validateKpCrossViewCorrespondenceMap,
  type KpCrossViewCorrespondenceMap
} from "../src/tutorial/cross-view-correspondence.ts";

function fixture(): KpCrossViewCorrespondenceMap {
  return {
    id: "cross-view.ftc",
    members: [
      {
        id: "member.graph.x",
        viewId: "view.ftc.graph",
        selectorId: "graph.ftc.upper-bound",
        role: "evaluation point"
      },
      {
        id: "member.equation.x",
        viewId: "view.ftc.equation",
        selectorId: "equation.ftc.upper-bound",
        role: "integral upper bound"
      }
    ],
    identities: [
      {
        id: "identity.ftc.x",
        meaning: "The same chosen upper bound x.",
        memberIds: ["member.graph.x", "member.equation.x"]
      }
    ],
    correspondences: [
      {
        id: "correspondence.ftc.graph-x-to-equation-x",
        sourceMemberId: "member.graph.x",
        targetMemberId: "member.equation.x",
        kind: "representation-to-representation",
        reversible: true,
        summary: "Transmit attention from the moving boundary into the notation."
      }
    ]
  };
}

test("cross-view identity and directional correspondence remain distinct", () => {
  const map = fixture();

  assert.deepEqual(validateKpCrossViewCorrespondenceMap(map), []);
  assert.deepEqual(map.identities[0]?.memberIds, [
    "member.graph.x",
    "member.equation.x"
  ]);
  assert.equal(map.correspondences[0]?.sourceMemberId, "member.graph.x");
});

test("cross-view identity rejects ambiguous semantic ownership", () => {
  const map = fixture();
  const diagnostics = validateKpCrossViewCorrespondenceMap({
    ...map,
    identities: [
      ...map.identities,
      {
        id: "identity.ftc.other-x",
        meaning: "Ambiguous identity",
        memberIds: ["member.graph.x"]
      }
    ]
  });

  assert.equal(diagnostics[0]?.path, "identities[1].memberIds[0]");
  assert.match(diagnostics[0]?.message ?? "", /already belongs/);
});
