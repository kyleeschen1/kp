import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createEquationOperationTransition,
  type EquationTransition
} from "../src/math/equation-transform.ts";
import { findEquationAnimationCatalogEntry } from "../src/editor/equation-animation-catalog.ts";
import {
  findKatexTransformFixture
} from "../src/rendering/katex-transform-fixtures.ts";
import {
  applyMeasuredMotionDeltas,
  createEquationMotionPlan,
  semanticLifecycleForCorrespondenceRelation,
  type EquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";
import {
  checkKatexVisualArtifactFadeRules,
  katexVisualArtifactLifecycleRecords,
  visualArtifactRecordToCorrespondenceRecord
} from "../src/rendering/visual-artifact-lifecycle.ts";
import {
  cloneVisualMotifPlan,
  createVisualMotifPlan,
  equationVisualMotifDescriptors,
  phaseIdsForEquationVisualMotifKind,
  primitiveIdsForEquationVisualMotifKind
} from "../src/rendering/visual-motif.ts";

type TokenLifecyclePair = [id: string, lifecycle: string];
type TokenRelationPair = [id: string, relation: string | undefined];
type TokenSemanticVisualPair = [
  id: string,
  semanticLifecycle: string | undefined,
  visualLifecycle: string | undefined
];

const summarizeTokenLifecycles = (
  plan: EquationMotionPlan
): TokenLifecyclePair[] =>
  plan.tokens.map((token) => [token.id, token.lifecycle]);

const summarizeTokenRelations = (plan: EquationMotionPlan): TokenRelationPair[] =>
  plan.tokens.map((token) => [
    token.id,
    token.correspondenceRelation
  ]);

const summarizeSemanticVisualLifecycles = (
  plan: EquationMotionPlan
): TokenSemanticVisualPair[] =>
  plan.tokens.map((token) => [
    token.id,
    token.semanticLifecycle,
    token.visualLifecycle
  ]);

const summarizeVisualMotifs = (plan: EquationMotionPlan) =>
  plan.visualMotifs.map((motif) => [
    motif.kind,
    motif.correspondenceRecordId,
    motif.sourceTokenIds,
    motif.targetTokenIds,
    motif.motionPrimitiveIds,
    motif.phaseIds
  ]);

const trackFor = (plan: EquationMotionPlan, tokenId: string) => {
  const track = plan.tracks.find((candidate) => candidate.tokenId === tokenId);
  assert.ok(track, `missing track for ${tokenId}`);
  return track;
};

test("visual motif module exposes reusable equation motif descriptors", () => {
  assert.deepEqual(
    equationVisualMotifDescriptors.map((descriptor) => [
      descriptor.kind,
      descriptor.motionPrimitiveIds,
      descriptor.phaseIds
    ]),
    [
      [
        "append-after-shift",
        ["shift", "enter"],
        ["layout-shift", "introduced-token-enter"]
      ],
      ["artifact-enter", ["enter"], ["artifact-enter"]],
      ["artifact-exit", ["exit"], ["artifact-exit"]],
      ["artifact-replace", ["exit", "enter"], ["artifact-exit", "artifact-enter"]],
      [
        "cancelation",
        ["vanish"],
        ["cancel-meet", "cancel-collapse", "post-cancel-layout-shift"]
      ],
      [
        "simplify-into",
        ["vanish", "reveal"],
        [
          "final-simplify-meet",
          "final-simplify-collapse",
          "final-simplify-reveal"
        ]
      ],
      ["wrap", ["wrap"], ["wrapped-token-shift", "wrap-artifact-enter"]],
      ["unwrap", ["unwrap"], ["unwrap-artifact-exit", "wrapped-token-shift"]]
    ]
  );
  assert.deepEqual(
    primitiveIdsForEquationVisualMotifKind("artifact-replace"),
    ["exit", "enter"]
  );
  assert.deepEqual(phaseIdsForEquationVisualMotifKind("wrap"), [
    "wrapped-token-shift",
    "wrap-artifact-enter"
  ]);

  const motif = createVisualMotifPlan({
    id: "test.cancelation",
    kind: "cancelation",
    correspondenceRecordId: "cancelation.test",
    sourceTokenIds: ["source"],
    targetTokenIds: [],
    motionPrimitiveIds: ["vanish"],
    phaseIds: phaseIdsForEquationVisualMotifKind("cancelation"),
    summary: "test cancelation"
  });
  const clone = cloneVisualMotifPlan(motif);

  assert.deepEqual(clone, motif);
  assert.notEqual(clone.sourceTokenIds, motif.sourceTokenIds);
  assert.notEqual(clone.phaseIds, motif.phaseIds);
});

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
  assert.equal(
    plan.correspondenceMap.id,
    "linear-equation.subtract-both-sides.3"
  );
  assert.deepEqual(
    plan.correspondenceMap.records.map((record) => [
      record.id,
      record.relation,
      record.sourceSelectorIds,
      record.targetSelectorIds
    ]),
    [
      ["identity.lhs.x", "identity", ["lhs.x"], ["lhs.x"]],
      ["identity.lhs.plus", "identity", ["lhs.plus"], ["lhs.plus"]],
      ["identity.lhs.3", "identity", ["lhs.3"], ["lhs.3"]],
      ["identity.equals", "identity", ["equals"], ["equals"]],
      ["identity.rhs.7", "identity", ["rhs.7"], ["rhs.7"]],
      ["introduction.lhs.inverse.minus", "introduction", [], ["lhs.inverse.minus"]],
      ["introduction.lhs.inverse.3", "introduction", [], ["lhs.inverse.3"]],
      ["introduction.rhs.inverse.minus", "introduction", [], ["rhs.inverse.minus"]],
      ["introduction.rhs.inverse.3", "introduction", [], ["rhs.inverse.3"]]
    ]
  );
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
  assert.deepEqual(summarizeSemanticVisualLifecycles(plan), [
    ["lhs.x", "identity-preserved", "persist"],
    ["lhs.plus", "identity-preserved", "persist"],
    ["lhs.3", "identity-preserved", "persist"],
    ["lhs.inverse.minus", "introduced", "enter"],
    ["lhs.inverse.3", "introduced", "enter"],
    ["equals", "identity-preserved", "persist"],
    ["rhs.7", "identity-preserved", "persist"],
    ["rhs.inverse.minus", "introduced", "enter"],
    ["rhs.inverse.3", "introduced", "enter"]
  ]);
  assert.deepEqual(trackFor(plan, "lhs.x"), {
    tokenId: "lhs.x",
    lifecycle: "persist",
    visualLifecycle: "persist",
    start: 0,
    end: 1,
    easing: "linear",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "lhs.plus"), {
    tokenId: "lhs.plus",
    lifecycle: "persist",
    visualLifecycle: "persist",
    start: 0,
    end: 1,
    easing: "linear",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "lhs.inverse.minus"), {
    tokenId: "lhs.inverse.minus",
    lifecycle: "inverse-enter",
    visualLifecycle: "enter",
    start: 0.2,
    end: 0.55,
    easing: "ease-out",
    from: { opacity: 0, x: 0, y: 0, scale: 0.82 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "rhs.inverse.3"), {
    tokenId: "rhs.inverse.3",
    lifecycle: "inverse-enter",
    visualLifecycle: "enter",
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
    semanticLifecycle: "identity-preserved",
    visualLifecycle: "persist",
    label: "+",
    sourceMotionId: "lhs.plus",
    targetMotionId: "lhs.plus",
    sourceLatex: "+",
    targetLatex: "+"
  });
});

