import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  deriveKpAnimationApiCallerLedger,
  kpAnimationApiCallerAuditTargets,
  type KpAnimationApiCallerSourceFile
} from "../src/architecture/animation-api-caller-ledger.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const ledger = deriveKpAnimationApiCallerLedger([
  ...sourceFiles("src"),
  ...sourceFiles("tests"),
  ...sourceFiles("scripts")
]);

test("animation API caller ledger targets live, uniquely classified surfaces", () => {
  assert.equal(
    new Set(kpAnimationApiCallerAuditTargets.map(({ id }) => id)).size,
    kpAnimationApiCallerAuditTargets.length
  );
  for (const surface of kpAnimationApiCallerAuditTargets) {
    assert.equal(existsSync(join(projectRoot, surface.targetPath)), true, surface.id);
    assert.ok(surface.authority.length >= 40, surface.id);
    assert.ok(surface.preservationBoundary.length >= 50, surface.id);
  }
});

test("governed construction has one explicit public authoring seam", () => {
  const surface = record("facade.canonical-animation-construction");
  assert.equal(surface.disposition, "retain-public-boundary");
  assert.deepEqual(surface.sourceCallers, [
    "src/article/vignettes/typescript-free-shipping-vignette.ts",
    "src/experiments/authoring-structural/distribution-projection.ts"
  ]);
  assert.deepEqual(surface.scriptCallers, []);
  assert.deepEqual(surface.otherCallers, []);
  assert.deepEqual(surface.testCallers, [
    "tests/canonical-animation-construction-request.test.ts",
    "tests/canonical-reader-unit-exponent-cost-proof.test.ts",
    "tests/foldable-distribution-governed-authoring-cost.test.ts",
    "tests/fraction-composition-promotion-certificate.test.ts",
    "tests/governed-canonical-compound-construction.test.ts",
    "tests/governed-canonical-construction-cohort.test.ts",
    "tests/governed-canonical-construction-compiler.test.ts",
    "tests/governed-canonical-construction-repair.test.ts",
    "tests/governed-exponent-absorption-fixture.test.ts",
    "tests/governed-fraction-split-merge-variation.test.ts",
    "tests/governed-integration-power-rule-fixture.test.ts",
    "tests/governed-radical-succession-fixture.test.ts",
    "tests/pre-expansion-llm-generation-benchmark.test.ts",
    "tests/typescript-free-shipping-vignette.test.ts"
  ]);
});

test("internal balanced solve seam has only its public facade production caller", () => {
  const surface = record("authoring.canonical-balanced-solve");
  assert.deepEqual(surface.sourceCallers, [
    "src/animation/public-api.ts"
  ]);
  assert.deepEqual(surface.testCallers, [
    "tests/animation-authoring-public-api.test.ts",
    "tests/type-fixtures/operation-evaluation-presentation-registry.ts"
  ]);
  assert.deepEqual(surface.scriptCallers, []);
  assert.deepEqual(surface.otherCallers, []);
});

