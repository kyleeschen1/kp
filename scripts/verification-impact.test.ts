import assert from "node:assert/strict";
import test from "node:test";

import {
  selectKpVerificationImpact,
  selectKpVerificationScope
} from "./verification-impact.ts";

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
    "architecture",
    "reader-conformance",
    "build",
    "reader-production-closure",
    "reader-route-budgets",
    "dev-review-production-closure",
    "distribution-motion-laws",
    "distribution-visual"
  ]);
  assert.deepEqual(result.unmatchedPaths, []);
  assert.equal(ids(result).includes("test"), false);
  assert.equal(ids(result).includes("focused-visual"), false);
});

test("manifest and declared lesson changes select reader production closure", () => {
  for (const path of [
    "src/reader/compiler/reader-route-manifest.ts",
    "content/lessons/divide-both-sides.md"
  ]) {
    const result = selectKpVerificationImpact([path]);
    assert.deepEqual(result.unmatchedPaths, []);
    assert.ok(ids(result).includes("reader-conformance"));
    assert.ok(ids(result).includes("reader-production-closure"));
    assert.ok(ids(result).includes("reader-route-budgets"));
    assert.ok(ids(result).includes("build"));
  }
});

test("distribution schedule changes select topology and exemplar gates", () => {
  const result = selectKpVerificationImpact(["src/animation/indexed-progress-schedule.ts"]);
  assert.deepEqual(ids(result), [
    "typecheck",
    "distribution-motion-laws",
    "distribution-visual"
  ]);
});

test("health-sensitive animation paths select their dedicated gates", () => {
  const profile = selectKpVerificationImpact([
    "src/animation/equation-presentation-policy.ts"
  ]);
  assert.ok(ids(profile).includes("semantic-animation-convergence"));
  assert.ok(ids(profile).includes("architecture"));

  const capability = selectKpVerificationImpact([
    "src/animation/catalog-packs/place-value.ts"
  ]);
  assert.ok(ids(capability).includes("svelte-catalogue-unit"));
  assert.ok(ids(capability).includes("catalogue-capability-browser"));
  assert.ok(ids(capability).includes("catalogue-bundle-boundary"));

  const reservation = selectKpVerificationImpact([
    "src/editor/animation-catalogue-font-reservation.ts"
  ]);
  assert.ok(ids(reservation).includes("catalogue-capability-browser"));

  const publication = selectKpVerificationImpact([
    "content/lessons/economics-demand-shift.kp.md"
  ]);
  assert.ok(ids(publication).includes("economics-publication"));
  assert.deepEqual(publication.unmatchedPaths, []);
});

test("verification modes accumulate durable checks without substituting an unrelated exemplar", () => {
  const path = "src/animation/function-wrap-reception.ts";
  const discovery = selectKpVerificationImpact([path], { mode: "discovery" });
  assert.equal(discovery.mode, "discovery");
  assert.deepEqual(ids(discovery), [
    "equation-surface-preservation",
    "function-wrap-visual"
  ]);

  const contract = selectKpVerificationImpact([path], { mode: "contract" });
  assert.deepEqual(ids(contract), [
    "equation-surface-preservation",
    "function-wrap-contract",
    "typecheck",
    "architecture",
    "function-wrap-visual"
  ]);
  assert.equal(ids(contract).includes("focused-visual"), false);

  const promotion = selectKpVerificationImpact([path], { mode: "promotion" });
  assert.ok(ids(promotion).includes("function-wrap-browser"));
});

test("renderer-neutral equation protocols select contract proof instead of a visual exemplar", () => {
  const result = selectKpVerificationImpact(
    ["src/domain-ir/equation-motif-invocation.ts"],
    { mode: "contract" }
  );
  assert.deepEqual(ids(result), [
    "equation-surface-preservation",
    "equation-motion-protocol",
    "typecheck",
    "architecture"
  ]);
  assert.equal(ids(result).includes("focused-visual"), false);
});

test("generated equation dispatch selects closure proof without a visual exemplar", () => {
  const result = selectKpVerificationImpact(
    ["src/generated/equation-extension-dispatch.generated.ts"],
    { mode: "promotion" }
  );
  assert.deepEqual(ids(result), [
    "equation-extension-dispatch",
    "typecheck",
    "architecture",
    "catalogue-bundle-boundary"
  ]);
  assert.equal(ids(result).includes("focused-visual"), false);
});

test("change-of-base rendering selects its bounded family gate", () => {
  const result = selectKpVerificationImpact([
    "src/rendering/logarithm-change-of-base-native-endpoints.ts"
  ]);
  assert.deepEqual(ids(result), [
    "logarithm-change-of-base-unit",
    "typecheck-app",
    "architecture",
    "logarithm-change-of-base-browser"
  ]);
  assert.deepEqual(result.unmatchedPaths, []);
  assert.equal(ids(result).includes("typecheck"), false);
  assert.equal(ids(result).includes("test"), false);
  assert.equal(ids(result).includes("build"), false);
});

test("log-product material discovery avoids broad unrelated gates", () => {
  for (const path of [
    "src/editor/log-product-surface-adapter.ts",
    "src/rendering/log-product-material-depth-dom.ts",
    "src/animation/log-product-material-depth-choreography.ts",
    "scripts/capture-log-product.ts"
  ]) {
    const result = selectKpVerificationImpact([path], { mode: "discovery" });
    assert.deepEqual(ids(result), [
      "equation-surface-preservation",
      "log-product-unit",
      "log-product-visual"
    ]);
    assert.deepEqual(result.unmatchedPaths, []);
  }

  const promotion = selectKpVerificationImpact([
    "src/editor/log-product-surface-adapter.ts"
  ], { mode: "promotion" });
  assert.ok(ids(promotion).includes("typecheck-app"));
  assert.ok(ids(promotion).includes("catalogue-capability-browser"));
  assert.ok(ids(promotion).includes("catalogue-bundle-boundary"));
});

