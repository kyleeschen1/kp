export type KpOperationEvaluationReferenceDisposition =
  | "reference-candidate"
  | "rejected";

export interface KpOperationEvaluationReferenceCandidate {
  readonly id: string;
  readonly disposition: KpOperationEvaluationReferenceDisposition;
  readonly provenance: {
    readonly commitIds: readonly string[];
    readonly sourceLocations: readonly string[];
    readonly reviewEvidence: readonly string[];
  };
  readonly execution: {
    readonly motifSampler:
      | "successor-synthesis-continuous-recognition-v1"
      | "successor-synthesis-with-binary-handoff-v1"
      | "successor-synthesis-with-shared-zero-area-junction-v1";
    readonly paintTransfer:
      | "bounded-co-presence"
      | "binary-owner-swap"
      | "shared-zero-area-junction";
    readonly phases: readonly string[];
  };
  readonly preservedBehavior: readonly string[];
  readonly knownDefects: readonly string[];
}

/**
 * These entries separate the surviving pedagogical sampler from the paint
 * wrappers that later replaced its visible behavior. Keeping immutable commit
 * provenance prevents "latest implementation" from becoming visual authority.
 */
export const kpOperationEvaluationReferenceCandidates = Object.freeze([
  referenceCandidate({
    id: "kp.operation-evaluation.reference.continuous-recognition-v1",
    disposition: "reference-candidate",
    provenance: {
      commitIds: [
        "a89f6da4ace9e5be34be51c2b26162b404af946f",
        "dc461abfeef45e465142004230008b68c894ae00"
      ],
      sourceLocations: [
        "src/animation/successor-synthesis.ts#sampleKpSuccessorSynthesis",
        "src/rendering/native-katex-successor-synthesis.ts#" +
          "sampleKpNativeKatexSuccessorSynthesisScenePlans"
      ],
      reviewEvidence: [
        "docs/project/reviews/" +
          "2026-07-29-executable-motif-perceptual-continuity-repair-" +
          "long-loop-proposal.md#" +
          "Checkpoint A: Select The Evaluation Reference"
      ]
    },
    execution: {
      motifSampler: "successor-synthesis-continuous-recognition-v1",
      paintTransfer: "bounded-co-presence",
      phases: [
        "orient",
        "converge",
        "synthesize",
        "recognize",
        "retire",
        "settled"
      ]
    },
    preservedBehavior: [
      "material inputs travel toward a measured junction",
      "the operator participates as a non-material catalyst",
      "the result becomes recognizable before native settlement",
      "the source cohort retires only after result recognition"
    ],
    knownDefects: [
      "historical clone-to-native endpoint flicker remained",
      "source and target opacity overlap was not governed by a perceptual floor"
    ]
  }),
  referenceCandidate({
    id: "kp.operation-evaluation.reference.opaque-binary-handoff-v1",
    disposition: "rejected",
    provenance: {
      commitIds: [
        "0e8b451055879c9fff18246c80b2e8e1e9e15fb7"
      ],
      sourceLocations: [
        "src/rendering/native-katex-successor-synthesis.ts#" +
          "sampleKpNativeKatexSuccessorSynthesisScenePlans"
      ],
      reviewEvidence: [
        "docs/theseus/events/2026-07-29.jsonl#" +
          "event.status:superseded.run-contract.kp." +
          "exact-fraction-quantity-promotion-v1.20260729165502132.36q.1"
      ]
    },
    execution: {
      motifSampler: "successor-synthesis-with-binary-handoff-v1",
      paintTransfer: "binary-owner-swap",
      phases: [
        "orient",
        "converge",
        "owner-swap",
        "settled"
      ]
    },
    preservedBehavior: [
      "opaque paint avoided fractional-alpha glyph blending",
      "semantic source and target ownership remained explicit"
    ],
    knownDefects: [
      "the readiness threshold atomically swapped source and target paint",
      "the swap suppressed the reviewed converge-recognize choreography",
      "natural playback exposed a visible discontinuity"
    ]
  }),
  referenceCandidate({
    id: "kp.operation-evaluation.reference.shared-zero-area-junction-v1",
    disposition: "rejected",
    provenance: {
      commitIds: [
        "470bea646de6e5b337b22a7d7c459d6e15d00449",
        "563403f47f37ab9d21f1e5007c4619b66053e1da",
        "77369eb07c0cb27168319b348ca9af8edc842d7a"
      ],
      sourceLocations: [
        "src/rendering/native-katex-successor-synthesis.ts#" +
          "sharedJunctionSourcePose",
        "src/rendering/native-katex-successor-synthesis.ts#" +
          "sharedJunctionTargetPose"
      ],
      reviewEvidence: [
        "docs/theseus/events/2026-07-29.jsonl#" +
          "event.verified.next-action.kp." +
          "exact-fraction-quantity-promotion-v0.20260729192851248.vro.1"
      ]
    },
    execution: {
      motifSampler: "successor-synthesis-with-shared-zero-area-junction-v1",
      paintTransfer: "shared-zero-area-junction",
      phases: [
        "orient",
        "converge",
        "collapse-to-zero",
        "open-from-zero",
        "settled"
      ]
    },
    preservedBehavior: [
      "source and target opacity remained one",
      "the transfer had one deterministic geometry boundary"
    ],
    knownDefects: [
      "source and target paint both reached zero area",
      "the near-empty interval appeared as a blank pulse",
      "generic collapse and opening replaced positive evaluation choreography",
      "successor-owned target glyphs bypassed the endpoint microscope"
    ]
  })
] as const satisfies readonly KpOperationEvaluationReferenceCandidate[]);

function referenceCandidate(
  candidate: KpOperationEvaluationReferenceCandidate
): KpOperationEvaluationReferenceCandidate {
  if (
    candidate.provenance.commitIds.length === 0 ||
    candidate.provenance.sourceLocations.length === 0 ||
    candidate.provenance.reviewEvidence.length === 0 ||
    candidate.execution.phases.length === 0
  ) {
    throw new Error(
      `Operation-evaluation reference ${candidate.id} lacks provenance.`
    );
  }
  return Object.freeze({
    ...candidate,
    provenance: Object.freeze({
      commitIds: Object.freeze([...candidate.provenance.commitIds]),
      sourceLocations: Object.freeze([
        ...candidate.provenance.sourceLocations
      ]),
      reviewEvidence: Object.freeze([
        ...candidate.provenance.reviewEvidence
      ])
    }),
    execution: Object.freeze({
      ...candidate.execution,
      phases: Object.freeze([...candidate.execution.phases])
    }),
    preservedBehavior: Object.freeze([...candidate.preservedBehavior]),
    knownDefects: Object.freeze([...candidate.knownDefects])
  });
}
