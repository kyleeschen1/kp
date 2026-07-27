import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionAnnotatedEndpoints,
  createKpFoldableDistributionSelectorAnnotatedLatex
} from "../src/rendering/foldable-distribution-selector-annotated-latex.ts";
import {
  createKpFoldableFinalCollectionCertificate,
  createKpFoldableProductEvaluationCertificates,
  createKpFoldableSignedTermGroupingCertificate
} from "../src/semantic/foldable-distribution-operation-certificates.ts";
import {
  renderSelectorAnnotatedLatexToHtml
} from "../src/rendering/katex-adapter.ts";

test("foldable distribution defines five exact native endpoint states", () => {
  const endpoints = createKpFoldableDistributionAnnotatedEndpoints();

  assert.deepEqual(
    endpoints.map(({ objectId }) => objectId),
    [
      "expression.foldable-distribution.factored",
      "expression.foldable-distribution.distributed-raw",
      "expression.foldable-distribution.distributed",
      "expression.foldable-distribution.grouped",
      "expression.foldable-distribution.collected"
    ]
  );
  assert.deepEqual(
    endpoints.map(({ annotated }) => annotated.rawLatex),
    [
      "3 ( x + 2 ) + 2 ( x - 1 )",
      "3 x + 3 \\cdot 2 + 2 x + 2 \\cdot (-1)",
      "3x + 6 + 2x - 2",
      "( 3 x + 2 x ) + ( 6 - 2 )",
      "5 x + 4"
    ]
  );
});

test("every native endpoint glyph has one stable semantic annotation", () => {
  for (const endpoint of createKpFoldableDistributionAnnotatedEndpoints()) {
    const selectorIds = endpoint.annotated.annotations.map(
      ({ selectorId }) => selectorId
    );
    assert.equal(new Set(selectorIds).size, selectorIds.length);
    assert.ok(selectorIds.length >= 4);
    const html = renderSelectorAnnotatedLatexToHtml(endpoint.annotated);
    assert.match(html, /class="katex-html"/);
    for (const annotation of endpoint.annotated.annotations) {
      assert.ok(
        html.includes(`data-kp-motion-id="${annotation.motionId}"`),
        annotation.selectorId
      );
    }
  }
});

test("term and group envelopes name only endpoint-native selectors", () => {
  for (const endpoint of createKpFoldableDistributionAnnotatedEndpoints()) {
    const selectors = new Set(
      endpoint.annotated.annotations.map(({ selectorId }) => selectorId)
    );
    for (const envelope of endpoint.groupEnvelopes) {
      assert.ok(envelope.memberSelectorIds.length > 0);
      assert.ok(envelope.memberSelectorIds.every((id) => selectors.has(id)));
    }
  }
  assert.equal(
    createKpFoldableDistributionSelectorAnnotatedLatex("unknown"),
    undefined
  );
});

test("certified relation selectors resolve against exact endpoint namespaces", () => {
  const endpoints = new Map(
    createKpFoldableDistributionAnnotatedEndpoints().map((endpoint) => [
      endpoint.objectId,
      new Set([
        ...endpoint.annotated.annotations.map(({ selectorId }) => selectorId),
        ...endpoint.groupEnvelopes.map(({ id }) => id)
      ])
    ])
  );
  const transformations = [
    ...createKpFoldableProductEvaluationCertificates().map(
      ({ transformation }) => transformation
    ),
    createKpFoldableSignedTermGroupingCertificate().transformation,
    createKpFoldableFinalCollectionCertificate().transformation
  ];

  for (const transformation of transformations) {
    const sourceIds = endpoints.get(transformation.sourceObjectIds[0]!)!;
    const targetIds = endpoints.get(transformation.targetObjectIds[0]!)!;
    for (const record of transformation.correspondenceMap?.records ?? []) {
      assert.ok(
        record.sourceSelectorIds.every((id) => sourceIds.has(id)),
        `${transformation.id} source ${record.sourceSelectorIds.join(",")}`
      );
      assert.ok(
        record.targetSelectorIds.every((id) => targetIds.has(id)),
        `${transformation.id} target ${record.targetSelectorIds.join(",")}`
      );
    }
  }
});
