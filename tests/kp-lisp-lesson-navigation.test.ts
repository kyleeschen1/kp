import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileKpLispFunctionApplicationLesson } from "../src/tutorial/lisp-function-application/lisp-function-application-lesson-compiler.ts";
import { resolveKpLispLessonNavigationTarget } from "../src/tutorial/lisp-function-application/lisp-function-application-navigation.ts";

const markdown = await readFile(
  new URL("../content/lessons/programming-lisp-function-application.md", import.meta.url),
  "utf8"
);
const lesson = compileKpLispFunctionApplicationLesson(markdown);
const resolve = (kind: "section" | "block" | "checkpoint", id: string) =>
  resolveKpLispLessonNavigationTarget({ lesson, destination: { kind, id } });

test("sections restore exact cumulative lesson states without replay", () => {
  assert.deepEqual(resolve("section", "read-application"), {
    destination: { kind: "section", id: "read-application" },
    blockId: "bind-and-reconstruct",
    localProgress: 0,
    elementId: "kp-section-read-application"
  });
  assert.equal(resolve("section", "evaluate-form")?.localProgress, 0);
  assert.equal(resolve("section", "evaluate-form")?.blockId, "evaluate-and-gather");
  assert.equal(resolve("section", "metaphor-scope")?.localProgress, 1);
});

test("every named checkpoint resolves to one block-local semantic progress", () => {
  assert.deepEqual(resolve("checkpoint", "binding-established"), {
    destination: { kind: "checkpoint", id: "binding-established" },
    blockId: "bind-and-reconstruct",
    localProgress: 0.46,
    elementId: "kp-checkpoint-binding-established"
  });
  assert.equal(resolve("checkpoint", "evaluation-gathering")?.localProgress, 0.58);
  assert.equal(resolve("checkpoint", "result-settled")?.localProgress, 1);
  assert.equal(resolve("checkpoint", "missing"), undefined);
});

test("block destinations restore their authored opening frames", () => {
  assert.equal(resolve("block", "bind-and-reconstruct")?.localProgress, 0);
  assert.equal(resolve("block", "evaluate-and-gather")?.localProgress, 0);
});
