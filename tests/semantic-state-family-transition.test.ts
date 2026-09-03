import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticStateSchema
} from "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import {
  createKpSemanticStateHandleSet
} from "../src/semantic-state/authoring-state-handles.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  compileKpSemanticStateTransitionPlan,
  declareKpSemanticStateDiscreteTransition,
  declareKpSemanticStateInterpolation,
  declareKpSemanticStatePresentationTransition,
  KpSemanticStateTransitionValidationError,
  type KpSemanticStateTransitionDeclaration,
  type KpSemanticStateTransitionDiagnostic
} from "../src/semantic-state/state-family-transition.ts";

test("transition modes compile into one serializable disjoint plan", () => {
  const fixture = createFixture("lesson.transition-modes");
  const semantic = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.transition-modes.amount",
    target: fixture.handles.refs.amount
  });
  const discrete = declareKpSemanticStateDiscreteTransition({
    id: "phase-change",
    sourceId: "lesson.transition-modes.phase",
    target: fixture.handles.refs.phase,
    changePoints: [{
      id: "tax-takes-effect",
      at: createKpSemanticProgress(1n, 2n),
      valueSourceId: "lesson.transition-modes.phase.taxed"
    }]
  });
  const presentation = declareKpSemanticStatePresentationTransition({
    id: "outcome-emphasis",
    sourceId: "lesson.transition-modes.outcome",
    target: fixture.handles.refs.outcome
  });
  const plan = compileKpSemanticStateTransitionPlan({
    compiled: fixture.compiled,
    declarations: [presentation, discrete, semantic]
  });

  assert.deepEqual(plan.declarations.map(projectMode), [
    "semantic:amount-interpolation",
    "presentation:outcome-emphasis",
    "discrete:phase-change@1/2"
  ]);
  const serialized = JSON.stringify(plan);
  assert.doesNotMatch(serialized, /function|compute|interpolator/u);
  assert.deepEqual(JSON.parse(serialized).declarations[0].target, {
    schemaVersion: "kp.semantic-state-transition-target.v1",
    kind: "semantic-state-transition-target",
    namespace: "lesson.transition-modes",
    slotId: fixture.handles.refs.amount.slotId,
    path: ["amount"],
    encodedPath: "amount",
    descriptorKind: "required-value"
  });
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.declarations), true);
  assert.equal(Object.isFrozen(discrete.changePoints), true);
});

test("declaration order cannot become transition order", () => {
  const fixture = createFixture("lesson.transition-order");
  const discrete = declareKpSemanticStateDiscreteTransition({
    id: "phase-change",
    sourceId: "lesson.transition-order.phase",
    target: fixture.handles.refs.phase,
    changePoints: [
      {
        id: "late",
        at: createKpSemanticProgress(3n, 4n),
        valueSourceId: "lesson.transition-order.phase.late"
      },
      {
        id: "early",
        at: createKpSemanticProgress(1n, 4n),
        valueSourceId: "lesson.transition-order.phase.early"
      }
    ]
  });

  assert.deepEqual(discrete.changePoints.map(({ id, at }) => ({ id, at })), [
    { id: "early", at: "1/4" },
    { id: "late", at: "3/4" }
  ]);
});

test("duplicate and foreign transition targets retain local diagnostics", () => {
  const fixture = createFixture("lesson.transition-local");
  const foreign = createFixture("lesson.transition-foreign");
  const declarations = [
    declareKpSemanticStateInterpolation({
      id: "amount-interpolation",
      sourceId: "lesson.transition-local.amount",
      target: fixture.handles.refs.amount
    }),
    declareKpSemanticStatePresentationTransition({
      id: "amount-emphasis",
      sourceId: "lesson.transition-local.amount-emphasis",
      target: fixture.handles.refs.amount
    }),
    declareKpSemanticStateDiscreteTransition({
      id: "foreign-phase",
      sourceId: "lesson.transition-foreign.phase",
      target: foreign.handles.refs.phase,
      changePoints: [{
        id: "foreign-change",
        at: createKpSemanticProgress(1n, 2n),
        valueSourceId: "lesson.transition-foreign.phase.changed"
      }]
    })
  ];

  assert.deepEqual(projectDiagnostics(validationDiagnostics(
    fixture.compiled,
    declarations
  )), [
    {
      code: "duplicate-transition-target",
      declarationId: "amount-emphasis",
      sourceId: "lesson.transition-local.amount-emphasis",
      transitionMode: "presentation-only",
      targetPath: ["amount"]
    },
    {
      code: "cross-schema-transition-target",
      declarationId: "foreign-phase",
      sourceId: "lesson.transition-foreign.phase",
      transitionMode: "discrete",
      targetPath: ["phase"]
    }
  ]);
});

function projectMode(declaration: KpSemanticStateTransitionDeclaration): string {
  switch (declaration.transitionMode) {
    case "semantic-interpolation":
      return `semantic:${declaration.id}`;
    case "discrete":
      return `discrete:${declaration.id}@${declaration.changePoints[0]?.at}`;
    case "presentation-only":
      return `presentation:${declaration.id}`;
    default:
      return assertNever(declaration);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected transition declaration ${String(value)}.`);
}

function createFixture(namespace: string) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    amount: kpStateValue(0),
    outcome: kpStateDerived<number>(),
    phase: kpStateValue<"before" | "after">("before")
  }));
  return {
    compiled,
    handles: createKpSemanticStateHandleSet(compiled)
  };
}

function validationDiagnostics(
  compiled: ReturnType<typeof createFixture>["compiled"],
  declarations: readonly KpSemanticStateTransitionDeclaration[]
): readonly KpSemanticStateTransitionDiagnostic[] {
  try {
    compileKpSemanticStateTransitionPlan({ compiled, declarations });
  } catch (error) {
    if (error instanceof KpSemanticStateTransitionValidationError) {
      return error.diagnostics;
    }
    throw error;
  }
  throw new Error("Expected transition declaration validation to fail.");
}

function projectDiagnostics(
  diagnostics: readonly KpSemanticStateTransitionDiagnostic[]
) {
  return diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    declarationId: diagnostic.declarationId,
    sourceId: diagnostic.sourceId,
    transitionMode: diagnostic.transitionMode,
    targetPath: diagnostic.targetPath
  }));
}
