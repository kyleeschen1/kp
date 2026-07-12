import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpBehavior
} from "../src/semantic/asset-behavior.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf
} from "../src/semantic/asset-diagram.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  checkKpBehaviorDeterminism,
  checkKpBehaviorReparameterization,
  checkKpAssetFixtureReferenceClosure,
  checkKpDiagramRewindLaw,
  checkKpDiagramSequenceAssociativityLaw,
  checkKpEquationFrameSelectorCorrespondenceClosure,
  checkKpFlashcardReferenceClosure,
  checkKpInterpreterLossDiagnostics,
  checkKpRendererFrameSemanticPreservation
} from "../src/semantic/asset-laws.ts";
import {
  createKpTransformationDrillDownHook
} from "../src/semantic/asset-decomposition.ts";
import { createKpFlashcardSpec } from "../src/semantic/asset-flashcard.ts";
import type { KpInterpretation } from "../src/semantic/asset-interpreter.ts";
import type { KpEquationFrame } from "../src/semantic/equation-frame-interpreter.ts";

test("checkKpBehaviorDeterminism passes repeated equivalent samples", () => {
  const behavior = createKpBehavior({
    id: "behavior.deterministic",
    durationMs: 1000,
    sample: ({ progress }) => ({
      phase: progress < 0.5 ? "first" : "second",
      progress
    })
  });

  assert.deepEqual(checkKpBehaviorDeterminism(behavior, [0, 250, 750]), {
    lawId: "behavior.determinism",
    passed: true,
    failures: []
  });
});

test("checkKpBehaviorDeterminism reports changing samples", () => {
  let count = 0;
  const behavior = createKpBehavior({
    id: "behavior.nondeterministic",
    durationMs: 1000,
    sample: () => ({
      count: count++
    })
  });

  assert.deepEqual(checkKpBehaviorDeterminism(behavior, [250]), {
    lawId: "behavior.determinism",
    passed: false,
    failures: [
      {
        path: "samples[0]",
        message:
          "Behavior behavior.nondeterministic produced different frames for time 250."
      }
    ]
  });
});

test("checkKpDiagramRewindLaw validates exact reverse phase ordering", () => {
  const first = createKpSemanticTransformation({
    id: "transform.first",
    transformType: "subtractBothSides",
    title: "First",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.with-inverses"],
    preserves: ["value"]
  });
  const second = createKpSemanticTransformation({
    id: "transform.second",
    transformType: "cancel",
    title: "Second",
    sourceObjectIds: ["equation.with-inverses"],
    targetObjectIds: ["equation.done"],
    preserves: ["value"]
  });
  const diagram = createKpSemanticDiagramSequence({
    id: "diagram.linear-solve",
    title: "Linear solve",
    children: [
      createKpTransformationDiagramLeaf(first),
      createKpTransformationDiagramLeaf(second)
    ]
  });

  assert.deepEqual(checkKpDiagramRewindLaw(diagram), {
    lawId: "diagram.rewind",
    passed: true,
    failures: []
  });
});

test("checkKpBehaviorReparameterization validates normalized samples", () => {
  const behavior = createKpBehavior({
    id: "behavior.original",
    durationMs: 1000,
    sample: ({ progress }) => ({
      phase: progress < 0.5 ? "move" : "settle"
    })
  });

  assert.deepEqual(checkKpBehaviorReparameterization(behavior, 3000, [0, 0.25, 1]), {
    lawId: "behavior.reparameterization",
    passed: true,
    failures: []
  });
});

test("checkKpEquationFrameSelectorCorrespondenceClosure validates frame-local selector pairs", () => {
  const frame = equationFrame({
    selectorIds: ["equation.initial.x", "equation.next.x"],
    correspondence: [
      {
        sourceSelectorId: "equation.initial.x",
        targetSelectorId: "equation.next.x",
        preserves: ["identity"]
      }
    ]
  });

  assert.deepEqual(checkKpEquationFrameSelectorCorrespondenceClosure(frame), {
    lawId: "equation-frame.selector-correspondence-closure",
    passed: true,
    failures: []
  });
});

