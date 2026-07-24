export type KpSemanticAnimationPreservationTopic =
  | "solve-x"
  | "distribution"
  | "factoring"
  | "fractions"
  | "radical"
  | "structural-wrap"
  | "matrix-composition"
  | "equation-graph"
  | "program-trace";

export type KpSettledEndpointAuthority =
  | "native-katex"
  | "lesson-composite"
  | "domain-renderer";

export interface KpSemanticAnimationPreservationEntry {
  readonly schemaVersion: "kp.semantic-animation-preservation-entry.v1";
  readonly topic: KpSemanticAnimationPreservationTopic;
  readonly animationId: string;
  readonly reviewScopeId: string;
  readonly canonicalRepresentationId: string;
  readonly canonicalRoute: string;
  readonly canonicalSource: {
    readonly kind: "lesson-animation" | "catalog-animation";
    readonly sourceId: string;
    readonly choreographyId: string;
  };
  readonly descriptorIds: readonly string[];
  readonly cardRepresentationIds: readonly string[];
  readonly exportTargetIds: readonly string[];
  readonly settledEndpointAuthority: KpSettledEndpointAuthority;
}

const preservationManifest = [
  entry({
    topic: "solve-x",
    animationId: "animation.linear-solve.solve-x",
    canonicalRepresentationId:
      "learner-experience.solve-x-scroll-lesson.animation.linear-solve.solve-x",
    canonicalRoute: "/reader/solve-x/",
    canonicalSource: {
      kind: "lesson-animation",
      sourceId: "animation.linear-solve.solve-x",
      choreographyId: "choreography.lesson.animation.linear-solve.solve-x"
    },
    descriptorIds: [
      "editor-animation.sample.animation.solve-x.both-sides",
      "editor-animation.sample.animation.solve-x.cancel-additive-inverses",
      "editor-animation.animation.linear-solve.solve-x"
    ],
    cardRepresentationIds: [
      "sample.animation.solve-x.both-sides",
      "sample.animation.solve-x.cancel-additive-inverses"
    ],
    exportTargetIds: ["export.linear-solve.frames"],
    settledEndpointAuthority: "native-katex"
  }),
  entry({
    topic: "distribution",
    animationId: "animation.generated.distribution.expand-a-sum",
    canonicalRepresentationId:
      "learner-experience.distribution-area-scroll-lesson.exemplar.distribution-area.3-times-x-plus-2",
    canonicalRoute: "/reader/distribution-area/",
    canonicalSource: {
      kind: "lesson-animation",
      sourceId: "exemplar.distribution-area.3-times-x-plus-2",
      choreographyId:
        "choreography.lesson.distribution-area.algebra-and-area"
    },
    descriptorIds: [
      "editor-animation.sample.animation.distribution.expand-a-sum",
      "editor-animation.animation.generated.distribution.expand-a-sum"
    ],
    cardRepresentationIds: [
      "sample.animation.distribution.expand-a-sum"
    ],
    exportTargetIds: [
      "export.generated.distribution.expand-a-sum.frames"
    ],
    settledEndpointAuthority: "lesson-composite"
  }),
  entry({
    topic: "factoring",
    animationId: "animation.generated.distribution.factor-common-a",
    canonicalRepresentationId:
      "editor-animation.sample.animation.factoring.factor-common-a",
    canonicalRoute:
      "/?animation=editor-animation.sample.animation.factoring.factor-common-a",
    canonicalSource: {
      kind: "catalog-animation",
      sourceId: "animation.generated.distribution.factor-common-a",
      choreographyId:
        "choreography.catalog.animation.generated.distribution.factor-common-a"
    },
    descriptorIds: [
      "editor-animation.sample.animation.factoring.factor-common-a",
      "editor-animation.animation.generated.distribution.factor-common-a"
    ],
    cardRepresentationIds: [
      "sample.animation.factoring.factor-common-a"
    ],
    exportTargetIds: [
      "export.generated.distribution.factor-common-a.frames"
    ],
    settledEndpointAuthority: "native-katex"
  }),
  entry({
    topic: "fractions",
    animationId: "animation.numerator-split-merge.round-trip",
    canonicalRepresentationId:
      "learner-experience.numerator-split-merge-scroll-lesson.animation.numerator-split-merge.round-trip",
    canonicalRoute: "/reader/split-merge-fractions/",
    canonicalSource: {
      kind: "lesson-animation",
      sourceId: "animation.numerator-split-merge.round-trip",
      choreographyId:
        "choreography.lesson.animation.numerator-split-merge.round-trip"
    },
    descriptorIds: [],
    cardRepresentationIds: [],
    exportTargetIds: [],
    settledEndpointAuthority: "native-katex"
  }),
  entry({
    topic: "radical",
    animationId: "animation.generated.radical.square-root-as-power",
    canonicalRepresentationId:
      "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    canonicalRoute:
      "/?animation=editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    canonicalSource: {
      kind: "catalog-animation",
      sourceId: "animation.generated.radical.square-root-as-power",
      choreographyId:
        "choreography.catalog.animation.generated.radical.square-root-as-power"
    },
    descriptorIds: [
      "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
      "editor-animation.animation.generated.radical.square-root-as-power"
    ],
    cardRepresentationIds: [
      "sample.animation.radical-rewrite.square-root-as-power"
    ],
    exportTargetIds: [
      "export.generated.radical.square-root-as-power.frames"
    ],
    settledEndpointAuthority: "native-katex"
  }),
  entry({
    topic: "structural-wrap",
    animationId: "animation.generated.function-wrap.apply-f",
    canonicalRepresentationId:
      "editor-animation.sample.animation.function-wrap.apply-f",
    canonicalRoute:
      "/?animation=editor-animation.sample.animation.function-wrap.apply-f",
    canonicalSource: {
      kind: "catalog-animation",
      sourceId: "animation.generated.function-wrap.apply-f",
      choreographyId:
        "choreography.catalog.animation.generated.function-wrap.apply-f"
    },
    descriptorIds: [
      "editor-animation.sample.animation.function-wrap.apply-f",
      "editor-animation.animation.generated.function-wrap.apply-f"
    ],
    cardRepresentationIds: ["sample.animation.function-wrap.apply-f"],
    exportTargetIds: ["export.generated.function-wrap.apply-f.frames"],
    settledEndpointAuthority: "native-katex"
  }),
  entry({
    topic: "matrix-composition",
    animationId:
      "animation.generated.linear-algebra.matrix-matrix.two-by-two",
    canonicalRepresentationId:
      "editor-animation.sample.animation.matrix-matrix.basic",
    canonicalRoute:
      "/?animation=editor-animation.sample.animation.matrix-matrix.basic",
    canonicalSource: {
      kind: "catalog-animation",
      sourceId:
        "animation.generated.linear-algebra.matrix-matrix.two-by-two",
      choreographyId:
        "choreography.catalog.animation.generated.linear-algebra.matrix-matrix.two-by-two"
    },
    descriptorIds: [
      "editor-animation.sample.animation.matrix-matrix.basic",
      "editor-animation.animation.generated.linear-algebra.matrix-matrix.two-by-two"
    ],
    cardRepresentationIds: ["sample.animation.matrix-matrix.basic"],
    exportTargetIds: [
      "export.generated.linear-algebra.matrix-matrix.two-by-two.generated-problem-frames"
    ],
    settledEndpointAuthority: "native-katex"
  }),
  entry({
    topic: "equation-graph",
    animationId: "animation.derivative-rules.tangent-graph",
    canonicalRepresentationId:
      "editor-animation.sample.animation.derivative-rules.tangent-graph",
    canonicalRoute:
      "/?animation=editor-animation.sample.animation.derivative-rules.tangent-graph",
    canonicalSource: {
      kind: "catalog-animation",
      sourceId: "animation.derivative-rules.tangent-graph",
      choreographyId:
        "choreography.catalog.animation.derivative-rules.tangent-graph"
    },
    descriptorIds: [
      "editor-animation.sample.animation.derivative-rules.tangent-graph",
      "editor-animation.animation.derivative-rules.tangent-graph"
    ],
    cardRepresentationIds: [
      "sample.animation.derivative-rules.tangent-graph"
    ],
    exportTargetIds: ["export.derivative-rules.tangent-graph.frames"],
    settledEndpointAuthority: "domain-renderer"
  }),
  entry({
    topic: "program-trace",
    animationId: "animation.programming.add.execution-trace",
    canonicalRepresentationId:
      "editor-animation.animation.programming.add.execution-trace",
    canonicalRoute:
      "/?animation=editor-animation.animation.programming.add.execution-trace",
    canonicalSource: {
      kind: "catalog-animation",
      sourceId: "animation.programming.add.execution-trace",
      choreographyId:
        "choreography.catalog.animation.programming.add.execution-trace"
    },
    descriptorIds: [
      "editor-animation.animation.programming.add.execution-trace"
    ],
    cardRepresentationIds: [],
    exportTargetIds: ["export.programming.add.execution-trace.frames"],
    settledEndpointAuthority: "domain-renderer"
  })
] as const satisfies readonly KpSemanticAnimationPreservationEntry[];