test("createEquationMotionPlan derives append-after-shift motifs from introductions", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });

  const plan = createEquationMotionPlan(transition);

  assert.deepEqual(summarizeVisualMotifs(plan), [
    [
      "append-after-shift",
      "linear-equation.subtract-both-sides.3",
      ["lhs.x", "lhs.plus", "lhs.3", "equals", "rhs.7"],
      [
        "lhs.inverse.minus",
        "lhs.inverse.3",
        "rhs.inverse.minus",
        "rhs.inverse.3"
      ],
      ["shift", "enter"],
      ["layout-shift", "introduced-token-enter"]
    ]
  ]);
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
  assert.deepEqual(
    summarizeSemanticVisualLifecycles(createEquationMotionPlan(transition)),
    [
      ["persisted", "identity-preserved", "persist"],
      ["moved", "identity-preserved", "shift"],
      ["wrapped", "role-changed", "wrap"],
      ["unwrapped", "role-changed", "unwrap"],
      ["entered", "introduced", "enter"],
      ["inverse", "introduced", "enter"],
      ["exited", "removed", "exit"],
      ["cancelled", "cancelled", "vanish"],
      ["simplified", "derived", "vanish"]
    ]
  );
});

test("createEquationMotionPlan compiles generalized subtractBothSides transitions", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "y = 10",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "2"
    }
  });

  const plan = createEquationMotionPlan(transition);

  assert.equal(plan.targetLatex, "y - 2 = 10 - 2");
  assert.deepEqual(summarizeTokenLifecycles(plan), [
    ["lhs.y", "persist"],
    ["lhs.inverse.minus", "inverse-enter"],
    ["lhs.inverse.2", "inverse-enter"],
    ["equals", "persist"],
    ["rhs.10", "persist"],
    ["rhs.inverse.minus", "inverse-enter"],
    ["rhs.inverse.2", "inverse-enter"]
  ]);
  assert.deepEqual(summarizeSemanticVisualLifecycles(plan), [
    ["lhs.y", "identity-preserved", "persist"],
    ["lhs.inverse.minus", "introduced", "enter"],
    ["lhs.inverse.2", "introduced", "enter"],
    ["equals", "identity-preserved", "persist"],
    ["rhs.10", "identity-preserved", "persist"],
    ["rhs.inverse.minus", "introduced", "enter"],
    ["rhs.inverse.2", "introduced", "enter"]
  ]);
  assert.deepEqual(
    plan.correspondenceMap.records.map((record) => [
      record.id,
      record.relation,
      record.sourceSelectorIds,
      record.targetSelectorIds
    ]),
    [
      ["identity.lhs.y", "identity", ["lhs.y"], ["lhs.y"]],
      ["identity.equals", "identity", ["equals"], ["equals"]],
      ["identity.rhs.10", "identity", ["rhs.10"], ["rhs.10"]],
      ["introduction.lhs.inverse.minus", "introduction", [], ["lhs.inverse.minus"]],
      ["introduction.lhs.inverse.2", "introduction", [], ["lhs.inverse.2"]],
      ["introduction.rhs.inverse.minus", "introduction", [], ["rhs.inverse.minus"]],
      ["introduction.rhs.inverse.2", "introduction", [], ["rhs.inverse.2"]]
    ]
  );
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

  assert.deepEqual(summarizeVisualMotifs(plan), [
    [
      "cancelation",
      "cancelation.lhs.additive-inverse",
      ["lhs.plus", "lhs.3", "lhs.inverse.minus", "lhs.inverse.3"],
      [],
      ["vanish"],
      ["cancel-meet", "cancel-collapse", "post-cancel-layout-shift"]
    ]
  ]);
  assert.deepEqual(trackFor(plan, "lhs.plus"), {
    tokenId: "lhs.plus",
    lifecycle: "cancel",
    visualLifecycle: "vanish",
    start: 0.05,
    end: 0.35,
    easing: "ease-in",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 0.82 }
  });
  assert.deepEqual(trackFor(plan, "lhs.inverse.3"), {
    tokenId: "lhs.inverse.3",
    lifecycle: "cancel",
    visualLifecycle: "vanish",
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

  assert.deepEqual(summarizeVisualMotifs(plan), [
    [
      "simplify-into",
      "fan-in.rhs.constant-difference",
      ["rhs.7", "rhs.inverse.minus", "rhs.inverse.3"],
      ["rhs.4"],
      ["vanish", "reveal"],
      ["final-simplify-meet", "final-simplify-collapse", "final-simplify-reveal"]
    ]
  ]);
  assert.deepEqual(summarizeSemanticVisualLifecycles(plan), [
    ["lhs.x", "identity-preserved", "persist"],
    ["equals", "identity-preserved", "persist"],
    ["rhs.7", "derived", "vanish"],
    ["rhs.inverse.minus", "derived", "vanish"],
    ["rhs.inverse.3", "derived", "vanish"],
    ["rhs.4", "introduced", "enter"]
  ]);
  assert.deepEqual(plan.correspondenceMap.records, [
    {
      id: "identity.lhs.x",
      relation: "identity",
      sourceSelectorIds: ["lhs.x"],
      targetSelectorIds: ["lhs.x"],
      summary: "lhs.x persists"
    },
    {
      id: "identity.equals",
      relation: "identity",
      sourceSelectorIds: ["equals"],
      targetSelectorIds: ["equals"],
      summary: "equals persists"
    },
    {
      id: "fan-in.rhs.constant-difference",
      relation: "fan-in",
      sourceSelectorIds: ["rhs.7", "rhs.inverse.minus", "rhs.inverse.3"],
      targetSelectorIds: ["rhs.4"],
      summary: "7 - 3 simplifies to 4"
    }
  ]);
  assert.deepEqual(trackFor(plan, "rhs.7"), {
    tokenId: "rhs.7",
    lifecycle: "simplify-into",
    visualLifecycle: "vanish",
    start: 0.05,
    end: 0.45,
    easing: "ease-in-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "rhs.4"), {
    tokenId: "rhs.4",
    lifecycle: "enter",
    visualLifecycle: "enter",
    start: 0.35,
    end: 0.75,
    easing: "ease-out",
    from: { opacity: 0, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
});

test("createEquationMotionPlan maps wrapper fixtures to wrap and enter tracks", () => {
  const fixture = findKatexTransformFixture("wrapper.parentheses.wrap");
  const transition: EquationTransition = {
    sourceLatex: fixture.source.latex,
    targetLatex: fixture.target.latex,
    operation: {
      kind: "subtractBothSides",
      valueLatex: "0"
    },
    tokens: [
      {
        id: "wrapped-expression",
        lifecycle: "group-wrap",
        label: "x+1",
        sourceMotionId: "source.expression",
        targetMotionId: "target.expression"
      },
      {
        id: "open-paren",
        lifecycle: "enter",
        label: "(",
        targetMotionId: "target.open-paren"
      },
      {
        id: "close-paren",
        lifecycle: "enter",
        label: ")",
        targetMotionId: "target.close-paren"
      }
    ],
    sourceAnnotations: [{ motionId: "source.expression", text: "x+1" }],
    targetAnnotations: [
      { motionId: "target.open-paren", text: "(" },
      { motionId: "target.expression", text: "x+1" },
      { motionId: "target.close-paren", text: ")" }
    ]
  };

  const plan = createEquationMotionPlan(transition);

  assert.deepEqual(summarizeSemanticVisualLifecycles(plan), [
    ["wrapped-expression", "role-changed", "wrap"],
    ["open-paren", "introduced", "enter"],
    ["close-paren", "introduced", "enter"]
  ]);
  assert.deepEqual(trackFor(plan, "wrapped-expression"), {
    tokenId: "wrapped-expression",
    lifecycle: "group-wrap",
    visualLifecycle: "wrap",
    start: 0,
    end: 1,
    easing: "ease-in-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
});

test("visual artifact lifecycle records map to visual-only artifact correspondence", () => {
  assert.equal(semanticLifecycleForCorrespondenceRelation("artifact"), "visual-only");
  assert.deepEqual(
    katexVisualArtifactLifecycleRecords
      .map(visualArtifactRecordToCorrespondenceRecord)
      .map((record) => [
        record.id,
        record.relation,
        record.sourceSelectorIds,
        record.targetSelectorIds
      ]),
    [
      [
        "artifact.fraction-bar.enter",
        "artifact",
        [],
        ["fraction.make.inline-to-stacked.target.frac-line"]
      ],
      [
        "artifact.matrix-bracket.replace-delimiter",
        "artifact",
        [
          "matrix.bracket.change-delimiter.source.left-bracket",
          "matrix.bracket.change-delimiter.source.right-bracket"
        ],
        [
          "matrix.bracket.change-delimiter.target.left-bracket",
          "matrix.bracket.change-delimiter.target.right-bracket"
        ]
      ],
      [
        "artifact.radical-glyph.enter",
        "artifact",
        [],
        [
          "radical.rewrite-power-as-root.target.hide-tail",
          "radical.rewrite-power-as-root.target.sqrt-line",
          "radical.rewrite-power-as-root.target.sqrt-glyph"
        ]
      ],
      [
        "artifact.accent.exit-overline",
        "artifact",
        ["accent.strip-overline.source.overline"],
        []
      ]
    ]
  );
});

test("visual artifact lifecycle records satisfy artifact fade rules", () => {
  assert.deepEqual(checkKatexVisualArtifactFadeRules(), {
    lawId: "katex-visual-artifact.fade-rules",
    passed: true,
    failures: []
  });
});

test("visual artifact fade rule reports replacement persistence claims", () => {
  assert.deepEqual(
    checkKatexVisualArtifactFadeRules(
      katexVisualArtifactLifecycleRecords.map((record) =>
        record.id === "artifact.matrix-bracket.replace-delimiter"
          ? {
              ...record,
              targetVisualLifecycle: "persist"
            }
          : record
      )
    ),
    {
      lawId: "katex-visual-artifact.fade-rules",
      passed: false,
      failures: [
        {
          path:
            "records[artifact.matrix-bracket.replace-delimiter].targetVisualLifecycle",
          message:
            "Visual artifact artifact.matrix-bracket.replace-delimiter phase replace expected targetVisualLifecycle enter but received persist."
        }
      ]
    }
  );
});

test("fixture fraction animation fades slash and fraction line artifacts", () => {
  const entry = findEquationAnimationCatalogEntry(
    "fixture-fraction-make-inline-to-stacked"
  );
  const plan = createEquationMotionPlan(entry.transitions[0]!);

  assert.deepEqual(summarizeTokenLifecycles(plan), [
    ["fraction.make.inline-to-stacked.x", "move"],
    ["fraction.make.inline-to-stacked.slash", "exit"],
    ["fraction.make.inline-to-stacked.3", "move"],
    ["fraction.make.inline-to-stacked.frac-line", "enter"]
  ]);
  assert.deepEqual(trackFor(plan, "fraction.make.inline-to-stacked.slash"), {
    tokenId: "fraction.make.inline-to-stacked.slash",
    lifecycle: "exit",
    visualLifecycle: "exit",
    start: 0,
    end: 0.2,
    easing: "ease-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "fraction.make.inline-to-stacked.frac-line"), {
    tokenId: "fraction.make.inline-to-stacked.frac-line",
    lifecycle: "enter",
    visualLifecycle: "enter",
    start: 0.8,
    end: 1,
    easing: "ease-out",
    from: { opacity: 0, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.equal(
    plan.tokens.find(
      (token) => token.id === "fraction.make.inline-to-stacked.frac-line"
    )?.entryEffect,
    "direct"
  );
});

test("fixture radical animation preserves x as radicand and enters radical artifact", () => {
  const entry = findEquationAnimationCatalogEntry(
    "fixture-radical-rewrite-power-as-root"
  );
  const transition = entry.transitions[0];

  assert.ok(transition, "expected radical transition");
  assert.deepEqual(
    transition.tokens.map((token) => [
      token.id,
      token.lifecycle,
      token.sourceMotionId,
      token.targetMotionId
    ]),
    [
      [
        "radical.rewrite-power-as-root.x",
        "group-wrap",
        "radical.rewrite-power-as-root.source.x",
        "radical.rewrite-power-as-root.target.x"
      ],
      [
        "radical.rewrite-power-as-root.exponent",
        "exit",
        "radical.rewrite-power-as-root.source.exponent",
        undefined
      ],
      [
        "radical.rewrite-power-as-root.radical",
        "enter",
        undefined,
        "radical.rewrite-power-as-root.target.radical"
      ]
    ]
  );

  const plan = createEquationMotionPlan(transition);

  assert.deepEqual(summarizeSemanticVisualLifecycles(plan), [
    ["radical.rewrite-power-as-root.x", "role-changed", "wrap"],
    ["radical.rewrite-power-as-root.exponent", "removed", "exit"],
    ["radical.rewrite-power-as-root.radical", "visual-only", "enter"]
  ]);
  assert.deepEqual(
    plan.correspondenceMap.records.map((record) => [
      record.relation,
      record.sourceSelectorIds,
      record.targetSelectorIds
    ]),
    [
      [
        "role-change",
        ["radical.rewrite-power-as-root.source.x"],
        ["radical.rewrite-power-as-root.target.x"]
      ],
      [
        "removal",
        ["radical.rewrite-power-as-root.source.exponent"],
        []
      ],
      [
        "artifact",
        [],
        ["radical.rewrite-power-as-root.target.radical"]
      ]
    ]
  );
});

test("fixture script animation fades the nonpersistent dot operator", () => {
  const entry = findEquationAnimationCatalogEntry(
    "fixture-script-combine-factor-as-power"
  );
  const plan = createEquationMotionPlan(entry.transitions[0]!);

  assert.deepEqual(summarizeTokenLifecycles(plan), [
    ["script.combine-factor-as-power.base", "persist"],
    ["script.combine-factor-as-power.dot", "exit"],
    ["script.combine-factor-as-power.factor", "simplify-into"]
  ]);
  assert.deepEqual(
    plan.tokens.map((token) => [
      token.id,
      token.semanticLifecycle,
      token.sourceMotionId,
      token.targetMotionId,
      token.sourceLatex,
      token.targetLatex
    ]),
    [
      [
        "script.combine-factor-as-power.base",
        "identity-preserved",
        "script.combine-factor-as-power.source.base",
        "script.combine-factor-as-power.target.base",
        "x",
        "x"
      ],
      [
        "script.combine-factor-as-power.dot",
        "removed",
        "script.combine-factor-as-power.source.dot",
        undefined,
        "\\cdot",
        undefined
      ],
      [
        "script.combine-factor-as-power.factor",
        "derived",
        "script.combine-factor-as-power.source.factor",
        "script.combine-factor-as-power.target.exponent",
        "x",
        "2"
      ]
    ]
  );
  assert.deepEqual(trackFor(plan, "script.combine-factor-as-power.factor"), {
    tokenId: "script.combine-factor-as-power.factor",
    lifecycle: "simplify-into",
    visualLifecycle: "vanish",
    start: 0,
    end: 0.75,
    easing: "ease-in-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 0.35 }
  });
  assert.deepEqual(
    plan.correspondenceMap.records.map((record) => [
      record.relation,
      record.sourceSelectorIds,
      record.targetSelectorIds
    ]),
    [
      [
        "identity",
        ["script.combine-factor-as-power.source.base"],
        ["script.combine-factor-as-power.target.base"]
      ],
      [
        "removal",
        ["script.combine-factor-as-power.source.dot"],
        []
      ],
      [
        "fan-in",
        ["script.combine-factor-as-power.source.factor"],
        ["script.combine-factor-as-power.target.exponent"]
      ]
    ]
  );
  assert.deepEqual(trackFor(plan, "script.combine-factor-as-power.dot"), {
    tokenId: "script.combine-factor-as-power.dot",
    lifecycle: "exit",
    visualLifecycle: "exit",
    start: 0,
    end: 1,
    easing: "ease-in-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 0, x: 0, y: 0, scale: 1 }
  });
});

test("fixture function wrap stages moved x, parentheses, and delayed f entry", () => {
  const entry = findEquationAnimationCatalogEntry("fixture-wrapper-function-wrap");
  const plan = createEquationMotionPlan(entry.transitions[0]!);

  assert.deepEqual(summarizeTokenLifecycles(plan), [
    ["wrapper.function.wrap.x", "group-wrap"],
    ["wrapper.function.wrap.f", "enter"],
    ["wrapper.function.wrap.open-paren", "enter"],
    ["wrapper.function.wrap.close-paren", "enter"]
  ]);
  assert.deepEqual(trackFor(plan, "wrapper.function.wrap.x"), {
    tokenId: "wrapper.function.wrap.x",
    lifecycle: "group-wrap",
    visualLifecycle: "wrap",
    start: 0,
    end: 0.4,
    easing: "ease-in-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "wrapper.function.wrap.open-paren"), {
    tokenId: "wrapper.function.wrap.open-paren",
    lifecycle: "enter",
    visualLifecycle: "enter",
    start: 0.42,
    end: 0.7,
    easing: "ease-in-out",
    from: { opacity: 0, x: -8, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "wrapper.function.wrap.close-paren"), {
    tokenId: "wrapper.function.wrap.close-paren",
    lifecycle: "enter",
    visualLifecycle: "enter",
    start: 0.42,
    end: 0.7,
    easing: "ease-in-out",
    from: { opacity: 0, x: 8, y: 0, scale: 1 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.deepEqual(trackFor(plan, "wrapper.function.wrap.f"), {
    tokenId: "wrapper.function.wrap.f",
    lifecycle: "enter",
    visualLifecycle: "enter",
    start: 0.5,
    end: 0.78,
    easing: "ease-out",
    from: { opacity: 0, x: -10, y: 0, scale: 0.35 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
});

test("fixture matrix bracket swap preserves entry identity and swaps bracket artifacts", () => {
  const entry = findEquationAnimationCatalogEntry(
    "fixture-matrix-bracket-change-delimiter"
  );
  const transition = entry.transitions[0];

  assert.ok(transition, "expected matrix bracket transition");
  assert.deepEqual(
    transition.tokens.map((token) => [
      token.id,
      token.lifecycle,
      token.sourceMotionId,
      token.targetMotionId
    ]),
    [
      [
        "matrix.bracket.change-delimiter.entry.r0.c0",
        "persist",
        "matrix.bracket.change-delimiter.source.entry.r0.c0",
        "matrix.bracket.change-delimiter.target.entry.r0.c0"
      ],
      [
        "matrix.bracket.change-delimiter.entry.r0.c1",
        "persist",
        "matrix.bracket.change-delimiter.source.entry.r0.c1",
        "matrix.bracket.change-delimiter.target.entry.r0.c1"
      ],
      [
        "matrix.bracket.change-delimiter.entry.r1.c0",
        "persist",
        "matrix.bracket.change-delimiter.source.entry.r1.c0",
        "matrix.bracket.change-delimiter.target.entry.r1.c0"
      ],
      [
        "matrix.bracket.change-delimiter.entry.r1.c1",
        "persist",
        "matrix.bracket.change-delimiter.source.entry.r1.c1",
        "matrix.bracket.change-delimiter.target.entry.r1.c1"
      ],
      [
        "matrix.bracket.change-delimiter.source.left-bracket",
        "exit",
        "matrix.bracket.change-delimiter.source.left-bracket",
        undefined
      ],
      [
        "matrix.bracket.change-delimiter.source.right-bracket",
        "exit",
        "matrix.bracket.change-delimiter.source.right-bracket",
        undefined
      ],
      [
        "matrix.bracket.change-delimiter.target.left-bracket",
        "enter",
        undefined,
        "matrix.bracket.change-delimiter.target.left-bracket"
      ],
      [
        "matrix.bracket.change-delimiter.target.right-bracket",
        "enter",
        undefined,
        "matrix.bracket.change-delimiter.target.right-bracket"
      ]
    ]
  );

  const plan = createEquationMotionPlan(transition);

  assert.deepEqual(summarizeVisualMotifs(plan), [
    [
      "artifact-replace",
      "matrix.bracket.change-delimiter.artifact.target-brackets",
      [
        "matrix.bracket.change-delimiter.source.left-bracket",
        "matrix.bracket.change-delimiter.source.right-bracket"
      ],
      [
        "matrix.bracket.change-delimiter.target.left-bracket",
        "matrix.bracket.change-delimiter.target.right-bracket"
      ],
      ["exit", "enter"],
      ["artifact-exit", "artifact-enter"]
    ]
  ]);
  assert.deepEqual(summarizeSemanticVisualLifecycles(plan), [
    [
      "matrix.bracket.change-delimiter.entry.r0.c0",
      "identity-preserved",
      "persist"
    ],
    [
      "matrix.bracket.change-delimiter.entry.r0.c1",
      "identity-preserved",
      "persist"
    ],
    [
      "matrix.bracket.change-delimiter.entry.r1.c0",
      "identity-preserved",
      "persist"
    ],
    [
      "matrix.bracket.change-delimiter.entry.r1.c1",
      "identity-preserved",
      "persist"
    ],
    [
      "matrix.bracket.change-delimiter.source.left-bracket",
      "removed",
      "exit"
    ],
    [
      "matrix.bracket.change-delimiter.source.right-bracket",
      "removed",
      "exit"
    ],
    [
      "matrix.bracket.change-delimiter.target.left-bracket",
      "visual-only",
      "enter"
    ],
    [
      "matrix.bracket.change-delimiter.target.right-bracket",
      "visual-only",
      "enter"
    ]
  ]);
  assert.deepEqual(
    plan.correspondenceMap.records.map((record) => [
      record.relation,
      record.sourceSelectorIds,
      record.targetSelectorIds
    ]),
    [
      [
        "identity",
        ["matrix.bracket.change-delimiter.source.entry.r0.c0"],
        ["matrix.bracket.change-delimiter.target.entry.r0.c0"]
      ],
      [
        "identity",
        ["matrix.bracket.change-delimiter.source.entry.r0.c1"],
        ["matrix.bracket.change-delimiter.target.entry.r0.c1"]
      ],
      [
        "identity",
        ["matrix.bracket.change-delimiter.source.entry.r1.c0"],
        ["matrix.bracket.change-delimiter.target.entry.r1.c0"]
      ],
      [
        "identity",
        ["matrix.bracket.change-delimiter.source.entry.r1.c1"],
        ["matrix.bracket.change-delimiter.target.entry.r1.c1"]
      ],
      [
        "removal",
        [
          "matrix.bracket.change-delimiter.source.left-bracket",
          "matrix.bracket.change-delimiter.source.right-bracket"
        ],
        []
      ],
      [
        "artifact",
        [],
        [
          "matrix.bracket.change-delimiter.target.left-bracket",
          "matrix.bracket.change-delimiter.target.right-bracket"
        ]
      ]
    ]
  );
});

test("applyMeasuredMotionDeltas encodes measured layout into sampled tracks", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });
  const plan = createEquationMotionPlan(transition);
  const measuredPlan = applyMeasuredMotionDeltas(plan, [
    {
      tokenId: "lhs.x",
      x: 24,
      y: -3,
      scale: 0.72,
      start: 0,
      end: 0.4,
      easing: "ease-in-out"
    }
  ]);

  assert.deepEqual(trackFor(measuredPlan, "lhs.x"), {
    tokenId: "lhs.x",
    lifecycle: "persist",
    visualLifecycle: "persist",
    start: 0,
    end: 0.4,
    easing: "ease-in-out",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
    to: { opacity: 1, x: 24, y: -3, scale: 0.72 }
  });
  assert.deepEqual(trackFor(plan, "lhs.x"), {
    tokenId: "lhs.x",
    lifecycle: "persist",
    visualLifecycle: "persist",
    start: 0,
    end: 1,
    easing: "linear",
    from: { opacity: 1, x: 0, y: 0, scale: 1 },
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
