import type { KpAnimationAsset } from "../animation/asset.ts";
import { createKpAnimationAssetVisualMotifTimeline } from "../animation/visual-motif.ts";
import { defaultEquationTransformVisualMotifRules } from "../animation/motifs/equation-visual-motif-defaults.ts";

export interface KpEquationVisualMotifConformanceFixture {
  readonly id: string;
  readonly animationId: string;
  readonly definitionId: string;
  readonly approvedExemplarId: string;
  readonly requiredCanonicalOperationIds: readonly string[];
  readonly requiredTrustedMotifIds: readonly string[];
  readonly semanticPhaseIds: readonly string[];
  readonly rewindPhaseIds: readonly string[];
  readonly ordering: readonly {
    readonly beforePhaseId: string;
    readonly afterPhaseId: string;
  }[];
  readonly identityRequirements: readonly {
    readonly relation: "identity" | "role-change" | "fan-out";
    readonly sourceCount: number;
    readonly targetCount: number;
    readonly sourcePersists: boolean;
  }[];
  readonly accessibility: readonly {
    readonly mode: "full-motion" | "reduced-motion" | "static" | "narrated";
    readonly preservesPhaseIds: readonly string[];
  }[];
  readonly checkpoints: readonly {
    readonly direction: "forward" | "rewind";
    readonly progress: number;
  }[];
}

export interface KpEquationVisualMotifConformanceResult {
  readonly passed: boolean;
  readonly failures: readonly string[];
}

export const kpEquationVisualMotifConformanceFixtures:
  readonly KpEquationVisualMotifConformanceFixture[] = [
    fixture({
      id: "conformance.equation.wrap-f-of-x",
      animationId: "animation.generated.function-wrap.apply-f",
      definitionId: "definition.generated.function-wrap.wrap-function",
      approvedExemplarId: "curated.equation.function-wrap.f-of-x",
      requiredCanonicalOperationIds: ["kp.core.wrap"],
      requiredTrustedMotifIds: ["wrap"],
      semanticPhaseIds: ["establish-argument", "introduce-enclosure", "settle-enclosure"],
      ordering: [
        { beforePhaseId: "establish-argument", afterPhaseId: "introduce-enclosure" },
        { beforePhaseId: "introduce-enclosure", afterPhaseId: "settle-enclosure" }
      ],
      identityRequirements: [{
        relation: "role-change",
        sourceCount: 1,
        targetCount: 1,
        sourcePersists: true
      }]
    }),
    fixture({
      id: "conformance.equation.distribute-factor",
      animationId: "animation.generated.distribution.expand-a-sum",
      definitionId: "definition.generated.distribution.distribute-multiplication",
      approvedExemplarId: "curated.equation.distribution.copy-factor",
      requiredCanonicalOperationIds: ["kp.core.persist", "kp.core.fan-out", "kp.core.eliminate", "kp.core.reorder"],
      requiredTrustedMotifIds: ["persist", "fan-out", "eliminate", "reorder"],
      semanticPhaseIds: ["establish-source", "contract-source", "branch-copies", "transit-copies", "arrive-copies", "settle-products"],
      ordering: [
        { beforePhaseId: "establish-source", afterPhaseId: "contract-source" },
        { beforePhaseId: "contract-source", afterPhaseId: "branch-copies" },
        { beforePhaseId: "branch-copies", afterPhaseId: "transit-copies" },
        { beforePhaseId: "transit-copies", afterPhaseId: "arrive-copies" },
        { beforePhaseId: "arrive-copies", afterPhaseId: "settle-products" }
      ],
      identityRequirements: [{
        relation: "fan-out",
        sourceCount: 1,
        targetCount: 2,
        sourcePersists: false
      }]
    })
  ];

export function kpEquationVisualMotifConformanceFixture(
  animationId: string
): KpEquationVisualMotifConformanceFixture {
  const result = kpEquationVisualMotifConformanceFixtures.find(
    (candidate) => candidate.animationId === animationId
  );
  if (result === undefined) throw new Error(`Missing motif conformance fixture ${animationId}.`);
  return result;
}

