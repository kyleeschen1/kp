import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpEconomicsSupplyTaxAnimationAsset
} from "../src/animation/economics-supply-tax-asset.ts";
import {
  createKpSupplyTaxPedagogicalScore,
  validateKpSupplyTaxPedagogicalScore,
  type KpSupplyTaxPedagogicalScoreV1
} from "../src/tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";

test("supply-tax score defines eight ordered semantic stops", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const score = createKpSupplyTaxPedagogicalScore(authority);

  assert.deepEqual(score.beats.map(({ ordinal, slug }) => ({ ordinal, slug })), [
    { ordinal: 1, slug: "baseline-market" },
    { ordinal: 2, slug: "tax-input" },
    { ordinal: 3, slug: "supply-translation" },
    { ordinal: 4, slug: "price-wedge" },
    { ordinal: 5, slug: "quantity-contraction" },
    { ordinal: 6, slug: "surplus-redistribution" },
    { ordinal: 7, slug: "government-revenue" },
    { ordinal: 8, slug: "deadweight-loss" }
  ]);
  assert.deepEqual(validateKpSupplyTaxPedagogicalScore(authority, score), []);
});

test("score separates one sampled transformation from settled attention states", () => {
  const score = createKpSupplyTaxPedagogicalScore();

  assert.deepEqual(score.beats.map(({ settledFrame }) => settledFrame), [
    "untaxed", "untaxed", "taxed", "taxed", "taxed", "taxed", "taxed", "taxed"
  ]);
  assert.deepEqual(score.beats.filter(
    ({ transitionFromPrevious }) => transitionFromPrevious !== "none"
  ).map(({ slug, transitionFromPrevious }) => ({ slug, transitionFromPrevious })), [{
    slug: "supply-translation",
    transitionFromPrevious: "sample-tax-imposition"
  }]);
});

test("every attention role closes against animation entities without overlap", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const score = createKpSupplyTaxPedagogicalScore(authority);
  const objectIds = new Set(authority.animation.bundle.objects.map(({ id }) => id));

  for (const entry of score.beats) {
    const roles = Object.values(entry.attention).flat();
    assert.equal(new Set(roles).size, roles.length, entry.slug);
    assert.ok(roles.every((id) => objectIds.has(id)), entry.slug);
  }
});

test("original supply stays explicit throughout every taxed stop", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const score = createKpSupplyTaxPedagogicalScore(authority);
  const originalSupplyId = authority.semantics.entities.curves.find(
    ({ role }) => role === "marginal-cost-supply"
  )?.id;
  assert.ok(originalSupplyId);

  for (const entry of score.beats.filter(({ settledFrame }) => settledFrame === "taxed")) {
    assert.ok(Object.values(entry.attention).flat().includes(originalSupplyId), entry.slug);
  }
});

test("validator rejects unknown semantic targets and a second motion owner", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const score = createKpSupplyTaxPedagogicalScore(authority);
  const invalid = {
    ...score,
    beats: score.beats.map((entry, index) => index === 0 ? {
      ...entry,
      transitionFromPrevious: "sample-tax-imposition" as const,
      attention: {
        ...entry.attention,
        targetEntityIds: ["entity.unknown"]
      }
    } : entry)
  } satisfies KpSupplyTaxPedagogicalScoreV1;
  const messages = validateKpSupplyTaxPedagogicalScore(authority, invalid)
    .map(({ message }) => message);

  assert.ok(messages.some((message) => message.includes("Unknown animation entity")));
  assert.ok(messages.some((message) => message.includes("Only the supply-translation beat")));
});

test("pedagogical score contains no renderer styling or timing keys", () => {
  const score = createKpSupplyTaxPedagogicalScore();
  const forbidden = new Set([
    "color", "opacity", "duration", "durationMs", "delay", "x", "y", "width", "height"
  ]);
  const keys: string[] = [];
  walk(score, keys);

  assert.deepEqual(keys.filter((key) => forbidden.has(key)), []);
});

function walk(value: unknown, keys: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => walk(entry, keys));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    walk(child, keys);
  }
}
