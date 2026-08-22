import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFiniteSumNativePaintOwnership
} from "../src/rendering/finite-sum-native-paint-ownership.ts";
import {
  kpCanonicalFiniteSumNativeEndpoints,
  type KpFiniteSumNativeEndpoint
} from "../src/rendering/finite-sum-native-endpoints.ts";
import {
  createKpNativeKatexRenderedEndpointHandle,
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  kpCanonicalFiniteSumExpansionOperation
} from "../src/semantic/canonical-finite-sum-expansion.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const root = { ownerDocument } as HTMLElement;

test("finite sum owns every settled endpoint atom exactly once", () => {
  const [sourceEndpoint, targetEndpoint] =
    kpCanonicalFiniteSumNativeEndpoints;
  const sourceHandle = handle(sourceEndpoint);
  const targetHandle = handle(targetEndpoint);
  const ownership = createKpFiniteSumNativePaintOwnership({
    sourceHandle,
    targetHandle
  });

  assert.strictEqual(ownership.source.handle, sourceHandle);
  assert.strictEqual(ownership.target.handle, targetHandle);
  assert.equal(ownership.source.leafAtomIds.length, sourceEndpoint.nodes.length);
  assert.equal(ownership.target.leafAtomIds.length, targetEndpoint.nodes.length);
  assert.equal(Object.isFrozen(ownership), true);
  assert.throws(() => JSON.stringify(ownership),
    /cannot enter durable state/u);
});

test("body fans out while boundary paint transfers to boundary references", () => {
  const ownership = createKpFiniteSumNativePaintOwnership({
    sourceHandle: handle(kpCanonicalFiniteSumNativeEndpoints[0]),
    targetHandle: handle(kpCanonicalFiniteSumNativeEndpoints[1])
  });
  const operation = kpCanonicalFiniteSumExpansionOperation;

  assert.deepEqual(ownership.relations, [
    {
      id: "paint.finite-binder.body-template-instantiates",
      relation: "split",
      sourceEntityIds: [operation.source.semantic.body.id],
      targetEntityIds: operation.target.instances.map(({ id }) => id)
    },
    {
      id: "paint.finite-binder.lower-bound-materializes-reference",
      relation: "persist",
      sourceEntityIds: [operation.source.semantic.lowerBound.id],
      targetEntityIds: [operation.target.instances[0]!.references[0]!.id]
    },
    {
      id: "paint.finite-binder.upper-bound-materializes-reference",
      relation: "persist",
      sourceEntityIds: [operation.source.semantic.upperBound.id],
      targetEntityIds: [operation.target.instances[2]!.references[0]!.id]
    }
  ]);
  assert.equal(ownership.relations.some(({ sourceEntityIds }) =>
    sourceEntityIds.includes(operation.source.semantic.operator.id)
  ), false);
  assert.equal(ownership.relations.some(({ sourceEntityIds }) =>
    sourceEntityIds.includes(
      operation.source.semantic.body.references[0]!.id
    )
  ), false);
});

test("paint ownership rejects missing roles stray atoms and stale fonts", () => {
  const [sourceEndpoint, targetEndpoint] =
    kpCanonicalFiniteSumNativeEndpoints;
  assert.throws(() => createKpFiniteSumNativePaintOwnership({
    sourceHandle: handle(sourceEndpoint, { omitLast: true }),
    targetHandle: handle(targetEndpoint)
  }), /lacks settled native ink/u);
  assert.throws(() => createKpFiniteSumNativePaintOwnership({
    sourceHandle: handle(sourceEndpoint, { addStray: true }),
    targetHandle: handle(targetEndpoint)
  }), /has no declared semantic role/u);
  assert.throws(() => createKpFiniteSumNativePaintOwnership({
    sourceHandle: handle(sourceEndpoint, { fontRevision: 1 }),
    targetHandle: handle(targetEndpoint, { fontRevision: 2 })
  }), /share one settled font revision/u);
});

test("ownership compilation uses cached ink and never remeasures the DOM", () => {
  const [sourceEndpoint, targetEndpoint] =
    kpCanonicalFiniteSumNativeEndpoints;
  const ownership = createKpFiniteSumNativePaintOwnership({
    sourceHandle: handle(sourceEndpoint, { throwOnMeasure: true }),
    targetHandle: handle(targetEndpoint, { throwOnMeasure: true })
  });
  assert.ok(ownership.source.owners.every(({ rect }) =>
    rect.width > 0 && rect.height > 0
  ));
});

function handle(endpoint: KpFiniteSumNativeEndpoint, options: {
  readonly omitLast?: boolean;
  readonly addStray?: boolean;
  readonly fontRevision?: number;
  readonly throwOnMeasure?: boolean;
} = {}) {
  const nodes = options.omitLast ? endpoint.nodes.slice(0, -1) : endpoint.nodes;
  const atoms: KpNativeKatexPaintAtomObservation[] = nodes.map((node, ordinal) => ({
    kind: "native-katex-paint-atom-observation" as const,
    lifecycle: "renderer-session" as const,
    id: `${endpoint.endpoint}.paint.glyph.${ordinal}`,
    endpoint: endpoint.endpoint,
    semanticEntityId: node.occurrenceId,
    presentationGroupId: node.presentationGroupId,
    paintKind: "glyph" as const,
    paintMeasurement: "atomic-text" as const,
    visualKey: `glyph:${node.role}`,
    sourceElement: element(options.throwOnMeasure),
    rect: { left: ordinal * 12, top: 20, width: 10, height: 20 },
    baselineY: 39,
    styleFingerprint: "font-family:KaTeX_Main",
    zOrder: ordinal,
    fontRevision: options.fontRevision ?? 1
  }));
  if (options.addStray === true) {
    atoms.push({
      ...atoms[0]!,
      id: `${endpoint.endpoint}.paint.glyph.stray`,
      semanticEntityId: "sum.stray.entity",
      presentationGroupId: nodes[0]!.presentationGroupId,
      zOrder: atoms.length
    });
  }
  const observation = createKpNativeKatexRenderedSceneObservation({
    endpoint: endpoint.endpoint,
    stage,
    root,
    atoms,
    groups: nodes.map((node, ordinal) => ({
      id: node.presentationGroupId,
      semanticEntityId: node.occurrenceId,
      atomIds: [`${endpoint.endpoint}.paint.glyph.${ordinal}`],
      rect: { left: ordinal * 12, top: 20, width: 10, height: 20 },
      sourceElement: element(options.throwOnMeasure),
      styleFingerprint: "font-family:KaTeX_Main",
      baselineY: 39
    })),
    fontRevision: options.fontRevision ?? 1,
    viewportKey: `${endpoint.endpoint}:640x240@1:font-${options.fontRevision ?? 1}`
  });
  return createKpNativeKatexRenderedEndpointHandle({ observation });
}

function element(throwOnMeasure = false): HTMLElement {
  return {
    ownerDocument,
    getBoundingClientRect() {
      if (throwOnMeasure) throw new Error("paint ownership remeasured DOM");
      return { left: 0, top: 0, width: 10, height: 20 };
    }
  } as unknown as HTMLElement;
}
