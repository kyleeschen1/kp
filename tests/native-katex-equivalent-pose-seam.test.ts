import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAdjacentPhaseEquivalentPoseSeamIntent
} from "../src/animation/paint-continuity-plan-types.ts";
import {
  createKpNativeKatexEndpointOwnershipView
} from "../src/rendering/native-katex-endpoint-ownership.ts";
import {
  validateAndMintKpNativeKatexEquivalentPoseSeam
} from "../src/rendering/native-katex-equivalent-pose-seam.ts";
import {
  createKpNativeKatexRenderedEndpointHandle,
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const root = { ownerDocument } as HTMLElement;
const sourceElement = { ownerDocument } as HTMLElement;
const intent = createKpAdjacentPhaseEquivalentPoseSeamIntent({
  id: "seam.stage-to-join",
  fromPhaseId: "stage-unit-factor",
  toPhaseId: "join-equivalent-fraction"
});

test("equivalent-pose certificate proves every leaf across two ownership views", () => {
  const handle = endpointHandle("target");
  const result = validateAndMintKpNativeKatexEquivalentPoseSeam({
    intent,
    from: createKpNativeKatexEndpointOwnershipView({
      handle,
      endpoint: "target",
      collapsedGroupIds: ["group.factor"]
    }),
    to: createKpNativeKatexEndpointOwnershipView({
      handle,
      endpoint: "source"
    })
  });

  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(result.certificate.leaves.length, 2);
  assert.strictEqual(result.certificate.from.handle, result.certificate.to.handle);
  assert.equal(Object.isFrozen(result.certificate.leaves), true);
  assert.throws(
    () => JSON.stringify(result.certificate),
    /cannot enter durable state/
  );
});

test("equivalent-pose validation reports per-leaf and revision drift", () => {
  const from = endpointHandle("target");
  const to = endpointHandle("source", {
    fontRevision: 3,
    viewportKey: "phone:font-3",
    mutateAtoms(atoms) {
      return [{
        ...atoms[0]!,
        endpoint: "source" as const,
        id: "source.paint.glyph.0",
        rect: { left: 12, top: 20, width: 10, height: 20 },
        baselineY: 41,
        styleFingerprint: "font:other",
        visualKey: "glyph:y"
      }];
    }
  });
  const result = validateAndMintKpNativeKatexEquivalentPoseSeam({
    intent,
    from: createKpNativeKatexEndpointOwnershipView({
      handle: from,
      endpoint: "target"
    }),
    to: createKpNativeKatexEndpointOwnershipView({
      handle: to,
      endpoint: "source"
    })
  });

  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  const codes = new Set(result.issues.map(({ code }) => code));
  for (const code of [
    "seam.handle-mismatch",
    "seam.font-revision",
    "seam.viewport-revision",
    "seam.leaf-inventory",
    "seam.leaf-rect",
    "seam.leaf-baseline",
    "seam.leaf-style",
    "seam.leaf-paint"
  ]) assert.equal(codes.has(code as never), true, code);
});

function endpointHandle(
  endpoint: "source" | "target",
  overrides: {
    readonly fontRevision?: number;
    readonly viewportKey?: string;
    readonly mutateAtoms?: (
      atoms: readonly KpNativeKatexPaintAtomObservation[]
    ) => readonly KpNativeKatexPaintAtomObservation[];
  } = {}
) {
  const atoms: readonly KpNativeKatexPaintAtomObservation[] = [{
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `${endpoint}.paint.glyph.0`,
    endpoint,
    semanticEntityId: "entity.factor.numerator",
    presentationGroupId: "group.factor",
    paintKind: "glyph",
    visualKey: "glyph:2",
    sourceElement,
    rect: { left: 10, top: 20, width: 10, height: 20 },
    baselineY: 40,
    styleFingerprint: "font:KaTeX",
    zOrder: 0,
    fontRevision: overrides.fontRevision ?? 2
  }, {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `${endpoint}.paint.rule.1`,
    endpoint,
    semanticEntityId: "entity.factor.division",
    presentationGroupId: "group.factor",
    paintKind: "rule",
    visualKey: "rule",
    sourceElement,
    rect: { left: 9, top: 42, width: 12, height: 1 },
    baselineY: null,
    styleFingerprint: "rule:KaTeX",
    zOrder: 1,
    fontRevision: overrides.fontRevision ?? 2
  }];
  const selected = overrides.mutateAtoms?.(atoms) ?? atoms;
  const observation = createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root,
    atoms: selected,
    groups: [{
      id: "group.factor",
      semanticEntityId: "entity.factor",
      atomIds: selected.map(({ id }) => id),
      rect: { left: 9, top: 20, width: 12, height: 23 }
    }],
    fontRevision: overrides.fontRevision ?? 2,
    viewportKey: overrides.viewportKey ?? "wide:font-2"
  });
  return createKpNativeKatexRenderedEndpointHandle({ observation });
}
