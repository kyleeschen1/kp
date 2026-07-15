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

  assert.equal(descriptors.length, 31);
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
