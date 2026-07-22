import assert from "node:assert/strict";
import test from "node:test";

import { selectKpVerificationImpact } from "./verification-impact.ts";

test("Theseus-only changes keep verification focused", () => {
  const result = selectKpVerificationImpact(["docs/theseus/events/2026-07-21.jsonl"]);
  assert.equal(result.risk, "low");
  assert.deepEqual(ids(result), ["theseus-validate"]);
});

test("review service changes select unit, type, and production-closure checks", () => {
  const result = selectKpVerificationImpact(["server/dev-review-store.ts"]);
  assert.deepEqual(ids(result), [
    "dev-review-unit",
    "typecheck",
    "dev-review-production-closure"
  ]);
});

test("review client changes add a focused browser gate", () => {
  const result = selectKpVerificationImpact(["src/dev-review/review-inbox.ts"]);
  assert.deepEqual(ids(result), [
    "dev-review-unit",
    "dev-review-browser",
    "typecheck",
    "dev-review-production-closure"
  ]);
});

test("distribution reader changes select bounded shared and exemplar gates", () => {
  const result = selectKpVerificationImpact(["src/reader/app/distribution-area-entry.ts"]);
  assert.deepEqual(ids(result), [
    "typecheck",
    "reader-conformance",
    "build",
    "dev-review-production-closure",
    "distribution-motion-laws",
    "distribution-visual"
  ]);
  assert.deepEqual(result.unmatchedPaths, []);
  assert.equal(ids(result).includes("test"), false);
  assert.equal(ids(result).includes("focused-visual"), false);
});

test("distribution schedule changes select topology and exemplar gates", () => {
  const result = selectKpVerificationImpact(["src/animation/indexed-progress-schedule.ts"]);
  assert.deepEqual(ids(result), [
    "typecheck",
    "distribution-motion-laws",
    "distribution-visual"
  ]);
});

test("cross-boundary changes union checks without duplication", () => {
  const result = selectKpVerificationImpact([
    "protocols/dev-review-v2.ts",
    "src/dev-review/review-inbox.ts",
    "docs/theseus/nodes/next-actions/example.json"
  ]);
  assert.equal(new Set(ids(result)).size, result.checks.length);
  assert.ok(ids(result).includes("protocol-typecheck"));
  assert.ok(ids(result).includes("dev-review-browser"));
  assert.ok(ids(result).includes("theseus-validate"));
});

test("unknown and build-system paths fail broad", () => {
  const unknown = selectKpVerificationImpact(["new-subsystem/first-file.ts"]);
  assert.deepEqual(ids(unknown), ["typecheck", "test", "build"]);
  assert.deepEqual(unknown.unmatchedPaths, ["new-subsystem/first-file.ts"]);

  const packageChange = selectKpVerificationImpact(["package.json"]);
  assert.deepEqual(ids(packageChange), ["typecheck", "test", "build"]);
});

test("release mode is explicit, broad, and deterministic", () => {
  const result = selectKpVerificationImpact(["docs/theseus/example.json"], { release: true });
  assert.equal(result.risk, "high");
  assert.deepEqual(ids(result), [
    "theseus-validate",
    "protocol-typecheck",
    "dev-review-unit",
    "dev-review-browser",
    "dev-review-production-closure",
    "typecheck",
    "architecture",
    "test",
    "build"
  ]);
});

function ids(result: ReturnType<typeof selectKpVerificationImpact>): string[] {
  return result.checks.map((check) => check.id);
}
