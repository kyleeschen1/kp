export interface KpPythonRefactorStageContract {
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

export interface KpPythonRefactorEntityContract {
  readonly id: string;
  readonly revision: "before" | "after";
  readonly kind: "source-file" | "function" | "expression" | "call-site";
  readonly label: string;
  readonly ownerEntityId?: string | undefined;
  readonly declarationEntityId?: string | undefined;
}

export interface KpPythonFreeShippingRefactorContractV1 {
  readonly schemaVersion: "kp.python-free-shipping-refactor.v1";
  readonly id: "python-refactor.free-shipping-threshold";
  readonly language: "python";
  readonly title: "One free-shipping rule";
  readonly learningClaim: string;
  readonly noviceMotivation: string;
  readonly threshold: 50;
  readonly paidShippingCost: 5;
  readonly before: {
    readonly revisionId: "free-shipping.before.v1";
    readonly path: "shipping-before.py";
    readonly source: string;
  };
  readonly after: {
    readonly revisionId: "free-shipping.after.v1";
    readonly path: "shipping-after.py";
    readonly source: string;
  };
  readonly entities: readonly KpPythonRefactorEntityContract[];
  readonly stages: readonly KpPythonRefactorStageContract[];
  readonly behaviorCases: readonly {
    readonly id: string;
    readonly total: number;
    readonly freeShipping: boolean;
    readonly shippingCost: number;
    readonly shippingMessage: string;
  }[];
  readonly visualAcceptance: readonly string[];
  readonly authority: {
    readonly syntax: "build-time-python-stdlib-ast";
    readonly sequencing: "authored-pedagogical-score";
    readonly playback: "shared-animation-clock";
    readonly prohibited: readonly string[];
  };
}

const beforeSource = `def shipping_cost(total: int) -> int:
    return 0 if total >= 50 else 5


def shipping_message(total: int) -> str:
    return "Free shipping" if total >= 50 else "Shipping: $5"`;

const afterSource = `def qualifies_for_free_shipping(total: int) -> bool:
    return total >= 50


def shipping_cost(total: int) -> int:
    return 0 if qualifies_for_free_shipping(total) else 5


def shipping_message(total: int) -> str:
    return "Free shipping" if qualifies_for_free_shipping(total) else "Shipping: $5"`;

/**
 * The Python caller freezes its own source and identities before compilation.
 * Its close analogy to TypeScript is evidence for later comparison, not
 * authority to share either language's contracts before human review.
 */
export const kpPythonFreeShippingRefactorContract = Object.freeze({
  schemaVersion: "kp.python-free-shipping-refactor.v1",
  id: "python-refactor.free-shipping-threshold",
  language: "python",
  title: "One free-shipping rule",
  learningClaim:
    "When one business rule appears twice, give it one clear name so every caller uses the same decision.",
  noviceMotivation:
    "If only one copy of the $50 threshold changes, the checkout price and customer message can disagree.",
  threshold: 50,
  paidShippingCost: 5,
  before: Object.freeze({
    revisionId: "free-shipping.before.v1",
    path: "shipping-before.py",
    source: beforeSource
  }),
  after: Object.freeze({
    revisionId: "free-shipping.after.v1",
    path: "shipping-after.py",
    source: afterSource
  }),
  entities: Object.freeze([
    entity("program.before", "before", "source-file", "duplicated program"),
    entity("function.shipping-cost.before", "before", "function", "shipping_cost"),
    entity("rule.shipping-cost.before", "before", "expression", "total >= 50", {
      ownerEntityId: "function.shipping-cost.before",
      declarationEntityId: "function.shipping-cost.before"
    }),
    entity("function.shipping-message.before", "before", "function", "shipping_message"),
    entity("rule.shipping-message.before", "before", "expression", "total >= 50", {
      ownerEntityId: "function.shipping-message.before",
      declarationEntityId: "function.shipping-message.before"
    }),
    entity("program.after", "after", "source-file", "refactored program"),
    entity("function.qualifies.after", "after", "function", "qualifies_for_free_shipping"),
    entity("rule.qualifies.after", "after", "expression", "total >= 50", {
      ownerEntityId: "function.qualifies.after",
      declarationEntityId: "function.qualifies.after"
    }),
    entity("function.shipping-cost.after", "after", "function", "shipping_cost"),
    entity("call.shipping-cost.after", "after", "call-site", "qualifies_for_free_shipping(total)", {
      ownerEntityId: "function.shipping-cost.after",
      declarationEntityId: "function.qualifies.after"
    }),
    entity("function.shipping-message.after", "after", "function", "shipping_message"),
    entity("call.shipping-message.after", "after", "call-site", "qualifies_for_free_shipping(total)", {
      ownerEntityId: "function.shipping-message.after",
      declarationEntityId: "function.qualifies.after"
    })
  ]),
  stages: Object.freeze([
    stage("stage.orient", "orient", 0,
      "The checkout price and customer message each ask the same question.",
      ["program.before"]),
    stage("stage.compare-duplicates", "compare-duplicates", 0.16,
      "These two expressions are one rule written in two places.",
      ["rule.shipping-cost.before", "rule.shipping-message.before"]),
    stage("stage.introduce-helper", "introduce-helper", 0.34,
      "Give the rule a name before changing either caller.",
      ["function.qualifies.after"]),
    stage("stage.move-shared-rule", "move-shared-rule", 0.5,
      "Move the threshold decision into the helper once.",
      ["rule.shipping-cost.before", "rule.shipping-message.before", "rule.qualifies.after"]),
    stage("stage.replace-cost-call", "replace-call-site", 0.68,
      "The price calculation now asks the named rule.",
      ["call.shipping-cost.after"]),
    stage("stage.replace-message-call", "replace-call-site", 0.84,
      "The customer message now asks the same named rule as the price calculation.",
      ["call.shipping-message.after"]),
    stage("stage.verify-parity", "verify-parity", 1,
      "The code has one source of truth and still behaves the same at every boundary case.",
      ["program.after"])
  ]),
  behaviorCases: Object.freeze([
    behaviorCase("below-threshold", 49, false, 5, "Shipping: $5"),
    behaviorCase("at-threshold", 50, true, 0, "Free shipping"),
    behaviorCase("above-threshold", 75, true, 0, "Free shipping")
  ]),
  visualAcceptance: Object.freeze([
    "The exact before source remains fully legible and geometrically stable while duplication is introduced.",
    "Both threshold expressions can be focused together without inferring identity from equal text.",
    "The helper declaration and its threshold rule settle before either caller is replaced.",
    "The price call site settles before the message call site begins changing.",
    "Operators and punctuation travel with the expressions they structurally own.",
    "Python indentation remains stable and never becomes semantic motion material.",
    "Every moving token reaches its exact destination before settled source takes ownership.",
    "Direct seek and rewind reproduce the same semantic state as forward playback.",
    "The exact after source is the sole native selectable accessible owner at completion."
  ]),
  authority: Object.freeze({
    syntax: "build-time-python-stdlib-ast",
    sequencing: "authored-pedagogical-score",
    playback: "shared-animation-clock",
    prohibited: Object.freeze([
      "arbitrary-source-execution",
      "browser-python-parser",
      "ast-traversal-as-pedagogical-order",
      "glyph-equality-as-identity",
      "geometry-as-semantic-authority",
      "second-clock-or-scheduler"
    ])
  })
} as const satisfies KpPythonFreeShippingRefactorContractV1);

function entity(
  id: string,
  revision: KpPythonRefactorEntityContract["revision"],
  kind: KpPythonRefactorEntityContract["kind"],
  label: string,
  relations: Readonly<{
    ownerEntityId?: string;
    declarationEntityId?: string;
  }> = {}
): KpPythonRefactorEntityContract {
  return Object.freeze({ id, revision, kind, label, ...relations });
}

function stage(
  id: string,
  operation: KpPythonRefactorStageContract["operation"],
  progress: number,
  narration: string,
  focusEntityIds: readonly string[]
): KpPythonRefactorStageContract {
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
): KpPythonFreeShippingRefactorContractV1["behaviorCases"][number] {
  return Object.freeze({ id, total, freeShipping, shippingCost, shippingMessage });
}
