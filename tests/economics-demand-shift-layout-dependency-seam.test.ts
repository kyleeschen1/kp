import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const directory = new URL(
  "../src/tutorial/economics-demand-shift/",
  import.meta.url
);
const audit = JSON.parse(readFileSync(new URL(
  "./fixtures/economics-scroll-layout-seam.json",
  import.meta.url
), "utf8")) as {
  readonly schemaVersion: string;
  readonly baseOwner: string;
  readonly consumers: readonly string[];
  readonly directImport: string;
  readonly sharedSelectors: readonly string[];
  readonly sharedTokens: readonly string[];
  readonly sharedDataHooks: readonly string[];
  readonly responsiveFallback: string;
};

test("both scroll layouts consume one neutral geometry owner", () => {
  assert.equal(audit.schemaVersion, "kp.economics.scroll-layout-seam.v2");
  const base = readFileSync(new URL(audit.baseOwner, directory), "utf8");
  for (const consumer of audit.consumers) {
    const source = readFileSync(new URL(consumer, directory), "utf8");
    assert.ok(
      source.includes(`import ${JSON.stringify(audit.directImport)};`),
      `${consumer} must import the neutral geometry owner directly`
    );
    assert.doesNotMatch(source, /economics-demand-shift-inline-sticky\.css/u);
  }
  assert.throws(() => readFileSync(new URL(
    "economics-demand-shift-inline-sticky.css",
    directory
  ), "utf8"));
  for (const selector of audit.sharedSelectors) {
    assert.ok(base.includes(selector), `missing shared selector ${selector}`);
  }
  for (const token of audit.sharedTokens) {
    assert.ok(base.includes(token), `missing shared token ${token}`);
  }
  const combined = `${base}\n${readFileSync(new URL(
    "economics-demand-shift-two-column.css",
    directory
  ), "utf8")}`;
  for (const hook of audit.sharedDataHooks) {
    assert.ok(combined.includes(hook), `missing shared hook ${hook}`);
  }
  assert.match(audit.responsiveFallback, /single-column/u);
});

test("Inline Sticky remains a reachable independent projection", () => {
  const view = readFileSync(new URL(
    "economics-demand-shift-view.ts",
    directory
  ), "utf8");
  const loader = readFileSync(new URL(
    "economics-demand-shift-presenter-capability.ts",
    directory
  ), "utf8");
  const capability = readFileSync(new URL(
    "presenters/inline-sticky-presenter-capability.ts",
    directory
  ), "utf8");
  const report = readFileSync(
    "docs/project/reviews/2026-08-12-inline-sticky-reachability-after-layout-separation.md",
    "utf8"
  );

  assert.match(view, /"inline-sticky"/u);
  assert.match(loader, /inline-sticky-presenter-capability\.ts/u);
  assert.match(capability, /kpEconomicsInlineStickyPresenterCapability/u);
  assert.match(report, /Verdict\n\nRetain\./u);
  assert.doesNotMatch(report, /Status: retired/u);
});
