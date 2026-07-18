import assert from "node:assert/strict";
import test from "node:test";
import { compileKpCrossViewAttentionPlan } from "../src/tutorial/cross-view-attention.ts";
import type { KpCrossViewCorrespondenceMap } from "../src/tutorial/cross-view-correspondence.ts";

const map = {
  id: "cross-view.ftc",
  members: [
    {
      id: "member.graph.strip",
      viewId: "view.graph",
      selectorId: "graph.added-strip",
      role: "finite area evidence"
    },
    {
      id: "member.equation.quotient",
      viewId: "view.equation",
      selectorId: "equation.difference-quotient",
      role: "symbolic ratio"
    }
  ],
  identities: [],
  correspondences: [
    {
      id: "correspondence.ftc.strip-to-quotient",
      sourceMemberId: "member.graph.strip",
      targetMemberId: "member.equation.quotient",
      kind: "evidence-to-claim",
      reversible: false,
      summary: "Carry attention from finite area evidence into its quotient."
    }
  ]
} satisfies KpCrossViewCorrespondenceMap;

test("cross-view attention compiles only authored directional correspondence", () => {
  const plan = compileKpCrossViewAttentionPlan({
    id: "attention.ftc.strip-to-quotient",
    map,
    correspondenceIds: ["correspondence.ftc.strip-to-quotient"]
  });

  assert.deepEqual(plan.salience.intents, [
    {
      id: "attention.ftc.strip-to-quotient.intent.0",
      kind: "transmit",
      sourceEntityIds: ["graph.added-strip"],
      targetEntityIds: ["equation.difference-quotient"],
      summary: "Carry attention from finite area evidence into its quotient."
    }
  ]);
  assert.deepEqual(plan.transmissions[0], {
    id: "attention.ftc.strip-to-quotient.transmission.0",
    correspondenceId: "correspondence.ftc.strip-to-quotient",
    salienceIntentId: "attention.ftc.strip-to-quotient.intent.0",
    releaseMemberId: "member.graph.strip",
    receiveMemberId: "member.equation.quotient"
  });
});

test("cross-view attention refuses to invent a missing correspondence", () => {
  assert.throws(
    () =>
      compileKpCrossViewAttentionPlan({
        id: "attention.ftc.missing",
        map,
        correspondenceIds: ["correspondence.ftc.missing"]
      }),
    /Unknown cross-view correspondence/
  );
});
