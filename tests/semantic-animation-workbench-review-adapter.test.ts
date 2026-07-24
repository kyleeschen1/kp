import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpDevReviewCompactNoteEvidence
} from "../protocols/dev-review-operations-v2.ts";
import {
  projectKpAnimationReviewEvidence
} from "../src/editor/semantic-animation-workbench-review-adapter.ts";
import {
  createKpCanonicalAnimationIdentity
} from "../src/editor/semantic-animation-workbench-identity.ts";
import {
  createKpAnimationRepresentationRelationship
} from "../src/editor/semantic-animation-workbench-representation.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "../src/editor/semantic-animation-workbench-seeds.ts";

const [radicalSeed, derivativeSeed] = createKpAnimationWorkbenchSeedCohort();
const identities = [
  createKpCanonicalAnimationIdentity({
    seed: radicalSeed!,
    aliases: [
      "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
    ]
  }),
  createKpCanonicalAnimationIdentity({ seed: derivativeSeed! })
];

test("review adapter joins active-phase and route captures to stable identity", () => {
  const notes = [
    note({
      id: "note.radical.old",
      sequence: 1,
      roundId: "round.old",
      status: "verified",
      activePhase:
        "animation.generated.radical.square-root-as-power.forward.1"
    }),
    note({
      id: "note.radical.current",
      sequence: 2,
      roundId: "round.current",
      status: "fixed",
      route:
        "/?animation=editor-animation.sample.animation.radical-rewrite.square-root-as-power"
    })
  ];
  const original = structuredClone(notes);
  const result = projectKpAnimationReviewEvidence({
    identities,
    notes,
    currentRoundId: "round.current"
  });
  const radical = result.projections[0]!;

  assert.deepEqual(notes, original);
  assert.equal(radical.animationId, radicalSeed!.animationId);
  assert.equal(radical.state, "awaiting-review");
  assert.deepEqual(
    radical.current.map((evidence) => evidence.noteId),
    ["note.radical.current"]
  );
  assert.deepEqual(
    radical.historical.map((evidence) => evidence.noteId),
    ["note.radical.old"]
  );
  assert.equal(
    radical.current[0]!.captureIdentity,
    "round.current:note.radical.current:2:build.fixture"
  );
});

test("review adapter supports full capture asset identity", () => {
  const result = projectKpAnimationReviewEvidence({
    identities,
    notes: [
      note({
        id: "note.derivative",
        activePhase: undefined,
        assetId: derivativeSeed!.animationId,
        status: "verified"
      })
    ],
    currentRoundId: "round.current"
  });

  assert.equal(result.projections[0]!.animationId, derivativeSeed!.animationId);
  assert.equal(result.projections[0]!.state, "approved");
});

test("review adapter keeps unscoped and ambiguous notes explicit", () => {
  const result = projectKpAnimationReviewEvidence({
    identities: [
      ...identities,
      {
        ...identities[1]!,
        animationId: "animation.derivative-rules.other",
        aliases: [derivativeSeed!.animationId]
      }
    ],
    notes: [
      note({
        id: "note.unscoped",
        activePhase: "animation.unrelated.forward.0"
      }),
      note({
        id: "note.ambiguous",
        activePhase: `${derivativeSeed!.animationId}.forward.0`
      })
    ],
    currentRoundId: "round.current"
  });

  assert.deepEqual(result.unscopedNoteIds, ["note.unscoped"]);
  assert.equal(result.diagnostics[0]!.code, "ambiguous-note-identity");
  assert.equal(result.projections.length, 0);
});

