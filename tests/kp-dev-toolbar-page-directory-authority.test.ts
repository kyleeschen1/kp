import assert from "node:assert/strict";
import test from "node:test";

import { generatedConceptCatalog } from "../content/public-api.ts";
import {
  kpDevelopmentBuildEntries
} from "../src/dev-toolbar/development-page-build-entries.ts";
import {
  kpDevelopmentPages
} from "../src/dev-toolbar/development-page-directory.ts";
import {
  kpReaderRouteHtmlPath
} from "../src/reader/compiler/reader-route-descriptor.ts";
import {
  kpReaderRouteManifest
} from "../src/reader/compiler/reader-route-manifest.ts";

test("reader directory entries exactly follow reader-route authority", () => {
  assert.deepEqual(
    kpDevelopmentPages
      .filter(({ group }) => group === "readers")
      .map(({ href }) => new URL(href, "https://kp.invalid").pathname)
      .sort(),
    kpReaderRouteManifest.map(({ route }) => route).sort()
  );
});

test("concept routes in the generated catalog are reachable from the directory", () => {
  const hrefs = new Set(kpDevelopmentPages.map(({ href }) =>
    new URL(href, "https://kp.invalid").pathname));
  for (const concept of generatedConceptCatalog) {
    assert.ok(
      hrefs.has(concept.canonicalPath),
      `Missing development page for ${concept.canonicalPath}`
    );
  }
});

test("logical pages resolve only through declared Vite or reader HTML inputs", () => {
  const buildPaths = new Set(kpDevelopmentBuildEntries.map(({ htmlPath }) =>
    htmlPath));
  const readerPaths = new Set(kpReaderRouteManifest.map(({ route }) =>
    kpReaderRouteHtmlPath(route)));
  const expectedPhysicalPaths = new Set([...buildPaths, ...readerPaths]);

  for (const page of kpDevelopmentPages) {
    const physicalPath = physicalHtmlPath(page.href);
    assert.ok(
      expectedPhysicalPaths.has(physicalPath),
      `${page.id} resolves through undeclared entry ${physicalPath}`
    );
  }
  assert.deepEqual(
    new Set(kpDevelopmentBuildEntries.map(({ name }) => name)).size,
    kpDevelopmentBuildEntries.length
  );
});

function physicalHtmlPath(href: string): string {
  const pathname = new URL(href, "https://kp.invalid").pathname;
  if (pathname === "/" || pathname.startsWith("/concepts/")) {
    return "index.html";
  }
  if (pathname.endsWith(".html")) return pathname.slice(1);
  return `${pathname.slice(1).replace(/\/?$/u, "/")}index.html`;
}
