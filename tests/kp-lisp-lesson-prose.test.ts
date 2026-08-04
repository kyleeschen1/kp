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

test("three motion boundaries are surrounded by stable prose", async () => {
  const source = await readFile(lessonUrl, "utf8");
  assert.deepEqual(
    [...source.matchAll(/<!-- kp:motion ([a-z0-9-]+) -->/g)].map((match) => match[1]),
    ["structure", "application", "evaluation"]
  );
  assert.match(source, /structure-before[\s\S]+kp:motion structure[\s\S]+structure-after/);
  assert.match(source, /application-before[\s\S]+kp:motion application[\s\S]+application-after/);
  assert.match(source, /evaluation-before[\s\S]+kp:motion evaluation[\s\S]+evaluation-after/);
  assert.doesNotMatch(source, /what to watch/i);
});

test("prose preserves canonical endpoints and operation boundaries", async () => {
  const source = await readFile(lessonUrl, "utf8");
  assert.match(source, /`\(\(lambda \(x\) \(\+ x 1\)\) 4\)`/);
  assert.match(source, /`\(\+ 4 1\)`/);
  assert.match(source, /bounded evaluator remains the authority/);
  assert.match(source, /fold preserves a form, while this reduction creates a value/);
  assert.doesNotMatch(source, /botanical|plant|branch resolves into fruit/i);
});
