import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpProgrammingAdditionExemplarContract
} from "../src/animation/programming-addition-exemplar-contract.ts";
import { createProgramTraceAnimationAsset } from
  "../src/animation/programming-adapter.ts";
import {
  kpProgrammingAdditionAcceptance,
  kpProgrammingAdditionCurrentBaseline,
  kpProgrammingAdditionPreservationBoundary,
  kpProgrammingAdditionReferenceInventory
} from "../src/architecture/programming-addition-exemplar-inventory.ts";
import {
  createSourceRangeProvenance
} from "../src/semantic/source-file.ts";
import {
  createAdditionProgrammingExecutionTraceFixture
} from "../src/domain-ir/programming-addition-trace-fixture.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import { parseKpPromotionLedger } from
  "../scripts/check-animation-promotion-memory.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("addition hosting does not advance rank 6 or rank-23 BFS", () => {
  const ledger = parseKpPromotionLedger(readFileSync(
    join(projectRoot, "docs/project/threads/animation-library-promotion.md"),
    "utf8"
  ));
  const vector = ledger.find(({ rank }) => rank === 5);
  const matrix = ledger.find(({ rank }) => rank === 6);
  const programming = ledger.find(({ rank }) => rank === 23);

  assert.equal(vector?.stableId, "kp.promotion.vector-dot-projection");
  assert.equal(vector?.status, "promoted");
  assert.equal(matrix?.stableId, "kp.promotion.matrix-linear-map");
  assert.equal(matrix?.status, "next");
  assert.equal(
    programming?.stableId,
    kpProgrammingAdditionExemplarContract.promotionBoundary.deferredPromotionId
  );
  assert.equal(programming?.status, "later");
  assert.equal(
    programming?.canonicalExemplar,
    kpProgrammingAdditionExemplarContract.promotionBoundary.deferredExemplar
  );
  assert.equal(
    kpProgrammingAdditionExemplarContract.promotionBoundary
      .advancesStableFrontier,
    false
  );
});

test("the frozen source ranges retain exact revision and provenance", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();
  const contract = kpProgrammingAdditionExemplarContract;

  assert.equal(fixture.sourceFile.id, contract.source.sourceFileId);
  assert.equal(fixture.sourceFile.language, contract.source.language);
  assert.equal(fixture.sourceFile.revisionId, contract.source.revisionId);
  assert.equal(fixture.sourceFile.path, contract.source.path);
  assert.deepEqual(
    fixture.selectors.map((selector) => {
      const provenance = createSourceRangeProvenance(
        fixture.sourceFile,
        selector
      );
      return {
        selectorId: selector.id,
        start: [selector.start.line, selector.start.column],
        end: [selector.end.line, selector.end.column],
        exactText: provenance.text,
        textHash: provenance.textHash
      };
    }),
    contract.source.sourceRanges
  );
});

test("the four verified trace steps close every contracted state channel", () => {
  const fixture = createAdditionProgrammingExecutionTraceFixture();
  const contract = kpProgrammingAdditionExemplarContract;

  assert.equal(fixture.trace.traceId, contract.trace.traceId);
  assert.equal(fixture.trace.sharedClockId, contract.trace.sharedClockId);
  assert.deepEqual(
    fixture.trace.steps.map((step) => ({
      stepId: step.stepId,
      kind: step.kind,
      progress: step.progress,
      activeSelectorIds: step.selectorIds,
      stackFrameIds: step.stack.map(({ frameId }) => frameId),
      localNames: step.locals.map(({ name }) => name),
      output: step.output ?? []
    })),
    contract.trace.steps
  );
  assert.deepEqual(fixture.sample(0).output, []);
  assert.deepEqual(fixture.sample(0.5).activeSelectorIds, [
    "selector.programming.add.return"
  ]);
  assert.deepEqual(fixture.sample(1).output, ["4"]);
});

test("the stable asset and both exact catalogue callers meet the host seam", () => {
  const animation = createProgramTraceAnimationAsset();
  const descriptors = createKpEditorAnimationLibrary();
  const contract = kpProgrammingAdditionExemplarContract;

  assert.equal(animation.id, contract.animationId);
  assert.deepEqual(animation.renderTargets.map(({ kind }) => kind), [
    contract.host.slotKind
  ]);
  assert.equal(animation.metadata?.["placeholderContract"], false);
  for (const animationId of contract.host.coveredAnimationIds) {
    const descriptor = descriptors.find((candidate) =>
      candidate.animationId === animationId
    );
    assert.ok(descriptor, animationId);
    assert.ok(descriptor.renderTargetKinds.includes("programming"), animationId);
  }
  assert.equal(kpProgrammingAdditionCurrentBaseline.gapCount, 2);
});

test("the boundary reuses existing seams and prohibits runtime invention", () => {
  for (const reference of kpProgrammingAdditionReferenceInventory) {
    assert.equal(existsSync(join(projectRoot, reference.path)), true, reference.path);
    assert.ok(reference.role.length > 45, reference.path);
  }
  assert.ok(kpProgrammingAdditionAcceptance.some((criterion) =>
    criterion.includes("one shared player clock")
  ));
  assert.ok(kpProgrammingAdditionAcceptance.some((criterion) =>
    criterion.includes("no BFS")
  ));
  assert.deepEqual(
    kpProgrammingAdditionExemplarContract.authority.prohibited,
    [
      "arbitrary-code-execution",
      "live-language-runtime",
      "renderer-inferred-runtime-state",
      "eager-code-highlighting-dependency"
    ]
  );
  assert.ok(kpProgrammingAdditionPreservationBoundary.some((criterion) =>
    criterion.includes("rank-23 BFS deferral")
  ));
});
