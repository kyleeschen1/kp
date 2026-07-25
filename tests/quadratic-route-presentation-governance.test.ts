import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpQuadraticOperationPresentationCertificates,
  evaluateKpQuadraticOperationPresentationCertificates,
  kpQuadraticOperationPresentationCertificateIds
} from "../src/projections/quadratic-operation-presentation-certificates.ts";
import {
  createKpCompletingSquareKatexProjection
} from "../src/projections/quadratic-completing-square-katex.ts";
import {
  createKpQuadraticFormulaKatexProjection
} from "../src/projections/quadratic-formula-katex.ts";
import {
  kpReaderRouteManifest
} from "../src/reader/compiler/reader-route-manifest.ts";

test("both quadratic method routes carry fully conforming operation certificates", () => {
  const certificates = createKpQuadraticOperationPresentationCertificates();
  assert.deepEqual(
    certificates.map(({ id }) => id),
    kpQuadraticOperationPresentationCertificateIds
  );
  assert.deepEqual(evaluateKpQuadraticOperationPresentationCertificates(), []);
  assert.deepEqual(
    certificates.map(({ authorityOperations }) =>
      authorityOperations.map(({ id }) => id)
    ),
    [
      operationTrace(createKpCompletingSquareKatexProjection().transitions),
      operationTrace(createKpQuadraticFormulaKatexProjection().transitions)
    ]
  );
  assert.doesNotMatch(JSON.stringify(certificates), /generic.?checkpoint/i);
});

test("the playable quadratic route cites the exact certificates and phase gates", () => {
  const route = kpReaderRouteManifest.find(
    ({ route }) => route === "/reader/quadratic-branching/"
  )!;
  assert.equal(route.presentation.kind, "certified-custom-renderer");
  if (route.presentation.kind !== "certified-custom-renderer") {
    assert.fail("Quadratic route must use custom-renderer certification.");
  }
  assert.deepEqual(
    route.presentation.operationCertificateIds,
    kpQuadraticOperationPresentationCertificateIds
  );
  assert.deepEqual(route.presentation.browserPhaseGates, [
    "reflow",
    "act",
    "native-settlement",
    "branch-split",
    "branch-to-graph"
  ]);
  assert.equal(route.presentation.genericFallback, "forbidden");
});

test("every generated reader route declares certified presentation governance", () => {
  assert.ok(kpReaderRouteManifest.every(
    ({ presentation }) =>
      presentation.certificationId.length > 0 &&
      presentation.genericFallback === "forbidden" &&
      presentation.browserPhaseGates.length > 0
  ));
  assert.ok(kpReaderRouteManifest
    .filter(({ presentation }) =>
      presentation.kind === "certified-custom-renderer"
    )
    .every(({ presentation }) =>
      presentation.kind === "certified-custom-renderer" &&
      presentation.operationCertificateIds.length > 0
    ));
});

function operationTrace(
  transitions: readonly {
    readonly presentation?: { readonly operationRef: string };
  }[]
): readonly string[] {
  return transitions.map((transition) => {
    assert.ok(transition.presentation);
    return transition.presentation.operationRef;
  });
}
