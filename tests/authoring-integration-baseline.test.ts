import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const baseline = JSON.parse(readFileSync(
  "tests/fixtures/authoring-integration/baseline.json", "utf8"
)) as {
  source: string;
  snapshot: string;
  metrics: { authoredSetupLines: number; orchestrationLines: number;
    semanticDeclarationLines: number };
  bindings: { name: string; lines: number; category: string }[];
  canonical: Record<string, string>;
  tasks: { id: string; status: string; evidence: string; gap: string }[];
};

test("frozen market baseline counts all 205 setup lines without hiding plumbing", () => {
  const source = readFileSync(baseline.snapshot, "utf8");
  const region = source.split("// composed-market-packet:start\n")[1]!
    .split("// composed-market-packet:end")[0]!;
  const ast = ts.createSourceFile("baseline.ts", region, ts.ScriptTarget.Latest, true);
  const bindings = ast.statements.map(statement => {
    assert.ok(ts.isVariableStatement(statement));
    const declarations = statement.declarationList.declarations;
    assert.equal(declarations.length, 1);
    return {
      name: declarations[0]!.name.getText(ast),
      lines: statement.getText(ast).split("\n").filter(line => line.trim()).length
    };
  });
  assert.deepEqual(bindings, baseline.bindings.map(({ name, lines }) => ({ name, lines })));
  const sum = (category: string) => baseline.bindings
    .filter(binding => binding.category === category)
    .reduce((total, binding) => total + binding.lines, 0);
  const total = region.split("\n").filter(line => line.trim()).length;
  assert.deepEqual(baseline.metrics, {
    authoredSetupLines: total,
    orchestrationLines: sum("orchestration"),
    semanticDeclarationLines: sum("semantic-declaration")
  });
  assert.equal(total, 205);
  assert.equal(sum("orchestration"), 52);
  assert.equal(sum("orchestration") + sum("semantic-declaration"), total);
  // Freeze imports and helper bodies too, so later savings cannot hide moved glue.
  assert.match(source, /function interpolateExact/);
  assert.match(source, /function parseExact/);
});

test("manual baseline stays frozen while the live specimen uses internal assembly", () => {
  const frozen = readFileSync(baseline.snapshot, "utf8");
  const live = readFileSync(baseline.source, "utf8");
  assert.match(frozen, /compileKpSemanticStateSchema\(/);
  assert.match(live, /assembleKpSemanticStateModel\(/);
  assert.match(live, /assembleKpSemanticStateExplanation\(/);
  assert.notEqual(live, frozen);
});

test("authoring source map names the actual host and its canonical owners", () => {
  for (const [role, path] of Object.entries(baseline.canonical)) {
    if (role !== "hostPath") assert.ok(existsSync(path), role + ": " + path);
  }
  const entry = readFileSync(baseline.canonical["entry"]!, "utf8");
  assert.doesNotMatch(entry, /economics-supply-tax-scroll-score\.kp\.md\?raw|createKpEconomicsSupplyTaxAnimationAsset/);
  assert.match(entry, /input\.source\.sampleFrame\(modelProgress\)/);
  const compiler = readFileSync("scripts/compile-canonical-tax-source.ts", "utf8");
  assert.match(compiler, /economics-supply-tax-scroll-score\.kp\.md/);
  assert.match(entry, /createKpReaderTimelinePlaybackClock/);
  assert.match(entry, /kinetic-figure-supply-tax-svg/);
  const paint = readFileSync(baseline.canonical["paint"]!, "utf8");
  assert.match(paint, /renderLatexToHtml/);
  assert.equal(baseline.canonical["hostPath"], "/experiments/kinetic-figure/supply-tax/");
});

test("author tasks distinguish component evidence from completed integration", () => {
  assert.deepEqual(baseline.tasks.map(task => task.id), [
    "parameter-edit", "demand-tax-composition", "selected-rewrite",
    "historical-selection", "prose-focus-binding", "publication"
  ]);
  for (const task of baseline.tasks) {
    assert.equal(task.status, "integration-gap");
    assert.ok(task.gap.length > 0);
    assert.ok(existsSync(task.evidence));
  }
});
