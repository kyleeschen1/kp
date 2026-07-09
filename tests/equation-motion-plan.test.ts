import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createEquationOperationTransition,
  type EquationTransition
} from "../src/math/equation-transform.ts";
import {
  createEquationMotionPlan,
  type EquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";

type TokenLifecyclePair = [id: string, lifecycle: string];
type TokenRelationPair = [id: string, relation: string | undefined];

const summarizeTokenLifecycles = (
  plan: EquationMotionPlan
): TokenLifecyclePair[] =>
  plan.tokens.map((token) => [token.id, token.lifecycle]);

const summarizeTokenRelations = (plan: EquationMotionPlan): TokenRelationPair[] =>
  plan.tokens.map((token) => [
    token.id,
    token.correspondenceRelation
  ]);

const trackFor = (plan: EquationMotionPlan, tokenId: string) => {
  const track = plan.tracks.find((candidate) => candidate.tokenId === tokenId);
  assert.ok(track, `missing track for ${tokenId}`);
  return track;
};

test("createEquationMotionPlan preserves corrected semantic lifecycle tracks", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });

  const plan = createEquationMotionPlan(transition);

  assert.equal(plan.sourceLatex, "x + 3 = 7");
  assert.equal(plan.targetLatex, "x + 3 - 3 = 7 - 3");
  assert.deepEqual(summarizeTokenLifecycles(plan), [
    ["lhs.x", "persist"],
    ["lhs.plus", "persist"],
    ["lhs.3", "persist"],
    ["lhs.inverse.minus", "inverse-enter"],
    ["lhs.inverse.3", "inverse-enter"],
    ["equals", "persist"],
    ["rhs.7", "persist"],
    ["rhs.inverse.minus", "inverse-enter"],
    ["rhs.inverse.3", "inverse-enter"]
  ]);
  assert.deepEqual(summarizeTokenRelations(plan), [
    ["lhs.x", "identity"],
    ["lhs.plus", "identity"],
    ["lhs.3", "identity"],
    ["lhs.inverse.minus", "introduction"],
    ["lhs.inverse.3", "introduction"],
    ["equals", "identity"],
    ["rhs.7", "identity"],
    ["rhs.inverse.minus", "introduction"],
    ["rhs.inverse.3", "introduction"]
  ]);
  assert.deepEqual(trackFor(plan, "lhs.x"), {
    tokenId: "lhs.x",
    lifecycle: "persist",
    start: 0,
    end: 1,
    easing: "linear",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "lhs.plus"), {
    tokenId: "lhs.plus",
    lifecycle: "persist",
    start: 0,
    end: 1,
    easing: "linear",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "lhs.inverse.minus"), {
    tokenId: "lhs.inverse.minus",
    lifecycle: "inverse-enter",
    start: 0.2,
    end: 0.55,
    easing: "ease-out",
    from: { opacity: 0, x: 0, y: 0, scale: 0.82 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "rhs.inverse.3"), {
    tokenId: "rhs.inverse.3",
    lifecycle: "inverse-enter",
    start: 0.2,
    end: 0.55,
    easing: "ease-out",
    from: { opacity: 0, x: 0, y: 0, scale: 0.82 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(plan.tokens[1], {
    id: "lhs.plus",
    lifecycle: "persist",
    correspondenceRelation: "identity",
    label: "+",
    sourceMotionId: "lhs.plus",
    targetMotionId: "lhs.plus",
    sourceLatex: "+",
    targetLatex: "+"
  });
});

test("createEquationMotionPlan maps lifecycles to selector correspondence relations", () => {
  const transition: EquationTransition = {
    sourceLatex: "a + b = c",
    targetLatex: "a + b = c",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "persisted",
        lifecycle: "persist",
        label: "p",
        sourceMotionId: "source.persisted",
        targetMotionId: "target.persisted"
      },
      {
        id: "moved",
        lifecycle: "move",
        label: "m",
        sourceMotionId: "source.moved",
        targetMotionId: "target.moved"
      },
      {
        id: "wrapped",
        lifecycle: "group-wrap",
        label: "w",
        sourceMotionId: "source.wrapped",
        targetMotionId: "target.wrapped"
      },
      {
        id: "unwrapped",
        lifecycle: "group-unwrap",
        label: "u",
        sourceMotionId: "source.unwrapped",
        targetMotionId: "target.unwrapped"
      },
      {
        id: "entered",
        lifecycle: "enter",
        label: "e",
        targetMotionId: "target.entered"
      },
      {
        id: "inverse",
        lifecycle: "inverse-enter",
        label: "i",
        targetMotionId: "target.inverse"
      },
      {
        id: "exited",
        lifecycle: "exit",
        label: "x",
        sourceMotionId: "source.exited"
      },
      {
        id: "cancelled",
        lifecycle: "cancel",
        label: "c",
        sourceMotionId: "source.cancelled"
      },
      {
        id: "simplified",
        lifecycle: "simplify-into",
        label: "s",
        sourceMotionId: "source.simplified"
      }
    ],
    sourceAnnotations: [
      { motionId: "source.persisted", text: "p" },
      { motionId: "source.moved", text: "m" },
      { motionId: "source.wrapped", text: "w" },
      { motionId: "source.unwrapped", text: "u" },
      { motionId: "source.exited", text: "x" },
      { motionId: "source.cancelled", text: "c" },
      { motionId: "source.simplified", text: "s" }
    ],
    targetAnnotations: [
      { motionId: "target.persisted", text: "p" },
      { motionId: "target.moved", text: "m" },
      { motionId: "target.wrapped", text: "w" },
      { motionId: "target.unwrapped", text: "u" },
      { motionId: "target.entered", text: "e" },
      { motionId: "target.inverse", text: "i" }
    ]
  };

  assert.deepEqual(summarizeTokenRelations(createEquationMotionPlan(transition)), [
    ["persisted", "identity"],
    ["moved", "identity"],
    ["wrapped", "role-change"],
    ["unwrapped", "role-change"],
    ["entered", "introduction"],
    ["inverse", "introduction"],
    ["exited", "removal"],
    ["cancelled", "cancelation"],
    ["simplified", "fan-in"]
  ]);
});

