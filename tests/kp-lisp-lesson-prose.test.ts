import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lessonUrl = new URL(
  "../content/lessons/programming-lisp-function-application.md",
  import.meta.url
);

test("canonical Lisp prose has one continuous question and four compact sections", async () => {
  const source = await readFile(lessonUrl, "utf8");
  assert.match(source, /^# How can applying a function turn code into a value/m);
  assert.equal([...source.matchAll(/^### /gm)].length, 4);
  assert.equal([...source.matchAll(/<!-- kp:section /g)].length, 4);
  assert.ok(source.split(/\s+/u).length >= 850);
});

test("two motion boundaries are surrounded by stable prose", async () => {
  const source = await readFile(lessonUrl, "utf8");
  assert.deepEqual(
    [...source.matchAll(/<!-- kp:motion ([a-z0-9-]+) -->/g)].map((match) => match[1]),
    ["bind-and-reconstruct", "evaluate-and-gather"]
  );
  assert.match(source, /binding-before[\s\S]+kp:motion bind-and-reconstruct[\s\S]+binding-after/);
  assert.match(source, /evaluation-before[\s\S]+kp:motion evaluate-and-gather[\s\S]+evaluation-after/);
  assert.doesNotMatch(source, /what to watch/i);
});

test("prose preserves the canonical semantic endpoints and metaphor boundary", async () => {
  const source = await readFile(lessonUrl, "utf8");
  assert.match(source, /`\(\(lambda \(x\) \(\+ x 1\)\) 4\)`/);
  assert.match(source, /`\(\+ 4 1\)`/);
  assert.match(source, /semantic model and the bounded evaluator/);
  assert.match(source, /native code remains the settled form/);
});
