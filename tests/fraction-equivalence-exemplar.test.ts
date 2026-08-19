import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionEquivalenceExemplarAsset,
  kpFractionEquivalenceExemplarId
} from "../src/animation/fraction-equivalence-exemplar.ts";
import {
  kpCanonicalFractionEquivalencePresentationPlan
} from "../src/animation/fraction-equivalence-presentation-plan.ts";
import {
  createKpFractionEquivalenceNativeEndpoints,
  kpCanonicalFractionEquivalenceNativeEndpoints
} from "../src/rendering/fraction-equivalence-native-endpoints.ts";
import { verifyKpFractionEquivalence } from
  "../src/semantic/fraction-equivalence.ts";

test("fraction-equivalence exemplar binds semantic and presentation authority", () => {
  const asset = createKpFractionEquivalenceExemplarAsset();
  const transformation = asset.transformations[0]!;
  assert.equal(asset.id, kpFractionEquivalenceExemplarId);
  assert.equal(asset.metadata?.["presentationPlanId"],
    kpCanonicalFractionEquivalencePresentationPlan.id);
  assert.deepEqual(transformation.sourceObjectIds, [
    "state.fraction-equivalence.source",
    "object.fraction-equivalence.scale-factor"
  ]);
  assert.deepEqual(transformation.targetObjectIds,
    ["state.fraction-equivalence.target"]);
  assert.deepEqual(transformation.correspondenceMap?.records.map(
    ({ id, relation }) => ({ id, relation })
  ), [{
    id: "correspondence.fraction-equivalence.division",
    relation: "identity"
  }, {
    id: "correspondence.fraction-equivalence.numerator",
    relation: "identity"
  }, {
    id: "correspondence.fraction-equivalence.denominator",
    relation: "identity"
  }, {
    id: "correspondence.fraction-equivalence.factor",
    relation: "fan-out"
  }]);
});

test("native endpoints expose one factor source and two exact descendants", () => {
  const [source, target] = kpCanonicalFractionEquivalenceNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "\\frac{a}{b}\\qquad 2");
  assert.equal(target.annotated.rawLatex, "\\frac{2a}{2b}");
  assert.equal(source.nodes.filter(({ kind }) => kind === "factor").length, 1);
  assert.equal(target.nodes.filter(({ kind }) => kind === "factor").length, 2);
  assert.equal(source.nodes.filter(({ kind }) => kind === "fraction-bar").length,
    1);
  assert.equal(target.nodes.filter(({ kind }) => kind === "fraction-bar").length,
    1);
  const factorIdentity = source.nodes.find(({ kind }) =>
    kind === "factor")!.semanticId;
  assert.equal(target.nodes.filter(({ kind }) => kind === "factor").every(
    ({ semanticId }) => semanticId === factorIdentity
  ), true);
  assert.match(source.nativeHtmlAndMathml, /frac-line/u);
  assert.match(target.nativeHtmlAndMathml, /frac-line/u);
});

test("endpoint factory preserves symbolic and numeric scalar identities", () => {
  const semantic = verifyKpFractionEquivalence({
    schemaVersion: "kp.fraction-equivalence.v1",
    id: "transformation.fraction-equivalence.numeric-three",
    operationAuthority: "operation.equation.fraction-equivalence.v1",
    lawAuthority: {
      id: "law.fraction.scale-by-nonzero-unity",
      authorityRefId: "definition.fraction.equivalent-nonzero-scaling",
      level: "strict"
    },
    source: {
      stateId: "state.numeric.source",
      fractionEntityId: "fraction.numeric.source",
      divisionEntityId: "division.numeric.source",
      numerator: {
        kind: "number", entityId: "numerator.numeric.source",
        semanticId: "semantic.number.three", value: 3
      },
      denominator: {
        kind: "symbol", entityId: "denominator.numeric.source",
        semanticId: "semantic.symbol.c", symbol: "c"
      }
    },
    factor: {
      kind: "symbol", entityId: "factor.numeric.k",
      semanticId: "semantic.symbol.k", symbol: "k"
    },
    target: {
      stateId: "state.numeric.target",
      fractionEntityId: "fraction.numeric.target",
      divisionEntityId: "division.numeric.target",
      numeratorProductEntityId: "product.numeric.numerator",
      denominatorProductEntityId: "product.numeric.denominator",
      numeratorSourceOccurrenceEntityId: "occurrence.numeric.numerator",
      numeratorFactorOccurrenceEntityId: "occurrence.numeric.factor.top",
      denominatorSourceOccurrenceEntityId: "occurrence.numeric.denominator",
      denominatorFactorOccurrenceEntityId: "occurrence.numeric.factor.bottom"
    },
    nonzeroEvidence: {
      sourceDenominatorNonzeroEvidenceId: "evidence.numeric.c-nonzero",
      scaleFactorNonzeroEvidenceId: "evidence.numeric.k-nonzero"
    }
  });
  const [source, target] = createKpFractionEquivalenceNativeEndpoints(semantic);
  assert.equal(source.annotated.rawLatex, "\\frac{3}{c}\\qquad k");
  assert.equal(target.annotated.rawLatex, "\\frac{k3}{kc}");
});

test("asset guarantees exact native endpoints and reversible playback contract", () => {
  const asset = createKpFractionEquivalenceExemplarAsset();
  assert.equal(asset.timeline?.beatCount, 96);
  assert.equal(asset.checks.some(({ lawId }) =>
    lawId === "animation.seek-rewind"), true);
  assert.equal(asset.bundle.objects.filter(({ metadata }) =>
    metadata?.["settledEndpointAuthority"] === "native-katex").length, 2);
});
