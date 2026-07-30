import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpAdjacentPlaceExchange
} from "../domains/quantities/place-value-exchange.ts";
import {
  certifyKpAdjacentBaseTenPlaces,
  kpBaseTenPlaces,
  type KpBaseTenAdjacency
} from "../domains/quantities/place-value.ts";
import {
  certifyKpCarryRemainderLineage
} from "../domains/quantities/place-value-regrouping.ts";
import {
  createKpPlaceValueAdditionPresentationPlan,
  type KpPlaceValuePresentationProgram
} from "../src/animation/place-value-addition-presentation-plan.ts";
import {
  certifyKpPlaceValueSemanticFoundation,
  checkKpPlaceValueSemanticFoundation,
  isKpVerifiedPlaceValueSemanticFoundation,
  type KpVerifiedPlaceValueSemanticFoundation
} from "../src/architecture/place-value-addition-semantic-foundation.ts";
import {
  deriveKpCanonicalFormatStatus,
  type KpCanonicalFormatPromotionEvidence
} from "../src/editor/animation-library-display-catalog-builder.ts";
import {
  kpPlaceValueAdditionDecompositions as decomposition
} from "../src/semantic/place-value-addition-decomposition.ts";
import {
  kpPlaceValueAdditionExchangeCertificates as exchange
} from "../src/semantic/place-value-addition-exchange.ts";
import {
  kpPlaceValueAdditionTrace
} from "../src/semantic/place-value-addition-trace.ts";

test("semantic foundation closes projection inputs without claiming promotion", () => {
  const certificate = certifyKpPlaceValueSemanticFoundation();
  assert.equal(certificate.status, "ready-for-projection");
  assert.equal(certificate.promotionStatus, "not-promoted");
  assert.deepEqual(certificate.remainingGates, [
    "written-column-projection",
    "base-ten-projection",
    "shared-runtime",
    "browser-and-product-integration",
    "human-perceptual-review"
  ]);
  assert.ok(isKpVerifiedPlaceValueSemanticFoundation(certificate));
  assert.equal(
    isKpVerifiedPlaceValueSemanticFoundation({ ...certificate }),
    false
  );
});

test("copied trace, plan, or program authority fails the firewall", () => {
  const plan = createKpPlaceValueAdditionPresentationPlan();
  const issues = checkKpPlaceValueSemanticFoundation({
    trace: { ...kpPlaceValueAdditionTrace },
    presentation: {
      ...plan,
      beats: plan.beats.map((beat) => ({
        ...beat,
        programs: beat.programs.map((program) => ({ ...program }))
      }))
    }
  });
  assert.ok(issues.some(({ code }) => code === "foundation.trace-authority"));
  assert.ok(
    issues.some(({ code }) => code === "foundation.presentation-authority")
  );
  assert.ok(issues.some(({ code }) => code === "foundation.program-authority"));
});

test("non-ten or copied exchange evidence cannot enter the governed path", () => {
  const adjacency = certifyKpAdjacentBaseTenPlaces(
    kpBaseTenPlaces.ones,
    kpBaseTenPlaces.tens
  );
  assert.throws(
    () => certifyKpAdjacentPlaceExchange(adjacency, 9n as 10n, 1n),
    /exactly ten units into one/
  );
  const copied = { ...adjacency } as KpBaseTenAdjacency<"ones", "tens">;
  assert.throws(
    () => certifyKpAdjacentPlaceExchange(copied, 10n, 1n),
    /compiler-owned adjacency/
  );
});

test("duplicate contributors cannot mint a carry lineage", () => {
  assert.throws(
    () => certifyKpCarryRemainderLineage(
      exchange.onesToTens,
      [
        decomposition.first.columns.ones,
        decomposition.first.columns.ones
      ],
      decomposition.result.columns.ones
    ),
    /unique lineage identities/
  );
});

test("missing catalyst, fade injection, and decorative labels get named failures", () => {
  const plan = createKpPlaceValueAdditionPresentationPlan();
  const evaluationBeat = plan.beats[1]!;
  if (evaluationBeat.kind !== "evaluate") {
    throw new Error("Expected ones evaluation presentation.");
  }
  const [evaluation, persistence] = evaluationBeat.programs;
  const { catalystId: _catalyst, ...missingCatalyst } = evaluation;
  const mutated = {
    ...plan,
    beats: [
      plan.beats[0],
      {
        ...evaluationBeat,
        programs: [
          {
            ...missingCatalyst,
            opacityPolicy: "crossfade",
            motifLabel: "add the numbers"
          },
          { motifLabel: "carry beautifully" },
          persistence
        ]
      },
      ...plan.beats.slice(2)
    ]
  };
  const issues = checkKpPlaceValueSemanticFoundation({
    trace: kpPlaceValueAdditionTrace,
    presentation: mutated
  });
  const codes = new Set(issues.map(({ code }) => code));
  assert.ok(codes.has("foundation.presentation-authority"));
  assert.ok(codes.has("foundation.program-authority"));
  assert.ok(codes.has("foundation.missing-catalyst"));
  assert.ok(codes.has("foundation.non-opaque-motion"));
  assert.ok(codes.has("foundation.decorative-only-motif"));
});

test("semantic success and authorable booleans cannot claim ported status", () => {
  const certificate = certifyKpPlaceValueSemanticFoundation();
  const issues = checkKpPlaceValueSemanticFoundation({
    trace: certificate.trace,
    presentation: certificate.presentation,
    claimedCanonicalFormat: "ported"
  });
  assert.deepEqual(
    issues.map(({ code }) => code),
    ["foundation.false-promotion"]
  );

  const forgedEvidence: KpCanonicalFormatPromotionEvidence = {
    animationId: certificate.animationId,
    executionAuthority: {
      kind: "legacy-reviewed",
      reviewId: "review.forged"
    },
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: true,
    presentationCoverage: "verified-animated",
    evidenceSourceIds: ["review.forged"]
  };
  assert.equal(
    deriveKpCanonicalFormatStatus({
      evidence: forgedEvidence,
      representations: [{
        id: "reader.forged",
        label: "Forged host",
        kind: "reader",
        href: "/forged/",
        role: "canonical-host"
      }]
    }),
    "partial"
  );
});

test("static types reject raw foundation and fallback presentation programs", () => {
  if (false as boolean) {
    // @ts-expect-error Only the semantic foundation certifier can mint authority.
    const rawFoundation: KpVerifiedPlaceValueSemanticFoundation = {
      schemaVersion: "kp.verified-place-value-semantic-foundation.v1",
      animationId: "animation.place-value-addition.278-plus-156",
      status: "ready-for-projection",
      promotionStatus: "not-promoted",
      trace: kpPlaceValueAdditionTrace,
      presentation: createKpPlaceValueAdditionPresentationPlan(),
      remainingGates: [
        "written-column-projection",
        "base-ten-projection",
        "shared-runtime",
        "browser-and-product-integration",
        "human-perceptual-review"
      ]
    };
    // @ts-expect-error Fade is not an executable presentation-program variant.
    const fallbackKind: KpPlaceValuePresentationProgram["kind"] = "fade";
    // @ts-expect-error Crossfade is excluded by the opaque lineage contract.
    const fallbackOpacity: KpPlaceValuePresentationProgram["opacityPolicy"] =
      "crossfade";
    assert.ok(rawFoundation);
    assert.ok(fallbackKind);
    assert.ok(fallbackOpacity);
  }
  assert.equal(certifyKpPlaceValueSemanticFoundation().promotionStatus, "not-promoted");
});
