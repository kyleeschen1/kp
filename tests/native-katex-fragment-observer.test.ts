import assert from "node:assert/strict";
import test from "node:test";

import {
  bindKpNativeKatexFragmentsWithinSemanticLineage,
  createKpNativeKatexFragmentObservationBatch,
  normalizeKpStageRelativeRect
} from "../src/rendering/native-katex-fragment-observer.ts";
import type {
  KpCanonicalLineageProjection
} from "../src/animation/canonical-operation-lineage-adapter.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const sourceElement = { ownerDocument } as HTMLElement;

function lineage(input: {
  sourceEntityIds: readonly string[];
  targetEntityIds: readonly string[];
}): KpCanonicalLineageProjection {
  return {
    kind: "canonical-lineage-projection",
    id: "lineage.solve-x",
    sourceEntityIds: input.sourceEntityIds,
    targetEntityIds: input.targetEntityIds,
    groups: [{
      id: "group.solve-x.x",
      kind: "one-to-one",
      relation: "persist",
      sourceEntityIds: input.sourceEntityIds,
      targetEntityIds: input.targetEntityIds,
      authority: {
        executionTransformationId: "transform.solve-x",
        operationSpecId: "kp.core.persist",
        lineageGraphId: "graph.solve-x",
        lineageEdgeId: "edge.solve-x.x"
      }
    }]
  };
}

function batch(
  id: string,
  semanticEntityId: string,
  glyphKey = "x"
) {
  return createKpNativeKatexFragmentObservationBatch({
    stage,
    fragments: [{
      id,
      semanticEntityId,
      motionId: `motion.${id}`,
      glyphKey,
      sourceElement,
      rect: { left: 12, top: 20, width: 14, height: 25 },
      styleFingerprint: "font:KaTeX_Math|size:24|weight:400",
      fontRevision: 2
    }]
  });
}

function batches(
  fragments: readonly {
    readonly id: string;
    readonly semanticEntityId: string;
    readonly glyphKey: string;
  }[]
) {
  return createKpNativeKatexFragmentObservationBatch({
    stage,
    fragments: fragments.map((fragment, index) => ({
      ...fragment,
      motionId: `motion.${fragment.id}`,
      sourceElement,
      rect: { left: 12 + index * 30, top: 20, width: 14, height: 25 },
      styleFingerprint: "font:KaTeX_Main|size:24|weight:400",
      fontRevision: 2
    }))
  });
}

test("native fragment observations are explicit renderer-session state", () => {
  const batch = createKpNativeKatexFragmentObservationBatch({
    stage,
    fragments: [{
      id: "fragment.solve-x.x",
      semanticEntityId: "equation.solve-x.before.x",
      motionId: "motion.solve-x.x",
      glyphKey: "x",
      sourceElement,
      rect: { left: 12, top: 20, width: 14, height: 25 },
      styleFingerprint: "font:KaTeX_Math|size:24|weight:400",
      fontRevision: 2
    }]
  });

  assert.equal(batch.kind, "native-katex-fragment-observation-batch");
  assert.equal(batch.lifecycle, "renderer-session");
  assert.strictEqual(batch.stage, stage);
  assert.strictEqual(batch.fragments[0]?.sourceElement, sourceElement);
  assert.equal(Object.isFrozen(batch.fragments[0]?.rect), true);
});

test("native fragment observations reject ambiguous identity and geometry", () => {
  const fragment = {
    id: "fragment.x",
    semanticEntityId: "entity.x",
    motionId: "motion.x",
    glyphKey: "x",
    sourceElement,
    rect: { left: 0, top: 0, width: 12, height: 20 },
    styleFingerprint: "font:KaTeX_Math",
    fontRevision: 0
  };
  assert.throws(
    () => createKpNativeKatexFragmentObservationBatch({
      stage,
      fragments: [fragment, fragment]
    }),
    /duplicated/
  );
  assert.throws(
    () => createKpNativeKatexFragmentObservationBatch({
      stage,
      fragments: [{
        ...fragment,
        rect: { ...fragment.rect, width: 0 }
      }]
    }),
    /positive width and height/
  );
  assert.throws(
    () => createKpNativeKatexFragmentObservationBatch({
      stage,
      fragments: [{
        ...fragment,
        sourceElement: { ownerDocument: {} } as HTMLElement
      }]
    }),
    /share the stage document/
  );
});

