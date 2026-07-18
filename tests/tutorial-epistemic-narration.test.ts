import assert from "node:assert/strict";
import test from "node:test";
import type { KpTutorialClaimGraph } from "../src/tutorial/claim-scene-graphs.ts";
import {
  validateKpTutorialEpistemicNarration,
  type KpTutorialEpistemicNarration
} from "../src/tutorial/epistemic-narration.ts";

const claimGraph = {
  id: "claims.ftc",
  nodes: [
    {
      id: "claim.ftc.finite-strip",
      statement: "A finite strip approximates the area change.",
      evidenceIds: ["evidence.ftc.strip-bounds"]
    }
  ],
  edges: []
} satisfies KpTutorialClaimGraph;

function narration(): KpTutorialEpistemicNarration {
  return {
    id: "narration.ftc.finite-strip",
    claimId: "claim.ftc.finite-strip",
    text: "The strip gives bounded geometric evidence before the limiting step.",
    proofStatus: "intuition",
    scope: {
      generality: "generic",
      domain: "continuous real-valued functions on a closed interval",
      assumptions: ["f is continuous near x"]
    },
    validity: {
      status: "valid",
      explanation: "The displayed bounds follow from continuity on the strip."
    },
    provenance: [
      {
        id: "source.ftc.strip-bounds",
        kind: "derivation",
        label: "Finite strip upper and lower bounds"
      }
    ],
    uncertainty: {
      kind: "bounded",
      statement: "The finite strip is not yet the exact derivative identity."
    }
  };
}

test("epistemic narration keeps proof, scope, validity, provenance, and uncertainty separate", () => {
  assert.deepEqual(
    validateKpTutorialEpistemicNarration({
      claimGraph,
      narrations: [narration()]
    }),
    []
  );
});

test("generic narration requires assumptions and intentional errors cannot be formal", () => {
  const input = narration();
  const diagnostics = validateKpTutorialEpistemicNarration({
    claimGraph,
    narrations: [
      {
        ...input,
        proofStatus: "formal",
        scope: { ...input.scope, assumptions: [] },
        validity: {
          status: "intentional-invalid",
          explanation: "A deliberate misconception for contrast."
        }
      }
    ]
  });

  assert.deepEqual(
    diagnostics.map((diagnostic) => diagnostic.path),
    ["narrations[0]", "narrations[0].scope.assumptions"]
  );
});
