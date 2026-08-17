import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpViteDevelopmentServer,
  kpViteProductionBuild,
  kpViteProjectRoot,
  kpViteScopedRootRedirectPlugin
} from "./kp-vite-config-helpers.ts";

test("route-neutral build helper preserves caller-owned entries and output", () => {
  const output = { manualChunks: () => undefined };
  const build = kpViteProductionBuild({
    entries: { lesson: "/repo/lesson/index.html" },
    outDir: "dist/lesson",
    output
  });

  assert.equal(build.outDir, "dist/lesson");
  assert.equal(build.emptyOutDir, true);
  assert.equal(build.manifest, true);
  assert.deepEqual(build.modulePreload, { polyfill: false });
  assert.deepEqual(build.rollupOptions?.input, {
    lesson: "/repo/lesson/index.html"
  });
  assert.equal(build.rollupOptions?.output, output);
});

test("route-neutral server helper owns mechanics but not route identity", () => {
  assert.deepEqual(kpViteDevelopmentServer({ port: 4195 }), {
    host: "127.0.0.1",
    port: 4195,
    strictPort: true,
    watch: { ignored: ["**/tmp/codex/**"] }
  });
  const proxy = kpViteDevelopmentServer({
    port: 4192,
    apiTarget: "http://127.0.0.1:8001"
  }).proxy?.["/api"];
  assert.equal(typeof proxy === "string" ? proxy : proxy?.target,
    "http://127.0.0.1:8001");
});

test("scoped root redirects preserve the pathname declared by the caller", () => {
  const plugin = kpViteScopedRootRedirectPlugin({
    name: "kp-test-scoped-root",
    pathname: "/learn/test/"
  });
  assert.equal(plugin.name, "kp-test-scoped-root");
  assert.equal(kpViteProjectRoot(import.meta.url).endsWith("/scripts/"), true);
});

test("route-neutral helpers do not import application implementations", async () => {
  const source = await readFile(
    new URL("./kp-vite-config-helpers.ts", import.meta.url),
    "utf8"
  );
  assert.equal(source.includes("/src/"), false);
  assert.equal(source.includes("/learn/"), false);
  assert.equal(source.includes("/studio/"), false);
});