test("lesson and card notes share canonical review state while retaining capture provenance", () => {
  const animationId =
    "animation.generated.distribution.expand-a-sum";
  const lessonAssetId =
    "exemplar.distribution-area.3-times-x-plus-2";
  const lessonRepresentationId =
    `learner-experience.distribution-area.${lessonAssetId}`;
  const cardRepresentationId =
    "sample.animation.distribution.expand-a-sum";
  const distributionIdentity = createKpCanonicalAnimationIdentity({
    seed: {
      animationId,
      title: "Distribution",
      source: {
        kind: "catalog",
        descriptorId:
          "editor-animation.sample.animation.distribution.expand-a-sum"
      },
      expectedPlayability: "playable"
    },
    aliases: [lessonAssetId]
  });
  const choreographySource = {
    kind: "lesson-animation" as const,
    sourceId: lessonAssetId,
    choreographyId:
      "choreography.lesson.distribution-area.algebra-and-area"
  };
  const relationships = [
    createKpAnimationRepresentationRelationship({
      animationId,
      representationId: lessonRepresentationId,
      kind: "lesson",
      label: "Distribution area lesson",
      href: "/reader/distribution-area/",
      playable: true,
      presentationRole: "canonical",
      choreographySource,
      aliases: [lessonAssetId]
    }),
    createKpAnimationRepresentationRelationship({
      animationId,
      representationId: cardRepresentationId,
      kind: "card",
      label: "Distribution card",
      playable: true,
      presentationRole: "projection",
      canonicalRepresentationId: lessonRepresentationId,
      choreographySource
    })
  ];

  const result = projectKpAnimationReviewEvidence({
    identities: [distributionIdentity],
    relationships,
    currentRoundId: "round.current",
    notes: [
      note({
        id: "note.lesson",
        sequence: 1,
        assetId: lessonAssetId,
        projectionId: "equation-area.distribution",
        documentId: "lesson.distribution-area",
        route: "/reader/distribution-area/"
      }),
      note({
        id: "note.card",
        sequence: 2,
        assetId: animationId,
        projectionId: cardRepresentationId,
        documentId: "editor.semantic-animation-workbench",
        route:
          `/?view=animation-workbench&workbenchAnimation=${animationId}`
      })
    ]
  });

  assert.equal(result.projections.length, 1);
  const projection = result.projections[0]!;
  assert.equal(projection.animationId, animationId);
  assert.equal(projection.state, "changes-requested");
  assert.deepEqual(
    projection.current.map(
      ({ capturedRepresentation }) => capturedRepresentation?.kind
    ),
    ["lesson", "card"]
  );
  assert.deepEqual(
    projection.current.map(
      ({ canonicalRepresentation }) =>
        canonicalRepresentation?.representationId
    ),
    [lessonRepresentationId, lessonRepresentationId]
  );
  assert.equal(
    projection.current[1]!.captureProjectionId,
    cardRepresentationId
  );
});

function note(
  input: Partial<KpDevReviewCompactNoteEvidence> & {
    readonly id: string;
    readonly assetId?: string;
    readonly projectionId?: string;
    readonly documentId?: string;
  }
): KpDevReviewCompactNoteEvidence {
  const assetId = input.assetId;
  return {
    id: input.id,
    sequence: input.sequence ?? 1,
    roundId: input.roundId ?? "round.current",
    status: input.status ?? "new",
    comment: input.comment ?? "Captured feedback",
    sessionId: input.sessionId ?? "session.fixture",
    capturedAt: input.capturedAt ?? "2026-07-23T00:00:00.000Z",
    route: input.route ?? "/",
    build: input.build ?? {
      commit: "fixture",
      fingerprint: "build.fixture",
      dirty: false
    },
    ...(input.checkpointId === undefined
      ? {}
      : { checkpointId: input.checkpointId }),
    ...(input.progressPermille === undefined
      ? {}
      : { progressPermille: input.progressPermille }),
    ...(input.activePhase === undefined
      ? {}
      : { activePhase: input.activePhase }),
    ...(assetId === undefined
      ? {}
      : {
          capture: {
            route: input.route ?? "/",
            capturedAt: input.capturedAt ?? "2026-07-23T00:00:00.000Z",
            environment: {
              browserName: "fixture",
              language: "en",
              viewport: {
                width: 1000,
                height: 700,
                devicePixelRatio: 1,
                scrollX: 0,
                scrollY: 0
              },
              reducedMotion: false,
              forcedColors: false,
              colorScheme: "light",
              build: {
                commit: "fixture",
                fingerprint: "build.fixture",
                dirty: false
              }
            },
            semantic: {
              assetId,
              ...(input.projectionId === undefined
                ? {}
                : { projectionId: input.projectionId }),
              ...(input.documentId === undefined
                ? {}
                : { documentId: input.documentId }),
              activeTransformationIds: [],
              focusRefs: []
            },
            render: { ownerIds: [] },
            temporalTrace: []
          }
        })
  };
}
