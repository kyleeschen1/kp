export interface KpProgrammingAdditionReference {
  readonly path: string;
  readonly role: string;
  readonly decision: "preserve" | "evolve";
}

export const kpProgrammingAdditionReferenceInventory = Object.freeze([
  reference(
    "src/tutorial/programming-card-sample.ts",
    "Exact TypeScript SourceFile plus stable signature and return selectors.",
    "preserve"
  ),
  reference(
    "src/domain-ir/programming-addition-trace-fixture.ts",
    "Precomputed four-step addition trace and deterministic progress sampler.",
    "preserve"
  ),
  reference(
    "src/domain-ir/programming-execution-trace.ts",
    "Typed source focus, stack, locals, output, and sampled-frame truth.",
    "evolve"
  ),
  reference(
    "src/semantic/program-trace-asset.ts",
    "Semantic objects, selectors, transformations, lineage, and behavior.",
    "preserve"
  ),
  reference(
    "src/animation/programming-adapter.ts",
    "Stable KpAnimationAsset and programming render-target identity.",
    "evolve"
  ),
  reference(
    "src/editor/animation-surface-adapter-registry.ts",
    "Existing caller-driven adapter seam and one-frame paint dispatch.",
    "evolve"
  ),
  reference(
    "docs/project/threads/animation-library-promotion.md",
    "Stable frontier keeps vector rank 5 next and BFS programming at rank 23.",
    "preserve"
  )
] as const satisfies readonly KpProgrammingAdditionReference[]);

export const kpProgrammingAdditionCurrentBaseline = Object.freeze({
  animationId: "animation.programming.add.execution-trace",
  comparisonAnimationId: "animation.comparison.linear-solve-programming",
  sourceFixtureId: "fixture.programming.add.execution-trace",
  canonicalFormat: "legacy" as const,
  hostOutcome: "capability-gap" as const,
  gapCount: 2,
  knownPresentationGaps: Object.freeze([
    "no native programming surface adapter is registered",
    "source focus is not painted in the catalogue",
    "stack and locals have no synchronized catalogue projection",
    "output and accessible step state have no native catalogue projection"
  ])
});

export const kpProgrammingAdditionAcceptance = Object.freeze([
  "the existing SourceFile and four-step trace remain semantic authority",
  "one shared player clock drives source focus, stack, locals, and output",
  "direct seek and rewind reproduce exact precomputed trace state",
  "reduced motion and static output preserve every semantic endpoint",
  "accessible state names the current step, source range, stack, locals, and output",
  "one lazy native programming adapter owns paint for addition and the exact comparison caller",
  "unrelated catalogue routes request no programming presenter or code highlighter",
  "no source execution, language runtime, inferred state, iframe, or second clock",
  "no BFS, queue, graph, algorithm-family generalization, or rank-23 promotion"
]);

export const kpProgrammingAdditionPreservationBoundary = Object.freeze([
  "animation.programming.add.execution-trace and fixture identities",
  "source-file.programming.add revision, exact text, and selector provenance",
  "trace step order, progress thresholds, stack, locals, and output",
  "KpAnimationAsset, sampled behavior, shared player clock, and catalogue lifecycle",
  "persistent shell, compact controls, URL state, and Review capture",
  "rank-5 vector frontier and rank-23 BFS deferral"
]);

function reference(
  path: string,
  role: string,
  decision: "preserve" | "evolve"
): KpProgrammingAdditionReference {
  return Object.freeze({ path, role, decision });
}
