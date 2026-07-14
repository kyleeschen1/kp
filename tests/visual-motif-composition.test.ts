import assert from "node:assert/strict";
import test from "node:test";

import { createSemanticTransformationRef } from "../src/semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationParallel,
  createSemanticTransformationSequence
} from "../src/semantic/transformation-composition.ts";
import {
  checkTransformTreeVisualMotifRewindLaw,
  createTransformTreeVisualMotifTimeline,
  type TransformTreeVisualMotifRule
} from "../src/rendering/visual-motif-composition.ts";
import {
  checkEquationCancelationVisualMotifContract,
  checkGeneratedAlgebraEquationVisualMotifDefaultCoverage,
  defaultEquationTransformVisualMotifRules
} from "../src/rendering/equation-visual-motif-defaults.ts";
import {
  listGeneratedAlgebraTransformDefinitions
} from "../src/semantic/generated-algebra-transform-definition-registry.ts";
import type {
  EquationMotionPrimitiveId,
  EquationVisualMotifKind,
  EquationVisualMotifPhaseId
} from "../src/rendering/visual-motif.ts";

type EquationMotifRule = TransformTreeVisualMotifRule<
  EquationVisualMotifKind,
  EquationMotionPrimitiveId,
  EquationVisualMotifPhaseId
>;

const rules: readonly EquationMotifRule[] = [
  {
    transformationKind: "subtractBothSides",
    descriptor: {
      kind: "append-after-shift",
      motionPrimitiveIds: ["shift", "enter"],
      phaseIds: ["layout-shift", "introduced-token-enter"],
      summary: "Persisted terms shift before inverse terms enter."
    }
  },
  {
    transformationKind: "cancelAdditiveInverse",
    descriptor: {
      kind: "cancelation",
      motionPrimitiveIds: ["vanish"],
      phaseIds: ["cancel-meet", "cancel-collapse", "post-cancel-layout-shift"],
      summary: "Canceling terms vanish and remaining terms shift."
    }
  },
  {
    transformationKind: "dotProduct",
    descriptor: {
      kind: "simplify-into",
      motionPrimitiveIds: ["vanish", "reveal"],
      phaseIds: [
        "final-simplify-meet",
        "final-simplify-collapse",
        "final-simplify-reveal"
      ],
      summary: "Products combine into an output entry."
    }
  }
];

