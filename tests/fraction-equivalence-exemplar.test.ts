import assert from "node:assert/strict";
import test from "node:test";
import { isKpImmutableSemanticAssetObject } from "../src/semantic/immutable-asset.ts";

import {
  createKpFractionEquivalenceExemplarAsset,
  createKpFractionEquivalenceExemplarAssets,
  kpCompactFractionEquivalenceExemplarId,
  kpFractionEquivalenceExemplarId
} from "../src/animation/fraction-equivalence-exemplar.ts";
import {
  kpCanonicalFractionEquivalencePresentationPlan
} from "../src/animation/fraction-equivalence-presentation-plan.ts";
import {
  createKpFractionEquivalenceNativeEndpoints,
  kpCanonicalCompactFractionEquivalenceNativeEndpoints,
  kpCanonicalFractionEquivalenceNativeEndpoints
} from "../src/rendering/fraction-equivalence-native-endpoints.ts";
import { compileKpFractionEquivalencePaintRelations } from
  "../src/rendering/fraction-equivalence-transit-session.ts";
import { verifyKpFractionEquivalence } from
  "../src/semantic/fraction-equivalence.ts";

test("fraction-equivalence exemplar binds semantic and presentation authority", () => {
  const asset = createKpFractionEquivalenceExemplarAsset();
  assert.ok(asset.bundle.objects.every(isKpImmutableSemanticAssetObject));
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

test("explanatory endpoints expose a unit factor and two exact descendants", () => {
  const [source, target] = kpCanonicalFractionEquivalenceNativeEndpoints;
  assert.equal(source.mode, "explain-unit-factor");
  assert.equal(source.annotated.rawLatex,
    "\\frac{2}{2}\\cdot\\frac{a}{b}");
  assert.equal(target.annotated.rawLatex, "\\frac{2a}{2b}");
  assert.equal(source.nodes.filter(({ kind }) => kind === "factor").length, 2);
  assert.equal(target.nodes.filter(({ kind }) => kind === "factor").length, 2);
  assert.equal(source.nodes.filter(({ kind }) => kind === "fraction-bar").length,
    2);
  assert.equal(target.nodes.filter(({ kind }) => kind === "fraction-bar").length,
    1);
  const factorIdentity = source.nodes.find(({ kind }) => kind === "factor")!
    .semanticId;
  assert.equal(target.nodes.filter(({ kind }) => kind === "factor").every(
    ({ semanticId }) => semanticId === factorIdentity
  ), true);
  assert.match(source.nativeHtmlAndMathml, /frac-line/u);
  assert.match(target.nativeHtmlAndMathml, /frac-line/u);
});

test("explanatory fraction bars fuse through shared many-to-one paint", () => {
  const relations = compileKpFractionEquivalencePaintRelations(
    kpCanonicalFractionEquivalencePresentationPlan
  );
  assert.deepEqual(relations.find(({ id }) =>
    id === "paint.correspondence.fraction-equivalence.division"
  ), {
    id: "paint.correspondence.fraction-equivalence.division",
    relation: "merge",
    sourceEntityIds: [
      "presentation.fraction-equivalence.unit-factor.division",
      "fraction-equivalence.source.division"
    ],
    targetEntityIds: ["fraction-equivalence.target.division"]
  });
});

test("compact endpoints start with a coordinated pair of branch operations", () => {
  const [source, target] =
    kpCanonicalCompactFractionEquivalenceNativeEndpoints;
  assert.equal(source.mode, "compact-paired-operation");
  assert.equal(source.annotated.rawLatex,
    "\\begin{matrix}2\\times\\\\2\\times\\end{matrix}\\qquad\\frac{a}{b}");
  assert.equal(target.annotated.rawLatex, "\\frac{2a}{2b}");
  assert.equal(source.nodes.filter(({ kind }) => kind === "factor").length, 2);
  assert.equal(target.nodes.filter(({ kind }) => kind === "factor").length, 2);
});

test("endpoint factory preserves explicit multiplication before numeric evaluation", () => {
  const semantic = verifyKpFractionEquivalence({
    schemaVersion: "kp.fraction-equivalence.v1",
    id: "transformation.fraction-equivalence.numeric-times-two",
    operationAuthority: "operation.equation.fraction-equivalence.v1",
    lawAuthority: {
      id: "law.fraction.scale-by-nonzero-unity",
      authorityRefId: "definition.fraction.equivalent-nonzero-scaling",
      level: "strict"
    },
    source: {
      stateId: "state.numeric-fraction.source",
      fractionEntityId: "fraction.numeric-fraction.source",
      divisionEntityId: "division.numeric-fraction.source",
      numerator: {
        kind: "number", entityId: "numerator.numeric-fraction.source",
        semanticId: "semantic.number.three", value: 3
      },
      denominator: {
        kind: "number", entityId: "denominator.numeric-fraction.source",
        semanticId: "semantic.number.five", value: 5
      }
    },
    factor: {
      kind: "number", entityId: "factor.numeric-fraction.two",
      semanticId: "semantic.number.two", value: 2
    },
    target: {
      stateId: "state.numeric-fraction.target",
      fractionEntityId: "fraction.numeric-fraction.target",
      divisionEntityId: "division.numeric-fraction.target",
      numeratorProductEntityId: "product.numeric-fraction.numerator",
      denominatorProductEntityId: "product.numeric-fraction.denominator",
      numeratorSourceOccurrenceEntityId: "occurrence.numeric-fraction.numerator",
      numeratorFactorOccurrenceEntityId:
        "occurrence.numeric-fraction.factor.top",
      denominatorSourceOccurrenceEntityId:
        "occurrence.numeric-fraction.denominator",
      denominatorFactorOccurrenceEntityId:
        "occurrence.numeric-fraction.factor.bottom"
    },
    nonzeroEvidence: {
      sourceDenominatorNonzeroEvidenceId:
        "evidence.numeric-fraction.five-nonzero",
      scaleFactorNonzeroEvidenceId:
        "evidence.numeric-fraction.two-nonzero"
    }
  });
  const [source, target] = createKpFractionEquivalenceNativeEndpoints(semantic);
  assert.equal(source.annotated.rawLatex,
    "\\frac{2}{2}\\cdot\\frac{3}{5}");
  assert.equal(target.annotated.rawLatex,
    "\\frac{2\\cdot3}{2\\cdot5}");
  assert.equal(target.nodes.filter(({ kind }) => kind === "operator").length,
    2);
});

test("catalogue variants share semantics while exposing distinct presentations", () => {
  const assets = createKpFractionEquivalenceExemplarAssets();
  assert.deepEqual(assets.map(({ id }) => id), [
    kpFractionEquivalenceExemplarId,
    kpCompactFractionEquivalenceExemplarId
  ]);
  assert.deepEqual(assets.map(({ transformations }) => transformations[0]!.id),
    [
      "transformation.fraction-equivalence.symbolic-times-two",
      "transformation.fraction-equivalence.symbolic-times-two"
    ]);
  assert.deepEqual(assets.map(({ metadata }) =>
    metadata?.["presentationMode"]), [
      "explain-unit-factor",
      "compact-paired-operation"
    ]);
});

test("asset guarantees exact native endpoints and reversible playback contract", () => {
  const asset = createKpFractionEquivalenceExemplarAsset();
  assert.equal(asset.timeline?.beatCount, 96);
  assert.equal(asset.checks.some(({ lawId }) =>
    lawId === "animation.seek-rewind"), true);
  assert.equal(asset.bundle.objects.filter(({ metadata }) =>
    metadata?.["settledEndpointAuthority"] === "native-katex").length, 2);
});
