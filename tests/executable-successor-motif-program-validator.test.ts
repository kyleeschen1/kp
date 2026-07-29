import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpExecutableSuccessorMotifProgramDraft
} from "../src/animation/motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram,
  validateAndMintKpExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program-validator.ts";

function commonProgramFields() {
  return {
    schemaVersion: "kp.executable-successor-motif-program.v1",
    programVersion: "1.0.0",
    context: {
      policy: "preserve-unclaimed-context",
      role: "continuant-context"
    },
    accessibility: {
      narration: "semantic-phase-and-role-summary",
      reducedMotion: "native-checkpoints-with-phase-summary"
    },
    rewind: {
      policy: "exact-phase-reversal",
      restores: "source-roles-lineage-and-context"
    },
    continuity: {
      minimumVisibleInk: "motif-specific",
      intentionalVanish: "forbidden",
      endpointSettlement: "exact-native-source-and-target"
    }
  } as const;
}

function evaluationDraft(): KpExecutableSuccessorMotifProgramDraft {
  return {
    ...commonProgramFields(),
    id: "kp.motif.operation-evaluation.v1",
    kind: "operation-evaluation",
    allowedRoles: [
      "material-input",
      "causal-catalyst",
      "result-material",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-contributors",
        effect: "orient",
        requiredRoles: [
          "material-input",
          "causal-catalyst",
          "continuant-context"
        ]
      },
      {
        id: "gather-contributors",
        effect: "converge",
        requiredRoles: ["material-input", "causal-catalyst"]
      },
      {
        id: "recognize-result",
        effect: "recognize-result",
        requiredRoles: [
          "material-input",
          "causal-catalyst",
          "result-material"
        ]
      },
      {
        id: "settle-result",
        effect: "settle",
        requiredRoles: ["result-material", "continuant-context"]
      }
    ],
    lineage: {
      material: "many-inputs-to-one-result",
      catalyst: "participates-without-result-lineage",
      context: "identity-preserving"
    }
  };
}

function fissionDraft(): KpExecutableSuccessorMotifProgramDraft {
  return {
    ...commonProgramFields(),
    id: "kp.motif.identity-fission.v1",
    kind: "identity-fission",
    allowedRoles: [
      "source-identity",
      "descendant-identity",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-source-identity",
        effect: "orient",
        requiredRoles: ["source-identity", "continuant-context"]
      },
      {
        id: "branch-identity",
        effect: "branch-identity",
        requiredRoles: ["source-identity", "descendant-identity"]
      },
      {
        id: "establish-descendants",
        effect: "establish-descendants",
        requiredRoles: ["descendant-identity"]
      },
      {
        id: "settle-descendants",
        effect: "settle",
        requiredRoles: ["descendant-identity", "continuant-context"]
      }
    ],
    lineage: {
      identity: "one-source-to-many-exact-descendants",
      descendantCardinality: "two-or-more",
      context: "identity-preserving"
    }
  };
}

function fusionDraft(): KpExecutableSuccessorMotifProgramDraft {
  return {
    ...commonProgramFields(),
    id: "kp.motif.identity-fusion.v1",
    kind: "identity-fusion",
    allowedRoles: [
      "contributor-identity",
      "result-identity",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-contributor-identities",
        effect: "orient",
        requiredRoles: ["contributor-identity", "continuant-context"]
      },
      {
        id: "gather-identities",
        effect: "gather-identities",
        requiredRoles: ["contributor-identity", "result-identity"]
      },
      {
        id: "establish-ancestor",
        effect: "establish-ancestor",
        requiredRoles: ["contributor-identity", "result-identity"]
      },
      {
        id: "settle-ancestor",
        effect: "settle",
        requiredRoles: ["result-identity", "continuant-context"]
      }
    ],
    lineage: {
      identity: "many-contributors-to-one-exact-ancestor",
      contributorCardinality: "two-or-more",
      context: "identity-preserving"
    }
  };
}

test("trusted validator mints immutable nominal programs for all variants", () => {
  for (const draft of [evaluationDraft(), fissionDraft(), fusionDraft()]) {
    const result = validateAndMintKpExecutableSuccessorMotifProgram({ draft });
    assert.equal(result.status, "verified");
    if (result.status !== "verified") continue;
    assert.equal(isKpVerifiedExecutableSuccessorMotifProgram(result.program), true);
    assert.equal(Object.isFrozen(result.program), true);
    assert.equal(Object.isFrozen(result.program.phases), true);
    assert.equal(Object.isFrozen(result.program.phases[0]?.requiredRoles), true);
  }
});

test("structurally forged and serialized programs have no runtime authority", () => {
  const draft = evaluationDraft();
  assert.equal(isKpVerifiedExecutableSuccessorMotifProgram(draft), false);
  const result = validateAndMintKpExecutableSuccessorMotifProgram({ draft });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  const clone = JSON.parse(JSON.stringify(result.program));
  assert.equal(isKpVerifiedExecutableSuccessorMotifProgram(clone), false);
});

test("validator rejects partial, missing, duplicated, and reordered phases", () => {
  const draft = evaluationDraft();
  const partial = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: { ...draft, phases: draft.phases.slice(0, 2) }
  });
  assert.equal(partial.status, "invalid");
  if (partial.status === "invalid") {
    assert.ok(partial.issues.some(({ code }) => code === "phase.missing"));
  }

  const duplicate = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      ...draft,
      phases: [draft.phases[0], draft.phases[0], ...draft.phases.slice(2)]
    }
  });
  assert.equal(duplicate.status, "invalid");
  if (duplicate.status === "invalid") {
    assert.ok(duplicate.issues.some(({ code }) => code === "phase.duplicate"));
  }

  const reordered = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      ...draft,
      phases: [
        draft.phases[1],
        draft.phases[0],
        draft.phases[2],
        draft.phases[3]
      ]
    }
  });
  assert.equal(reordered.status, "invalid");
  if (reordered.status === "invalid") {
    assert.ok(reordered.issues.some(({ code }) => code === "phase.order"));
  }
});

test("validator rejects missing, duplicate, and foreign semantic roles", () => {
  const draft = evaluationDraft();
  const result = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      ...draft,
      allowedRoles: [
        "material-input",
        "material-input",
        "invented-render-role"
      ]
    }
  });
  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.ok(result.issues.some(({ code }) => code === "role.missing"));
  assert.ok(result.issues.some(({ code }) => code === "role.duplicate"));
  assert.ok(result.issues.some(({ code }) => code === "role.foreign"));
});

test("validator rejects illegal lineage and presentation-authority fields", () => {
  const draft = fissionDraft();
  const result = validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      ...draft,
      durationMs: 700,
      lineage: {
        ...draft.lineage,
        descendantCardinality: "one"
      },
      phases: draft.phases.map((phase, index) => index === 1
        ? { ...phase, path: "arc-from-source-box" }
        : phase)
    }
  });
  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.ok(result.issues.some(({ code }) => code === "lineage.invalid"));
  assert.ok(result.issues.some(({ code, path }) =>
    code === "authority.forbidden" && path === "durationMs"
  ));
  assert.ok(result.issues.some(({ code, path }) =>
    code === "authority.forbidden" && path === "phases.1.path"
  ));
});

test("validation uses semantic structure and never rendered glyph text", () => {
  const source = validateAndMintKpExecutableSuccessorMotifProgram.toString();
  for (const forbidden of [
    "getBoundingClientRect",
    "querySelector",
    "textContent",
    "innerHTML",
    "fontFamily"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