test("checkKpEquationFrameSelectorCorrespondenceClosure reports missing frame selectors", () => {
  const frame = equationFrame({
    selectorIds: ["equation.initial.x"],
    correspondence: [
      {
        sourceSelectorId: "equation.initial.x",
        targetSelectorId: "equation.next.x",
        preserves: ["identity"]
      }
    ]
  });

  assert.deepEqual(checkKpEquationFrameSelectorCorrespondenceClosure(frame), {
    lawId: "equation-frame.selector-correspondence-closure",
    passed: false,
    failures: [
      {
        path: "selectorCorrespondenceRefs[0].targetSelectorId",
        message:
          "Equation frame frame.sample correspondence references missing target selector equation.next.x."
      }
    ]
  });
});

test("checkKpDiagramSequenceAssociativityLaw validates equivalent regrouping", () => {
  const first = createKpSemanticTransformation({
    id: "transform.first",
    transformType: "first",
    title: "First",
    sourceObjectIds: ["equation.a"],
    targetObjectIds: ["equation.b"],
    preserves: ["value"]
  });
  const second = createKpSemanticTransformation({
    id: "transform.second",
    transformType: "second",
    title: "Second",
    sourceObjectIds: ["equation.b"],
    targetObjectIds: ["equation.c"],
    preserves: ["value"]
  });
  const third = createKpSemanticTransformation({
    id: "transform.third",
    transformType: "third",
    title: "Third",
    sourceObjectIds: ["equation.c"],
    targetObjectIds: ["equation.d"],
    preserves: ["value"]
  });
  const leftAssociated = createKpSemanticDiagramSequence({
    id: "diagram.left-associated",
    title: "Left associated",
    children: [
      createKpSemanticDiagramSequence({
        id: "diagram.first-second",
        title: "First then second",
        children: [
          createKpTransformationDiagramLeaf(first),
          createKpTransformationDiagramLeaf(second)
        ]
      }),
      createKpTransformationDiagramLeaf(third)
    ]
  });
  const rightAssociated = createKpSemanticDiagramSequence({
    id: "diagram.right-associated",
    title: "Right associated",
    children: [
      createKpTransformationDiagramLeaf(first),
      createKpSemanticDiagramSequence({
        id: "diagram.second-third",
        title: "Second then third",
        children: [
          createKpTransformationDiagramLeaf(second),
          createKpTransformationDiagramLeaf(third)
        ]
      })
    ]
  });

  assert.deepEqual(
    checkKpDiagramSequenceAssociativityLaw(leftAssociated, rightAssociated),
    {
      lawId: "diagram.sequence-associativity",
      passed: true,
      failures: []
    }
  );
});

test("checkKpAssetFixtureReferenceClosure reports unresolved fixture references", () => {
  const bundle = createKpAssetBundle({
    id: "asset.fixture-law",
    title: "Fixture law",
    objects: [
      createKpSemanticAssetObject({
        id: "equation.initial",
        objectType: "equation",
        title: "Initial",
        value: { latex: "x + 3 = 7" },
        selectors: [{ id: "equation.initial.x", kind: "term", label: "x" }]
      }),
      createKpSemanticAssetObject({
        id: "equation.next",
        objectType: "equation",
        title: "Next",
        value: { latex: "x = 4" },
        selectors: [{ id: "equation.next.x", kind: "term", label: "x" }]
      })
    ]
  });
  const transformation = createKpSemanticTransformation({
    id: "transform.subtract",
    transformType: "subtractBothSides",
    title: "Subtract",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.next"],
    preserves: ["value"]
  });
  const diagramOnlyTransformation = createKpSemanticTransformation({
    id: "transform.diagram-missing",
    transformType: "diagramOnly",
    title: "Diagram only",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.next"],
    preserves: ["value"]
  });
  const hook = createKpTransformationDrillDownHook({
    id: "drilldown.bad",
    transformationId: "transform.hook-missing",
    title: "Bad hook",
    asset: createKpAssetBundle({
      id: "asset.hook",
      title: "Hook",
      objects: []
    })
  });
  const card = createKpFlashcardSpec({
    id: "card.bad",
    kind: "predict-next",
    title: "Bad card",
    assetId: "asset.fixture-law",
    prompt: "What transform is missing?",
    transformationIds: ["transform.card-missing"]
  });

  assert.deepEqual(
    checkKpAssetFixtureReferenceClosure({
      bundle,
      transformations: [transformation],
      diagram: createKpTransformationDiagramLeaf(diagramOnlyTransformation),
      drillDownHooks: [hook],
      flashcards: [card],
      trace: {
        id: "trace.bad",
        steps: [
          {
            id: "trace.bad.step",
            transformationId: "transform.trace-missing"
          }
        ]
      }
    }),
    {
      lawId: "asset-fixture.reference-closure",
      passed: false,
      failures: [
        {
          path: "diagram.forwardPhases[0][0]",
          message:
            "Diagram transform.diagram-missing references missing transformation transform.diagram-missing."
        },
        {
          path: "drillDownHooks.hooks[0].transformationId",
          message:
            "Drill-down hook drilldown.bad references missing transformation transform.hook-missing."
        },
        {
          path: "flashcards[0].transformationIds[0]",
          message:
            "Flashcard card.bad references missing transformation transform.card-missing."
        },
        {
          path: "trace.steps[0].transformationId",
          message:
            "Trace trace.bad step trace.bad.step references missing transformation transform.trace-missing."
        }
      ]
    }
  );
});

