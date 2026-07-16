import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEpistemicAnnotation,
  kpEpistemicStatuses,
  sampleKpEpistemicDisclosure,
  type KpEpistemicStatus
} from "../src/semantic/epistemic-status.ts";

test("state and transition annotations explicitly support every epistemic status", () => {
  const expected: readonly KpEpistemicStatus[] = [
    "valid",
    "hypothesis",
    "unverified",
    "misconception",
    "invalid",
    "counterexample"
  ];
  assert.deepEqual(kpEpistemicStatuses, expected);

  expected.forEach((status, index) => {
    const annotation = createKpEpistemicAnnotation({
      subject: {
        kind: index % 2 === 0 ? "state" : "transition",
        id: `semantic.${status}`
      },
      status,
      rationale: `${status} is intentionally asserted by the semantic author.`,
      disclosure: { trigger: { kind: "immediate" }, announce: true }
    });
    assert.equal(annotation.status, status);
    assert.equal(annotation.subject.kind, index % 2 === 0 ? "state" : "transition");
  });
});

test("invalid semantics remain present while correctness disclosure is delayed", () => {
  const annotation = createKpEpistemicAnnotation({
    subject: { kind: "transition", id: "transition.intentional-invalid-step" },
    status: "invalid",
    rationale: "Multiplying only one side does not preserve equality.",
    evidenceIds: ["law.equality-both-sides"],
    disclosure: {
      trigger: { kind: "progress", at: 0.75 },
      announce: true
    }
  });

  const concealed = sampleKpEpistemicDisclosure({ annotation, progress: 0.5 });
  const revealed = sampleKpEpistemicDisclosure({ annotation, progress: 0.75 });
  assert.equal(annotation.status, "invalid");
  assert.deepEqual(concealed, {
    subject: { kind: "transition", id: "transition.intentional-invalid-step" },
    disclosed: false,
    announce: false
  });
  assert.equal(revealed.status, "invalid");
  assert.equal(revealed.announce, true);
});

test("checkpoint and learner-request disclosures sample independently of status", () => {
  const counterexample = createKpEpistemicAnnotation({
    subject: { kind: "state", id: "state.counterexample" },
    status: "counterexample",
    rationale: "This input refutes the proposed general rule.",
    disclosure: {
      trigger: { kind: "checkpoint", checkpointId: "checkpoint.try-first" },
      announce: false
    }
  });
  assert.equal(sampleKpEpistemicDisclosure({
    annotation: counterexample,
    progress: 1,
    elapsedCheckpointIds: []
  }).disclosed, false);
  assert.equal(sampleKpEpistemicDisclosure({
    annotation: counterexample,
    progress: 0,
    elapsedCheckpointIds: ["checkpoint.try-first"]
  }).status, "counterexample");

  const hypothesis = createKpEpistemicAnnotation({
    subject: { kind: "state", id: "state.hypothesis" },
    status: "hypothesis",
    rationale: "The learner has proposed this state for inspection.",
    disclosure: { trigger: { kind: "on-request" }, announce: true }
  });
  assert.equal(sampleKpEpistemicDisclosure({
    annotation: hypothesis,
    progress: 1
  }).disclosed, false);
  assert.equal(sampleKpEpistemicDisclosure({
    annotation: hypothesis,
    progress: 0,
    requested: true
  }).status, "hypothesis");
});

test("disclosure policies reject ambiguous progress and checkpoint triggers", () => {
  assert.throws(() => createKpEpistemicAnnotation({
    subject: { kind: "state", id: "state.bad-progress" },
    status: "unverified",
    rationale: "Awaiting verification.",
    disclosure: { trigger: { kind: "progress", at: 1.1 }, announce: false }
  }), /between 0 and 1/);
  assert.throws(() => createKpEpistemicAnnotation({
    subject: { kind: "transition", id: "transition.bad-checkpoint" },
    status: "misconception",
    rationale: "Known incorrect learner model.",
    disclosure: { trigger: { kind: "checkpoint", checkpointId: " " }, announce: true }
  }), /checkpoint id must not be empty/);
});
