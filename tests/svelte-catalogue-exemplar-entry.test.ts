import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compile } from "svelte/compiler";

import {
  selectsKpSvelteCatalogueExemplar
} from "../src/editor/svelte-catalogue/svelte-catalogue-exemplar-route.ts";

test("Svelte exemplar selection is explicit and independent of catalogue state", () => {
  assert.equal(selectsKpSvelteCatalogueExemplar(""), false);
  assert.equal(
    selectsKpSvelteCatalogueExemplar(
      "?artifact=animation.dot-projection.basic&catalogueShell=svelte-exemplar"
    ),
    true
  );
  assert.equal(
    selectsKpSvelteCatalogueExemplar("?catalogueShell=unknown"),
    false
  );
});

test("bootstrap keeps the imperative default and dynamically mounts the exemplar", async () => {
  const [bootstrap, entry, component] = await Promise.all([
    readFile("src/bootstrap.ts", "utf8"),
    readFile(
      "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts",
      "utf8"
    ),
    readFile(
      "src/editor/svelte-catalogue/KpSvelteCatalogueExemplar.svelte",
      "utf8"
    )
  ]);

  assert.match(
    bootstrap,
    /selectsKpSvelteCatalogueExemplar\(window\.location\.search\)/
  );
  assert.match(
    bootstrap,
    /import\(\s*"\.\/editor\/svelte-catalogue\/svelte-catalogue-exemplar-entry\.ts"\s*\)/
  );
  assert.match(
    bootstrap,
    /import\(\s*"\.\/editor\/animation-catalogue-application\.ts"\s*\)/
  );
  assert.match(entry, /createKpAnimationCatalogueSelectionPreparationService/);
  assert.match(entry, /createKpAnimationCatalogueSelectedHostViewModel/);
  assert.doesNotMatch(entry, /loadKpAnimationAsset|createKpAnimationAssets/);

  const compiled = compile(component, {
    filename: "KpSvelteCatalogueExemplar.svelte",
    generate: "client",
    runes: true
  });
  assert.match(compiled.js.code, /kp-svelte-catalogue-exemplar/);
});
