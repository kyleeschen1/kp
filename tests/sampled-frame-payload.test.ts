import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createKpSampledFrameDomainPayload,
  parseKpSampledFrameDomainPayload,
  validateKpSampledFrameDomainPayload,
  type KpSampledFrameDomainPayload
} from "../src/animation/sampled-frame-payload.ts";

const equationPayload = {
  domain: "equation" as const,
  schemaVersion: "kp.sampled-frame-payload.equation.v1" as const,
  kind: "equation-frame-payload" as const,
  frameId: "frame.equation.solve-x",
  assetId: "asset.equation.solve-x",
  surface: "katex-dom" as const,
  objects: [
    { objectId: "equation.before", role: "source" as const },
    { objectId: "equation.after", role: "target" as const }
  ],
  selectors: [
    {
      selectorId: "selector.x.before",
      objectId: "equation.before",
      role: "persistent" as const
    },
    {
      selectorId: "selector.x.after",
      objectId: "equation.after",
      role: "persistent" as const
    }
  ],
  correspondences: [{
    sourceSelectorId: "selector.x.before",
    targetSelectorId: "selector.x.after",
    preserves: ["identity"]
  }]
};

const graphPayload = {
  domain: "graph-diagram" as const,
  schemaVersion: "kp.sampled-frame-payload.graph-diagram.v1" as const,
  kind: "graph-diagram-frame-payload" as const,
  frameId: "frame.graph.linear-map",
  sceneId: "graph.linear-map",
  surface: "graph" as const,
  entityIds: ["vector.source", "vector.target", "vector.current"],
  relationIds: ["relation.linear-map"],
  groupIds: [],
  regionIds: ["region.graph.workspace"],
  activeSelectorIds: ["selector.vector.current"],
  numericSamples: [{
    entityId: "vector.current",
    role: "current" as const,
    components: [2.5, -1]
  }]
};

const programTracePayload = {
  domain: "program-trace" as const,
  schemaVersion: "kp.sampled-frame-payload.program-trace.v1" as const,
  kind: "program-trace-frame-payload" as const,
  frameId: "frame.trace.add",
  traceId: "trace.add",
  sourceFileId: "source.add",
  sharedClockId: "clock.add",
  step: {
    index: 1,
    id: "step.add.evaluate",
    kind: "evaluate" as const,
    summary: "Evaluate the addition."
  },
  activeSelectorIds: ["selector.add.return"],
  stack: [{
    frameId: "stack.add",
    functionName: "add",
    sourceFileId: "source.add",
    selectorId: "selector.add.signature"
  }],
  locals: [
    { name: "a", value: "2", type: "number" },
    { name: "b", value: "3", type: "number" }
  ],
  output: []
};

test("constructs the three closed domain payload families", () => {
  for (const payload of [
    equationPayload,
    graphPayload,
    programTracePayload
  ] satisfies readonly KpSampledFrameDomainPayload[]) {
    const created = createKpSampledFrameDomainPayload(payload);

    assert.deepEqual(created, payload);
    assert.equal(Object.isFrozen(created), true);
    assert.deepEqual(validateKpSampledFrameDomainPayload(created), []);
  }
});

test("domain and schema discriminants cannot be mixed", () => {
  const issues = validateKpSampledFrameDomainPayload({
    ...equationPayload,
    schemaVersion: "kp.sampled-frame-payload.graph-diagram.v1"
  });

  assert.deepEqual(issues.map(({ path, code }) => [path, code]), [
    ["$.schemaVersion", "payload.discriminant"]
  ]);
});

test("closed payloads reject unknown metadata channels", () => {
  const issues = validateKpSampledFrameDomainPayload({
    ...graphPayload,
    metadata: {
      rendererPose: "unchecked"
    }
  });

  assert.deepEqual(issues, [{
    path: "$.metadata",
    code: "payload.shape",
    message: "Domain frame payload does not allow property $.metadata."
  }]);
});

test("domain references must close over their declared semantic ids", () => {
  const equationIssues = validateKpSampledFrameDomainPayload({
    ...equationPayload,
    selectors: [{
      selectorId: "selector.missing",
      objectId: "equation.missing"
    }]
  });
  const graphIssues = validateKpSampledFrameDomainPayload({
    ...graphPayload,
    numericSamples: [{
      entityId: "vector.missing",
      role: "current",
      components: [1, 2]
    }]
  });

  assert.equal(equationIssues.at(-1)?.code, "payload.reference");
  assert.equal(graphIssues.at(-1)?.code, "payload.reference");
});

test("JSON round trips preserve exact domain payloads and restore immutability", () => {
  for (const payload of [
    equationPayload,
    graphPayload,
    programTracePayload
  ] satisfies readonly KpSampledFrameDomainPayload[]) {
    const decoded = parseKpSampledFrameDomainPayload(
      JSON.parse(JSON.stringify(payload))
    );

    assert.deepEqual(decoded, payload);
    assert.equal(Object.isFrozen(decoded), true);
  }
});

test("payload decoding uses validation rather than unchecked domain coercion", () => {
  const path = fileURLToPath(new URL(
    "../src/animation/sampled-frame-payload.ts",
    import.meta.url
  ));
  const source = readFileSync(path, "utf8");

  assert.doesNotMatch(source, /\bas\s+(?:unknown|KpSampledFrame)/);
  assert.throws(
    () => parseKpSampledFrameDomainPayload({
      ...programTracePayload,
      step: { ...programTracePayload.step, index: -1 }
    }),
    /non-negative integer/
  );
});
