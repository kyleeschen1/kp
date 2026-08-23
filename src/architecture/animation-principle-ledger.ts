export const KP_ANIMATION_PRINCIPLE_STATUSES = [
  "candidate",
  "approved-exemplar",
  "promoted",
  "deprecated",
  "blocked"
] as const;

export type KpAnimationPrincipleStatus =
  typeof KP_ANIMATION_PRINCIPLE_STATUSES[number];

export type KpAnimationPrincipleEnforcement =
  | "none"
  | "advisory"
  | "required";

export type KpAnimationPrincipleCategory =
  | "mechanical"
  | "semantic"
  | "typography"
  | "visual";

export type KpAnimationPrincipleScope =
  | "renderer-neutral"
  | "equation"
  | "graph"
  | "programming"
  | "diagram";

export type KpAnimationPrincipleId = `principle.animation.${string}`;
export type KpAnimationPrincipleContractId = `contract.animation.${string}`;

interface KpAnimationPrincipleBase {
  readonly id: KpAnimationPrincipleId;
  readonly title: string;
  readonly category: KpAnimationPrincipleCategory;
  readonly scopes: readonly KpAnimationPrincipleScope[];
  readonly statement: string;
  readonly rationale: string;
  readonly evidenceSourceIds: readonly string[];
}

export type KpAnimationPrinciple = KpAnimationPrincipleBase & (
  | {
      readonly status: "candidate";
    }
  | {
      readonly status: "approved-exemplar";
      readonly exemplarAnimationIds: readonly [string, ...string[]];
    }
  | {
      readonly status: "promoted";
      readonly exemplarAnimationIds: readonly [string, string, ...string[]];
      readonly contractIds: readonly [
        KpAnimationPrincipleContractId,
        ...KpAnimationPrincipleContractId[]
      ];
    }
  | {
      readonly status: "deprecated";
      readonly replacementPrincipleId: KpAnimationPrincipleId;
    }
  | {
      readonly status: "blocked";
      readonly blockedReason: string;
    }
);

export interface KpCompiledAnimationPrinciple {
  readonly principle: KpAnimationPrinciple;
  readonly enforcement: KpAnimationPrincipleEnforcement;
}

/**
 * Promotion, not mere documentation, creates repository-wide authority. This
 * prevents an attractive one-off experiment from silently changing every
 * caller before a structurally different exemplar proves the seam.
 */
export function resolveKpAnimationPrincipleEnforcement(
  principle: KpAnimationPrinciple
): KpAnimationPrincipleEnforcement {
  switch (principle.status) {
    case "candidate":
    case "deprecated":
    case "blocked":
      return "none";
    case "approved-exemplar":
      return "advisory";
    case "promoted":
      return "required";
  }
}

export function compileKpAnimationPrincipleLedger(
  principles: readonly KpAnimationPrinciple[]
): readonly KpCompiledAnimationPrinciple[] {
  const ids = new Set<KpAnimationPrincipleId>();
  for (const principle of principles) {
    validatePrinciple(principle, ids);
    ids.add(principle.id);
  }
  for (const principle of principles) {
    if (
      principle.status === "deprecated" &&
      !ids.has(principle.replacementPrincipleId)
    ) {
      throw new Error(
        `Deprecated principle ${principle.id} names missing replacement ${principle.replacementPrincipleId}.`
      );
    }
  }
  return Object.freeze(
    principles.map((principle) => Object.freeze({
      principle,
      enforcement: resolveKpAnimationPrincipleEnforcement(principle)
    }))
  );
}

function validatePrinciple(
  principle: KpAnimationPrinciple,
  ids: ReadonlySet<KpAnimationPrincipleId>
): void {
  if (ids.has(principle.id)) {
    throw new Error(`Duplicate animation principle ${principle.id}.`);
  }
  if (principle.title.trim() === "" || principle.statement.trim() === "") {
    throw new Error(`Animation principle ${principle.id} requires a title and statement.`);
  }
  if (principle.scopes.length === 0 || new Set(principle.scopes).size !== principle.scopes.length) {
    throw new Error(`Animation principle ${principle.id} requires unique scopes.`);
  }
  if (principle.evidenceSourceIds.length === 0) {
    throw new Error(`Animation principle ${principle.id} requires evidence.`);
  }
  if (
    "exemplarAnimationIds" in principle &&
    new Set(principle.exemplarAnimationIds).size !==
      principle.exemplarAnimationIds.length
  ) {
    throw new Error(`Animation principle ${principle.id} requires distinct exemplars.`);
  }
  if (
    principle.status === "promoted" &&
    new Set(principle.contractIds).size !== principle.contractIds.length
  ) {
    throw new Error(`Promoted principle ${principle.id} requires distinct contracts.`);
  }
  if (principle.status === "blocked" && principle.blockedReason.trim() === "") {
    throw new Error(`Blocked principle ${principle.id} requires a reason.`);
  }
}

