import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { authoredRailExample, compileAuthoredRailPublication } from "../src/tutorial/mechanics-relations/authored-rail-publication.ts";
import { loadAuthoredRail, railSelectionPath, selectAuthoredRail } from "../scripts/rail-authoring-selection.ts";

const source = readFileSync(authoredRailExample, "utf8");
test("one Article supplies the title, prose, rail selection and exact checked mathematics", () => {
  const result = compileAuthoredRailPublication(source, authoredRailExample);
  assert.equal(result.status, "checked"); if (result.status !== "checked") return;
  assert.deepEqual(result.railIds, ["energy-from-momentum", "force-to-energy"]);
  assert.equal(result.title, "What does energy keep—and what does it leave out?");
  assert.ok(result.html.includes("data-derivation-namespace=\"energy\""));
  assert.ok(result.html.includes("data-derivation-namespace=\"power\""));
  assert.ok(result.html.includes("four times as large"));
  assert.ok(!result.html.includes("{{kp-derivation:"));
  assert.equal(result.editorialAuthority, "author-supplied-not-proof");
  assert.ok(result.html.includes(result.sourceRevision));
});

test("a source-only shorter explanation omits the rate argument without renderer edits", () => {
  const shorter = source.replace(/:::kp-passage\{#force-to-energy\}[\s\S]*?\n:::/, "")
    .replace("What does energy keep—and what does it leave out?", "Energy and momentum magnitude");
  const result = compileAuthoredRailPublication(shorter, "examples/shorter.article.md");
  const original = compileAuthoredRailPublication(source, authoredRailExample);
  assert.equal(result.status, "checked"); assert.equal(original.status, "checked");
  if (result.status !== "checked" || original.status !== "checked") return;
  assert.deepEqual(result.railIds, ["energy-from-momentum"]);
  assert.equal(result.title, "Energy and momentum magnitude");
  assert.notEqual(result.sourceRevision, original.sourceRevision);
  assert.ok(!result.html.includes('data-derivation-namespace="power"'));
});

test("unsupported, misplaced, duplicate and quoted references fail with a located repair", () => {
  const reference = "{{kp-derivation:physics.energy-from-momentum@1}}";
  for (const replacement of ["{{kp-derivation:physics.chain-rule@1}}", "prefix " + reference,
    "```\n" + reference + "\n```", reference + "\n" + reference]) {
    const result = compileAuthoredRailPublication(source.replace(reference, replacement), authoredRailExample);
    assert.equal(result.status, "repair"); if (result.status !== "repair") continue;
    assert.ok(result.repair.line > 1);
  }
  const wrong = compileAuthoredRailPublication(source.replace("#energy-from-momentum}", "#wrong-passage}"), authoredRailExample);
  assert.equal(wrong.status, "repair");
  const missing = compileAuthoredRailPublication(source.replaceAll(/\{\{kp-derivation:[^}]+\}\}/g, ""), authoredRailExample);
  assert.equal(missing.status, "repair");
});

test("missing dependencies, copied chains and unsupported presentation selectors require repair", () => {
  const missingDependency = source.replace("{{kp-concept:physics.newtonian-momentum@1.0.0/division}}", "");
  assert.equal(compileAuthoredRailPublication(missingDependency, authoredRailExample).status, "repair");
  const copied = source.replace("{{kp-derivation:physics.force-to-energy@1}}", "$$x=x$$");
  assert.equal(compileAuthoredRailPublication(copied, authoredRailExample).status, "repair");
  assert.equal(compileAuthoredRailPublication(source.replace("#takeaway}", "#momentum-space}"), authoredRailExample).status, "repair");
  assert.equal(compileAuthoredRailPublication("é".repeat(50_001), "large").status, "repair");
});

test("selection retains exact bytes, rejects a bad draft without replacement, and detects tampering", () => {
  const scratch = resolve("tmp/codex"); mkdirSync(scratch, { recursive: true });
  const root = mkdtempSync(resolve(scratch, "rail-selection-"));
  try {
    mkdirSync(resolve(root, "examples/physics"), { recursive: true });
    writeFileSync(resolve(root, authoredRailExample), source);
    const selected = selectAuthoredRail(root, authoredRailExample, source);
    assert.equal(selected.status, "checked");
    const before = readFileSync(resolve(root, railSelectionPath), "utf8");
    const bad = selectAuthoredRail(root, "invalid.md", source.replace("physics.energy-from-momentum@1", "physics.unknown@1"));
    assert.equal(bad.status, "repair");
    assert.equal(readFileSync(resolve(root, railSelectionPath), "utf8"), before);
    assert.deepEqual(loadAuthoredRail(root, true), selected);
    const variation = selectAuthoredRail(root, "variation.md", source.replace("What does energy keep—and what does it leave out?", "A different selected source"));
    assert.equal(variation.status, "checked");
    assert.deepEqual(loadAuthoredRail(root, false), selected, "production ignores a local author selection");
    const stored = JSON.parse(before); stored.text += "\nChanged after selection.\n";
    writeFileSync(resolve(root, railSelectionPath), JSON.stringify(stored));
    assert.throws(() => loadAuthoredRail(root, true), /selection-revision/);
    writeFileSync(resolve(root, railSelectionPath), "{}");
    assert.throws(() => loadAuthoredRail(root, true), /selection-invalid/);
    writeFileSync(resolve(root, railSelectionPath), "");
    assert.throws(() => loadAuthoredRail(root, true), /selection-invalid/, "empty selection must not silently fall back to the reference");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
