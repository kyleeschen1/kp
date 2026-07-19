import assert from "node:assert/strict";
import test from "node:test";

import canonicalArtifactSource from "../content/generated/artifacts/mathematics.linear-equations.solve-with-balance--1.0.0.ts";
import { createExactRationalLinearProblemProvider } from "../providers/linear-problems/public-api.ts";
import {
  canonicalLinearEquationGenerationRequest,
  canonicalLinearEquationRequests,
  mapCanonicalLinearEquationTrace
} from "../src/app-adapters/linear-equation-canonical-provider.ts";
import { createLinearEquationConceptRuntime } from "../src/app-adapters/linear-equation-concept-runtime.ts";
import { KpConceptRoomRuntimeError } from "../src/app-adapters/concept-room-runtime.ts";
import { publishedConceptArtifactSchema } from "../src/authoring/public-api.ts";
import type { KpLinearProblemClient } from "../src/integrations/public-api.ts";
import { createConceptRoomState } from "../src/kernel/public-api.ts";

test("canonical provider seed generates and verifies the exact shared trace", () => {
  const provider = createExactRationalLinearProblemProvider();
  const generation = provider.generate(canonicalLinearEquationGenerationRequest());
  const requests = canonicalLinearEquationRequests(generation);
  const trace = mapCanonicalLinearEquationTrace({
    requests,
    subtractResponse: provider.verifyStep(requests.subtract),
    divideResponse: provider.verifyStep(requests.divide),
    solutionResponse: provider.verifySolution(requests.solution)
  });
  assert.equal(requests.generation.problem.provenance.seed, "canonical-room-9868");
  assert.equal(trace.preservation, "strict");
  assert.equal(trace.solutionVerified, true);
  assert.deepEqual(trace.frames.map((frame) => frame.semanticIds.equation), [
    "equation.initial", "equation.after-subtract", "equation.solved"
  ]);
});

test("linear runtime prepares through only the client and renders both projection contracts", async () => {
  const artifact = publishedConceptArtifactSchema.parse(canonicalArtifactSource);
  const rendered: string[] = [];
  const runtime = createLinearEquationConceptRuntime({
    client: providerClient(),
    loadSymbolicRenderer: async () => ({
      renderSymbolicEquation(_root, projection) { rendered.push(`symbolic:${projection.frameId}`); }
    }),
    loadBalanceRenderer: async () => ({
      renderBalanceScene(_root, projection) { rendered.push(`balance:${projection.frameId}`); }
    })
  });
  const session = await runtime.prepare(artifact, { signal: new AbortController().signal });
  const state = createConceptRoomState({
    schemaVersion: "kp.room-route.v1",
    conceptId: artifact.manifest.conceptId,
    conceptVersion: artifact.manifest.version,
    checkpoint: "start",
    timePermille: 0,
    mode: "touch",
    projection: "symbolic",
    parameters: {},
    focus: []
  }, artifact.integrity);
  await session.render({} as HTMLElement, state);
  await session.render({} as HTMLElement, { ...state, projection: "balance", timePermille: 1000 });
  assert.deepEqual(rendered, ["symbolic:frame.initial", "balance:frame.step.2"]);
  session.dispose();
});

test("linear runtime classifies provider, capability, and renderer failures", async () => {
  const artifact = publishedConceptArtifactSchema.parse(canonicalArtifactSource);
  const providerFailure = createLinearEquationConceptRuntime({
    client: { ...providerClient(), generate: async () => { throw new Error("offline"); } }
  });
  await assert.rejects(
    providerFailure.prepare(artifact, { signal: new AbortController().signal }),
    (error) => error instanceof KpConceptRoomRuntimeError && error.code === "provider-unavailable"
  );

  const unsupported = {
    ...artifact,
    manifest: {
      ...artifact.manifest,
      capabilities: [{ id: "kp.equation", major: 2 }]
    }
  };
  const runtime = createLinearEquationConceptRuntime({
    client: providerClient(),
    loadSymbolicRenderer: async () => { throw new Error("missing chunk"); }
  });
  await assert.rejects(
    runtime.prepare(unsupported, { signal: new AbortController().signal }),
    (error) => error instanceof KpConceptRoomRuntimeError && error.code === "capability-unavailable"
  );
  const session = await runtime.prepare(artifact, { signal: new AbortController().signal });
  const state = createConceptRoomState({
    schemaVersion: "kp.room-route.v1",
    conceptId: artifact.manifest.conceptId,
    conceptVersion: artifact.manifest.version,
    checkpoint: "start",
    timePermille: 0,
    mode: "touch",
    projection: "symbolic",
    parameters: {},
    focus: []
  }, artifact.integrity);
  await assert.rejects(
    Promise.resolve(session.render({} as HTMLElement, state)),
    (error: unknown) => error instanceof KpConceptRoomRuntimeError && error.code === "renderer-unavailable"
  );
});

function providerClient(): KpLinearProblemClient {
  const provider = createExactRationalLinearProblemProvider();
  return {
    async generate(request) {
      const response = provider.generate(request);
      if (response.schemaVersion !== "linear-problem.generate.response.v1") throw new Error(response.message);
      return response;
    },
    async verifyStep(request) {
      const response = provider.verifyStep(request);
      if (response.schemaVersion !== "linear-problem.verify-step.response.v1") throw new Error(response.message);
      return response;
    },
    async verifySolution(request) {
      const response = provider.verifySolution(request);
      if (response.schemaVersion !== "linear-problem.verify-solution.response.v1") throw new Error(response.message);
      return response;
    }
  };
}
