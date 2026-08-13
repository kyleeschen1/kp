export interface KpTypeScriptRefactorStageContract {
  readonly id: string;
  readonly operation:
    | "orient"
    | "compare-duplicates"
    | "introduce-helper"
    | "move-shared-rule"
    | "replace-call-site"
    | "verify-parity";
  readonly progress: number;
  readonly narration: string;
  readonly focusEntityIds: readonly string[];
}

export interface KpTypeScriptRefactorEntityContract {
  readonly id: string;
  readonly revision: "before" | "after";
  readonly kind: "source-file" | "function" | "expression" | "call-site";
  readonly label: string;
}

export interface KpTypeScriptFreeShippingRefactorContractV1 {
  readonly schemaVersion: "kp.typescript-free-shipping-refactor.v1";
  readonly id: "typescript-refactor.free-shipping-threshold";
  readonly language: "typescript";
  readonly title: "One free-shipping rule";
  readonly learningClaim: string;
  readonly noviceMotivation: string;
  readonly threshold: 50;
  readonly paidShippingCost: 5;
  readonly before: {
    readonly revisionId: "free-shipping.before.v1";
    readonly path: "shipping-before.ts";
    readonly source: string;
  };
  readonly after: {
    readonly revisionId: "free-shipping.after.v1";
    readonly path: "shipping-after.ts";
    readonly source: string;
  };
  readonly entities: readonly KpTypeScriptRefactorEntityContract[];
  readonly stages: readonly KpTypeScriptRefactorStageContract[];
  readonly behaviorCases: readonly {
    readonly id: string;
    readonly total: number;
    readonly freeShipping: boolean;
    readonly shippingCost: number;
    readonly shippingMessage: string;
  }[];
  readonly visualAcceptance: readonly string[];
  readonly authority: {
    readonly syntax: "build-time-typescript-compiler";
    readonly sequencing: "authored-pedagogical-score";
    readonly playback: "shared-animation-clock";
    readonly prohibited: readonly string[];
  };
}

const beforeSource = `export function shippingCost(total: number): number {
  return total >= 50 ? 0 : 5;
}

export function shippingMessage(total: number): string {
  return total >= 50 ? "Free shipping" : "Shipping: $5";
}`;

const afterSource = `function qualifiesForFreeShipping(total: number): boolean {
  return total >= 50;
}

export function shippingCost(total: number): number {
  return qualifiesForFreeShipping(total) ? 0 : 5;
}

export function shippingMessage(total: number): string {
  return qualifiesForFreeShipping(total) ? "Free shipping" : "Shipping: $5";
}`;

/**
 * This contract freezes the pedagogical edit before syntax or paint exists.
 * The compiler may discover spans for these identities, but it may not change
 * the novice story, stage order, or source in response to its own traversal.
 */
