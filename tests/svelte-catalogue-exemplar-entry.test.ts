import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compile } from "svelte/compiler";

test("bootstrap has one canonical Svelte catalogue composition", async () => {
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
    /import\(\s*"\.\/editor\/svelte-catalogue\/svelte-catalogue-exemplar-entry\.ts"\s*\)/
  );
  assert.doesNotMatch(
    bootstrap,
    /import\(\s*"\.\/editor\/animation-catalogue-application\.ts"\s*\)/
  );
  assert.doesNotMatch(bootstrap, /catalogueShell|imperative-rollback/);
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

test("canonical catalogue delegates browser lifecycles to shared hosts", async () => {
  const [
    playerHost,
    interactionHost,
    parameterHost,
    component
  ] = await Promise.all([
    readFile("src/editor/animation-catalogue-player-host.ts", "utf8"),
    readFile("src/editor/animation-catalogue-interaction-host.ts", "utf8"),
    readFile("src/editor/animation-catalogue-parameter-host.ts", "utf8"),
    readFile(
      "src/editor/svelte-catalogue/KpSvelteCatalogueExemplar.svelte",
      "utf8"
    )
  ]);

  assert.match(component, /mountKpAnimationCataloguePlayerHost/);
  assert.match(playerHost, /hydrateKpEditorAnimationPlayers/);
  assert.match(playerHost, /hydrateKpEditorAnimationSurfaces/);
  assert.match(playerHost, /observeKpAnimationCatalogueHost/);
  assert.doesNotMatch(
    playerHost,
    /createKpEditorAnimationPlaybackSession|sampleKpAnimationRuntimeFrame/
  );
  assert.match(component, /captureKpAnimationCatalogueFocus/);
  assert.match(component, /restoreKpAnimationCatalogueFocus/);
  assert.match(component, /toggleKpAnimationCatalogueOverlay/);
  assert.match(interactionHost, /data-kp-animation-catalogue-results/);
  assert.match(component, /applyKpAnimationCatalogueParameterInput/);
  assert.match(parameterHost, /createParameterizedEconomicsEquilibriumAnimation/);
  assert.match(parameterHost, /createParameterizedConstantForceWorkEnergyAnimation/);
  assert.match(component, /replaceKpAnimationCatalogueHostParameters/);
});

test("stable Svelte visual command verifies the promoted canonical shell", async () => {
  const [packageSource, captureScript] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("scripts/capture-animation-catalogue.ts", "utf8")
  ]);

  assert.match(
    packageSource,
    /"visual:svelte-catalogue-exemplar": "node --disable-warning=ExperimentalWarning scripts\/capture-animation-catalogue\.ts --scope svelte-catalogue-exemplar"/
  );
  assert.match(
    captureScript,
    /kp\.svelte-catalogue-vector-release-checkpoint\.v1/
  );
  assert.match(
    captureScript,
    /reviewState: "approved-and-promoted"/
  );
  assert.match(captureScript, /canonicalShell: "svelte"/);
  assert.match(captureScript, /contact-sheet\.png/);
  assert.match(
    packageSource,
    /"test:browser:svelte-catalogue-release": "playwright test tests\/svelte-catalogue-exemplar\.browser\.spec\.ts --project=chromium --project=firefox --project=webkit --workers=1"/
  );
  assert.doesNotMatch(captureScript, /imperative-rollback/);
});