test("createTransformTreeVisualMotifTimeline maps transform trees to reversible motif phases", () => {
  const subtract = createSemanticTransformationRef({
    id: "transform.subtract-both-sides.3",
    kind: "subtractBothSides",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.with-inverses"],
    preserves: ["value", "structure"]
  });
  const cancel = createSemanticTransformationRef({
    id: "transform.cancel-additive-inverse",
    kind: "cancelAdditiveInverse",
    sourceObjectIds: ["equation.with-inverses"],
    targetObjectIds: ["equation.simplified-left"],
    preserves: ["value"]
  });
  const tree = createEditableSemanticTransformationTree({
    root: createSemanticTransformationSequence({
      id: "solve-x.sequence",
      label: "Solve x",
      children: [
        createSemanticTransformationLeaf(subtract),
        createSemanticTransformationLeaf(cancel)
      ]
    }),
    annotations: [
      {
        id: "pause.after-subtract",
        kind: "pause",
        targetNodeId: "transform.subtract-both-sides.3",
        placement: "after",
        durationBeats: 1
      },
      {
        id: "focus.cancel",
        kind: "focus",
        targetNodeId: "transform.cancel-additive-inverse",
        placement: "during",
        selectorIds: ["lhs.plus-3", "lhs.minus-3"]
      }
    ]
  });

  const timeline = createTransformTreeVisualMotifTimeline({
    id: "solve-x.visual",
    tree,
    rules
  });

  assert.deepEqual(
    timeline.segments.map((segment) => [
      segment.id,
      segment.transformationNodeId,
      segment.motifKind,
      segment.phaseIds
    ]),
    [
      [
        "transform.subtract-both-sides.3.visual.append-after-shift",
        "transform.subtract-both-sides.3",
        "append-after-shift",
        ["layout-shift", "introduced-token-enter"]
      ],
      [
        "transform.cancel-additive-inverse.visual.cancelation",
        "transform.cancel-additive-inverse",
        "cancelation",
        ["cancel-meet", "cancel-collapse", "post-cancel-layout-shift"]
      ]
    ]
  );
  assert.deepEqual(timeline.forwardPhases, [
    {
      id: "solve-x.visual.forward.0",
      direction: "forward",
      segmentIds: ["transform.subtract-both-sides.3.visual.append-after-shift"],
      annotationIdsByPlacement: {
        before: [],
        during: [],
        after: ["pause.after-subtract"]
      }
    },
    {
      id: "solve-x.visual.forward.1",
      direction: "forward",
      segmentIds: ["transform.cancel-additive-inverse.visual.cancelation"],
      annotationIdsByPlacement: {
        before: [],
        during: ["focus.cancel"],
        after: []
      }
    }
  ]);
  assert.deepEqual(timeline.rewindPhases, [
    {
      id: "solve-x.visual.rewind.0",
      direction: "rewind",
      segmentIds: ["transform.cancel-additive-inverse.visual.cancelation"],
      annotationIdsByPlacement: {
        before: [],
        during: ["focus.cancel"],
        after: []
      }
    },
    {
      id: "solve-x.visual.rewind.1",
      direction: "rewind",
      segmentIds: ["transform.subtract-both-sides.3.visual.append-after-shift"],
      annotationIdsByPlacement: {
        before: ["pause.after-subtract"],
        during: [],
        after: []
      }
    }
  ]);
  assert.deepEqual(checkTransformTreeVisualMotifRewindLaw(timeline), {
    lawId: "transform-tree-visual-motif.rewind-phase-mirror",
    passed: true,
    failures: []
  });
});

test("createTransformTreeVisualMotifTimeline keeps parallel leaves in one motif phase", () => {
  const row1 = createSemanticTransformationRef({
    id: "dot.row1",
    kind: "dotProduct",
    sourceObjectIds: ["matrix.row1", "vector"],
    targetObjectIds: ["entry.row1"],
    preserves: ["value", "structure"]
  });
  const row2 = createSemanticTransformationRef({
    id: "dot.row2",
    kind: "dotProduct",
    sourceObjectIds: ["matrix.row2", "vector"],
    targetObjectIds: ["entry.row2"],
    preserves: ["value", "structure"]
  });
  const tree = createEditableSemanticTransformationTree({
    root: createSemanticTransformationParallel({
      id: "matrix-vector.rows",
      label: "Matrix-vector rows",
      children: [
        createSemanticTransformationLeaf(row1),
        createSemanticTransformationLeaf(row2)
      ]
    })
  });
  const timeline = createTransformTreeVisualMotifTimeline({
    id: "matrix-vector.visual",
    tree,
    rules
  });

  assert.deepEqual(timeline.forwardPhases.map((phase) => phase.segmentIds), [
    [
      "dot.row1.visual.simplify-into",
      "dot.row2.visual.simplify-into"
    ]
  ]);
  assert.deepEqual(timeline.rewindPhases.map((phase) => phase.segmentIds), [
    [
      "dot.row1.visual.simplify-into",
      "dot.row2.visual.simplify-into"
    ]
  ]);
});

