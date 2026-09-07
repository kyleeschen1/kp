import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  runKpEquationTransformSeriesCli,
  type KpEquationTransformSeriesCliDependencies
} from "../scripts/compile-equation-transform-series.ts";
import { collectKpRuntimeImportClosure } from
  "../scripts/runtime-import-closure.ts";
import { kpEquationSeriesOperationRegistry } from
  "../src/authoring/equation-series-operation-declarations.ts";
import { createKpEquationSeriesLogarithmBaseExample } from
  "../src/authoring/equation-series-logarithm-base-example.ts";

interface CliResponse {
  readonly status: string;
  readonly requestSchemaVersion?: string | undefined;
  readonly operations?: readonly Readonly<{
    operationId: string;
    source: string;
    governedAuthoring?: Readonly<{
      schemaVersion: string;
      roleIds: readonly string[];
    }> | undefined;
  }>[] | undefined;
  readonly request?: Readonly<{ id: string }> | undefined;
  readonly runtime?: Readonly<{
    id: string;
    plans: readonly unknown[];
    checkpoints: readonly unknown[];
  }> | undefined;
  readonly repairs?: readonly Readonly<{
    code: string;
    path: string;
  }>[] | undefined;
}

test("named example binds real source authority and rejects edited false endpoints", async () => {
  const accepted = cliHarness();
  assert.equal(await runKpEquationTransformSeriesCli(["--example", "logarithm-change-of-base"], accepted.dependencies), 0);
  assert.equal(accepted.output().runtime?.plans.length, 1);
  const { value } = createKpEquationSeriesLogarithmBaseExample();
  const missing = cliHarness(JSON.stringify(value));
  assert.equal(await runKpEquationTransformSeriesCli([], missing.dependencies), 2);
  const changed = { ...value, states: [value.states[0], { ...value.states[1], latex: "\\frac{\\ln(2)}{\\ln(7)}" }] };
  const rejected = cliHarness(JSON.stringify(changed));
  assert.equal(await runKpEquationTransformSeriesCli(["--example", "logarithm-change-of-base", "--request", "-"], rejected.dependencies), 2);
  assert.equal(rejected.output().status, "repair-required");
  assert.equal(rejected.output().runtime, undefined);
  const unrelated = cliHarness(JSON.stringify(validRequest()));
  assert.equal(await runKpEquationTransformSeriesCli(["--example", "logarithm-change-of-base", "--request", "-"], unrelated.dependencies), 2);
  assert.equal(unrelated.output().runtime, undefined);
  const unknown = cliHarness();
  assert.equal(await runKpEquationTransformSeriesCli(["--example", "invented"], unknown.dependencies), 2);
});

test("list mode exposes deterministic series capabilities", async () => {
  const harness = cliHarness();
  assert.equal(
    await runKpEquationTransformSeriesCli(["--list"], harness.dependencies),
    0
  );
  const response = harness.output();
  assert.equal(response.status, "catalogue");
  assert.equal(
    response.requestSchemaVersion,
    "kp.equation-transform-series-request.v1"
  );
  assert.deepEqual(
    response.operations?.map(({ operationId }) => operationId),
    kpEquationSeriesOperationRegistry.ids
  );
  assert.equal(
    response.operations?.filter(({ governedAuthoring }) =>
      governedAuthoring !== undefined
    ).length,
    6
  );
  assert.deepEqual(
    response.operations?.find(({ operationId }) =>
      operationId === "kp.algebra.apply-natural-log-both-sides"
    )?.governedAuthoring?.roleIds,
    ["lhs", "rhs", "relation", "applied-operation"]
  );
});

test("stdin compiles a JSON series into one deterministic runtime", async () => {
  const harness = cliHarness(JSON.stringify(validRequest()));
  assert.equal(
    await runKpEquationTransformSeriesCli([], harness.dependencies),
    0
  );
  const response = harness.output();
  assert.equal(response.status, "compiled");
  assert.equal(response.request?.id, "series.cli.wrap.v1");
  assert.equal(response.runtime?.id, "runtime.series.cli.wrap.v1");
  assert.equal(response.runtime?.plans.length, 1);
  assert.equal(response.runtime?.checkpoints.length, 2);
});

test("typed series repairs are printed without a partial runtime", async () => {
  const harness = cliHarness(JSON.stringify({
    ...validRequest(),
    adjacencies: [{
      ...validRequest().adjacencies[0],
      intent: {
        mode: "explicit",
        operationId: "operation.equation.unknown.v1",
        semanticArguments: {}
      }
    }]
  }));
  assert.equal(
    await runKpEquationTransformSeriesCli([], harness.dependencies),
    2
  );
  const response = harness.output();
  assert.equal(response.status, "repair-required");
  assert.equal(response.repairs?.[0]?.code, "equation-series.repair.unknown-operation");
  assert.equal(response.runtime, undefined);
});

test("malformed JSON and contradictory arguments fail before compilation", async () => {
  const malformed = cliHarness("{not-json");
  assert.equal(
    await runKpEquationTransformSeriesCli([], malformed.dependencies),
    2
  );
  assert.equal(
    malformed.output().repairs?.[0]?.code,
    "equation-series.cli.request.json"
  );

  const contradictory = cliHarness();
  assert.equal(
    await runKpEquationTransformSeriesCli(
      ["--list", "--request", "fixture.json"],
      contradictory.dependencies
    ),
    2
  );
  assert.equal(
    contradictory.output().repairs?.[0]?.code,
    "equation-series.cli.request.arguments"
  );
});

test("the series command closure excludes UI rendering and browser authority", () => {
  const entry = fileURLToPath(new URL(
    "../scripts/compile-equation-transform-series.ts",
    import.meta.url
  ));
  const source = readFileSync(entry, "utf8");
  assert.doesNotMatch(
    source,
    /(?:src\/editor|src\/rendering|\.svelte|window\.|document\.|HTMLElement|SVGElement)/u
  );
  const inputs = collectKpRuntimeImportClosure(entry);
  assert.deepEqual(inputs.filter((path) =>
    path.includes("/src/editor/") ||
    path.includes("/src/rendering/") ||
    path.includes("/src/public-web/") ||
    path.endsWith(".svelte")
  ), []);
});

function validRequest() {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.cli.wrap.v1",
    states: [
      { id: "state.cli.before", latex: "x" },
      { id: "state.cli.after", latex: "\\ln(x)" }
    ],
    adjacencies: [{
      id: "adjacency.cli.wrap",
      fromStateId: "state.cli.before",
      toStateId: "state.cli.after",
      intent: {
        mode: "explicit",
        operationId: "kp.algebra.wrap-function",
        semanticArguments: { wrapper: "ln" }
      }
    }]
  };
}

function cliHarness(stdin = ""): {
  readonly dependencies: KpEquationTransformSeriesCliDependencies;
  readonly output: () => CliResponse;
} {
  let output = "";
  return {
    dependencies: {
      readFile: async () => stdin,
      readStdin: async () => stdin,
      write: (chunk) => { output += chunk; }
    },
    output: () => JSON.parse(output) as CliResponse
  };
}
