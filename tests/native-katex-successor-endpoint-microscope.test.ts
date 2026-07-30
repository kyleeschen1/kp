import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpNativeKatexSuccessorEndpoint,
  type KpNativeKatexSuccessorEndpointAtomSnapshot,
  type KpNativeKatexSuccessorEndpointCheckpoint,
  type KpNativeKatexSuccessorEndpointOwner,
  type KpNativeKatexSuccessorEndpointSnapshot
} from "../src/rendering/native-katex-successor-endpoint-microscope.ts";

function atom(
  id: string,
  owner: KpNativeKatexSuccessorEndpointOwner,
  overrides: Partial<KpNativeKatexSuccessorEndpointAtomSnapshot> = {}
): KpNativeKatexSuccessorEndpointAtomSnapshot {
  const isRule = id.includes("rule");
  return {
    paintAtomId: id,
    semanticEntityId: `semantic.${id}`,
    paintKind: isRule ? "rule" : "glyph",
    paintFingerprint: isRule ? "rule" : `glyph:${id}`,
    owner,
    paintAlignment:
      owner === "successor-target-material" ? "measured-ink" : "native",
    layoutRect: {
      left: isRule ? 15 : 10,
      top: isRule ? 28 : 12,
      width: isRule ? 22 : 8,
      height: isRule ? 1 : 14
    },
    paintRect: {
      left: isRule ? 15 : 10.5,
      top: isRule ? 28 : 13,
      width: isRule ? 22 : 7,
      height: isRule ? 1 : 12
    },
    innerInset: {
      left: isRule ? 0 : 0.5,
      top: isRule ? 0 : 1,
      right: isRule ? 0 : 0.5,
      bottom: isRule ? 0 : 1
    },
    baselineY: isRule ? null : 24,
    styleFingerprint: isRule ? "border-top:1px" : "font:KaTeX|size:16px",
    fontFingerprint: isRule ? "font:none" : "font:KaTeX|size:16px",
    opacity: 1,
    ...(isRule
      ? {
          ruleGeometry: {
            left: 15,
            top: 28,
            width: 22,
            thickness: 1
          }
        }
      : {}),
    ...overrides
  };
}

function snapshot(
  checkpoint: KpNativeKatexSuccessorEndpointCheckpoint,
  owner: KpNativeKatexSuccessorEndpointOwner,
  overrides: Partial<KpNativeKatexSuccessorEndpointSnapshot> = {}
): KpNativeKatexSuccessorEndpointSnapshot {
  return {
    schemaVersion: "kp.native-katex-successor-endpoint-snapshot.v1",
    lifecycle: "renderer-session",
    checkpoint,
    viewportKey: "target:640x180@2:font-1:640:180:dpr-2",
    deviceScaleFactor: 2,
    fontRevision: 1,
    atoms: [
      atom("target.glyph.0", owner),
      atom("target.rule.1", owner)
    ],
    semanticAuthority:
      "successor-program-and-observed-atom-correlation",
    ...overrides
  };
}

function report(overrides: {
  readonly successor?: KpNativeKatexSuccessorEndpointSnapshot;
  readonly nativeTarget?: KpNativeKatexSuccessorEndpointSnapshot;
  readonly postSettlement?: KpNativeKatexSuccessorEndpointSnapshot;
  readonly normalizedSilhouetteDelta?: number;
  readonly normalizedRasterDelta?: number;
  readonly postSettlementSilhouetteDelta?: number;
  readonly postSettlementRasterDelta?: number;
} = {}) {
  return evaluateKpNativeKatexSuccessorEndpoint({
    successor: overrides.successor ?? snapshot(
      "successor-one-minus-epsilon",
      "successor-target-material"
    ),
    nativeTarget: overrides.nativeTarget ?? snapshot(
      "native-target",
      "native-target"
    ),
    postSettlement: overrides.postSettlement ?? snapshot(
      "post-settlement",
      "native-target"
    ),
    normalizedSilhouetteDelta: overrides.normalizedSilhouetteDelta ?? 0.002,
    normalizedRasterDelta: overrides.normalizedRasterDelta ?? 0.004,
    postSettlementSilhouetteDelta:
      overrides.postSettlementSilhouetteDelta ?? 0,
    postSettlementRasterDelta: overrides.postSettlementRasterDelta ?? 0
  });
}

