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
  assert.equal(
    [...component.matchAll(/data-kp-animation-catalogue-region=/g)].length,
    3
  );
  assert.match(component, /hostState\.status === "loading"/);
  assert.match(component, /hostState\.status === "not-found"/);
  assert.match(component, /role="alert">\{hostState\.message\}/);
  assert.match(component, /<h3 id="kp-svelte-catalogue-details-title">Details/);
  assert.doesNotMatch(component, /animation-player-controller|<h2(?:\s|>)/);

  const compiled = compile(component, {
    filename: "KpSvelteCatalogueExemplar.svelte",
    generate: "client",
    runes: true
  });
  assert.match(compiled.js.code, /kp-animation-catalogue-region/);
});