test("inference contracts avoid Svelte and full-suite verification", () => {
  const result = selectKpVerificationImpact([
    "src/rendering/equation-motion-occlusion-types.ts"
  ]);
  assert.deepEqual(ids(result), [
    "inference-contracts",
    "inference-budget-unit",
    "typecheck-app"
  ]);
  assert.deepEqual(result.unmatchedPaths, []);
  assert.equal(ids(result).includes("typecheck"), false);
  assert.equal(ids(result).includes("focused-visual"), false);
});

test("native KaTeX settlement selects compositor checks without Svelte", () => {
  const result = selectKpVerificationImpact([
    "src/rendering/native-katex-rendered-scene.ts"
  ]);
  assert.deepEqual(ids(result), [
    "native-katex-paint-unit",
    "canonical-equation-renderer-unit",
    "typecheck-app",
    "architecture"
  ]);
  assert.deepEqual(result.unmatchedPaths, []);
  assert.equal(ids(result).includes("typecheck"), false);
  assert.equal(ids(result).includes("test"), false);
});

test("browser host changes select one non-watching smoke lane", () => {
  const result = selectKpVerificationImpact(["scripts/dev.ts"]);
  assert.deepEqual(ids(result), [
    "typecheck-node",
    "browser-test-host-smoke"
  ]);
  assert.deepEqual(result.unmatchedPaths, []);
  assert.equal(ids(result).includes("typecheck"), false);
  assert.equal(ids(result).includes("test"), false);
});

test("unknown paths fail broad even when discovery mode is requested", () => {
  const result = selectKpVerificationImpact(
    ["new-subsystem/unknown.ts"],
    { mode: "discovery" }
  );
  assert.deepEqual(ids(result), ["typecheck", "test", "build"]);
});

test("public TypeScript paths select the bounded route gate", () => {
  for (const path of [
    "src/public-web/typescript-free-shipping-entry.ts",
    "content/lessons/typescript-free-shipping.kp.md",
    "scripts/check-public-typescript-budgets.ts",
    "vite.public-typescript.config.ts",
    "tsconfig.public-typescript.json"
  ]) {
    const result = selectKpVerificationImpact([path]);
    assert.deepEqual(ids(result), ["public-typescript"]);
    assert.deepEqual(result.unmatchedPaths, []);
  }
});

test("public symbolic paths select the bounded route gate", () => {
  for (const path of [
    "src/public-web/fraction-composition-public-entry.ts",
    "learn/math/fraction-composition/index.html",
    "vite.public-fraction-composition.config.ts",
    "tsconfig.public-fraction-composition.json"
  ]) {
    const result = selectKpVerificationImpact([path]);
    assert.deepEqual(ids(result), ["public-fraction-composition"]);
    assert.deepEqual(result.unmatchedPaths, []);
  }
});

test("canonical TypeScript refactor paths add focused semantic coverage", () => {
  const result = selectKpVerificationImpact([
    "src/animation/typescript-refactor-motion-plan.ts"
  ]);
  assert.deepEqual(ids(result), ["typescript-refactor", "public-typescript"]);
  assert.equal(ids(result).includes("focused-visual"), false);
  assert.equal(ids(result).includes("typecheck"), false);
  assert.deepEqual(result.unmatchedPaths, []);
});

test("public command composition does not turn package metadata into a broad gate", () => {
  const result = selectKpVerificationImpact([
    "package.json",
    "src/public-web/typescript-free-shipping-entry.ts",
    "scripts/verification-impact.ts",
    "tests/pre-expansion-health-commands.test.ts"
  ]);
  assert.deepEqual(ids(result), [
    "public-typescript-infrastructure",
    "public-typescript"
  ]);
  assert.deepEqual(result.unmatchedPaths, []);
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
  assert.equal(result.mode, "release");
  assert.deepEqual(ids(result), [
    "theseus-validate",
    "protocol-typecheck",
    "dev-review-unit",
    "dev-review-browser",
    "dev-review-production-closure",
    "reader-production-closure",
    "reader-route-budgets",
    "typecheck",
    "architecture",
    "test",
    "build"
  ]);
  assert.deepEqual(
    result.checks.find(({ id }) => id === "build")?.command,
    ["npm", "run", "build:bundle"]
  );
});

test("equation scope exposes honest inner boundary promotion and release tiers", () => {
  assert.deepEqual(
    ids(selectKpVerificationScope("equation", "discovery")),
    ["equation-surface-preservation", "equation-extension-dispatch"]
  );
  assert.deepEqual(
    ids(selectKpVerificationScope("equation", "contract")),
    [
      "equation-surface-preservation",
      "equation-extension-dispatch",
      "equation-motion-protocol",
      "typecheck",
      "architecture"
    ]
  );
  assert.deepEqual(
    ids(selectKpVerificationScope("equation", "promotion")),
    [
      "equation-surface-preservation",
      "equation-extension-dispatch",
      "equation-motion-protocol",
      "typecheck",
      "architecture",
      "catalogue-capability-browser",
      "catalogue-bundle-boundary"
    ]
  );
  const release = selectKpVerificationScope("equation", "release");
  assert.deepEqual(ids(release), ["equation-release"]);
  assert.deepEqual(release.checks[0]?.command, [
    "npm", "run", "health:pre-expansion:release"
  ]);
});

function ids(result: ReturnType<typeof selectKpVerificationImpact>): string[] {
  return result.checks.map((check) => check.id);
}