test("createEquationMotionPlan cancels left additive inverse only during simplification", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });

  const plan = createEquationMotionPlan(transition);

  assert.deepEqual(trackFor(plan, "lhs.plus"), {
    tokenId: "lhs.plus",
    lifecycle: "cancel",
    start: 0.05,
    end: 0.35,
    easing: "ease-in",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 0.82 }
  });
  assert.deepEqual(trackFor(plan, "lhs.inverse.3"), {
    tokenId: "lhs.inverse.3",
    lifecycle: "cancel",
    start: 0.05,
    end: 0.35,
    easing: "ease-in",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 0.82 }
  });
});

test("createEquationMotionPlan animates right constant difference simplification", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });

  const plan = createEquationMotionPlan(transition);

  assert.deepEqual(trackFor(plan, "rhs.7"), {
    tokenId: "rhs.7",
    lifecycle: "simplify-into",
    start: 0.05,
    end: 0.45,
    easing: "ease-in-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "rhs.4"), {
    tokenId: "rhs.4",
    lifecycle: "enter",
    start: 0.35,
    end: 0.75,
    easing: "ease-out",
    from: { opacity: 0, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
});

test("createEquationMotionPlan rejects tokens without source or target motion ids", () => {
  const transition: EquationTransition = {
    sourceLatex: "x = 1",
    targetLatex: "x = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "bad",
        lifecycle: "persist",
        label: "bad"
      }
    ],
    sourceAnnotations: [],
    targetAnnotations: []
  };

  assert.throws(
    () => createEquationMotionPlan(transition),
    /Motion token bad has no sourceMotionId or targetMotionId/
  );
});

test("createEquationMotionPlan rejects uncovered source annotations", () => {
  const transition: EquationTransition = {
    sourceLatex: "x = 1",
    targetLatex: "x = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "x",
        targetMotionId: "x"
      }
    ],
    sourceAnnotations: [
      { motionId: "x", text: "x" },
      { motionId: "orphan.source", text: "1" }
    ],
    targetAnnotations: [{ motionId: "x", text: "x" }]
  };

  assert.throws(
    () => createEquationMotionPlan(transition),
    /Source motion id orphan\.source has no lifecycle token/
  );
});

test("createEquationMotionPlan rejects uncovered target annotations", () => {
  const transition: EquationTransition = {
    sourceLatex: "x = 1",
    targetLatex: "x = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "x",
        targetMotionId: "x"
      }
    ],
    sourceAnnotations: [{ motionId: "x", text: "x" }],
    targetAnnotations: [
      { motionId: "x", text: "x" },
      { motionId: "orphan.target", text: "1" }
    ]
  };

  assert.throws(
    () => createEquationMotionPlan(transition),
    /Target motion id orphan\.target has no lifecycle token/
  );
});

test("createEquationMotionPlan rejects source tokens that reference unannotated motion ids", () => {
  const transition: EquationTransition = {
    sourceLatex: "x = 1",
    targetLatex: "x = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "unannotated.source",
        targetMotionId: "x"
      }
    ],
    sourceAnnotations: [],
    targetAnnotations: [{ motionId: "x", text: "x" }]
  };

  assert.throws(
    () => createEquationMotionPlan(transition),
    /Source lifecycle token x references unannotated motion id unannotated\.source/
  );
});

