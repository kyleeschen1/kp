import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";

import {
  createKpAnimationAssets
} from "../src/animation/catalog.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  compileKpGeneratedCancellationPresentation,
  kpGeneratedCancellationDraftSchemaVersion
} from "../src/animation/generated-cancellation-presentation-boundary.ts";
import {
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import {
  kpOperationPresentationPropertyAstShapes,
  kpOperationPresentationPropertyBrowserChecks,
  kpOperationPresentationPropertyBudget,
  kpOperationPresentationPropertyCases,
  kpOperationPresentationPropertyDirections,
  kpOperationPresentationPropertyFamilies,
  kpOperationPresentationPropertyNotationStructures,
  kpOperationPresentationPropertySeekPoints,
  kpOperationPresentationPropertyViewports
} from "../src/architecture/operation-presentation-property-coverage.ts";
import {
  inspectKpEquationPresentationOperation
} from "../src/reader/renderers/equation-presentation-catalog-conformance.ts";

const assets = new Map([
  ...createKpAnimationAssets(),
  createKpFractionCompositionEquationAnimationAsset(),
  createNumeratorSplitMergeEquationAnimationAsset(),
  createLinearSolveTeacherZeroAnimationAsset()
].map((animation) => [animation.id, animation]));

test("bounded property cases cover every declared semantic axis", () => {
  assert.ok(
    kpOperationPresentationPropertyCases.length <=
      kpOperationPresentationPropertyBudget.maxCases
  );
  assert.deepEqual(
    new Set(kpOperationPresentationPropertyCases.map(
      ({ astShape }) => astShape
    )),
    new Set(kpOperationPresentationPropertyAstShapes)
  );
  assert.deepEqual(
    new Set(kpOperationPresentationPropertyCases.map(
      ({ notationStructure }) => notationStructure
    )),
    new Set(kpOperationPresentationPropertyNotationStructures)
  );
  assert.deepEqual(
    new Set(kpOperationPresentationPropertyCases.map(
      ({ operationFamily }) => operationFamily
    )),
    new Set(kpOperationPresentationPropertyFamilies)
  );
  assert.deepEqual(
    kpOperationPresentationPropertyViewports.map(({ id }) => id),
    ["wide", "phone"]
  );
  assert.deepEqual(
    kpOperationPresentationPropertyBrowserChecks,
    [
      "npm run test:browser:canonical-reader-contract",
      "npm run visual:fraction-composition-canonical",
      "npm run perf:fraction-composition-scroll"
    ]
  );
});

test("every bounded case is direct-seek stable and exactly reversible", () => {
  const started = performance.now();
  let sampleCount = 0;

  for (const candidate of kpOperationPresentationPropertyCases) {
    const animation = assets.get(candidate.animationId);
    assert.ok(animation, candidate.animationId);
    const byDirection = new Map<string, ReturnType<
      typeof inspectKpEquationPresentationOperation
    >["entry"]>();

    for (const direction of kpOperationPresentationPropertyDirections) {
      let baseline:
        Omit<ReturnType<
          typeof inspectKpEquationPresentationOperation
        >["entry"], "progress"> | undefined;
      for (const progress of kpOperationPresentationPropertySeekPoints) {
        const result = inspectKpEquationPresentationOperation({
          animation: animation!,
          transformationId: candidate.transformationId,
          direction,
          progress
        });
        sampleCount += 1;
        assert.equal(
          result.issue?.code,
          candidate.expectedIssueCode,
          candidate.id
        );
        assert.equal(result.entry.status, candidate.expectedStatus);
        assert.equal(result.entry.planKind, candidate.expectedPlanKind);
        assert.equal(
          result.entry.operationPlanKind,
          candidate.expectedOperationPlanKind
        );
        const { progress: _progress, ...stable } = result.entry;
        if (baseline === undefined) baseline = stable;
        assert.deepEqual(stable, baseline, candidate.id);
        if (progress === 0.5) {
          byDirection.set(direction, result.entry);
        }
      }
    }

    const forward = byDirection.get("forward")!;
    const rewind = byDirection.get("rewind")!;
    assert.deepEqual(
      forward.sourceObjectIds,
      rewind.targetObjectIds,
      candidate.id
    );
    assert.deepEqual(
      forward.targetObjectIds,
      rewind.sourceObjectIds,
      candidate.id
    );
  }

  assert.equal(
    sampleCount,
    kpOperationPresentationPropertyBudget.expectedPlanSamples
  );
  assert.ok(
    sampleCount <= kpOperationPresentationPropertyBudget.maxPlanSamples
  );
  assert.ok(
    performance.now() - started <=
      kpOperationPresentationPropertyBudget.maxUnitDurationMs
  );
});

test("generated cancellation AST shapes stay inside a finite compiler-owned grid", () => {
  const generated = [-5, -2, 1, 3].flatMap((coefficient) =>
    [-3, 0, 4].flatMap((solution) =>
      [undefined, 2].map((addend) => ({
        coefficient,
        solution,
        addend
      }))
    )
  );
  assert.ok(
    generated.length <=
      kpOperationPresentationPropertyBudget.maxGeneratedDrafts
  );

  for (const [index, candidate] of generated.entries()) {
    const result = compileKpGeneratedCancellationPresentation({
      schemaVersion: kpGeneratedCancellationDraftSchemaVersion,
      familyId: "generated.linear-solve",
      id: `generated.linear-solve.property-${index}`,
      title: `Generated property case ${index}`,
      variable: "x",
      coefficient: candidate.coefficient,
      ...(candidate.addend === undefined
        ? {}
        : { addend: candidate.addend }),
      solution: candidate.solution
    });
    assert.equal(result.kind, "accepted");
    if (result.kind !== "accepted") continue;
    assert.equal(
      result.presentations.length,
      candidate.addend === undefined ? 1 : 2
    );
    assert.ok(result.presentations.every(
      ({ plan }) => plan.planKind === "inverse-cancellation"
    ));
  }
});
