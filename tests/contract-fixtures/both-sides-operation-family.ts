import type {
  KpBothSidesOperationDraft,
  KpDivideBothSidesOperationDraft,
  KpVerifiedBothSidesOperation
} from "../../src/semantic/both-sides-operation-family.ts";

declare const validDraft: KpBothSidesOperationDraft;
declare const divisionBase: Omit<
  KpDivideBothSidesOperationDraft,
  "operation" | "lawAuthority" | "domainEvidence"
>;

// @ts-expect-error Only the semantic verifier can mint operation authority.
const fabricated: KpVerifiedBothSidesOperation = validDraft;

const wrongDivisionLaw: KpDivideBothSidesOperationDraft = {
  ...divisionBase,
  operation: { kind: "divide", operandSemanticId: "semantic.value.two" },
  lawAuthority: {
    // @ts-expect-error Division cannot claim multiplication's law authority.
    id: "law.equation.multiply-both-sides",
    authorityRefId: "authority.multiply",
    level: "strict"
  },
  domainEvidence: {
    kind: "nonzero-operand",
    operandSemanticId: "semantic.value.two",
    evidenceId: "evidence.two.nonzero"
  }
};

const unsafeDivision: KpDivideBothSidesOperationDraft = {
  ...divisionBase,
  operation: { kind: "divide", operandSemanticId: "semantic.value.two" },
  lawAuthority: {
    id: "law.equation.divide-both-sides",
    authorityRefId: "authority.divide",
    level: "strict"
  },
  domainEvidence: {
    // @ts-expect-error Division requires nonzero-operand evidence.
    kind: "declared-relation-domain",
    evidenceIds: ["evidence.real-equality"]
  }
};

const executableDraft: KpBothSidesOperationDraft = {
  ...validDraft,
  // @ts-expect-error Semantic drafts cannot contain executable callbacks.
  execute: () => undefined
};

const presentationDraft: KpBothSidesOperationDraft = {
  ...validDraft,
  // @ts-expect-error Timing is derived by presentation, never semantic input.
  durationMs: 500
};

void [
  fabricated,
  wrongDivisionLaw,
  unsafeDivision,
  executableDraft,
  presentationDraft
];