export function createKpSemanticAnimationPreservationManifest():
  readonly KpSemanticAnimationPreservationEntry[] {
  assertKpSemanticAnimationPreservationManifest(preservationManifest);
  return preservationManifest.map((item) => ({
    ...item,
    canonicalSource: { ...item.canonicalSource },
    descriptorIds: [...item.descriptorIds],
    cardRepresentationIds: [...item.cardRepresentationIds],
    exportTargetIds: [...item.exportTargetIds]
  }));
}

export function assertKpSemanticAnimationPreservationManifest(
  manifest: readonly KpSemanticAnimationPreservationEntry[]
): void {
  const topics = new Set<KpSemanticAnimationPreservationTopic>();
  const animationIds = new Set<string>();
  for (const item of manifest) {
    if (topics.has(item.topic)) {
      throw new Error(`Duplicate preservation topic ${item.topic}.`);
    }
    if (animationIds.has(item.animationId)) {
      throw new Error(`Duplicate preservation animation ${item.animationId}.`);
    }
    topics.add(item.topic);
    animationIds.add(item.animationId);
    if (item.reviewScopeId !== item.animationId) {
      throw new Error(
        `Preservation review scope for ${item.animationId} must use canonical animation identity.`
      );
    }
    if (
      item.canonicalSource.kind === "lesson-animation" &&
      !item.canonicalRepresentationId.startsWith("learner-experience.")
    ) {
      throw new Error(
        `Lesson-owned animation ${item.animationId} requires a learner-experience representation.`
      );
    }
  }
}

function entry(
  input: Omit<
    KpSemanticAnimationPreservationEntry,
    "schemaVersion" | "reviewScopeId"
  >
): KpSemanticAnimationPreservationEntry {
  return {
    schemaVersion: "kp.semantic-animation-preservation-entry.v1",
    ...input,
    // Review aggregation follows semantic identity, while captures retain their
    // lesson/card representation provenance.
    reviewScopeId: input.animationId
  };
}
