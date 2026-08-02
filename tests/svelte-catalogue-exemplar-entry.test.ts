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
  assert.equal(
    [...entry.matchAll(/createKpAnimationCatalogueSelectionPreparationService/g)]
      .length,
    2
  );
  assert.match(entry, /createKpAnimationCatalogueSelectedHostViewModel/);
  assert.doesNotMatch(entry, /loadKpAnimationAsset|createKpAnimationAssets/);
  assert.equal(
    [...component.matchAll(/data-kp-animation-catalogue-region=/g)].length,
    3
  );
  assert.match(component, /hostState\.status === "loading"/);
  assert.match(component, /hostState\.status === "not-found"/);
  assert.match(component, /role="alert">\{hostState\.message\}/);
  assert.match(component, /renderKpAnimationCatalogueInspector/);
  assert.match(component, /selectKpAnimationCatalogueInspector/);
  assert.match(component, /tuneKpAnimationCataloguePresentation/);
  assert.match(component, /decideKpAnimationCatalogueLinkNavigation/);
  assert.match(component, /resolveKpAnimationCatalogueHistoryNavigation/);
  assert.match(component, /window\.history\.pushState/);
  assert.match(component, /window\.history\.replaceState/);
  assert.match(component, /selectionRevision/);
  assert.match(component, /selectionHost\.prepare/);
  assert.doesNotMatch(component, /window\.location\.reload/);
  assert.match(component, /mountKpAnimationCataloguePlayerHost/);
  assert.match(component, /renderKpEditorAnimationPlayerShell/);
  assert.doesNotMatch(
    component,
    /createKpEditorAnimationPlaybackSession|sampleKpAnimationRuntimeFrame|<h2(?:\s|>)/
  );

  const compiled = compile(component, {
    filename: "KpSvelteCatalogueExemplar.svelte",
    generate: "client",
    runes: true
  });
  assert.match(compiled.js.code, /kp-animation-catalogue-region/);
});

test("both catalogue shells delegate browser lifecycles to shared hosts", async () => {
  const [
    application,
    playerHost,
    interactionHost,
    parameterHost,
    component
  ] = await Promise.all([
    readFile("src/editor/animation-catalogue-application.ts", "utf8"),
    readFile("src/editor/animation-catalogue-player-host.ts", "utf8"),
    readFile("src/editor/animation-catalogue-interaction-host.ts", "utf8"),
    readFile("src/editor/animation-catalogue-parameter-host.ts", "utf8"),
    readFile(
      "src/editor/svelte-catalogue/KpSvelteCatalogueExemplar.svelte",
      "utf8"
    )
  ]);

  assert.match(application, /mountKpAnimationCataloguePlayerHost/);
  assert.match(component, /mountKpAnimationCataloguePlayerHost/);
  assert.match(playerHost, /hydrateKpEditorAnimationPlayers/);
  assert.match(playerHost, /hydrateKpEditorAnimationSurfaces/);
  assert.match(playerHost, /observeKpAnimationCatalogueHost/);
  assert.doesNotMatch(
    application,
    /hydrateKpEditorAnimationPlayers|hydrateKpEditorAnimationSurfaces/
  );
  assert.doesNotMatch(
    playerHost,
    /createKpEditorAnimationPlaybackSession|sampleKpAnimationRuntimeFrame/
  );
  for (const owner of [application, component]) {
    assert.match(owner, /captureKpAnimationCatalogueFocus/);
    assert.match(owner, /restoreKpAnimationCatalogueFocus/);
    assert.match(owner, /toggleKpAnimationCatalogueOverlay/);
  }
  assert.match(interactionHost, /data-kp-animation-catalogue-results/);
  for (const owner of [application, component]) {
    assert.match(owner, /applyKpAnimationCatalogueParameterInput/);
  }
  assert.match(parameterHost, /createParameterizedEconomicsEquilibriumAnimation/);
  assert.match(parameterHost, /createParameterizedConstantForceWorkEnergyAnimation/);
  assert.doesNotMatch(
    application,
    /createParameterizedEconomicsEquilibriumAnimation|createParameterizedConstantForceWorkEnergyAnimation/
  );
  assert.match(component, /replaceKpAnimationCatalogueHostParameters/);
});