test("default equation visual motif rules map wrap and unwrap transforms", () => {
  const wrap = createSemanticTransformationRef({
    id: "transform.wrap-function",
    kind: "wrapFunction",
    sourceObjectIds: ["expression.x"],
    targetObjectIds: ["expression.f-of-x"],
    preserves: ["identity", "role"]
  });
  const unwrap = createSemanticTransformationRef({
    id: "transform.unwrap-function",
    kind: "unwrapFunction",
    sourceObjectIds: ["expression.f-of-x"],
    targetObjectIds: ["expression.x"],
    preserves: ["identity", "role"]
  });
  const tree = createEditableSemanticTransformationTree({
    root: createSemanticTransformationSequence({
      id: "wrap-unwrap.sequence",
      label: "Wrap then unwrap",
      children: [
        createSemanticTransformationLeaf(wrap),
        createSemanticTransformationLeaf(unwrap)
      ]
    })
  });

  const timeline = createTransformTreeVisualMotifTimeline({
    id: "wrap-unwrap.visual",
    tree,
    rules: defaultEquationTransformVisualMotifRules
  });

  assert.deepEqual(
    timeline.segments.map((segment) => [
      segment.transformationKind,
      segment.motifKind,
      segment.motionPrimitiveIds,
      segment.phaseIds
    ]),
    [
      [
        "wrapFunction",
        "wrap",
        ["wrap"],
        ["wrapped-token-shift", "wrap-artifact-enter"]
      ],
      [
        "unwrapFunction",
        "unwrap",
        ["unwrap"],
        ["unwrap-artifact-exit", "wrapped-token-shift"]
      ]
    ]
  );
  assert.deepEqual(timeline.rewindPhases.map((phase) => phase.segmentIds), [
    ["transform.unwrap-function.visual.unwrap"],
    ["transform.wrap-function.visual.wrap"]
  ]);
});

test("default equation visual motif rules cover promoted generated transform definitions", () => {
  assert.deepEqual(checkGeneratedAlgebraEquationVisualMotifDefaultCoverage(), {
    lawId: "equation-visual-motif.generated-transform-default-coverage",
    passed: true,
    failures: []
  });
  assert.deepEqual(
    defaultEquationTransformVisualMotifRules
      .filter((rule) => (rule.definitionIds ?? []).length > 0)
      .map((rule) => [
        rule.transformationKind,
        rule.descriptor.kind,
        rule.definitionIds
      ]),
    [
      [
        "subtractBothSides",
        "append-after-shift",
        ["definition.generated.linear-solve.subtract-both-sides"]
      ],
      [
        "addBothSides",
        "append-after-shift",
        ["definition.generated.linear-solve.add-both-sides"]
      ],
      [
        "cancelAdditiveInverses",
        "cancelation",
        ["definition.generated.linear-solve.cancel-additive-inverses"]
      ],
      [
        "simplifyConstantDifference",
        "simplify-into",
        ["definition.generated.linear-solve.simplify-constant-difference"]
      ],
      [
        "simplifyConstantSum",
        "simplify-into",
        ["definition.generated.linear-solve.simplify-constant-sum"]
      ],
      [
        "divideBothSides",
        "append-after-shift",
        ["definition.generated.linear-solve.divide-both-sides"]
      ],
      [
        "cancelMultiplicativeInverses",
        "cancelation",
        ["definition.generated.linear-solve.cancel-multiplicative-inverses"]
      ],
      [
        "simplifyConstantQuotient",
        "simplify-into",
        ["definition.generated.linear-solve.simplify-constant-quotient"]
      ],
      [
        "splitFractionFactors",
        "artifact-replace",
        ["definition.generated.fraction-expression.split-fraction-factors"]
      ],
      [
        "mergeFractionCommonFactor",
        "artifact-replace",
        ["definition.generated.fraction-expression.merge-common-factor"]
      ],
      [
        "simplifyUnitFractionFactor",
        "simplify-into",
        ["definition.generated.fraction-expression.simplify-unit-factor"]
      ],
      [
        "lowerExponent",
        "append-after-shift",
        ["definition.generated.exponent.lower-exponent"]
      ],
      [
        "unwrapUnitExponent",
        "unwrap",
        ["definition.generated.exponent.unwrap-unit-exponent"]
      ],
      [
        "rewritePowerAsRoot",
        "artifact-replace",
        ["definition.generated.radical.rewrite-power-as-root"]
      ],
      [
        "wrapFunction",
        "wrap",
        ["definition.generated.function-wrap.wrap-function"]
      ],
      [
        "distributeMultiplication",
        "artifact-replace",
        ["definition.generated.distribution.distribute-multiplication"]
      ],
      [
        "factorCommonTerm",
        "simplify-into",
        ["definition.generated.distribution.factor-common-term"]
      ]
    ]
  );
});

