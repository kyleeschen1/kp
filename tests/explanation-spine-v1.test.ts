import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpExplanationSpineV1,
  validateKpExplanationSpineV1,
  type KpExplanationSpineV1,
  type KpExplanationVerifiedClaimAuthorityV1
} from "../src/tutorial/explanation-spine-v1.ts";

const instanceId = "instance.generated.linear-solve.linear-abc12345";

test("ExplanationSpineV1 accepts one deterministic claim-grounded solve structure", () => {
  const spine = createKpExplanationSpineV1({
    spine: canonicalSpine(),
    claimAuthority: claimAuthority()
  });
  assert.deepEqual(spine.sections.map(({ kind }) => kind), [
    "orientation",
    "subtract",
    "divide",
    "solution"
  ]);
  assert.deepEqual(
    spine.sections.flatMap(({ beatIds }) => beatIds),
    spine.beats.map(({ id }) => id)
  );
  assert.equal(
    spine.beats.every(({ claimRefs }) => claimRefs.length > 0),
    true
  );
  assert.equal(Object.isFrozen(spine.beats[0]?.claimRefs), true);
});

test("spine rejects unknown claims, unsupported vocabulary, and mismatched source authority", () => {
  const spine = canonicalSpine();
  const rejected = {
    ...spine,
    beats: spine.beats.map((beat, index) => index === 2
      ? {
          ...beat,
          claimRefs: ["claim.unknown"],
          vocabularyRefs: ["unknown", "unapproved-term"],
          sourceOperationRef: "operation.unverified"
        }
      : beat)
  } as KpExplanationSpineV1;
  const diagnostics = validateKpExplanationSpineV1({
    spine: rejected,
    claimAuthority: claimAuthority()
  });
  assert.equal(
    diagnostics.some(({ code }) => code === "claim-authority"),
    true
  );
  assert.equal(
    diagnostics.some(({ code }) => code === "vocabulary"),
    true
  );
  assert.equal(
    diagnostics.some(({ code }) => code === "source-authority"),
    true
  );
});

test("spine rejects section drift, beat reordering, and duplicate ownership", () => {
  const spine = canonicalSpine();
  const diagnostics = validateKpExplanationSpineV1({
    spine: {
      ...spine,
      sections: [
        spine.sections[1]!,
        spine.sections[0]!,
        spine.sections[2]!,
        {
          ...spine.sections[3]!,
          beatIds: [
            ...spine.sections[3]!.beatIds,
            spine.sections[0]!.beatIds[0]!
          ]
        }
      ],
      beats: [...spine.beats].reverse()
    },
    claimAuthority: claimAuthority()
  });
  assert.equal(
    diagnostics.some(({ code }) => code === "section-order"),
    true
  );
  assert.equal(
    diagnostics.some(({ code }) => code === "beat-order"),
    true
  );
  assert.equal(
    diagnostics.some(({ code }) => code === "duplicate-id"),
    true
  );
});

test("spine rejects raw prose, latex, visual recipes, and renderer fields", () => {
  const spine = canonicalSpine();
  const diagnostics = validateKpExplanationSpineV1({
    spine: {
      ...spine,
      prose: "Move the three across.",
      beats: spine.beats.map((beat, index) => index === 0
        ? {
            ...beat,
            latex: "x=5/2",
            geometry: { x: 1 },
            renderer: "custom"
          }
        : beat)
    } as KpExplanationSpineV1,
    claimAuthority: claimAuthority()
  });
  assert.deepEqual(
    diagnostics
      .filter(({ code }) => code === "unknown-field")
      .map(({ path }) => path),
    ["$.prose", "$.beats[0].latex", "$.beats[0].geometry", "$.beats[0].renderer"]
  );

  const source = readFileSync(new URL(
    "../src/tutorial/explanation-spine-v1.ts",
    import.meta.url
  ), "utf8");
  assert.equal(source.includes('from "../rendering/'), false);
  assert.equal(source.includes('from "../animation/'), false);
});

test("spine rejects learner-state and vocabulary contract drift", () => {
  const spine = canonicalSpine();
  const diagnostics = validateKpExplanationSpineV1({
    spine: {
      ...spine,
      learnerState: {
        ...spine.learnerState,
        detail: "personalized",
        assumedConceptIds: ["calculus"]
      },
      vocabulary: {
        ...spine.vocabulary,
        cueWordLimit: 100,
        introduced: ["equal"],
        familiar: [...spine.vocabulary.familiar, "equal"]
      }
    } as KpExplanationSpineV1,
    claimAuthority: claimAuthority()
  });
  assert.equal(
    diagnostics.some(({ code }) => code === "learner-state"),
    true
  );
  assert.equal(
    diagnostics.some(({ code }) => code === "vocabulary"),
    true
  );
});