test("client rectangles normalize into stable stage-local coordinates", () => {
  const normalized = normalizeKpStageRelativeRect({
    stageClientRect: { left: 100, top: 50, width: 960, height: 360 },
    stageLayoutWidth: 640,
    stageLayoutHeight: 240,
    fragmentClientRect: { left: 250, top: 125, width: 30, height: 37.5 }
  });

  assert.deepEqual(normalized, {
    left: 100,
    top: 50,
    width: 20,
    height: 25
  });
  assert.throws(
    () => normalizeKpStageRelativeRect({
      stageClientRect: { left: 0, top: 0, width: 0, height: 240 },
      stageLayoutWidth: 640,
      stageLayoutHeight: 240,
      fragmentClientRect: { left: 0, top: 0, width: 10, height: 20 }
    }),
    /positive settled geometry/
  );
});

test("native fragments bind through canonical semantic lineage", () => {
  const result = bindKpNativeKatexFragmentsWithinSemanticLineage({
    lineage: lineage({
      sourceEntityIds: ["entity.before.x"],
      targetEntityIds: ["entity.after.x"]
    }),
    source: batch("fragment.before.x", "entity.before.x"),
    target: batch("fragment.after.x", "entity.after.x")
  });

  assert.equal(result.bindings.length, 1);
  assert.equal(result.bindings[0]?.source.id, "fragment.before.x");
  assert.equal(result.bindings[0]?.target.id, "fragment.after.x");
  assert.equal(result.bindings[0]?.glyphKey, "x");
  assert.deepEqual(result.multiplicity, []);
  assert.deepEqual(result.unmatchedSourceFragmentIds, []);
  assert.deepEqual(result.unmatchedTargetFragmentIds, []);
});

test("equal native glyphs cannot create identity outside canonical lineage", () => {
  assert.throws(
    () => bindKpNativeKatexFragmentsWithinSemanticLineage({
      lineage: lineage({
        sourceEntityIds: ["entity.before.x"],
        targetEntityIds: ["entity.after.x"]
      }),
      source: batch("fragment.before.x", "entity.before.x"),
      target: batch("fragment.unrelated.x", "entity.unrelated.x")
    }),
    /outside canonical lineage/
  );
});

test("native denominator fragments bind through declared many-to-one lineage", () => {
  const projection: KpCanonicalLineageProjection = {
    kind: "canonical-lineage-projection",
    id: "lineage.fraction-denominators",
    sourceEntityIds: ["denominator.left", "denominator.right"],
    targetEntityIds: ["denominator.merged"],
    groups: [{
      id: "group.fraction-denominators",
      kind: "many-to-one",
      relation: "merge",
      sourceEntityIds: ["denominator.left", "denominator.right"],
      targetEntityIds: ["denominator.merged"],
      authority: {
        executionTransformationId: "transform.merge-fractions",
        operationSpecId: "kp.core.merge",
        lineageGraphId: "graph.merge-fractions",
        lineageEdgeId: "edge.denominators-merge"
      }
    }]
  };
  const result = bindKpNativeKatexFragmentsWithinSemanticLineage({
    lineage: projection,
    source: batches([
      { id: "fragment.denominator.left", semanticEntityId: "denominator.left", glyphKey: "2" },
      { id: "fragment.denominator.right", semanticEntityId: "denominator.right", glyphKey: "2" }
    ]),
    target: batches([
      { id: "fragment.denominator.merged", semanticEntityId: "denominator.merged", glyphKey: "2" }
    ])
  });

  assert.equal(result.bindings.length, 0);
  assert.equal(result.multiplicity.length, 1);
  assert.equal(result.multiplicity[0]?.kind, "merge");
  assert.deepEqual(
    result.multiplicity[0]?.sources.map(({ id }) => id),
    ["fragment.denominator.left", "fragment.denominator.right"]
  );
  assert.deepEqual(
    result.multiplicity[0]?.targets.map(({ id }) => id),
    ["fragment.denominator.merged"]
  );
  assert.deepEqual(result.unmatchedSourceFragmentIds, []);
  assert.deepEqual(result.unmatchedTargetFragmentIds, []);
});
