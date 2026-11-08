import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";
import postcss from "postcss";
import contract from "./fixtures/algebra-style-contract.json" with { type: "json" };
import { auditStylesheetOwnership } from "../scripts/audit-stylesheet-ownership.ts";
import { commonFactorCardStyles, composedAlgebraCardStyles, authoredCardStyle, authoredEquationCardStyles, reasoningCardStyle, reasoningCardStyles } from "../scripts/algebra-styles.ts";

const root = resolve(import.meta.dirname, "..");
const shared = ["src/rendering/authored-algebra-card.css", "src/reader/presentation/reasoning-card.css", "src/reader/presentation/common-factor-reading.css", "src/reader/presentation/composed-algebra-reading.css"];
const retired = ["authoring-distribution-focus-card", "reusable-reasoning", "common-factor", "composed-algebra"];

test("shared algebra owners preserve existing selector specificity and declaration order", () => {
  const selectors: Record<string, (string | boolean)[][]> = {};
  for (const path of shared) {
    postcss.parse(readFileSync(resolve(root, path), "utf8")).walkRules(rule => {
      for (const selector of rule.selectors) {
        (selectors[selector] ??= []).push(...rule.nodes.filter(node => node.type === "decl")
          .map(node => [node.prop, node.value, !!node.important]));
      }
    });
  }
  assert.deepEqual(Object.fromEntries(Object.entries(selectors).sort(([a], [b]) => a.localeCompare(b))), contract.selectors);
});

test("all browser entries use the same ordered owners as previews and editions", () => {
  const entries: Record<string, readonly string[]> = {
    "authoring-distribution-focus-card/entry.ts": authoredEquationCardStyles,
    "reusable-reasoning/entry.ts": reasoningCardStyles,
    "reusable-reasoning/code-entry.ts": [authoredCardStyle, reasoningCardStyle, "rendering/typescript-refactor.css", "tutorial/kinetic-figure-typescript-focus-card/kinetic-figure-typescript-focus-card.css"],
    "common-factor/entry.ts": commonFactorCardStyles,
    "composed-algebra/entry.ts": composedAlgebraCardStyles,
    "composed-algebra-intuition/entry.ts": composedAlgebraCardStyles,
    "distribute-collect/entry.ts": composedAlgebraCardStyles
  };
  for (const [entry, expected] of Object.entries(entries)) {
    const path = resolve(root, "src/experiments", entry), source = readFileSync(path, "utf8");
    const imports = [...source.matchAll(/^import "([^"]+\.css)";/gm)]
      .map(match => relative(resolve(root, "src"), resolve(dirname(path), match[1]!)));
    assert.deepEqual(imports, expected, entry);
  }
});

test("retired example styles have no remaining source, preview or packaging consumer", () => {
  for (const family of retired) assert.equal(existsSync(resolve(root, `src/experiments/${family}/style.css`)), false);
  const report = auditStylesheetOwnership(root);
  const references = [...report.stylesheets.flatMap(sheet => sheet.references), ...report.unresolvedReferences];
  for (const ref of references) {
    assert.ok(!retired.some(family => ref.literal.includes(`${family}/style.css`)), `${ref.consumer}:${ref.line}: ${ref.literal}`);
  }
});