test("createEquationMotionPlan rejects target tokens that reference unannotated motion ids", () => {
  const transition: EquationTransition = {
    sourceLatex: "x = 1",
    targetLatex: "x = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "x",
        targetMotionId: "unannotated.target"
      }
    ],
    sourceAnnotations: [{ motionId: "x", text: "x" }],
    targetAnnotations: []
  };

  assert.throws(
    () => createEquationMotionPlan(transition),
    /Target lifecycle token x references unannotated motion id unannotated\.target/
  );
});

test("createEquationMotionPlan rejects duplicate token ids and motion ids", () => {
  const duplicateTokenIdTransition: EquationTransition = {
    sourceLatex: "x + y = 1",
    targetLatex: "x + y = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "term",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "x.source",
        targetMotionId: "x.target"
      },
      {
        id: "term",
        lifecycle: "persist",
        label: "y",
        sourceMotionId: "y.source",
        targetMotionId: "y.target"
      }
    ],
    sourceAnnotations: [
      { motionId: "x.source", text: "x" },
      { motionId: "y.source", text: "y" }
    ],
    targetAnnotations: [
      { motionId: "x.target", text: "x" },
      { motionId: "y.target", text: "y" }
    ]
  };
  const duplicateSourceMotionIdTransition: EquationTransition = {
    sourceLatex: "x + x = 1",
    targetLatex: "x + x = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "x.first",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "x.source",
        targetMotionId: "x.first.target"
      },
      {
        id: "x.second",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "x.source",
        targetMotionId: "x.second.target"
      }
    ],
    sourceAnnotations: [{ motionId: "x.source", text: "x" }],
    targetAnnotations: [
      { motionId: "x.first.target", text: "x" },
      { motionId: "x.second.target", text: "x" }
    ]
  };
  const duplicateTargetMotionIdTransition: EquationTransition = {
    sourceLatex: "x + y = 1",
    targetLatex: "x + y = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        label: "x",
        sourceMotionId: "x.source",
        targetMotionId: "target.term"
      },
      {
        id: "y",
        lifecycle: "persist",
        label: "y",
        sourceMotionId: "y.source",
        targetMotionId: "target.term"
      }
    ],
    sourceAnnotations: [
      { motionId: "x.source", text: "x" },
      { motionId: "y.source", text: "y" }
    ],
    targetAnnotations: [{ motionId: "target.term", text: "x" }]
  };

  assert.throws(
    () => createEquationMotionPlan(duplicateTokenIdTransition),
    /Duplicate equation motion token id term/
  );
  assert.throws(
    () => createEquationMotionPlan(duplicateSourceMotionIdTransition),
    /Duplicate source motion id x\.source/
  );
  assert.throws(
    () => createEquationMotionPlan(duplicateTargetMotionIdTransition),
    /Duplicate target motion id target\.term/
  );
});

test("createEquationMotionPlan rejects lifecycle endpoint mismatches", () => {
  const baseTransition = (
    token: EquationTransition["tokens"][number]
  ): EquationTransition => ({
    sourceLatex: "x = 1",
    targetLatex: "x = 1",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [token],
    sourceAnnotations:
      token.sourceMotionId === undefined
        ? []
        : [{ motionId: token.sourceMotionId, text: token.label }],
    targetAnnotations:
      token.targetMotionId === undefined
        ? []
        : [{ motionId: token.targetMotionId, text: token.label }]
  });

  assert.throws(
    () =>
      createEquationMotionPlan(
        baseTransition({
          id: "x",
          lifecycle: "persist",
          label: "x",
          sourceMotionId: "x"
        })
      ),
    /Motion token x lifecycle persist requires both sourceMotionId and targetMotionId/
  );
  assert.throws(
    () =>
      createEquationMotionPlan(
        baseTransition({
          id: "entered",
          lifecycle: "enter",
          label: "x",
          sourceMotionId: "source.x",
          targetMotionId: "target.x"
        })
      ),
    /Motion token entered lifecycle enter requires only targetMotionId/
  );
  assert.throws(
    () =>
      createEquationMotionPlan(
        baseTransition({
          id: "cancelled",
          lifecycle: "cancel",
          label: "x",
          sourceMotionId: "source.x",
          targetMotionId: "target.x"
        })
      ),
    /Motion token cancelled lifecycle cancel requires only sourceMotionId/
  );
});

test("createEquationMotionPlan returns independent track poses", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });

  const plan = createEquationMotionPlan(transition);
  const lhsTrack = trackFor(plan, "lhs.x");
  const plusTrack = trackFor(plan, "lhs.plus");

  (lhsTrack.from as { opacity: number }).opacity = 0.25;

  assert.equal(plusTrack.from.opacity, 1);
});
