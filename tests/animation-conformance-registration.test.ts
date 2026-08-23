import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  registerKpAnimationPackConformance,
  type KpAnimationConformanceRegistrationDeclaration
} from "../src/animation/animation-conformance-registration.ts";
import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import { kpAnimationConformanceRegistrationDeclarations } from
  "../src/generated/animation-conformance-registrations.generated.ts";

test("every loadable asset enters through a conformance registration", async () => {
  const assets = createKpAnimationAssets();
  assert.equal(
    kpAnimationConformanceRegistrationDeclarations.length,
    assets.length
  );
  const loaded = await Promise.all(assets.map(({ id }) =>
    loadKpAnimationAsset(id)
  ));
  for (const result of loaded) {
    assert.equal(result.conformance.assetId, result.animation.id);
    assert.equal(result.conformance.packId, result.packId);
    assert.equal(result.conformance.kind, "manifest-ref");
  }
});

test("gateway rejects undeclared assets instead of inventing conformance", () => {
  const asset = createKpAnimationAssets()[0]!;
  assert.throws(
    () => registerKpAnimationPackConformance({
      packId: "algebra",
      catalog: [asset],
      declarations: []
    }),
    /must register a conformance manifest or typed gap/u
  );
});

test("typed gaps are explicit first-class registrations", () => {
  const asset = createKpAnimationAssets()[0]!;
  const gap = {
    kind: "typed-gap",
    assetId: asset.id,
    packId: "algebra",
    code: "migration-deferred",
    reason: "A bounded compatibility migration is explicitly scheduled."
  } as const satisfies KpAnimationConformanceRegistrationDeclaration;
  const registered = registerKpAnimationPackConformance({
    packId: "algebra",
    catalog: [asset],
    declarations: [gap]
  });
  assert.deepEqual(registered.conformanceRegistrations, [gap]);
});

test("registration metadata contains no eager family imports", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL(
      "../src/generated/animation-conformance-registrations.generated.ts",
      import.meta.url
    ), "utf8")
  );
  assert.doesNotMatch(source, /import\(/u);
  assert.doesNotMatch(source, /catalog-packs\//u);
  assert.doesNotMatch(source, /(?:codemirror|from ["']three|from ["']katex)/iu);
});
