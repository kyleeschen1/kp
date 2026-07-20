import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpEditorAnimationPickerModel
} from "../src/editor/animation-picker.ts";
import {
  acceptKpEditorAnimationPicker,
  cancelKpEditorAnimationPicker,
  createKpEditorAnimationPickerProtocolState,
  navigateKpEditorAnimationPicker,
  refreshKpEditorAnimationPicker
} from "../src/editor/animation-picker-protocol.ts";

test("picker navigation clamps and empty snapshots have no cursor identity", () => {
  const initial = createKpEditorAnimationPickerProtocolState(model([
    ["alpha", "Alpha"],
    ["beta", "Beta"]
  ]));
  const first = navigateKpEditorAnimationPicker(initial, "cursor.first");
  const beforeFirst = navigateKpEditorAnimationPicker(first, "cursor.previous");
  const last = navigateKpEditorAnimationPicker(beforeFirst, "cursor.last");
  const afterLast = navigateKpEditorAnimationPicker(last, "cursor.next");

  assert.equal(beforeFirst.cursorRowId, "alpha");
  assert.equal(beforeFirst.cursorIndex, 0);
  assert.equal(afterLast.cursorRowId, "beta");
  assert.equal(afterLast.cursorIndex, 1);
  assert.deepEqual(createKpEditorAnimationPickerProtocolState(model([])), {
    surfaceId: "kp.editor.animation-picker",
    providerId: "kp.editor.animation-descriptors",
    promptLabel: "Animation library",
    query: "",
    rows: [],
    cursorIndex: -1
  });
});

test("picker refresh reconciles the cursor by identity rather than label or index", () => {
  const initial = createKpEditorAnimationPickerProtocolState(model([
    ["alpha", "Alpha"],
    ["beta", "Beta"]
  ]), { cursorDescriptorId: "beta", query: "be" });
  const reordered = refreshKpEditorAnimationPicker(initial, model([
    ["beta", "Renamed beta"],
    ["alpha", "Alpha"]
  ]));
  const removed = refreshKpEditorAnimationPicker(reordered, model([
    ["alpha", "Alpha"]
  ]));

  assert.equal(reordered.cursorRowId, "beta");
  assert.equal(reordered.cursorIndex, 0);
  assert.equal(reordered.rows[0]?.label, "Renamed beta");
  assert.equal(reordered.query, "be");
  assert.equal(removed.cursorRowId, "alpha");
  assert.equal(removed.cursorIndex, 0);
});

test("picker selection keeps acceptance no-selection and cancellation distinct", () => {
  const selected = createKpEditorAnimationPickerProtocolState(model([
    ["alpha", "Alpha"]
  ]), { query: "al" });
  const empty = createKpEditorAnimationPickerProtocolState(model([]), {
    query: "missing"
  });

  assert.deepEqual(acceptKpEditorAnimationPicker(selected), {
    kind: "accepted",
    surfaceId: "kp.editor.animation-picker",
    providerId: "kp.editor.animation-descriptors",
    query: "al",
    command: "row.accept",
    key: "Enter",
    rowIds: ["alpha"]
  });
  assert.deepEqual(acceptKpEditorAnimationPicker(empty), {
    kind: "no-selection",
    surfaceId: "kp.editor.animation-picker",
    providerId: "kp.editor.animation-descriptors",
    query: "missing",
    command: "row.accept",
    key: "Enter"
  });
  assert.deepEqual(cancelKpEditorAnimationPicker(selected), {
    kind: "cancelled",
    surfaceId: "kp.editor.animation-picker",
    providerId: "kp.editor.animation-descriptors",
    query: "al",
    command: "row.cancel",
    key: "Escape"
  });
});

test("picker acceptance rejects stale cursor identity", () => {
  const state = createKpEditorAnimationPickerProtocolState(model([
    ["alpha", "Alpha"]
  ]));

  assert.equal(acceptKpEditorAnimationPicker({
    ...state,
    cursorRowId: "deleted"
  }).kind, "no-selection");
});

function model(rows: readonly (readonly [id: string, label: string])[]): KpEditorAnimationPickerModel {
  return {
    selectedDescriptorId: rows[0]?.[0],
    optionCount: rows.length,
    groups: rows.length === 0 ? [] : [{
      id: "test",
      label: "Test",
      options: rows.map(([descriptorId, label], index) => ({
        id: `option.${descriptorId}`,
        descriptorId,
        animationId: `animation.${descriptorId}`,
        label,
        index,
        selected: index === 0
      }))
    }]
  };
}
