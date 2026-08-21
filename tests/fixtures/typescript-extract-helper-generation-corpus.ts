import type {
  KpCodeRefactorGenerationDiagnosticCode
} from "../../src/domain-ir/code-refactor-generation-diagnostic.ts";

export interface KpTypeScriptExtractHelperCorpusCase {
  readonly id: string;
  readonly category:
    | "renames"
    | "threshold-variant"
    | "explicit-types"
    | "nested-expression"
    | "parse-failure"
    | "unequal-predicates"
    | "unsafe-capture";
  readonly before: string;
  readonly after: string;
  readonly expected: Readonly<
    | { status: "accepted" }
    | {
        status: "repair-required";
        code: KpCodeRefactorGenerationDiagnosticCode;
      }
  >;
}

export const kpTypeScriptExtractHelperGenerationCorpus = Object.freeze([
  accepted("renamed-loyalty-rule", "renames",
    `function rebate(points: number) { return points >= 120 ? 8 : 0; }\nfunction badge(points: number) { return points >= 120 ? "gold" : "blue"; }`,
    `function earnsGold(points: number) { return points >= 120; }\nfunction rebate(points: number) { return earnsGold(points) ? 8 : 0; }\nfunction badge(points: number) { return earnsGold(points) ? "gold" : "blue"; }`
  ),
  accepted("changed-threshold", "threshold-variant",
    `function fee(total: number) { return total > 275 ? 0 : 9; }\nfunction note(total: number) { return total > 275 ? "free" : "paid"; }`,
    `function isFree(total: number) { return total > 275; }\nfunction fee(total: number) { return isFree(total) ? 0 : 9; }\nfunction note(total: number) { return isFree(total) ? "free" : "paid"; }`
  ),
  accepted("explicit-return-types", "explicit-types",
    `export function fee(total: number): number { return total >= 80 ? 0 : 4; }\nexport function note(total: number): string { return total >= 80 ? "free" : "paid"; }`,
    `function qualifies(total: number): boolean { return total >= 80; }\nexport function fee(total: number): number { return qualifies(total) ? 0 : 4; }\nexport function note(total: number): string { return qualifies(total) ? "free" : "paid"; }`
  ),
  accepted("compound-decision", "nested-expression",
    `function fee(total: number, active: boolean) { return total >= 50 && active ? 0 : 5; }\nfunction note(total: number, active: boolean) { return total >= 50 && active ? "free" : "paid"; }`,
    `function qualifies(total: number, active: boolean) { return total >= 50 && active; }\nfunction fee(total: number, active: boolean) { return qualifies(total, active) ? 0 : 5; }\nfunction note(total: number, active: boolean) { return qualifies(total, active) ? "free" : "paid"; }`
  ),
  rejected("malformed-before", "parse-failure",
    `function fee(total: number) { return total >= ? 0 : 5; }\nfunction note(total: number) { return total >= 50 ? "free" : "paid"; }`,
    `function qualifies(total: number) { return total >= 50; }\nfunction fee(total: number) { return qualifies(total) ? 0 : 5; }\nfunction note(total: number) { return qualifies(total) ? "free" : "paid"; }`,
    "code-refactor.parse-rejected"
  ),
  rejected("unequal-decisions", "unequal-predicates",
    `function fee(total: number) { return total >= 50 ? 0 : 5; }\nfunction note(total: number) { return total > 50 ? "free" : "paid"; }`,
    `function qualifies(total: number) { return total >= 50; }\nfunction fee(total: number) { return qualifies(total) ? 0 : 5; }\nfunction note(total: number) { return qualifies(total) ? "free" : "paid"; }`,
    "code-refactor.non-equivalent-duplicates"
  ),
  rejected("wrong-call-binding", "unsafe-capture",
    `function fee(total: number) { return total >= 50 ? 0 : 5; }\nfunction note(total: number) { return total >= 50 ? "free" : "paid"; }`,
    `function qualifies(total: number) { return total >= 50; }\nfunction fee(total: number, other: number) { return qualifies(other) ? 0 : 5; }\nfunction note(total: number, other: number) { return qualifies(other) ? "free" : "paid"; }`,
    "code-refactor.unsafe-capture"
  )
] as const satisfies readonly KpTypeScriptExtractHelperCorpusCase[]);

function accepted(
  id: string,
  category: KpTypeScriptExtractHelperCorpusCase["category"],
  before: string,
  after: string
): KpTypeScriptExtractHelperCorpusCase {
  return Object.freeze({ id, category, before, after, expected: {
    status: "accepted" as const
  } });
}

function rejected(
  id: string,
  category: KpTypeScriptExtractHelperCorpusCase["category"],
  before: string,
  after: string,
  code: KpCodeRefactorGenerationDiagnosticCode
): KpTypeScriptExtractHelperCorpusCase {
  return Object.freeze({ id, category, before, after, expected: {
    status: "repair-required" as const,
    code
  } });
}