export const kpAnimationPrinciples = [
  {
    id: "principle.animation.semantic-lineage-authority",
    title: "Semantic lineage owns identity",
    category: "semantic",
    scopes: ["renderer-neutral"],
    statement:
      "Animation identity follows canonical semantic lineage and never glyph equality, DOM order, or geometry.",
    rationale:
      "Repeated glyphs, copies, merges, and representation changes are visually ambiguous without upstream semantic authority.",
    evidenceSourceIds: [
      "docs/project/reviews/2026-07-25-glyph-compositor-promotion-closeout.md",
      "docs/project/reviews/2026-07-29-presentation-compiler-continuity-repair-long-loop-proposal.md"
    ],
    status: "promoted",
    exemplarAnimationIds: [
      "animation.generated.function-wrap.apply-f",
      "animation.exact-fraction-quantity.third-plus-sixth"
    ],
    contractIds: ["contract.animation.semantic-lineage.v1"]
  },
  {
    id: "principle.animation.deterministic-single-clock",
    title: "One deterministic clock",
    category: "mechanical",
    scopes: ["renderer-neutral"],
    statement:
      "Every composed animation samples one deterministic clock for play, seek, rewind, and restoration.",
    rationale:
      "A single clock makes semantic states reconstructible and prevents independently scheduled views from drifting.",
    evidenceSourceIds: [
      "docs/project/reviews/2026-08-18-governed-animation-generation-foundation-closeout.md",
      "docs/project/reviews/2026-07-23-semantic-animation-convergence-successor-loop-closeout.md"
    ],
    status: "promoted",
    exemplarAnimationIds: [
      "animation.generated.function-wrap.apply-f",
      "animation.equation.finite-sum-expansion.v1"
    ],
    contractIds: ["contract.animation.deterministic-clock.v1"]
  },
  {
    id: "principle.animation.relation-clearing-transit",
    title: "Relations are landmarks, not tunnels",
    category: "visual",
    scopes: ["equation"],
    statement:
      "A continuant crossing a retained relation takes a measured clear route while the relation stays fixed and legible.",
    rationale:
      "Finite-sum generation and log equivalence independently proved that retained relations remain readable when continuants use renderer-measured crossing routes.",
    evidenceSourceIds: [
      "docs/project/decisions/2026-08-22-finite-binder-boundary-handoff-and-schematic-expansion.md",
      "docs/project/reviews/2026-08-23-animation-governance-v2-calibration-checkpoint.md"
    ],
    status: "promoted",
    exemplarAnimationIds: [
      "animation.equation.finite-sum-expansion.v1",
      "animation.algebra.log-product.equivalence-frame"
    ],
    contractIds: ["contract.animation.relation-clearing-transit.v1"]
  },
  {
    id: "principle.animation.target-arrival-cohort",
    title: "Punctuation prepares the landing",
    category: "visual",
    scopes: ["equation"],
    statement:
      "An explicit target connector resolves with the complete follower group after its left neighbor settles.",
    rationale:
      "Finite-sum term generation and log wrapper reception independently proved that connected target syntax must arrive as one semantic cohort.",
    evidenceSourceIds: [
      "docs/project/decisions/2026-08-22-finite-binder-boundary-handoff-and-schematic-expansion.md",
      "docs/project/reviews/2026-08-23-animation-governance-v2-calibration-checkpoint.md"
    ],
    status: "promoted",
    exemplarAnimationIds: [
      "animation.equation.finite-sum-expansion.v1",
      "animation.algebra.log-product.equivalence-frame"
    ],
    contractIds: ["contract.animation.target-arrival-cohort.v1"]
  },
  {
    id: "principle.animation.typography-authority-v2",
    title: "Typography is semantic policy",
    category: "typography",
    scopes: ["equation"],
    statement:
      "Flow context, mathematical style, and visual scale are independent typed choices compiled before rendering.",
    rationale:
      "The v2 grammar must prove this split before it can replace inherited display-mode and caller scaling conventions.",
    evidenceSourceIds: [
      "docs/project/reviews/2026-08-22-animation-governance-epoch-v2-long-loop-proposal.md"
    ],
    status: "candidate"
  },
  {
    id: "principle.animation.implicit-display-mode",
    title: "Implicit display-mode typography",
    category: "typography",
    scopes: ["equation"],
    statement:
      "A renderer infers mathematical presentation directly from a boolean display-mode setting.",
    rationale:
      "The convention conflates document flow, math style, and scale, so the v2 typography policy replaces it.",
    evidenceSourceIds: [
      "docs/project/reviews/2026-08-22-animation-governance-epoch-v2-long-loop-proposal.md"
    ],
    status: "deprecated",
    replacementPrincipleId: "principle.animation.typography-authority-v2"
  },
  {
    id: "principle.animation.opaque-occlusion-backing-plate",
    title: "Opaque occlusion backing plate",
    category: "visual",
    scopes: ["equation"],
    statement:
      "Moving equation ink receives an opaque rectangular backing plate to hide collisions.",
    rationale:
      "Human review found the plate visually disruptive; measured routes and ownership should solve collisions instead.",
    evidenceSourceIds: [
      "docs/project/reviews/2026-08-20-calculus-bc-symbolic-foundation-long-loop-proposal.md"
    ],
    status: "blocked",
    blockedReason:
      "Rejected at human review; retain as historical evidence rather than a globally enforced prohibition until affected callers migrate."
  }
] as const satisfies readonly KpAnimationPrinciple[];

export const kpCompiledAnimationPrincipleLedger =
  compileKpAnimationPrincipleLedger(kpAnimationPrinciples);

export const kpRequiredAnimationPrinciples = Object.freeze(
  kpCompiledAnimationPrincipleLedger
    .filter(({ enforcement }) => enforcement === "required")
    .map(({ principle }) => principle)
);