function canonicalSpine(): KpExplanationSpineV1 {
  const beats: KpExplanationSpineV1["beats"] = [
    beat("goal", "goal", "solve.goal.variable-alone", ["claim.initial"], ["unknown", "variable-alone"], { sourceFrameRef: "frame.initial" }),
    beat("invariant", "invariant", "solve.invariant.same-change", ["claim.subtract-operation"], ["both-sides", "same-change", "equal"], { sourceOperationRef: "operation.step.1" }),
    beat("subtract-action", "action", "solve.action.subtract-both-sides", ["claim.subtract-operation"], ["subtract", "both-sides"], { sourceOperationRef: "operation.step.1" }),
    beat("additive-cancel", "mechanism", "solve.mechanism.additive-cancellation", ["claim.subtract-operation"], ["plus", "minus", "undo"], { sourceOperationRef: "operation.step.1" }),
    beat("subtract-checkpoint", "checkpoint", "solve.checkpoint.subtraction", ["claim.after-subtract"], ["equal"], { sourceFrameRef: "frame.step.1" }),
    beat("divide-action", "action", "solve.action.divide-both-sides", ["claim.divide-operation"], ["divide", "both-sides"], { sourceOperationRef: "operation.step.2" }),
    beat("multiplicative-cancel", "mechanism", "solve.mechanism.multiplicative-cancellation", ["claim.divide-operation"], ["divide", "undo"], { sourceOperationRef: "operation.step.2" }),
    beat("solution", "payoff", "solve.payoff.verified-solution", ["claim.solution"], ["unknown", "equal"], { sourceFrameRef: "frame.step.2" })
  ];
  return {
    schemaVersion: "kp.explanation-spine.v1",
    id: "spine.generated.linear-solve.linear-abc12345",
    instanceId,
    sourceTraceId: "trace.linear-abc12345",
    learnerState: {
      schemaVersion: "kp.explanation-learner-state.v1",
      id: "learner-state.early-algebra.standard",
      level: "early-algebra-foundation",
      detail: "standard",
      assumedConceptIds: [
        "whole-number-arithmetic",
        "operation-symbols",
        "equals-means-equal",
        "letter-as-unknown"
      ],
      targetConceptIds: [
        "undo-in-useful-order",
        "same-change-keeps-equality"
      ]
    },
    vocabulary: {
      schemaVersion: "kp.explanation-vocabulary.v1",
      id: "vocabulary.early-algebra.solve.standard",
      familiar: [
        "both-sides",
        "divide",
        "equal",
        "equals-sign",
        "minus",
        "number",
        "plus",
        "subtract",
        "unknown"
      ],
      introduced: ["same-change", "undo", "variable-alone"],
      blocked: [
        "additive-term",
        "inverse-operation",
        "isolate-variable",
        "preserve-equality",
        "verify-by-substitution"
      ],
      notationReadings: [
        "equals.as-equal-to",
        "fraction.as-divided-by",
        "variable.as-unknown"
      ],
      cueWordLimit: 12,
      sentenceShape: "one-clause"
    },
    sections: [
      section("orientation", ["goal", "invariant"]),
      section("subtract", ["subtract-action", "additive-cancel", "subtract-checkpoint"]),
      section("divide", ["divide-action", "multiplicative-cancel"]),
      section("solution", ["solution"])
    ],
    beats
  };
}

function claimAuthority(): KpExplanationVerifiedClaimAuthorityV1 {
  return {
    schemaVersion: "kp.explanation-verified-claim-authority.v1",
    instanceId,
    claims: [
      claim("claim.initial", "equation-frame", "frame.initial"),
      claim("claim.subtract-operation", "equivalence-operation", "operation.step.1"),
      claim("claim.after-subtract", "equation-frame", "frame.step.1"),
      claim("claim.divide-operation", "equivalence-operation", "operation.step.2"),
      claim("claim.solution", "solution", "frame.step.2")
    ]
  };
}

function claim(
  id: string,
  kind: KpExplanationVerifiedClaimAuthorityV1["claims"][number]["kind"],
  sourceRefId: string
) {
  return {
    id,
    instanceId,
    kind,
    sourceRefId,
    verification: "provider-verified" as const
  };
}

function section(
  kind: KpExplanationSpineV1["sections"][number]["kind"],
  beatIds: readonly string[]
) {
  return {
    id: `section.${kind}`,
    kind,
    beatIds: beatIds.map((id) => `beat.${id}`)
  };
}

function beat(
  id: string,
  kind: KpExplanationSpineV1["beats"][number]["kind"],
  templateId: KpExplanationSpineV1["beats"][number]["templateId"],
  claimRefs: readonly string[],
  vocabularyRefs: KpExplanationSpineV1["beats"][number]["vocabularyRefs"],
  source: Pick<
    KpExplanationSpineV1["beats"][number],
    "sourceFrameRef" | "sourceOperationRef"
  >
) {
  return {
    id: `beat.${id}`,
    kind,
    templateId,
    claimRefs,
    vocabularyRefs,
    ...source
  };
}
