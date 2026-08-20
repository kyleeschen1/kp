import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpExponentialNativeEndpointInk,
  createKpExponentialHomomorphismNativeEndpoints,
  type KpExponentialNativeEndpoint
} from "../src/rendering/exponential-homomorphism-native-endpoints.ts";
import {
  createKpNativeKatexRenderedSceneObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  compileKpExponentialHomomorphismCorrespondence
} from "../src/semantic/exponential-homomorphism-correspondence.ts";
import { normalizeKpPowerApplicationEndpoint } from
  "../src/semantic/power-application-endpoint-normalizer.ts";

const normalized = normalizeKpPowerApplicationEndpoint("b^{x+y}");
if (normalized.status !== "normalized") {
  throw new Error("Native endpoint fixture requires a normalized power source.");
}
const authority = compileKpExponentialHomomorphismCorrespondence({
  id: "exponential.sum-to-product.native.xy",
  source: normalized.endpoint,
  baseReferentId: "semantic.exponential.base.b",
  operandReferentIds: [
    "semantic.exponential.operand.x",
    "semantic.exponential.operand.y"
  ]
});
const endpoints = createKpExponentialHomomorphismNativeEndpoints(authority);

test("power homomorphism compiles exact accessible native KaTeX endpoints", () => {
  assert.equal(endpoints.source.rawLatex, "b^{x+y}");
  assert.equal(endpoints.target.rawLatex, "b^{x}b^{y}");
  for (const endpoint of [endpoints.source, endpoints.target]) {
    assert.equal(endpoint.accessibleText, endpoint.rawLatex);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-mathml"/u);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-html"/u);
    endpoint.nodes.filter(({ motionId }) => motionId !== undefined)
      .forEach(({ motionId }) => assert.match(
        endpoint.nativeHtmlAndMathml,
        new RegExp(`data-kp-motion-id="${escapeRegex(motionId!)}"`)
      ));
  }
});

test("target multiplication stays native juxtaposition with a derived gap anchor", () => {
  const connector = endpoints.target.nodes.find(({ role }) =>
    role === "combination-connector"
  );
  assert.equal(connector?.measurement, "derived-adjacency");
  assert.equal(connector?.motionId, undefined);
  assert.doesNotMatch(endpoints.target.rawLatex, /\\cdot|\\times/u);
  assert.doesNotMatch(endpoints.target.annotatedLatex, /\\mkern|\\phantom/u);

  const certificate = certifyKpExponentialNativeEndpointInk({
    endpoint: endpoints.target,
    scene: scene(endpoints.target),
    deviceScaleFactor: 2
  });
  const connectorAnchor = certificate.anchors.find(({ role }) =>
    role === "connector"
  );
  assert.deepEqual(connectorAnchor?.rect, {
    left: 30,
    top: 10,
    width: 6,
    height: 22
  });
  assert.equal(connectorAnchor?.anchorX, 33);
});

test("ink certificates cover base, exponent plane, operands, and connector", () => {
  for (const endpoint of [endpoints.source, endpoints.target]) {
    const certificate = certifyKpExponentialNativeEndpointInk({
      endpoint,
      scene: scene(endpoint),
      deviceScaleFactor: 1
    });
    const expected = endpoint.nodes.filter(({ role }) => [
      "base",
      "superscript-region",
      "exponent-payload",
      "combination-connector"
    ].includes(role));
    assert.equal(certificate.anchors.length, expected.length);
    assert.deepEqual(
      new Set(certificate.anchors.map(({ role }) => role)),
      new Set(["base", "exponent-plane", "operand", "connector"])
    );
    assert.equal(certificate.coordinateSpace, "stage-css-pixels");
    assert.throws(() => JSON.stringify(certificate), /cannot enter durable state/u);
  }
});

test("equivalent native poses retain CSS-pixel ink anchors across DPR", () => {
  const endpoint = endpoints.target;
  const dpr1 = certifyKpExponentialNativeEndpointInk({
    endpoint,
    scene: scene(endpoint, "wide:dpr-1"),
    deviceScaleFactor: 1
  });
  const dpr2 = certifyKpExponentialNativeEndpointInk({
    endpoint,
    scene: scene(endpoint, "wide:dpr-2"),
    deviceScaleFactor: 2
  });
  assert.deepEqual(
    dpr1.anchors.map(({ occurrenceId, rect, anchorX, anchorY }) => ({
      occurrenceId,
      rect,
      anchorX,
      anchorY
    })),
    dpr2.anchors.map(({ occurrenceId, rect, anchorX, anchorY }) => ({
      occurrenceId,
      rect,
      anchorX,
      anchorY
    }))
  );
});

test("endpoint certification fails closed on wrong side or missing native groups", () => {
  assert.throws(() => certifyKpExponentialNativeEndpointInk({
    endpoint: endpoints.source,
    scene: scene(endpoints.target),
    deviceScaleFactor: 1
  }), /wrong endpoint/u);
  const sourceScene = scene(endpoints.source);
  const firstGroup = sourceScene.groups[0];
  assert.ok(firstGroup);
  const incomplete = createKpNativeKatexRenderedSceneObservation({
    endpoint: "source",
    stage: sourceScene.stage,
    root: sourceScene.root,
    atoms: [],
    groups: sourceScene.groups.slice(1),
    fontRevision: sourceScene.fontRevision,
    viewportKey: sourceScene.viewportKey
  });
  assert.throws(() => certifyKpExponentialNativeEndpointInk({
    endpoint: endpoints.source,
    scene: incomplete,
    deviceScaleFactor: 1
  }), /missing measured group/u);
});

function scene(
  endpoint: KpExponentialNativeEndpoint,
  viewportKey = "wide:dpr-independent"
) {
  const ownerDocument = {};
  const stage = { ownerDocument } as HTMLElement;
  const root = { ownerDocument } as HTMLElement;
  const nativeNodes = endpoint.nodes.filter(({ measurement }) =>
    measurement !== "derived-adjacency"
  );
  return createKpNativeKatexRenderedSceneObservation({
    endpoint: endpoint.endpoint,
    stage,
    root,
    atoms: [],
    groups: nativeNodes.map((node) => ({
      id: node.presentationGroupId,
      semanticEntityId: node.occurrenceId,
      atomIds: [],
      rect: rectFor(node.role, node.ordinal)
    })),
    fontRevision: 3,
    viewportKey
  });
}

function rectFor(
  role: KpExponentialNativeEndpoint["nodes"][number]["role"],
  ordinal: number
) {
  if (role === "power-application") {
    return { left: ordinal === 0 ? 10 : 36, top: 10, width: 20, height: 22 };
  }
  if (role === "base") {
    return { left: ordinal === 0 ? 10 : 36, top: 20, width: 8, height: 12 };
  }
  if (role === "superscript-region") {
    return { left: ordinal === 0 ? 18 : 44, top: 10, width: 12, height: 10 };
  }
  if (role === "exponent-payload") {
    return { left: 18 + ordinal * 26, top: 10, width: 5, height: 8 };
  }
  if (role === "combination-connector") {
    return { left: 24, top: 10, width: 4, height: 8 };
  }
  return { left: 10, top: 10, width: 46, height: 22 };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
