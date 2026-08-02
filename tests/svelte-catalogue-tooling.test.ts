import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compile } from "svelte/compiler";

test("Svelte 5 tooling compiles the canonical host", async () => {
  const [component, bootstrap, viteConfig, svelteConfig] = await Promise.all([
    readFile(
      "src/editor/svelte-catalogue/SvelteToolingCanary.svelte",
      "utf8"
    ),
    readFile("src/bootstrap.ts", "utf8"),
    readFile("vite.config.ts", "utf8"),
    readFile("svelte.config.js", "utf8")
  ]);
  const compiled = compile(component, {
    filename: "SvelteToolingCanary.svelte",
    generate: "client",
    runes: true
  });

  assert.match(compiled.js.code, /svelte\/internal\/client/);
  assert.match(compiled.js.code, /kp-svelte-catalogue-tooling-canary/);
  assert.match(viteConfig, /import \{ svelte \} from "@sveltejs\/vite-plugin-svelte"/);
  assert.match(viteConfig, /plugins:\s*\[/);
  assert.match(viteConfig, /\bsvelte\(\),/);
  assert.match(svelteConfig, /runes:\s*true/);
  assert.doesNotMatch(
    bootstrap,
    /import\(\s*"\.\/editor\/animation-catalogue-application\.ts"\s*\)/
  );
  assert.match(
    bootstrap,
    /import\(\s*"\.\/editor\/svelte-catalogue\/svelte-catalogue-exemplar-entry\.ts"\s*\)/
  );
  assert.doesNotMatch(bootstrap, /SvelteToolingCanary/);
});