export const kpTypeScriptFreeShippingRefactorContract = Object.freeze({
  schemaVersion: "kp.typescript-free-shipping-refactor.v1",
  id: "typescript-refactor.free-shipping-threshold",
  language: "typescript",
  title: "One free-shipping rule",
  learningClaim:
    "When one business rule appears twice, give it one clear name so every caller uses the same decision.",
  noviceMotivation:
    "If only one copy of the $50 threshold changes, the checkout price and customer message can disagree.",
  threshold: 50,
  paidShippingCost: 5,
  before: Object.freeze({
    revisionId: "free-shipping.before.v1",
    path: "shipping-before.ts",
    source: beforeSource
  }),
  after: Object.freeze({
    revisionId: "free-shipping.after.v1",
    path: "shipping-after.ts",
    source: afterSource
  }),
  entities: Object.freeze([
    entity("program.before", "before", "source-file", "duplicated program"),
    entity("function.shipping-cost.before", "before", "function", "shippingCost"),
    entity("rule.shipping-cost.before", "before", "expression", "total >= 50"),
    entity("function.shipping-message.before", "before", "function", "shippingMessage"),
    entity("rule.shipping-message.before", "before", "expression", "total >= 50"),
    entity("program.after", "after", "source-file", "refactored program"),
    entity("function.qualifies.after", "after", "function", "qualifiesForFreeShipping"),
    entity("rule.qualifies.after", "after", "expression", "total >= 50"),
    entity("function.shipping-cost.after", "after", "function", "shippingCost"),
    entity("call.shipping-cost.after", "after", "call-site", "qualifiesForFreeShipping(total)"),
    entity("function.shipping-message.after", "after", "function", "shippingMessage"),
    entity("call.shipping-message.after", "after", "call-site", "qualifiesForFreeShipping(total)")
  ]),
  stages: Object.freeze([
    stage(
      "stage.orient",
      "orient",
      0,
      "The checkout price and customer message each ask the same question.",
      ["program.before"]
    ),
    stage(
      "stage.compare-duplicates",
      "compare-duplicates",
      0.16,
      "These two expressions are one rule written in two places.",
      ["rule.shipping-cost.before", "rule.shipping-message.before"]
    ),
    stage(
      "stage.introduce-helper",
      "introduce-helper",
      0.34,
      "Give the rule a name before changing either caller.",
      ["function.qualifies.after"]
    ),
    stage(
      "stage.move-shared-rule",
      "move-shared-rule",
      0.5,
      "Move the threshold decision into the helper once.",
      ["rule.shipping-cost.before", "rule.shipping-message.before", "rule.qualifies.after"]
    ),
    stage(
      "stage.replace-cost-call",
      "replace-call-site",
      0.68,
      "The price calculation now asks the named rule.",
      ["call.shipping-cost.after"]
    ),
    stage(
      "stage.replace-message-call",
      "replace-call-site",
      0.84,
      "The customer message now asks the same named rule as the price calculation.",
      ["call.shipping-message.after"]
    ),
    stage(
      "stage.verify-parity",
      "verify-parity",
      1,
      "The code has one source of truth and still behaves the same at every boundary case.",
      ["program.after"]
    )
  ]),
  behaviorCases: Object.freeze([
    behaviorCase("below-threshold", 49, false, 5, "Shipping: $5"),
    behaviorCase("at-threshold", 50, true, 0, "Free shipping"),
    behaviorCase("above-threshold", 75, true, 0, "Free shipping")
  ]),
  visualAcceptance: Object.freeze([
    "The exact before source remains fully legible and geometrically stable while duplication is introduced.",
    "Both threshold expressions can be focused together as one semantic idea without inferring identity from glyph equality.",
    "The helper declaration and its threshold rule settle before either caller is replaced.",
    "The price call site settles before the message call site begins changing.",
    "Operators and punctuation travel with the expressions they structurally own.",
    "No token teleports, overlaps another token, or jerks when a stage endpoint settles.",
    "Direct seek and rewind reproduce the same semantic state as forward playback.",
    "The exact after source is the sole native, selectable, accessible owner at completion.",
    "Wide and narrow views preserve readable source without changing the graph of semantic identities."
  ]),
  authority: Object.freeze({
    syntax: "build-time-typescript-compiler",
    sequencing: "authored-pedagogical-score",
    playback: "shared-animation-clock",
    prohibited: Object.freeze([
      "arbitrary-source-execution",
      "browser-typescript-compiler",
      "compiler-traversal-as-pedagogical-order",
      "glyph-equality-as-identity",
      "geometry-as-semantic-authority",
      "second-clock-or-scheduler"
    ])
  })
} as const satisfies KpTypeScriptFreeShippingRefactorContractV1);

function entity(
  id: string,
  revision: KpTypeScriptRefactorEntityContract["revision"],
  kind: KpTypeScriptRefactorEntityContract["kind"],
  label: string
): KpTypeScriptRefactorEntityContract {
  return Object.freeze({ id, revision, kind, label });
}

function stage(
  id: string,
  operation: KpTypeScriptRefactorStageContract["operation"],
  progress: number,
  narration: string,
  focusEntityIds: readonly string[]
): KpTypeScriptRefactorStageContract {
  return Object.freeze({
    id,
    operation,
    progress,
    narration,
    focusEntityIds: Object.freeze([...focusEntityIds])
  });
}

function behaviorCase(
  id: string,
  total: number,
  freeShipping: boolean,
  shippingCost: number,
  shippingMessage: string
): KpTypeScriptFreeShippingRefactorContractV1["behaviorCases"][number] {
  return Object.freeze({
    id,
    total,
    freeShipping,
    shippingCost,
    shippingMessage
  });
}
