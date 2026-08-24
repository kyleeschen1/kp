import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const operationSurface = source(
  "src/editor/operation-evaluation-surface-adapter.ts"
);
const genericMount = source(
  "src/editor/equation-certified-evaluation-mount.ts"
);
const equationSurface = source(
  "src/editor/equation-surface-adapter.ts"
);
const readerCompositor = source(
  "src/reader/renderers/equation-scene-compositor-adapter.ts"
);
const nativeCompositor = source(
  "src/rendering/native-katex-scene-compositor.ts"
);

test("production evaluation hosts cannot reselect family authority", () => {
  for (const [path, contents] of [
    ["operation surface", operationSurface],
    ["generic mount", genericMount],
    ["reader compositor", readerCompositor]
  ] as const) {
    assert.doesNotMatch(
      contents,
      /resolveKpDefaultOperationEvaluationFamilyProfile|resolveKpOperationEvaluationFamilyReleaseRegistration/u,
      `${path} re-resolves compiler-owned evaluation authority.`
    );
  }
  assert.doesNotMatch(operationSurface, /animationId\s*===/u);
  assert.doesNotMatch(
    operationSurface,
    /kp(?:TwoTimesThree|ThreeSixths)EvaluationAnimationId/u
  );
  assert.match(
    operationSurface,
    /createKpCertifiedNativeKatexContributorFusionPlayback/u
  );
  assert.match(
    operationSurface,
    /governanceTransition\.evaluationFamilyCertificate/u
  );
});

test("a static carrier cannot cross the readiness boundary uncertified", () => {
  const certificateGuard = readerCompositor.indexOf(
    "isKpVerifiedEquationEvaluationFamilyCertificateV2"
  );
  const carrierCreation = readerCompositor.indexOf(
    "input.nativeKatex.compose.createCarrierSession"
  );
  assert.ok(certificateGuard >= 0);
  assert.ok(carrierCreation > certificateGuard);
  assert.match(
    nativeCompositor,
    /interface KpCanonicalNativeKatexCarrierSceneSession/u
  );
  const carrierInterface = nativeCompositor.slice(
    nativeCompositor.indexOf(
      "export interface KpCanonicalNativeKatexCarrierSceneSession"
    ),
    nativeCompositor.indexOf(
      "export interface KpCanonicalNativeKatexPureScenePlan"
    )
  );
  assert.doesNotMatch(carrierInterface, /executableMotion/u);

  const certifiedMount = operationSurface.indexOf(
    "createKpCertifiedNativeKatexContributorFusionPlayback"
  );
  const publishMotion = operationSurface.indexOf(
    "publishExternalFamilyMotion(",
    certifiedMount
  );
  const publishReady = operationSurface.indexOf(
    'stage.dataset["kpOperationEvaluationStatus"] = "ready"'
  );
  assert.ok(certifiedMount >= 0);
  assert.ok(publishMotion > certifiedMount);
  assert.ok(publishReady > publishMotion);
});

test("generic equation paint has no derivative-only evaluation route", () => {
  for (const [path, contents] of [
    ["equation surface", equationSurface],
    ["certified evaluation mount", genericMount],
    ["operation evaluation surface", operationSurface]
  ] as const) {
    assert.doesNotMatch(
      contents,
      /DerivativeDecrement|derivativeDecrement|derivative-decrement/u,
      `${path} reintroduced derivative-only evaluation choreography.`
    );
  }
  assert.doesNotMatch(
    genericMount,
    /animation\.generated\.calculus\.derivative/u
  );
});

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
