import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpHtmlEncodingOwners,
  type KpHtmlOutputContext
} from "../src/architecture/html-output-encoding-inventory.ts";

test("every local generic HTML helper has one classified sink owner", async () => {
  const actualOwners = await sourceFiles(["src", "scripts"]);
  const sources = await Promise.all(actualOwners.map(async (sourceFile) => ({
    sourceFile,
    source: await readFile(sourceFile, "utf8")
  })));
  const actual = sources
    .filter(({ source }) => /function escapeHtml/.test(source))
    .map(({ sourceFile }) => sourceFile)
    .sort();
  const classified = kpHtmlEncodingOwners
    .map(({ sourceFile }) => sourceFile)
    .slice()
    .sort();

  assert.deepEqual(classified, actual);
  assert.equal(new Set(classified).size, classified.length);
});

test("the excess helper has one context-specific consolidation target", () => {
  const selected = kpHtmlEncodingOwners.filter(
    ({ disposition }) => disposition.kind === "consolidate"
  );

  assert.deepEqual(selected, [
    {
      sourceFile: "src/editor/exact-fraction-quantity-surface-adapter.ts",
      outputContexts: ["html-text", "html-attribute"],
      disposition: {
        kind: "consolidate",
        boundary: "editor-context-encoder"
      }
    }
  ]);
});

test("the inventory does not erase parser-context distinctions", () => {
  const represented = new Set<KpHtmlOutputContext>(
    kpHtmlEncodingOwners.flatMap(({ outputContexts }) => outputContexts)
  );

  assert.deepEqual(
    [...represented].sort(),
    ["html-attribute", "html-text", "svg-attribute", "svg-text"]
  );
});

async function sourceFiles(roots: readonly string[]): Promise<string[]> {
  const visit = async (path: string): Promise<string[]> => {
    const entries = await readdir(path, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => {
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) return visit(child);
      return /\.(?:mjs|ts|tsx)$/.test(entry.name) ? [child] : [];
    }))).flat();
  };

  return (await Promise.all(roots.map(visit))).flat();
}
