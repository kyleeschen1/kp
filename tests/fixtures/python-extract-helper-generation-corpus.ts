import type {
  KpCodeRefactorGenerationDiagnosticCode
} from "../../src/domain-ir/code-refactor-generation-diagnostic.ts";
export { KP_PYTHON_EXTRACT_HELPER_CORPUS_AUTHORITY } from
  "../../src/domain-ir/code-extract-helper-authorities.ts";

export interface KpPythonExtractHelperCorpusCase {
  readonly id: string;
  readonly category:
    | "renames"
    | "threshold-variant"
    | "annotations"
    | "indentation"
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

export const kpPythonExtractHelperGenerationCorpus = Object.freeze([
  accepted("renamed-loyalty-rule", "renames",
    `def rebate(points: int) -> int:\n    return 8 if points >= 120 else 0\n\ndef badge(points: int) -> str:\n    return "gold" if points >= 120 else "blue"`,
    `def earns_gold(points: int) -> bool:\n    return points >= 120\n\ndef rebate(points: int) -> int:\n    return 8 if earns_gold(points) else 0\n\ndef badge(points: int) -> str:\n    return "gold" if earns_gold(points) else "blue"`
  ),
  accepted("changed-threshold", "threshold-variant",
    `def fee(total: float) -> int:\n    return 0 if total > 275 else 9\n\ndef note(total: float) -> str:\n    return "free" if total > 275 else "paid"`,
    `def is_free(total: float) -> bool:\n    return total > 275\n\ndef fee(total: float) -> int:\n    return 0 if is_free(total) else 9\n\ndef note(total: float) -> str:\n    return "free" if is_free(total) else "paid"`
  ),
  accepted("qualified-annotations", "annotations",
    `def fee(total: "Money") -> int:\n    return 0 if total >= 80 else 4\n\ndef note(total: "Money") -> str:\n    return "free" if total >= 80 else "paid"`,
    `def qualifies(total: "Money") -> bool:\n    return total >= 80\n\ndef fee(total: "Money") -> int:\n    return 0 if qualifies(total) else 4\n\ndef note(total: "Money") -> str:\n    return "free" if qualifies(total) else "paid"`
  ),
  accepted("two-space-indentation", "indentation",
    `def fee(total: int) -> int:\n  return 0 if total >= 60 else 6\n\ndef note(total: int) -> str:\n  return "free" if total >= 60 else "paid"`,
    `def qualifies(total: int) -> bool:\n  return total >= 60\n\ndef fee(total: int) -> int:\n  return 0 if qualifies(total) else 6\n\ndef note(total: int) -> str:\n  return "free" if qualifies(total) else "paid"`
  ),
  accepted("compound-decision", "nested-expression",
    `def fee(total: int, active: bool) -> int:\n    return 0 if total >= 50 and active else 5\n\ndef note(total: int, active: bool) -> str:\n    return "free" if total >= 50 and active else "paid"`,
    `def qualifies(total: int, active: bool) -> bool:\n    return total >= 50 and active\n\ndef fee(total: int, active: bool) -> int:\n    return 0 if qualifies(total, active) else 5\n\ndef note(total: int, active: bool) -> str:\n    return "free" if qualifies(total, active) else "paid"`
  ),
  rejected("malformed-before", "parse-failure",
    `def fee(total: int) -> int:\n    return 0 if total >= else 5\n\ndef note(total: int) -> str:\n    return "free" if total >= 50 else "paid"`,
    `def qualifies(total: int) -> bool:\n    return total >= 50\n\ndef fee(total: int) -> int:\n    return 0 if qualifies(total) else 5\n\ndef note(total: int) -> str:\n    return "free" if qualifies(total) else "paid"`,
    "code-refactor.parse-rejected"
  ),
  rejected("unequal-decisions", "unequal-predicates",
    `def fee(total: int) -> int:\n    return 0 if total >= 50 else 5\n\ndef note(total: int) -> str:\n    return "free" if total > 50 else "paid"`,
    `def qualifies(total: int) -> bool:\n    return total >= 50\n\ndef fee(total: int) -> int:\n    return 0 if qualifies(total) else 5\n\ndef note(total: int) -> str:\n    return "free" if qualifies(total) else "paid"`,
    "code-refactor.non-equivalent-duplicates"
  ),
  rejected("wrong-call-binding", "unsafe-capture",
    `def fee(total: int) -> int:\n    return 0 if total >= 50 else 5\n\ndef note(total: int) -> str:\n    return "free" if total >= 50 else "paid"`,
    `def qualifies(total: int) -> bool:\n    return total >= 50\n\ndef fee(total: int, other: int) -> int:\n    return 0 if qualifies(other) else 5\n\ndef note(total: int, other: int) -> str:\n    return "free" if qualifies(other) else "paid"`,
    "code-refactor.unsafe-capture"
  )
] as const satisfies readonly KpPythonExtractHelperCorpusCase[]);

function accepted(
  id: string,
  category: KpPythonExtractHelperCorpusCase["category"],
  before: string,
  after: string
): KpPythonExtractHelperCorpusCase {
  return Object.freeze({ id, category, before, after, expected: {
    status: "accepted" as const
  } });
}

function rejected(
  id: string,
  category: KpPythonExtractHelperCorpusCase["category"],
  before: string,
  after: string,
  code: KpCodeRefactorGenerationDiagnosticCode
): KpPythonExtractHelperCorpusCase {
  return Object.freeze({ id, category, before, after, expected: {
    status: "repair-required" as const,
    code
  } });
}