test("default equation visual motif coverage law reports missing promoted definitions", () => {
  assert.deepEqual(
    checkGeneratedAlgebraEquationVisualMotifDefaultCoverage({
      definitions: listGeneratedAlgebraTransformDefinitions(),
      rules: defaultEquationTransformVisualMotifRules.filter(
        (rule) => rule.transformationKind !== "cancelAdditiveInverses"
      )
    }),
    {
      lawId: "equation-visual-motif.generated-transform-default-coverage",
      passed: false,
      failures: [
        {
          path:
            "definitions[definition.generated.linear-solve.cancel-additive-inverses]",
          message:
            "Promoted generated transform definition definition.generated.linear-solve.cancel-additive-inverses must have a default equation visual motif rule."
        }
      ]
    }
  );
});

test("equation cancelation visual motif contract accepts generated cancellation defaults", () => {
  assert.deepEqual(checkEquationCancelationVisualMotifContract(), {
    lawId: "equation-visual-motif.cancelation-contract",
    passed: true,
    failures: []
  });
});

test("equation cancelation visual motif contract reports non-cancelation defaults", () => {
  assert.deepEqual(
    checkEquationCancelationVisualMotifContract({
      rules: defaultEquationTransformVisualMotifRules.map((rule) =>
        rule.transformationKind === "cancelMultiplicativeInverses"
          ? {
              ...rule,
              descriptor: {
                ...rule.descriptor,
                kind: "simplify-into"
              }
            }
          : rule
      )
    }),
    {
      lawId: "equation-visual-motif.cancelation-contract",
      passed: false,
      failures: [
        {
          path: "rules[cancelMultiplicativeInverses].descriptor.kind",
          message:
            "Generated cancelation transform definition definition.generated.linear-solve.cancel-multiplicative-inverses mapped to simplify-into, expected cancelation."
        }
      ]
    }
  );
});

test("visual motif rewind law reports non-mirrored phase order", () => {
  const subtract = createSemanticTransformationRef({
    id: "transform.subtract-both-sides.3",
    kind: "subtractBothSides",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.with-inverses"],
    preserves: ["value", "structure"]
  });
  const cancel = createSemanticTransformationRef({
    id: "transform.cancel-additive-inverse",
    kind: "cancelAdditiveInverse",
    sourceObjectIds: ["equation.with-inverses"],
    targetObjectIds: ["equation.simplified-left"],
    preserves: ["value"]
  });
  const timeline = createTransformTreeVisualMotifTimeline({
    id: "solve-x.visual",
    tree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationSequence({
        id: "solve-x.sequence",
        label: "Solve x",
        children: [
          createSemanticTransformationLeaf(subtract),
          createSemanticTransformationLeaf(cancel)
        ]
      })
    }),
    rules
  });

  assert.deepEqual(
    checkTransformTreeVisualMotifRewindLaw({
      ...timeline,
      rewindPhases: timeline.forwardPhases.map((phase) => ({
        ...phase,
        direction: "rewind" as const,
        id: phase.id.replace(".forward.", ".rewind.")
      }))
    }),
    {
      lawId: "transform-tree-visual-motif.rewind-phase-mirror",
      passed: false,
      failures: [
        {
          path: "solve-x.visual.rewindPhases",
          message:
            "Visual motif timeline solve-x.visual rewind phases must mirror forward phase segment order."
        }
      ]
    }
  );
});

test("createTransformTreeVisualMotifTimeline rejects unmapped transformation kinds", () => {
  const tree = createEditableSemanticTransformationTree({
    root: createSemanticTransformationLeaf(
      createSemanticTransformationRef({
        id: "transform.unknown",
        kind: "unknownTransform",
        sourceObjectIds: ["a"],
        targetObjectIds: ["b"],
        preserves: ["value"]
      })
    )
  });

  assert.throws(
    () =>
      createTransformTreeVisualMotifTimeline({
        id: "unknown.visual",
        tree,
        rules
      }),
    /No visual motif rule for transformation kind unknownTransform/
  );
});