test("checkKpRendererFrameSemanticPreservation reports clock and semantic drift", () => {
  const semanticFrame = equationFrame({
    selectorIds: ["equation.initial.x"],
    correspondence: [
      {
        sourceSelectorId: "equation.initial.x",
        targetSelectorId: "equation.next.x",
        preserves: ["identity"]
      }
    ]
  });
  const driftedFrame = {
    ...semanticFrame,
    activeTransformationIds: ["transform.active"],
    transformationRefs: [
      {
        transformationId: "transform.other",
        sourceObjectIds: ["equation.initial"],
        targetObjectIds: ["equation.next"],
        progress: 0.75
      }
    ],
    inspection: {
      behaviorId: "behavior.sample",
      timeMs: 500,
      progress: 0.5,
      phaseId: "transform.inspected",
      activeTransformationIds: ["transform.active"],
      activeSelectorIds: ["equation.initial.x"]
    }
  };

  assert.deepEqual(
    checkKpRendererFrameSemanticPreservation({
      progress: 0.5,
      cardProgress: 0.5,
      transitionProgress: 0.25,
      equationFrame: { progress: 0.5 },
      semanticFrame: driftedFrame
    }),
    {
      lawId: "renderer-frame.semantic-preservation",
      passed: false,
      failures: [
        {
          path: "equationFrame.progress",
          message:
            "Renderer equation motion progress 0.5 does not match transition progress 0.25."
        },
        {
          path: "semanticFrame.transformationRefs",
          message:
            "Semantic frame frame.sample active transformations must match transformation refs."
        },
        {
          path: "semanticFrame.selectorCorrespondenceRefs[0].targetSelectorId",
          message:
            "Equation frame frame.sample correspondence references missing target selector equation.next.x."
        },
        {
          path: "semanticFrame.inspection.phaseId",
          message:
            "Semantic frame frame.sample inspection phase transform.inspected must match active transformation transform.active."
        }
      ]
    }
  );
});

test("checkKpInterpreterLossDiagnostics validates explicit composition loss diagnostics", () => {
  const interpretation: KpInterpretation<unknown> = {
    interpreterId: "interpreter.frame-sequence",
    target: "frame-sequence",
    inputKind: "semantic-diagram",
    preservation: "lossy",
    output: { frames: [] },
    diagnostics: [
      {
        severity: "warning",
        code: "composition-flattened",
        message: "Nested semantic diagram groups were flattened for export.",
        lossKind: "composition",
        path: "diagram.children"
      }
    ]
  };

  assert.deepEqual(checkKpInterpreterLossDiagnostics(interpretation), {
    lawId: "interpreter.loss-reporting",
    passed: true,
    failures: []
  });
});

