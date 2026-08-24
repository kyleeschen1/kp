import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpCanonicalCancellationPressureAnimationAsset
} from "../src/animation/cancellation-pressure-animation.ts";
import {
  compileKpEquationCancellationPresentationPlan
} from "../src/animation/equation-cancellation-presentation.ts";
import {
  resolveKpOperationEvaluationFamilyCandidate
} from "../src/animation/operation-evaluation-family-profile.ts";
import {
  compileKpDerivativePowerMigrationV2
} from "../src/domain-ir/derivative-power-migration-v2.ts";
import {
  createKpTwoTimesOneCarrierEvidenceCandidate,
  createKpTwoTimesOneCarrierExemplar
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";
import {
  kpCanonicalCancellationPressureContract
} from "../src/semantic/cancellation-pressure-contract.ts";
import {
  compileKpContributorEvaluationTopologyCertificate
} from "../src/semantic/evaluation-topology-certificate.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";

const derivativeAnimationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";

test("semantic evaluation cohort selects four disjoint outcomes", () => {
  const animation = createKpAnimationAssets().find(
    ({ id }) => id === derivativeAnimationId
  );
  assert.ok(animation);
  const derivative = compileKpDerivativePowerMigrationV2(animation);
  const fusionCertificate = derivative.presentationPlan.transitions.find(
    ({ evaluationFamilyCertificate }) =>
      evaluationFamilyCertificate !== undefined
  )?.evaluationFamilyCertificate;
  assert.ok(fusionCertificate);

  const carrier = createKpTwoTimesOneCarrierExemplar();
  const carrierEvidence = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: carrier.bundle,
    transformation: carrier.transformation
  });
  assert.equal(carrierEvidence.status, "verified");
  if (carrierEvidence.status !== "verified") return;
  const carrierResolution = resolveKpOperationEvaluationFamilyCandidate({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer",
    transformationKind: carrier.transformation.transformType,
    evidence: carrierEvidence.evidence
  });

  const cancellationAsset =
    createKpCanonicalCancellationPressureAnimationAsset();
  const cancellation = cancellationAsset.transformations[0]!;
  const cancellationPlan =
    compileKpEquationCancellationPresentationPlan(cancellation);
  const cancellationAsFusion =
    compileKpContributorEvaluationTopologyCertificate({
      bundle: cancellationAsset.bundle,
      transformation: cancellation,
      operationId: kpCanonicalCancellationPressureContract.operationId
    });

  const fixture = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.power-rule-x-cubed"
  );
  const difference = fixture.transformations.find(
    ({ transformType }) => transformType === "simplifyConstantDifference"
  );
  assert.ok(difference);
  const unsupported = compileKpContributorEvaluationTopologyCertificate({
    bundle: fixture.bundle,
    transformation: difference,
    operationId: "kp.arithmetic.multiply"
  });

  assert.deepEqual([
    {
      cohort: "fusion",
      outcome: fusionCertificate.familyProfile.family,
      topology: fusionCertificate.topologyCertificate.topology
    },
    {
      cohort: "carrier",
      outcome: carrierResolution.status,
      topology: "carrier-survives"
    },
    {
      cohort: "cancellation",
      outcome: cancellationPlan?.planKind,
      fusionStatus: cancellationAsFusion.status
    },
    {
      cohort: "unsupported",
      outcome: unsupported.status,
      diagnostic: unsupported.status === "repair-required"
        ? unsupported.diagnostics[0]?.code
        : undefined
    }
  ], [
    {
      cohort: "fusion",
      outcome: "contributor-fusion",
      topology: "contributors-create-result"
    },
    {
      cohort: "carrier",
      outcome: "candidate-resolved",
      topology: "carrier-survives"
    },
    {
      cohort: "cancellation",
      outcome: "inverse-cancellation",
      fusionStatus: "repair-required"
    },
    {
      cohort: "unsupported",
      outcome: "repair-required",
      diagnostic: "evaluation-topology.missing-evaluation-record"
    }
  ]);
});

test("carrier and cancellation cannot masquerade as contributor fusion", () => {
  const carrier = createKpTwoTimesOneCarrierExemplar();
  const carrierAsFusion = compileKpContributorEvaluationTopologyCertificate({
    bundle: carrier.bundle,
    transformation: carrier.transformation,
    operationId: "kp.algebra.simplify-multiplicative-identity"
  });
  assert.equal(carrierAsFusion.status, "repair-required");
  if (carrierAsFusion.status !== "repair-required") return;
  assert.deepEqual(carrierAsFusion.diagnostics.map(({ code }) => code), [
    "evaluation-topology.missing-evaluation-record"
  ]);

  const cancellationAsset =
    createKpCanonicalCancellationPressureAnimationAsset();
  const cancellationAsFusion =
    compileKpContributorEvaluationTopologyCertificate({
      bundle: cancellationAsset.bundle,
      transformation: cancellationAsset.transformations[0]!,
      operationId: kpCanonicalCancellationPressureContract.operationId
    });
  assert.equal(cancellationAsFusion.status, "repair-required");
  assert.equal("fallback" in cancellationAsFusion, false);
});
