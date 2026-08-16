import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpRendererThemeReference,
  kpLinearEquationExemplarThemeReference
} from "../src/rendering/renderer-theme-reference.ts";

test("renderer theme references expose stable framework-neutral identity", () => {
  assert.deepEqual(kpLinearEquationExemplarThemeReference, {
    id: "kp.concept-room.linear-equation-exemplar.v1"
  });
  assert.ok(Object.isFrozen(kpLinearEquationExemplarThemeReference));
});

test("renderer theme references reject absent identity", () => {
  assert.throws(
    () => defineKpRendererThemeReference({ id: "  " }),
    /stable non-empty id/
  );
});

test("renderer theme references do not carry application token payloads", () => {
  assert.deepEqual(Object.keys(kpLinearEquationExemplarThemeReference), ["id"]);
});
