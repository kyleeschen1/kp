import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import product from "../src/authoring/examples/composed-algebra-product.json" with { type: "json" };
import { createKpComposedAlgebraExample, checkKpComposedAlgebraAuthorSource } from "../src/authoring/composed-algebra-author-check.ts";
import { runAuthorCheckCli } from "../scripts/author-check.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { assertKpComposedAlgebraPresentation } from "../src/authoring/composed-algebra-presentation.ts";

test("discovery and owner preserve exact composed reports without live authority", async () => {
  assert.deepEqual(createKpComposedAlgebraExample(), primary);
  assert.deepEqual(await runAuthorCheckCli(["--task", "equation.composed-algebra", "--example"]), primary);
  for (const source of [primary, product]) {
    const json = JSON.stringify(source), result = checkKpComposedAlgebraAuthorSource(json);
    assert.equal(result.status, "compiled");
    assert.deepEqual(await runAuthorCheckCli(["--task", "equation.composed-algebra", "--request", "source.json"], () => json),
      reportAuthorCheck("equation.composed-algebra", result));
    assert.throws(() => assertKpComposedAlgebraPresentation(result), TypeError);
    assert.equal("draft" in result, false);
    assert.equal(checkKpComposedAlgebraAuthorSource(JSON.stringify(result)).status, "repair-gap");
  }
});

test("packet repair examples keep owner codes and paths, then recover after one source correction", () => {
  for (const [index, latex, code] of [[1, "(2+4)(x+3)", "invalid-factorization"], [2, "6(x+3)", "invalid-evaluation"]] as const) {
    const source = structuredClone(primary); source.states[index]!.latex = latex;
    const result = checkKpComposedAlgebraAuthorSource(JSON.stringify(source));
    assert.equal(result.status, "repair-gap");
    if (result.status !== "repair-gap") throw Error("Expected located repair.");
    assert.equal(result.diagnostic.code, code); assert.equal(result.diagnostic.path, `$.states[${index}].latex`);
    source.states[index]!.latex = primary.states[index]!.latex;
    assert.equal(checkKpComposedAlgebraAuthorSource(JSON.stringify(source)).status, "compiled");
  }
  const registry = readFileSync("scripts/author-check-owner-dispatch.ts", "utf8");
  assert.match(registry, /satisfies KpAuthorTaskOwners/);
  assert.doesNotMatch(registry, /switch\s*\(task\)|task\s*===/);
  const packet = readFileSync("docs/project/authoring/composed-algebra-authoring-packet.md", "utf8");
  for (const expected of ["equation.composed-algebra", "composed-algebra-primary.json", "composed-algebra-product.json", "invalid-factorization", "invalid-evaluation", "Apply"])
    assert.ok(packet.includes(expected), expected);
});