test("typed equation presentation policy has one neutral owner and bounded callers", () => {
  const surface = record("core.equation-presentation-policy");
  assert.deepEqual(surface.sourceCallers, [
    "src/animation/linear-rearrangement-choreography.ts",
    "src/editor/equation-surface-adapter.ts",
    "src/reader/app/chrome-free-canonical-equation-session.ts",
    "src/reader/app/exemplar-entry.ts",
    "src/reader/renderers/equation-operation-choreography-compiler.ts",
    "src/reader/renderers/equation-symbol-motion.ts",
    "src/rendering/cancellation-presentation-conformance.ts",
    "src/rendering/equation-cross-surface-frame.ts",
    "src/rendering/equation-linear-rearrangement-bindings.ts",
    "src/rendering/equation-linear-rearrangement-frame.ts",
    "src/rendering/equation-linear-rearrangement-owner-motion.ts",
    "src/rendering/equation-linear-rearrangement.ts",
    "src/rendering/equation-motion-dom.ts",
    "src/rendering/equation-semantic-depth.ts"
  ]);
  const source = readFileSync(join(projectRoot, surface.targetPath), "utf8");
  assert.doesNotMatch(source, /from ["']\.\.\/rendering\//);
  assert.doesNotMatch(source, /legacy|metadata/i);
  assert.equal(
    existsSync(join(projectRoot, "src/rendering/equation-presentation-policy.ts")),
    false
  );
  assert.equal(
    existsSync(join(projectRoot, "src/animation/equation-presentation-profile-decoder.ts")),
    false
  );
});

test("animation facade has exactly the two approved production callers", () => {
  const surface = record("facade.animation-authoring");
  assert.equal(surface.disposition, "retain-public-boundary");
  assert.deepEqual(surface.sourceCallers, [
    "src/animation/fraction-composition-equation-adapter.ts",
    "src/animation/verified-linear-problem-animation-compiler.ts"
  ]);
  assert.deepEqual(surface.testCallers, [
    "tests/animation-authoring-facade-caller-preservation.test.ts",
    "tests/animation-authoring-public-api.test.ts",
    "tests/canonical-animation-api-map.test.ts",
    "tests/type-fixtures/animation-authoring-public-api.ts"
  ]);
  assert.deepEqual(surface.scriptCallers, []);
});

test("public-looking facades remain separated by authority", () => {
  assert.deepEqual(record("facade.concept-authoring").sourceCallers, [
    "src/compatibility/legacy-concept-room-entry.ts"
  ]);
  assert.deepEqual(record("facade.provider-integration").sourceCallers, [
    "src/animation/verified-linear-problem-animation-compiler.ts",
    "src/app-adapters/fractional-linear-equation-canonical-provider.ts",
    "src/app-adapters/linear-equation-canonical-provider.ts",
    "src/app-adapters/linear-equation-concept-runtime.ts",
    "src/tutorial/verified-generated-linear-solve-session.ts",
    "src/tutorial/verified-linear-problem-explanation-compiler.ts"
  ]);
  assert.deepEqual(record("facade.reader-compiler").sourceCallers, [
    "src/reader/compiler/reader-route-manifest.ts"
  ]);
  assert.equal(record("facade.reader-runtime").sourceCallers.length, 19);
  assert.ok(!record("facade.reader-runtime").sourceCallers.includes(
    "src/reader/app/canonical-equation-frame-plan.ts"
  ));
  assert.ok(record("facade.reader-runtime").sourceCallers.every((path) =>
    path.startsWith("src/reader/") ||
    path === "src/editor/operation-evaluation-surface-adapter.ts"
  ));
  assert.deepEqual(record("facade.reader-renderers").sourceCallers, [
    "src/reader/app/canonical-equation-endpoint-ownership.ts",
    "src/reader/app/canonical-equation-semantic-focus.ts",
    "src/reader/app/chrome-free-canonical-equation-session.ts",
    "src/reader/app/distribution-area-renderer-runtime.ts",
    "src/reader/app/distribution-area-runtime.ts",
    "src/reader/app/reader-canonical-equation-session.ts"
  ]);
  assert.deepEqual(record("facade.reader-runtime-learner").sourceCallers, [
    "src/reader/app/canonical-equation-frame-plan.ts",
    "src/reader/app/canonical-equation-stage-layout.ts",
    "src/reader/app/canonical-equation-transition-continuity.ts",
    "src/reader/app/exemplar-entry.ts",
    "src/reader/renderers/equation-layout-snapshot.ts",
    "src/reader/renderers/equation-perceptual-alignment.ts",
    "src/reader/renderers/equation-responsive-fit.ts",
    "src/reader/renderers/scheduled-adapter.ts",
    "src/tutorial/algebra-fraction-composition/fraction-composition-article-transport.ts"
  ]);
  assert.deepEqual(record("facade.reader-renderers-learner").sourceCallers, [
    "src/reader/app/canonical-equation-stage-layout.ts",
    "src/reader/app/canonical-equation-transition-continuity.ts",
    "src/reader/app/exemplar-entry.ts"
  ]);
  assert.deepEqual(record("facade.equation-motifs").sourceCallers, []);
  assert.deepEqual(record("facade.equation-motifs").testCallers, [
    "tests/canonical-animation-api-map.test.ts"
  ]);
});

test("generated-session internals expose only their observed direct callers", () => {
  assert.deepEqual(record("generated.animation-compiler").sourceCallers, [
    "src/tutorial/verified-generated-linear-solve-session.ts",
    "src/tutorial/verified-linear-problem-explanation-compiler.ts"
  ]);
  assert.deepEqual(record("generated.animation-compiler").scriptCallers, []);
  assert.deepEqual(record("generated.explanation-compiler").sourceCallers, [
    "src/editor/verified-generated-linear-solve-reader.ts",
    "src/tutorial/verified-generated-linear-solve-session.ts"
  ]);
  assert.deepEqual(record("generated.catalogue-reader").sourceCallers, [
    "src/editor/animation-catalogue-selection-preparation.ts"
  ]);
});

test("retirement-adjacent metadata and compatibility targets have no unknown callers", () => {
  const displayMetadata = record("metadata.animation-library-display");
  assert.equal(displayMetadata.disposition, "retain-internal");
  assert.deepEqual(displayMetadata.sourceCallers, [
    "src/editor/animation-library-display-catalog.ts"
  ]);
  assert.deepEqual(record("metadata.animation-library-search").sourceCallers, [
    "src/editor/animation-library-metadata.ts"
  ]);
  assert.deepEqual(
    record("ledger.semantic-animation-compatibility").testCallers,
    [
      "tests/equation-presentation-profile-authoring-ratchet.test.ts",
      "tests/semantic-animation-compatibility-ledger.test.ts"
    ]
  );
  assert.deepEqual(
    record("ledger.semantic-animation-compatibility").sourceCallers,
    [
      "src/architecture/exact-equation-reachability-graph.ts",
      "src/architecture/post-convergence-infrastructure-inventory.ts",
      "src/architecture/pre-expansion-health.ts"
    ]
  );
  assert.deepEqual(
    record("ledger.semantic-animation-compatibility").scriptCallers,
    ["scripts/check-semantic-animation-boundaries.ts"]
  );
  assert.equal(
    ledger.some(({ disposition }) => String(disposition).includes("candidate")),
    false
  );
});

test("concept authoring does not accidentally export animation asset construction", () => {
  const conceptFacade = readFileSync(
    join(projectRoot, "src/authoring/public-api.ts"),
    "utf8"
  );
  assert.doesNotMatch(conceptFacade, /KpAnimationAsset|canonical-balanced-solve/);
  assert.equal(existsSync(join(projectRoot, "src/animation/public-api.ts")), true);
});

function record(id: string) {
  const entry = ledger.find((candidate) => candidate.id === id);
  assert.ok(entry, `missing caller ledger entry ${id}`);
  return entry;
}

function sourceFiles(relativeDirectory: string): KpAnimationApiCallerSourceFile[] {
  const absoluteDirectory = join(projectRoot, relativeDirectory);
  return readdirSync(absoluteDirectory, {
    recursive: true,
    withFileTypes: true
  })
    .filter((entry) =>
      entry.isFile() && /\.(?:ts|json)$/.test(entry.name)
    )
    .map((entry) => {
      const relativePath = join(
        relativeDirectory,
        entry.parentPath.slice(absoluteDirectory.length + 1),
        entry.name
      ).replaceAll("\\", "/");
      return {
        path: relativePath,
        source: readFileSync(join(projectRoot, relativePath), "utf8")
      };
    });
}