test("endpoint microscope accepts exact paint and atomic native settlement", () => {
  const result = report();
  assert.equal(result.passed, true);
  assert.equal(result.atomCount, 2);
  assert.equal(result.geometryToleranceCssPx, 0.25);
  assert.equal(result.maximumGeometryDeltaCssPx, 0);
  assert.equal(result.maximumBaselineDeltaCssPx, 0);
  assert.equal(result.maximumInnerInsetDeltaCssPx, 0);
  assert.equal(result.maximumRuleDeltaCssPx, 0);
  assert.deepEqual(result.diagnostics, []);
});

test("paint geometry baseline inner inset and rule drift fail independently", () => {
  const successor = snapshot(
    "successor-one-minus-epsilon",
    "successor-target-material",
    {
      atoms: [
        atom("target.glyph.0", "successor-target-material", {
          layoutRect: { left: 9.6, top: 12, width: 8, height: 14 },
          paintRect: { left: 10.1, top: 13, width: 7, height: 12 },
          innerInset: { left: 0.5, top: 1, right: 0.5, bottom: 1 },
          baselineY: 23.6
        }),
        atom("target.rule.1", "successor-target-material", {
          ruleGeometry: {
            left: 15,
            top: 28,
            width: 21.6,
            thickness: 1
          }
        })
      ]
    }
  );
  const result = report({ successor });
  const codes = new Set(result.diagnostics.map(({ code }) => code));
  assert.equal(result.passed, false);
  assert.ok(codes.has("endpoint.geometry.mismatch"));
  assert.ok(codes.has("endpoint.baseline.mismatch"));
  assert.ok(codes.has("endpoint.rule.mismatch"));
  // Insets above stay within the independent DPR-scaled budget.
  assert.equal(codes.has("endpoint.inner-paint.mismatch"), false);
});

test("font style opacity paint and owner mismatches fail closed", () => {
  const successor = snapshot(
    "successor-one-minus-epsilon",
    "successor-target-material",
    {
      atoms: [
        atom("target.glyph.0", "native-target", {
          semanticEntityId: "wrong.semantic",
          paintFingerprint: "wrong.paint",
          styleFingerprint: "wrong.style",
          fontFingerprint: "wrong.font",
          opacity: 0.98
        }),
        atom("target.rule.1", "successor-target-material")
      ]
    }
  );
  const codes = new Set(report({ successor }).diagnostics.map(
    ({ code }) => code
  ));
  assert.ok(codes.has("endpoint.owner.mismatch"));
  assert.ok(codes.has("endpoint.paint.mismatch"));
  assert.ok(codes.has("endpoint.style.mismatch"));
  assert.ok(codes.has("endpoint.font.mismatch"));
  assert.ok(codes.has("endpoint.opacity.mismatch"));
});

test("inventory environment raster silhouette and post-settlement drift fail", () => {
  const successor = snapshot(
    "successor-one-minus-epsilon",
    "successor-target-material",
    {
      viewportKey: "wrong-viewport",
      atoms: [atom(
        "target.glyph.0",
        "successor-target-material"
      )]
    }
  );
  const result = report({
    successor,
    normalizedSilhouetteDelta: 0.021,
    normalizedRasterDelta: 0.03,
    postSettlementSilhouetteDelta: 0.0001,
    postSettlementRasterDelta: 0.0001
  });
  const codes = new Set(result.diagnostics.map(({ code }) => code));
  assert.ok(codes.has("endpoint.environment.mismatch"));
  assert.ok(codes.has("endpoint.inventory.mismatch"));
  assert.ok(codes.has("endpoint.silhouette.mismatch"));
  assert.ok(codes.has("endpoint.raster.mismatch"));
  assert.ok(codes.has("endpoint.post-settlement.mismatch"));
});

test("comparison is deterministic and bounded", () => {
  const first = report();
  for (let index = 0; index < 5_000; index += 1) {
    assert.deepEqual(report(), first);
  }
});
