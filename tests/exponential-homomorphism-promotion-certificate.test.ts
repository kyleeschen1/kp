import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpExponentialHomomorphismNarrowPromotion,
  kpExponentialHomomorphismBrowserCertification
} from
  "../src/architecture/exponential-homomorphism-promotion-certificate.ts";

test("exponential promotion derives from exact narrow requirements", () => {
  const certificate = certifyKpExponentialHomomorphismNarrowPromotion();
  assert.equal(certificate.status, "promoted");
  assert.deepEqual(certificate.topologyIds, [
    "lateral-product",
    "vertical-quotient"
  ]);
  assert.equal(certificate.operationIds.length, 2);
  assert.deepEqual(certificate.excludedOperationFamilies, [
    "scalar-power-transport",
    "inverse-cancellation"
  ]);
});

test("browser certificate requires Firefox real-ink playback evidence", () => {
  assert.deepEqual(
    kpExponentialHomomorphismBrowserCertification.map(({ engine }) => engine),
    ["chromium", "firefox"]
  );
  assert.equal(
    kpExponentialHomomorphismBrowserCertification[1].command,
    "npm run check:live-exponential-quotient-playback:firefox"
  );
  assert.ok(kpExponentialHomomorphismBrowserCertification.every(
    ({ geometryAuthority }) =>
      geometryAuthority === "measured-visible-paint"
  ));
});
