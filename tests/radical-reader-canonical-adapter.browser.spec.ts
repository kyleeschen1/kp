import { expect, test } from "@playwright/test";

import {
  kpFractionEndpointRegressionLimits
} from "../scripts/glyph-reconciliation-endpoint-checkpoints.ts";

interface RadicalAdapterEvidence {
  readonly fixtureId: string;
  readonly routeActivated: boolean;
  readonly renderDiagnostics: readonly unknown[];
  readonly materialDiagnostics: readonly unknown[];
  readonly sessionKind: string;
  readonly sessionLifecycle: string;
  readonly sessionMode: string;
  readonly structuralSuccessionStrategy: string;
  readonly structuralSuccessionStatus: string;
  readonly choreographyFidelity: string;
  readonly structuralCanvasVisible: boolean;
  readonly structuralOwnersHidden: boolean;
  readonly continuantOwnersOpaque: boolean;
  readonly transitionId: string;
  readonly lifecycles: readonly string[];
  readonly trackCount: number;
  readonly sourceAtomCount: number;
  readonly targetAtomCount: number;
  readonly statelessSeek: boolean;
  readonly finiteFrames: boolean;
  readonly persistentPaintOpaque: boolean;
  readonly sourceMissingAtomIds: readonly string[];
  readonly targetMissingAtomIds: readonly string[];
  readonly monotonicEmergence: boolean;
  readonly monotonicAbsorption: boolean;
  readonly reverseTraversalExact: boolean;
  readonly endpointsSettled: boolean;
  readonly endpointTrackGeometryExact: boolean;
  readonly endpointBoxesExact: boolean;
  readonly nearSourceMaximumResidualPx: number;
  readonly nearTargetMaximumResidualPx: number;
  readonly persistentStyleExact: boolean;
  readonly maximumPersistentBaselineResidualPx: number;
  readonly introducedPathGeometryExact: boolean;
  readonly visualOwner: string;
  readonly materialOwnerCount: number;
}

test("radical reader dry run reaches the existing canonical adapter", async ({
  page
}) => {
  await page.goto(
    "/tests/fixtures/radical-reader-canonical-adapter.html"
  );
  await page.locator(
    '[data-kp-radical-adapter-fixture][data-kp-ready="true"]'
  ).waitFor();
  const evidence = await page.evaluate(() =>
    (window as unknown as {
      __kpRadicalReaderCanonicalAdapterEvidence: RadicalAdapterEvidence;
    }).__kpRadicalReaderCanonicalAdapterEvidence
  );

  expect(evidence.fixtureId).toBe(
    "fixture.governed.radical-succession.v1"
  );
  expect(evidence.routeActivated).toBe(false);
  expect(evidence.renderDiagnostics).toEqual([]);
  expect(evidence.materialDiagnostics).toEqual([]);
  expect(evidence.sessionKind).toBe("native-katex-renderer-session");
  expect(evidence.sessionLifecycle).toBe("renderer-session");
  expect(evidence.sessionMode).toBe("atom-transit");
  expect(evidence.structuralSuccessionStrategy).toBe(
    "solid-mask-succession"
  );
  expect(evidence.structuralSuccessionStatus).toBe("ready");
  expect(evidence.choreographyFidelity).toBe("passed");
  expect(evidence.structuralCanvasVisible).toBe(true);
  expect(evidence.structuralOwnersHidden).toBe(true);
  expect(evidence.continuantOwnersOpaque).toBe(true);
  expect(evidence.transitionId).toBe(
    "transform.generated.radical.square-root-as-power.rewrite-power-as-root"
  );
  expect(evidence.lifecycles).toContain("persist");
  expect(evidence.lifecycles).toContain("introduce");
  expect(evidence.lifecycles).toContain("eliminate");
  expect(evidence.trackCount).toBeGreaterThan(0);
  expect(evidence.sourceAtomCount).toBeGreaterThan(0);
  expect(evidence.targetAtomCount).toBeGreaterThan(0);
  expect(evidence.statelessSeek).toBe(true);
  expect(evidence.finiteFrames).toBe(true);
  expect(evidence.persistentPaintOpaque).toBe(true);
  expect(evidence.sourceMissingAtomIds).toEqual([]);
  expect(evidence.targetMissingAtomIds).toEqual([]);
  expect(evidence.monotonicEmergence).toBe(true);
  expect(evidence.monotonicAbsorption).toBe(true);
  expect(evidence.reverseTraversalExact).toBe(true);
  expect(evidence.endpointsSettled).toBe(true);
  expect(evidence.endpointTrackGeometryExact).toBe(true);
  expect(evidence.endpointBoxesExact).toBe(true);
  expect(evidence.nearSourceMaximumResidualPx).toBeLessThan(0.001);
  expect(evidence.nearTargetMaximumResidualPx).toBeLessThan(0.001);
  expect(evidence.persistentStyleExact).toBe(true);
  expect(evidence.maximumPersistentBaselineResidualPx).toBeLessThanOrEqual(
    kpFractionEndpointRegressionLimits.maximumGlyphBaselineResidualPx
  );
  expect(evidence.introducedPathGeometryExact).toBe(true);
  expect(evidence.visualOwner).toBe("material-scene");
  expect(evidence.materialOwnerCount).toBe(evidence.trackCount);
});
