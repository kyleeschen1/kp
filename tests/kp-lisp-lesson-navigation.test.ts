import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileKpLispFunctionApplicationLesson } from "../src/tutorial/lisp-function-application/lisp-function-application-lesson-compiler.ts";
import {
  canonicalizeKpLispLessonDestination,
  resolveKpLispLessonNavigationTarget
} from "../src/tutorial/lisp-function-application/lisp-function-application-navigation.ts";
import { kpLispLessonMotionBlocks } from
  "../src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts";

const markdown = await readFile(
  new URL("../content/lessons/programming-lisp-function-application.md", import.meta.url),
  "utf8"
);
const lesson = compileKpLispFunctionApplicationLesson(markdown);
const resolve = (kind: "section" | "block" | "checkpoint", id: string) =>
  resolveKpLispLessonNavigationTarget({ lesson, destination: { kind, id } });

test("sections restore exact cumulative lesson states without replay", () => {
  assert.deepEqual(resolve("section", "see-structure"), {
    destination: { kind: "section", id: "see-structure" },
    blockId: "structure",
    localProgress: 0,
    elementId: "kp-section-see-structure"
  });
  assert.equal(resolve("section", "apply-lambda")?.blockId, "application");
  assert.equal(resolve("section", "evaluate-result")?.localProgress, 0);
  assert.equal(resolve("section", "evaluate-result")?.blockId, "evaluation");
  assert.equal(resolve("section", "follow-provenance")?.localProgress, 1);
});

test("every named checkpoint resolves to one block-local semantic progress", () => {
  const authoredParameterProgress = kpLispLessonMotionBlocks.find(({ id }) =>
    id === "application")!.checkpoints.find(({ id }) =>
      id === "parameter-bound")!.progress;
  const parameterBound = resolve("checkpoint", "parameter-bound");
  assert.deepEqual(parameterBound, {
    destination: { kind: "checkpoint", id: "parameter-bound" },
    blockId: "application",
    localProgress: authoredParameterProgress,
    elementId: "kp-checkpoint-parameter-bound"
  });
  assert.ok((parameterBound?.localProgress ?? 0) > 0);
  assert.ok((resolve("checkpoint", "leaf-forms-folded")?.localProgress ?? 0) > 0);
  assert.ok((resolve("checkpoint", "inputs-gathered")?.localProgress ?? 0) > 0);
  assert.equal(resolve("checkpoint", "result-settled")?.localProgress, 1);
  assert.equal(resolve("checkpoint", "missing"), undefined);
});

test("block destinations restore their authored opening frames", () => {
  assert.equal(resolve("block", "structure")?.localProgress, 0);
  assert.equal(resolve("block", "application")?.localProgress, 0);
  assert.equal(resolve("block", "evaluation")?.localProgress, 0);
});

test("every legacy destination resolves directly to its canonical meaning", () => {
  const aliases = [
    ["section", "read-application", "see-structure"],
    ["section", "bind-argument", "apply-lambda"],
    ["section", "evaluate-form", "evaluate-result"],
    ["section", "metaphor-scope", "follow-provenance"],
    ["block", "bind-and-reconstruct", "application"],
    ["block", "evaluate-and-gather", "evaluation"],
    ["checkpoint", "application-ready", "binding-ready"],
    ["checkpoint", "binding-established", "parameter-bound"],
    ["checkpoint", "evaluation-form-ready", "reduction-ready"],
    ["checkpoint", "evaluation-gathering", "inputs-gathered"]
  ] as const;
  for (const [kind, legacyId, canonicalId] of aliases) {
    const requested = { kind, id: legacyId };
    const canonical = canonicalizeKpLispLessonDestination(requested);
    assert.deepEqual(canonical, { kind, id: canonicalId });
    const resolved = resolve(kind, legacyId);
    assert.deepEqual(resolved?.destination, canonical);
    assert.equal(resolved?.elementId, `kp-${kind}-${canonicalId}`);
  }
});

test("checkpoint IDs retained by the new grammar remain exact", () => {
  for (const id of ["body-reconstructed", "result-settled"]) {
    assert.deepEqual(
      canonicalizeKpLispLessonDestination({ kind: "checkpoint", id }),
      { kind: "checkpoint", id }
    );
    assert.equal(resolve("checkpoint", id)?.destination.id, id);
  }
});