export function checkKpEquationVisualMotifFixture(
  fixture: KpEquationVisualMotifConformanceFixture
): KpEquationVisualMotifConformanceResult {
  const failures: string[] = [];
  const phases = new Set(fixture.semanticPhaseIds);
  if (phases.size !== fixture.semanticPhaseIds.length) failures.push("Semantic phase ids must be unique.");
  fixture.ordering.forEach((constraint) => {
    const before = fixture.semanticPhaseIds.indexOf(constraint.beforePhaseId);
    const after = fixture.semanticPhaseIds.indexOf(constraint.afterPhaseId);
    if (before < 0 || after < 0 || before >= after) failures.push(`Invalid phase order ${constraint.beforePhaseId} before ${constraint.afterPhaseId}.`);
  });
  if (!arraysEqual(fixture.rewindPhaseIds, [...fixture.semanticPhaseIds].reverse())) {
    failures.push("Rewind phases must exactly mirror semantic phase order.");
  }
  fixture.accessibility.forEach((variant) => {
    if (!arraysEqual(variant.preservesPhaseIds, fixture.semanticPhaseIds)) {
      failures.push(`${variant.mode} must preserve every semantic phase.`);
    }
  });
  return { passed: failures.length === 0, failures };
}

export function checkKpAnimationAgainstEquationMotifFixture(input: {
  readonly animation: KpAnimationAsset;
  readonly fixture: KpEquationVisualMotifConformanceFixture;
}): KpEquationVisualMotifConformanceResult {
  const failures = [...checkKpEquationVisualMotifFixture(input.fixture).failures];
  const transformation = input.animation.transformations.find(
    (candidate) => candidate.definitionId === input.fixture.definitionId
  );
  if (transformation === undefined) {
    failures.push(`Animation ${input.animation.id} is missing definition ${input.fixture.definitionId}.`);
    return { passed: false, failures };
  }
  const timeline = createKpAnimationAssetVisualMotifTimeline({
    id: `${input.animation.id}.motif-conformance`,
    animation: input.animation,
    rules: defaultEquationTransformVisualMotifRules
  });
  const segment = timeline.segments.find((candidate) =>
    candidate.definitionIds?.includes(input.fixture.definitionId)
  );
  if (segment === undefined) {
    failures.push(`Definition ${input.fixture.definitionId} has no executable motif segment.`);
  } else {
    requireSubset(input.fixture.requiredCanonicalOperationIds, segment.canonicalOperationIds ?? [], "canonical operation", failures);
    requireSubset(input.fixture.requiredTrustedMotifIds, segment.trustedMotifIds ?? [], "trusted motif", failures);
  }
  input.fixture.identityRequirements.forEach((requirement) => {
    const record = transformation.correspondenceMap?.records.find((candidate) =>
      candidate.relation === requirement.relation &&
      candidate.sourceSelectorIds.length === requirement.sourceCount &&
      candidate.targetSelectorIds.length === requirement.targetCount
    );
    if (record === undefined) failures.push(`Missing ${requirement.relation} identity requirement ${requirement.sourceCount}:${requirement.targetCount}.`);
  });
  return { passed: failures.length === 0, failures };
}

function fixture(
  input: Omit<KpEquationVisualMotifConformanceFixture, "rewindPhaseIds" | "accessibility" | "checkpoints">
): KpEquationVisualMotifConformanceFixture {
  const checkpoints = [
    { direction: "forward" as const, progress: 0 },
    { direction: "forward" as const, progress: 0.5 },
    { direction: "forward" as const, progress: 1 },
    { direction: "rewind" as const, progress: 0.5 }
  ];
  return {
    ...input,
    rewindPhaseIds: [...input.semanticPhaseIds].reverse(),
    accessibility: (["full-motion", "reduced-motion", "static", "narrated"] as const).map(
      (mode) => ({ mode, preservesPhaseIds: [...input.semanticPhaseIds] })
    ),
    checkpoints
  };
}

function requireSubset(required: readonly string[], actual: readonly string[], label: string, failures: string[]): void {
  required.forEach((id) => { if (!actual.includes(id)) failures.push(`Missing ${label} ${id}.`); });
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
