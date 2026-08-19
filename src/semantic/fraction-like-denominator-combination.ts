import {
  addKpRationals,
  createKpRational,
  equalKpRationals,
  subtractKpRationals,
  type KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import type {
  KpExactFractionForm,
  KpExactFractionTermDraft
} from "./exact-fraction-expression.ts";

declare const kpVerifiedLikeDenominatorCombinationBrand: unique symbol;

const verifiedCombinations = new WeakSet<object>();

export const KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY =
  "operation.equation.like-denominator-combination.v1" as const;

export interface KpLikeDenominatorCombinationDraft {
  readonly schemaVersion: "kp.like-denominator-combination.v1";
  readonly id: string;
  readonly operationAuthority:
    typeof KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY;
  readonly lawAuthority: Readonly<{
    readonly id: "law.fraction.combine-like-denominators";
    readonly authorityRefId: string;
    readonly level: "strict";
  }>;
  readonly operator: "+" | "-";
  readonly source: Readonly<{
    readonly stateId: string;
    readonly expressionEntityId: string;
    readonly operatorEntityId: string;
    readonly terms: readonly [
      KpExactFractionTermDraft,
      KpExactFractionTermDraft
    ];
  }>;
  readonly target: Readonly<{
    readonly stateId: string;
    readonly expressionEntityId: string;
    readonly term: KpExactFractionTermDraft;
  }>;
}

export interface KpVerifiedLikeDenominatorCombination
extends KpLikeDenominatorCombinationDraft {
  readonly lawId: "law.fraction.combine-like-denominators";
  readonly sourceForms: readonly [KpExactFractionForm, KpExactFractionForm];
  readonly targetForm: KpExactFractionForm;
  readonly exactValue: KpNormalizedRational;
  readonly correspondence: readonly KpLikeDenominatorCorrespondence[];
  readonly [kpVerifiedLikeDenominatorCombinationBrand]: true;
}

export interface KpLikeDenominatorCorrespondence {
  readonly id: string;
  readonly relation: "derivation" | "coalescence";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly summary: string;
}

export class KpLikeDenominatorCombinationError extends Error {
  override readonly name = "KpLikeDenominatorCombinationError";
  readonly code:
    | "like-denominator.unsupported-contract"
    | "like-denominator.invalid-denominator"
    | "like-denominator.denominator-mismatch"
    | "like-denominator.result-mismatch"
    | "like-denominator.value-mismatch"
    | "like-denominator.invalid-id"
    | "like-denominator.state-alias"
    | "like-denominator.entity-alias"
    | "like-denominator.unexpected-field";

  constructor(code: KpLikeDenominatorCombinationError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Certifies only the raw like-denominator operation. Reduction is deliberately
 * excluded so authors cannot hide a second semantic adjacency in this step.
 */
export function verifyKpLikeDenominatorCombination(
  draft: KpLikeDenominatorCombinationDraft
): KpVerifiedLikeDenominatorCombination {
  validateDraftShape(draft);
  if (
    draft.schemaVersion !== "kp.like-denominator-combination.v1" ||
    draft.operationAuthority !==
      KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY ||
    draft.lawAuthority.id !== "law.fraction.combine-like-denominators" ||
    draft.lawAuthority.level !== "strict" ||
    (draft.operator !== "+" && draft.operator !== "-")
  ) {
    fail(
      "like-denominator.unsupported-contract",
      "Unsupported like-denominator schema, operation, law, or operator."
    );
  }

  const sourceForms = draft.source.terms.map(termForm) as unknown as readonly [
    KpExactFractionForm,
    KpExactFractionForm
  ];
  const targetForm = termForm(draft.target.term);
  const [left, right] = sourceForms;
  if (left.denominator !== right.denominator) {
    fail(
      "like-denominator.denominator-mismatch",
      "Like-denominator combination requires equal source denominators."
    );
  }

  const expectedNumerator = draft.operator === "+"
    ? left.numerator + right.numerator
    : left.numerator - right.numerator;
  if (
    targetForm.numerator !== expectedNumerator ||
    targetForm.denominator !== left.denominator
  ) {
    fail(
      "like-denominator.result-mismatch",
      "The raw target must combine numerators and preserve the denominator."
    );
  }

  const exactValue = draft.operator === "+"
    ? addKpRationals(left.value, right.value)
    : subtractKpRationals(left.value, right.value);
  if (!equalKpRationals(exactValue, targetForm.value)) {
    fail(
      "like-denominator.value-mismatch",
      "Like-denominator combination must preserve exact expression value."
    );
  }

  const verified = deepFreeze({
    ...draft,
    lawId: draft.lawAuthority.id,
    sourceForms,
    targetForm,
    exactValue,
    correspondence: createCorrespondence(draft)
  }) as KpVerifiedLikeDenominatorCombination;
  verifiedCombinations.add(verified);
  return verified;
}

export function isKpVerifiedLikeDenominatorCombination(
  value: unknown
): value is KpVerifiedLikeDenominatorCombination {
  return typeof value === "object" && value !== null &&
    verifiedCombinations.has(value);
}

export const kpCanonicalLikeDenominatorCombinationDraft = deepFreeze({
  schemaVersion: "kp.like-denominator-combination.v1",
  id: "transformation.fraction.like-denominator.two-sixths-plus-one-sixth",
  operationAuthority: KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY,
  lawAuthority: {
    id: "law.fraction.combine-like-denominators",
    authorityRefId: "proof.exact-fraction.like-denominator-combination",
    level: "strict"
  },
  operator: "+",
  source: sourceState([[2n, 6n], [1n, 6n]]),
  target: {
    stateId: "state.fraction.like-denominator.target",
    expressionEntityId: "entity.fraction.like-denominator.target.expression",
    term: fractionTerm("target", "result", 3n, 6n)
  }
} satisfies KpLikeDenominatorCombinationDraft);

export const kpCanonicalLikeDenominatorCombination =
  verifyKpLikeDenominatorCombination(
    kpCanonicalLikeDenominatorCombinationDraft
  );

function validateDraftShape(draft: KpLikeDenominatorCombinationDraft): void {
  exactKeys(draft, [
    "schemaVersion",
    "id",
    "operationAuthority",
    "lawAuthority",
    "operator",
    "source",
    "target"
  ], "combination");
  exactKeys(draft.lawAuthority, ["id", "authorityRefId", "level"],
    "lawAuthority");
  exactKeys(draft.source, [
    "stateId",
    "expressionEntityId",
    "operatorEntityId",
    "terms"
  ], "source");
  exactKeys(draft.target, ["stateId", "expressionEntityId", "term"],
    "target");
  if (!Array.isArray(draft.source.terms) || draft.source.terms.length !== 2) {
    fail(
      "like-denominator.unexpected-field",
      "Bounded combination requires exactly two ordered source fractions."
    );
  }
  [draft.source.terms[0], draft.source.terms[1], draft.target.term]
    .forEach((term, index) => validateTerm(term, `term[${index}]`));
  requireIds([
    draft.id,
    draft.lawAuthority.authorityRefId,
    draft.source.stateId,
    draft.source.expressionEntityId,
    draft.source.operatorEntityId,
    draft.target.stateId,
    draft.target.expressionEntityId
  ]);
  if (draft.source.stateId === draft.target.stateId) {
    fail(
      "like-denominator.state-alias",
      "Source and target combination states require distinct identities."
    );
  }
  const entityIds = [
    draft.source.expressionEntityId,
    draft.source.operatorEntityId,
    draft.target.expressionEntityId,
    ...draft.source.terms.flatMap(termEntityIds),
    ...termEntityIds(draft.target.term)
  ];
  if (new Set(entityIds).size !== entityIds.length) {
    fail(
      "like-denominator.entity-alias",
      "Every rendered occurrence requires one state-local entity ID."
    );
  }
}

function validateTerm(term: KpExactFractionTermDraft, path: string): void {
  exactKeys(term, [
    "termEntityId",
    "fractionEntityId",
    "divisionEntityId",
    "numerator",
    "denominator"
  ], path);
  requireIds([term.termEntityId, term.fractionEntityId, term.divisionEntityId]);
  [term.numerator, term.denominator].forEach((occurrence) => {
    exactKeys(occurrence, ["entityId", "semanticId", "value"],
      `${path}.occurrence`);
    requireIds([occurrence.entityId, occurrence.semanticId]);
    if (typeof occurrence.value !== "bigint") {
      fail(
        "like-denominator.unexpected-field",
        "Exact fraction occurrences require bigint values."
      );
    }
  });
}

function termForm(term: KpExactFractionTermDraft): KpExactFractionForm {
  if (term.denominator.value <= 0n) {
    fail(
      "like-denominator.invalid-denominator",
      "Exact fraction forms require positive denominators."
    );
  }
  return Object.freeze({
    numerator: term.numerator.value,
    denominator: term.denominator.value,
    value: createKpRational(term.numerator.value, term.denominator.value)
  });
}

function sourceState(
  values: readonly [readonly [bigint, bigint], readonly [bigint, bigint]]
) {
  return {
    stateId: "state.fraction.like-denominator.source",
    expressionEntityId: "entity.fraction.like-denominator.source.expression",
    operatorEntityId: "entity.fraction.like-denominator.source.plus",
    terms: values.map(([numerator, denominator], index) =>
      fractionTerm(
        "source",
        index === 0 ? "first" : "second",
        numerator,
        denominator
      )
    ) as unknown as KpLikeDenominatorCombinationDraft["source"]["terms"]
  };
}

function createCorrespondence(
  draft: KpLikeDenominatorCombinationDraft
): readonly KpLikeDenominatorCorrespondence[] {
  const [left, right] = draft.source.terms;
  const target = draft.target.term;
  return [
    correspondence(
      "correspondence.like-denominator.expression",
      "derivation",
      [draft.source.expressionEntityId],
      [draft.target.expressionEntityId],
      "The source expression derives the exact combined fraction."
    ),
    correspondence(
      "correspondence.like-denominator.term",
      "derivation",
      [left.termEntityId, right.termEntityId],
      [target.termEntityId],
      "Both source addends contribute to the combined term."
    ),
    correspondence(
      "correspondence.like-denominator.fraction",
      "derivation",
      [
        left.fractionEntityId,
        draft.source.operatorEntityId,
        right.fractionEntityId
      ],
      [target.fractionEntityId],
      "The two fractions and their operation derive one result fraction."
    ),
    correspondence(
      "correspondence.like-denominator.division",
      "coalescence",
      [left.divisionEntityId, right.divisionEntityId],
      [target.divisionEntityId],
      "Two equivalent division structures coalesce into one fraction bar."
    ),
    correspondence(
      "correspondence.like-denominator.numerator",
      "derivation",
      [
        left.numerator.entityId,
        draft.source.operatorEntityId,
        right.numerator.entityId
      ],
      [target.numerator.entityId],
      "Both numerators and the source operator derive the raw numerator."
    ),
    correspondence(
      "correspondence.like-denominator.denominator",
      "coalescence",
      [left.denominator.entityId, right.denominator.entityId],
      [target.denominator.entityId],
      "The shared denominator persists while two occurrences coalesce."
    )
  ];
}

function correspondence(
  id: string,
  relation: KpLikeDenominatorCorrespondence["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  summary: string
): KpLikeDenominatorCorrespondence {
  return { id, relation, sourceEntityIds, targetEntityIds, summary };
}

function fractionTerm(
  stage: "source" | "target",
  position: "first" | "second" | "result",
  numerator: bigint,
  denominator: bigint
): KpExactFractionTermDraft {
  const prefix = `entity.fraction.like-denominator.${stage}.${position}`;
  return {
    termEntityId: `${prefix}.term`,
    fractionEntityId: `${prefix}.fraction`,
    divisionEntityId: `${prefix}.division`,
    numerator: {
      entityId: `${prefix}.numerator`,
      semanticId: `semantic.fraction.like-denominator.${position}.numerator`,
      value: numerator
    },
    denominator: {
      entityId: `${prefix}.denominator`,
      semanticId: "semantic.fraction.like-denominator.shared-denominator",
      value: denominator
    }
  };
}

function termEntityIds(term: KpExactFractionTermDraft): string[] {
  return [
    term.termEntityId,
    term.fractionEntityId,
    term.divisionEntityId,
    term.numerator.entityId,
    term.denominator.entityId
  ];
}

function exactKeys(
  value: object,
  expected: readonly string[],
  path: string
): void {
  const actual = Object.keys(value);
  const missing = expected.filter((key) => !actual.includes(key));
  const unexpected = actual.filter((key) => !expected.includes(key));
  if (missing.length > 0 || unexpected.length > 0) {
    fail(
      "like-denominator.unexpected-field",
      `${path} fields differ: missing=${missing.join(",")}; ` +
        `unexpected=${unexpected.join(",")}.`
    );
  }
}

function requireIds(ids: readonly string[]): void {
  ids.forEach((id) => {
    if (!/^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u.test(id)) {
      fail(
        "like-denominator.invalid-id",
        `${id || "<blank>"} is not a protocol ID.`
      );
    }
  });
}

function fail(
  code: KpLikeDenominatorCombinationError["code"],
  message: string
): never {
  throw new KpLikeDenominatorCombinationError(code, message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
