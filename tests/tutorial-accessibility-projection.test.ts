import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpTutorialAccessibilityFamily,
  validateKpTutorialAccessibilityFamily
} from "../src/tutorial/accessibility-projection.ts";

test("all tutorial accessibility modes preserve causal explanatory structure", () => {
  const family = compileKpTutorialAccessibilityFamily({
    id: "accessibility.ftc",
    claimIds: ["claim.whole", "claim.strip", "claim.reintegrate"],
    checkpointIds: ["checkpoint.whole", "checkpoint.strip", "checkpoint.reintegrate"],
    semanticIdentityIds: ["identity.upper-bound"],
    evidenceIds: ["evidence.strip-bounds"],
    narrationIds: ["narration.whole", "narration.strip", "narration.reintegrate"]
  });

  assert.equal(family.projections.length, 8);
  assert.deepEqual(validateKpTutorialAccessibilityFamily(family), []);
  assert.deepEqual(
    family.projections.map(({ kind }) => kind),
    [
      "full",
      "reduced",
      "static",
      "narrated",
      "high-contrast",
      "no-depth",
      "keyboard",
      "rewind"
    ]
  );
});

test("an accessibility projection cannot remove evidence or narration meaning", () => {
  const family = compileKpTutorialAccessibilityFamily({
    id: "accessibility.ftc",
    claimIds: ["claim.ftc"],
    checkpointIds: ["checkpoint.ftc"],
    semanticIdentityIds: ["identity.ftc"],
    evidenceIds: ["evidence.ftc"],
    narrationIds: ["narration.ftc"]
  });
  const projections = family.projections.map((projection) =>
    projection.kind === "static" ? { ...projection, evidenceIds: [] } : projection
  );

  assert.equal(
    validateKpTutorialAccessibilityFamily({ ...family, projections })[0]?.path,
    "projections[2].evidenceIds"
  );
});