test("checkKpInterpreterLossDiagnostics reports silent and unnamed losses", () => {
  const silent: KpInterpretation<unknown> = {
    interpreterId: "interpreter.silent",
    target: "custom",
    inputKind: "asset-bundle",
    preservation: "lax",
    output: {},
    diagnostics: []
  };
  const unnamed: KpInterpretation<unknown> = {
    interpreterId: "interpreter.unnamed-loss",
    target: "katex-dom",
    inputKind: "asset-bundle",
    preservation: "lossy",
    output: {},
    diagnostics: [
      {
        severity: "error",
        code: "selector-dropped",
        message: "A selector was dropped during interpretation."
      }
    ]
  };
  const strictWithLoss: KpInterpretation<unknown> = {
    interpreterId: "interpreter.strict-loss",
    target: "dashboard",
    inputKind: "asset-bundle",
    preservation: "strict",
    output: {},
    diagnostics: [
      {
        severity: "info",
        code: "identity-dropped",
        message: "Identity was dropped despite strict preservation.",
        lossKind: "identity"
      }
    ]
  };

  assert.deepEqual(checkKpInterpreterLossDiagnostics(silent), {
    lawId: "interpreter.loss-reporting",
    passed: false,
    failures: [
      {
        path: "diagnostics",
        message:
          "Interpreter interpreter.silent must report diagnostics when preservation is lax."
      }
    ]
  });
  assert.deepEqual(checkKpInterpreterLossDiagnostics(unnamed), {
    lawId: "interpreter.loss-reporting",
    passed: false,
    failures: [
      {
        path: "diagnostics[0].lossKind",
        message:
          "Interpreter interpreter.unnamed-loss diagnostic selector-dropped must name the loss kind."
      }
    ]
  });
  assert.deepEqual(checkKpInterpreterLossDiagnostics(strictWithLoss), {
    lawId: "interpreter.loss-reporting",
    passed: false,
    failures: [
      {
        path: "preservation",
        message:
          "Interpreter interpreter.strict-loss cannot claim strict preservation while reporting loss diagnostics."
      }
    ]
  });
});

test("checkKpFlashcardReferenceClosure validates referenced asset entities", () => {
  const context = flashcardContext();
  const card = createKpFlashcardSpec({
    id: "card.sample",
    kind: "cloze",
    title: "Hide the constant term",
    assetId: "asset.flashcard-law",
    prompt: "What term is hidden?",
    objectIds: ["equation.initial"],
    selectorIds: ["equation.initial.plus3"],
    transformationIds: ["transform.subtract"],
    answer: {
      kind: "selector",
      value: "equation.initial.plus3"
    }
  });

  assert.deepEqual(checkKpFlashcardReferenceClosure(card, context), {
    lawId: "flashcard.reference-closure",
    passed: true,
    failures: []
  });
});

test("checkKpFlashcardReferenceClosure reports unresolved references", () => {
  const card = createKpFlashcardSpec({
    id: "card.bad",
    kind: "predict-next",
    title: "Bad flashcard refs",
    assetId: "asset.other",
    prompt: "What happens next?",
    selectorIds: ["selector.missing"],
    transformationIds: ["transform.missing"]
  });

  assert.deepEqual(
    checkKpFlashcardReferenceClosure(card, flashcardContext()),
    {
      lawId: "flashcard.reference-closure",
      passed: false,
      failures: [
        {
          path: "assetId",
          message:
            "Flashcard card.bad references asset asset.other but validation context is asset.flashcard-law."
        },
        {
          path: "selectorIds[0]",
          message: "Flashcard card.bad references missing selector selector.missing."
        },
        {
          path: "transformationIds[0]",
          message:
            "Flashcard card.bad references missing transformation transform.missing."
        }
      ]
    }
  );
});

function equationFrame(input: {
  readonly selectorIds: readonly string[];
  readonly correspondence: KpEquationFrame["selectorCorrespondenceRefs"];
}): KpEquationFrame {
  return {
    id: "frame.sample",
    assetId: "asset.sample",
    progress: 0.5,
    surface: "katex-dom",
    activeTransformationIds: ["transform.sample"],
    objectRefs: [],
    transformationRefs: [],
    selectorRefs: input.selectorIds.map((selectorId) => ({
      selectorId,
      objectId: selectorId.split(".").slice(0, 2).join("."),
      role: "persistent"
    })),
    selectorCorrespondenceRefs: input.correspondence,
    diagnostics: []
  };
}

function flashcardContext() {
  const bundle = createKpAssetBundle({
    id: "asset.flashcard-law",
    title: "Flashcard law fixture",
    objects: [
      createKpSemanticAssetObject({
        id: "equation.initial",
        objectType: "equation",
        title: "Initial equation",
        value: { latex: "x + 3 = 7" },
        selectors: [
          { id: "equation.initial.x", kind: "term", label: "x" },
          { id: "equation.initial.plus3", kind: "term", label: "+3" }
        ]
      })
    ]
  });
  const transformation = createKpSemanticTransformation({
    id: "transform.subtract",
    transformType: "subtractBothSides",
    title: "Subtract 3",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.next"],
    preserves: ["value"]
  });

  return {
    bundle,
    transformations: [transformation]
  };
}
