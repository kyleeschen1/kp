import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  KpLinearProblemClientError,
  createLinearProblemClient,
  type KpLinearProblemFetch,
  type KpLinearProblemHttpResponse
} from "../src/integrations/public-api.ts";

const problem = {
  problemId: "linear-problems.exact-rational:canonical",
  equation: {
    left: {
      variable: "x",
      coefficient: { numerator: "2", denominator: "1" },
      constant: { numerator: "3", denominator: "1" }
    },
    right: {
      variable: "x",
      coefficient: { numerator: "0", denominator: "1" },
      constant: { numerator: "8", denominator: "1" }
    }
  },
  solution: { numerator: "5", denominator: "2" },
  provenance: {
    providerId: "linear-problems.exact-rational",
    providerVersion: "1.0.0",
    protocolVersion: "linear-problem.v1",
    seed: "canonical"
  }
} as const;

test("browser client posts only the versioned JSON protocol and validates success", async () => {
  const calls: { url?: string; init?: Parameters<KpLinearProblemFetch>[1] } = {};
  const client = createLinearProblemClient({
    fetch: async (url, init) => {
      calls.url = url;
      calls.init = init;
      return jsonResponse(200, { schemaVersion: "linear-problem.generate.response.v1", problem });
    }
  });
  const controller = new AbortController();
  const response = await client.generate({
    schemaVersion: "linear-problem.generate.request.v1",
    seed: "canonical",
    constraints: { minimumCoefficient: -9, maximumCoefficient: 9, allowFractionalSolution: true }
  }, { signal: controller.signal });
  assert.equal(calls.url, "/api/v1/linear-problems");
  assert.equal(calls.init?.method, "POST");
  assert.equal(calls.init?.headers["content-type"], "application/json");
  assert.equal(calls.init?.signal, controller.signal);
  assert.equal(response.problem.solution.numerator, "5");
});

test("client rejects invalid requests before fetch and refuses unversioned endpoints", async () => {
  let called = false;
  const client = createLinearProblemClient({ fetch: async () => { called = true; return jsonResponse(200, {}); } });
  await assert.rejects(() => client.generate({
    schemaVersion: "linear-problem.generate.request.v1",
    seed: "",
    constraints: { minimumCoefficient: -9, maximumCoefficient: 9, allowFractionalSolution: true }
  }), /at least 1 character/);
  assert.equal(called, false);
  assert.throws(() => createLinearProblemClient({ endpoint: "/api/linear-problems" }), /versioned/);
});

test("client preserves structured protocol errors", async () => {
  const client = createLinearProblemClient({
    fetch: async () => jsonResponse(400, {
      schemaVersion: "linear-problem.error.v1",
      code: "invalid-request",
      message: "Candidate equation is invalid.",
      path: ["$.candidate"],
      retryable: false
    })
  });
  await assert.rejects(
    () => client.verifySolution({
      schemaVersion: "linear-problem.verify-solution.request.v1",
      problem,
      candidate: { numerator: "5", denominator: "2" }
    }),
    (error: unknown) => error instanceof KpLinearProblemClientError &&
      error.category === "protocol" && error.protocolError?.code === "invalid-request"
  );
});

test("client rejects transport, JSON, and response-schema failures", async () => {
  const cases: readonly [KpLinearProblemHttpResponse, KpLinearProblemClientError["category"]][] = [
    [{ ...jsonResponse(200, {}), headers: { get: () => "text/html" } }, "transport"],
    [{ ...jsonResponse(200, {}), json: async () => { throw new SyntaxError("bad json"); } }, "transport"],
    [jsonResponse(200, { schemaVersion: "linear-problem.generate.response.v1", problem: { invalid: true } }), "schema"],
    [jsonResponse(502, { error: "gateway" }), "transport"]
  ];
  for (const [response, category] of cases) {
    const client = createLinearProblemClient({ fetch: async () => response });
    await assert.rejects(
      () => client.generate({
        schemaVersion: "linear-problem.generate.request.v1",
        seed: "canonical",
        constraints: { minimumCoefficient: -9, maximumCoefficient: 9, allowFractionalSolution: true }
      }),
      (error: unknown) => error instanceof KpLinearProblemClientError && error.category === category
    );
  }
});

test("transport source imports protocol contracts but no provider engine or KP mapper", () => {
  const source = readFileSync(new URL("../src/integrations/linear-problem-client.ts", import.meta.url), "utf8");
  assert.equal(source.includes("providers/"), false);
  assert.equal(source.includes("../animation/"), false);
  assert.match(source, /protocols\/public-api\.ts/);
});

function jsonResponse(status: number, body: unknown): KpLinearProblemHttpResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? "application/json" : null },
    json: async () => body
  };
}
