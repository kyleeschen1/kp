import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEditorAnimationLibrary,
  selectKpEditorAnimationDescriptor
} from "../src/editor/animation-library.ts";
import {
  kpEditorAnimationSelectionHref,
  readKpEditorAnimationSelection,
  writeKpEditorAnimationSelection
} from "../src/editor/animation-selection-route.ts";
import {
  createInitialEditorDocument,
  renderEditorDocument
} from "../src/editor/editor.ts";

test("editor renders every concrete asset through a stable descriptor selection", () => {
  const descriptors = createKpEditorAnimationLibrary();
  const selected = descriptors.find(
    (descriptor) => descriptor.animationId ===
      "animation.graph.surface-mode.mesh-to-donut"
  )!;
  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: selected.id
  });

  assert.equal(descriptors.length, 41);
  assert.match(html, /data-kp-editor-animation-library/);
  assert.match(
    html,
    new RegExp(`data-kp-editor-animation-descriptor-id="${selected.id.replaceAll(".", "\\.")}"`)
  );
  assert.match(
    html,
    new RegExp(`option value="${selected.id.replaceAll(".", "\\.")}" selected`)
  );
  assert.match(html, /data-kp-editor-animation-surface="graph"/);
});

test("editor selection falls back to the first concrete descriptor", () => {
  const descriptors = createKpEditorAnimationLibrary();

  assert.equal(
    selectKpEditorAnimationDescriptor(descriptors, "unknown").id,
    descriptors[0]?.id
  );
});

test("fraction simplification is selectable through its family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId ===
      "sample.animation.fraction-simplification.basic"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.generated\.fraction-expression\.two-fourths"/
  );
  assert.match(html, /family\.algebra\.fraction-simplification/);
  assert.match(
    html,
    /option value="editor-animation\.sample\.animation\.fraction-simplification\.basic" selected/
  );
});

test("inequality sign flip is selectable through its family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId === "sample.animation.inequality.sign-flip.basic"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.inequality\.sign-flip\.basic"/
  );
  assert.match(html, /family\.algebra\.inequality/);
  assert.match(
    html,
    /option value="editor-animation\.sample\.animation\.inequality\.sign-flip\.basic" selected/
  );
});

test("derivative power rule is selectable through its calculus family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId === "sample.animation.derivative-rules.basic"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.generated\.calculus\.derivative\.power-rule-x-cubed"/
  );
  assert.match(html, /family\.calculus\.derivative-rules/);
  assert.match(
    html,
    /option value="editor-animation\.sample\.animation\.derivative-rules\.basic" selected/
  );
});

test("derivative tangent graph is selectable through its calculus family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId ===
      "sample.animation.derivative-rules.tangent-graph"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.derivative-rules\.tangent-graph"/
  );
  assert.match(html, /data-kp-editor-animation-surface="graph"/);
  assert.match(html, /family\.calculus\.derivative-rules/);
  assert.match(
    html,
    /option value="editor-animation\.sample\.animation\.derivative-rules\.tangent-graph" selected/
  );
});

test("FTC forms are selectable through their calculus family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId === "sample.animation.integral-ftc.basic"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.sample\.fundamental-theorem-calculus"/
  );
  assert.match(html, /family\.calculus\.integral-ftc/);
  assert.match(
    html,
    /option value="editor-animation\.sample\.animation\.integral-ftc\.basic" selected/
  );
});

test("integral area sweep is selectable through its calculus family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId === "sample.animation.integral-ftc.area-sweep"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.integral-ftc\.area-sweep"/
  );
  assert.match(html, /data-kp-editor-animation-surface="graph"/);
  assert.match(html, /family\.calculus\.integral-ftc/);
  assert.match(
    html,
    /option value="editor-animation\.sample\.animation\.integral-ftc\.area-sweep" selected/
  );
});

test("vector scaling is selectable through its linear-algebra family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId === "sample.animation.vector-add-scale.basic"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.graph\.vector\.linear-map-scale"/
  );
  assert.match(html, /family\.linear-algebra\.vector-add-scale/);
  assert.match(html, /data-kp-editor-animation-surface="graph"/);
});

test("dot projection is selectable through its linear-algebra family descriptor", () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.sampleId === "sample.animation.dot-projection.basic"
  );
  assert.ok(descriptor);

  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId: descriptor.id
  });

  assert.match(
    html,
    /data-kp-editor-animation-id="animation\.dot-projection\.basic"/
  );
  assert.match(html, /family\.linear-algebra\.dot-projection/);
  assert.match(html, /data-kp-editor-animation-surface="graph"/);
});

test("matrix products are selectable through concrete linear-algebra family descriptors", () => {
  const descriptors = createKpEditorAnimationLibrary();
  const samples = [
    {
      sampleId: "sample.animation.matrix-vector.basic",
      animationId:
        "animation.generated.linear-algebra.matrix-vector.two-by-two",
      familyId: "family.linear-algebra.matrix-vector"
    },
    {
      sampleId: "sample.animation.matrix-matrix.basic",
      animationId:
        "animation.generated.linear-algebra.matrix-matrix.two-by-two",
      familyId: "family.linear-algebra.matrix-matrix-composition"
    }
  ] as const;

  for (const sample of samples) {
    const descriptor = descriptors.find(
      (candidate) => candidate.sampleId === sample.sampleId
    );
    assert.ok(descriptor);
    assert.equal(descriptor.animationId, sample.animationId);

    const html = renderEditorDocument(createInitialEditorDocument(), {
      editorAnimationDescriptorId: descriptor.id
    });
    assert.match(html, /data-kp-editor-animation-surface="equation"/);
    assert.match(html, new RegExp(sample.familyId.replaceAll(".", "\\.")));
  }
});

test("editor animation routes preserve unrelated query and hash state", () => {
  const descriptorId = "editor-animation.animation.graph.sine-sweep";
  const search = writeKpEditorAnimationSelection("?dashboard=1", descriptorId);

  assert.equal(readKpEditorAnimationSelection(search), descriptorId);
  assert.equal(
    kpEditorAnimationSelectionHref({
      pathname: "/editor",
      search: "?dashboard=1",
      hash: "#preview",
      descriptorId
    }),
    "/editor?dashboard=1&animation=editor-animation.animation.graph.sine-sweep#preview"
  );
});
