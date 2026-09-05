import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";
import { createKpSemanticStateComposedMarketPacket } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-composed-market.ts";
import { createKpSemanticStateQuerySession } from "../src/semantic-state/authoring-query-session.ts";
import { createKpSettledSemanticStateCompositionAddress } from
  "../src/semantic-state/state-family-composition-address.ts";
import { measureKpAuthoringIntegrationCost } from "./helpers/authoring-integration-cost.ts";

test("assembled market exactly matches the executed frozen manual pipeline", async () => {
  const source = readFileSync("tests/fixtures/authoring-integration/composed-market-baseline.ts.txt", "utf8");
  const sourceUrl = pathToFileURL(resolve("src/experiments/typed-linear-supply-demand/semantic-state-composed-market.ts"));
  // This is committed characterization source, evaluated only by the Node test;
  // it does not establish any browser or user-source evaluation capability.
  const javascript = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext
  }}).outputText.replace(/from\s+["'](\.[^"']+)["']/g,
    (_match, path: string) => `from ${JSON.stringify(new URL(path, sourceUrl).href)}`);
  const frozen = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`) as {
    createKpSemanticStateComposedMarketPacket: typeof createKpSemanticStateComposedMarketPacket
  };
  const before = frozen.createKpSemanticStateComposedMarketPacket();
  const after = createKpSemanticStateComposedMarketPacket();
  assert.deepEqual(after.initial, before.initial);
  assert.deepEqual(after.chain.boundaries, before.chain.boundaries);
  assert.deepEqual(after.chain.applications.map(item => item.application.commit.journal),
    before.chain.applications.map(item => item.application.commit.journal));
  assert.deepEqual(after.declaration, before.declaration);
  assert.deepEqual(after.compositionHandles, before.compositionHandles);
  const session = createKpSemanticStateQuerySession(after.explanation);
  const final = createKpSettledSemanticStateCompositionAddress({
    handles: after.explanation.handles, boundary: after.explanation.handles.composition.after
  });
  assert.deepEqual(session.evaluate(final, after.stateHandles.refs.outcomes.accounting).totalSurplus,
    { numerator: "35", denominator: "1" });
  session.dispose();
});

test("market author cost charges wrapper and compatibility glue and discloses shared implementation", () => {
  const cost = measureKpAuthoringIntegrationCost();
  assert.equal(cost.authoredSetupLines, cost.semanticDeclarationLines + cost.setupOrchestrationLines);
  assert.ok(cost.chargedOrchestrationLines <= 26, JSON.stringify(cost));
  assert.ok(cost.current.importModules < cost.previous.importModules);
  assert.ok(cost.shared.every(item => item.sourceLines > 0));
  const frozen = readFileSync("tests/fixtures/authoring-integration/composed-market-baseline.ts.txt", "utf8");
  const live = readFileSync("src/experiments/typed-linear-supply-demand/semantic-state-composed-market.ts", "utf8");
  assert.equal(live.slice(live.indexOf("function interpolateExact")),
    frozen.slice(frozen.indexOf("function interpolateExact")));
  for (const helper of cost.shared) {
    assert.doesNotMatch(readFileSync(helper.path, "utf8"), /composed-market|per-unit-tax|demandPriceIntercept/);
  }
  console.log("AUTHORING_COST", JSON.stringify(cost));
});
