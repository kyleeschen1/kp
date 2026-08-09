import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpVignetteRelease,
  KpArticleImportLockError,
  resolveKpArticleImports,
  serializeKpVignetteReleasePayload,
  type KpArticleImportLock,
  type KpVignetteRelease
} from "../src/article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import {
  economicsDemandShiftVignetteRelease
} from "../src/article/vignettes/economics-demand-shift-vignette.ts";
import {
  economicsEquilibriumAnimationId
} from "../src/animation/economics-equilibrium-adapter.ts";

test("major-version imports resolve deterministically to the newest exact release", () => {
  const registry = [release("1.0.0", "a"), release("2.0.0", "c"), release("1.2.0", "b")];
  const resolved = resolveKpArticleImports(goldenSource(), registry);

  assert.deepEqual(resolved.lock, {
    schemaVersion: "kp.article-import-lock.v1",
    documentId: "lesson.economics.demand-shift",
    entries: [{
      alias: "demandShift",
      request: "vignette.economics.demand-shift@1",
      vignetteId: "vignette.economics.demand-shift",
      requestedMajor: 1,
      version: "1.2.0",
      integrity: digest("b"),
      moduleSpecifier: "./vignette.ts"
    }]
  });
  assert.equal(resolved.releases[0]!.version, "1.2.0");
  assert.deepEqual(resolved.stages.map(({ stageId, alias }) => ({ stageId, alias })), [
    { stageId: "market", alias: "demandShift" }
  ]);
});

test("an existing lock reproduces its exact release until an explicit update", () => {
  const oldRegistry = [release("1.0.0", "a")];
  const old = resolveKpArticleImports(goldenSource(), oldRegistry);
  const expandedRegistry = [release("1.2.0", "b"), ...oldRegistry];

  const reproduced = resolveKpArticleImports(goldenSource(), expandedRegistry, old.lock);
  const updated = resolveKpArticleImports(goldenSource(), expandedRegistry);

  assert.equal(reproduced.releases[0]!.version, "1.0.0");
  assert.equal(updated.releases[0]!.version, "1.2.0");
});

test("lock ordering is independent of frontmatter and registry order", () => {
  const source = sourceWithImports([
    "    zed: vignette.economics.zed@1",
    "    alpha: vignette.economics.alpha@1"
  ]);
  const registry = [namedRelease("vignette.economics.zed", "1.0.0", "z"), namedRelease("vignette.economics.alpha", "1.0.0", "a")];
  const resolved = resolveKpArticleImports(source, registry);

  assert.deepEqual(resolved.lock.entries.map(({ alias }) => alias), ["alpha", "zed"]);
});

test("missing releases, unknown stage aliases, and lock drift fail closed", () => {
  assertImportError(() => resolveKpArticleImports(goldenSource(), []), "import-release-unavailable");
  assertImportError(
    () => resolveKpArticleImports(sourceWithStageUse("missing"), [release("1.0.0", "a")]),
    "import-stage-alias-unknown"
  );

  const resolved = resolveKpArticleImports(goldenSource(), [release("1.0.0", "a")]);
  assertImportError(
    () => resolveKpArticleImports(goldenSource(), [release("1.0.0", "changed")], resolved.lock),
    "import-lock-integrity-drift"
  );
  const missingReleaseLock: KpArticleImportLock = {
    ...resolved.lock,
    entries: resolved.lock.entries.map((entry) => ({ ...entry, version: "1.1.0" }))
  };
  assertImportError(
    () => resolveKpArticleImports(goldenSource(), [release("1.0.0", "a")], missingReleaseLock),
    "import-lock-release-missing"
  );
  const unknownObject = createKpArticleSource(
    "unknown-object.md",
    goldenSource().text.replace("market/price-axis", "market/missing-object")
  );
  assertImportError(
    () => resolveKpArticleImports(unknownObject, [release("1.0.0", "a")]),
    "import-semantic-path-unknown"
  );
});

test("the economics vignette has a reproducible exact release identity", () => {
  const integrity = `sha256:${createHash("sha256")
    .update(serializeKpVignetteReleasePayload(economicsDemandShiftVignetteRelease))
    .digest("hex")}`;

  assert.equal(economicsDemandShiftVignetteRelease.version, "1.0.0");
  assert.equal(economicsDemandShiftVignetteRelease.animationId, economicsEquilibriumAnimationId);
  assert.equal(economicsDemandShiftVignetteRelease.integrity, integrity);
  assert.deepEqual(economicsDemandShiftVignetteRelease.transitionPaths, ["shift-demand"]);
  assert.deepEqual(economicsDemandShiftVignetteRelease.checkpointPaths, ["initial", "settled"]);
  const fixture = JSON.parse(readFileSync(
    new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.lock.json", import.meta.url),
    "utf8"
  ));
  assert.deepEqual(
    resolveKpArticleImports(goldenSource(), [economicsDemandShiftVignetteRelease]).lock,
    fixture
  );
});

function release(version: string, seed: string): KpVignetteRelease {
  return namedRelease("vignette.economics.demand-shift", version, seed);
}

function namedRelease(id: string, version: string, seed: string): KpVignetteRelease {
  return createKpVignetteRelease({
    schemaVersion: "kp.vignette-release.v1",
    id,
    version,
    integrity: digest(seed),
    moduleSpecifier: "./vignette.ts",
    animationId: `animation.${id}`,
    objectPaths: ["axes", "demand", "price-axis", "supply"],
    transitionPaths: ["shift-demand"],
    checkpointPaths: ["initial", "settled"]
  });
}

function digest(seed: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(seed).digest("hex")}`;
}

function assertImportError(action: () => unknown, code: KpArticleImportLockError["code"]): void {
  assert.throws(action, (error: unknown) => (
    error instanceof KpArticleImportLockError && error.code === code
  ));
}

function goldenSource() {
  return createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
}

function sourceWithImports(importLines: readonly string[]) {
  return createKpArticleSource("ordered.md", [
    "---",
    "kp:",
    "  schema: kp.article.v1-rc1",
    "  id: lesson.economics.ordered",
    "  imports:",
    ...importLines,
    "---",
    ""
  ].join("\n"));
}

function sourceWithStageUse(alias: string) {
  return createKpArticleSource(
    "stage.md",
    goldenSource().text.replace("use=demandShift", `use=${alias}`)
  );
}
