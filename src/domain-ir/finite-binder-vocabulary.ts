export const KP_FINITE_BINDER_VOCABULARY_AUTHORITY =
  "vocabulary.equation.finite-binder-expansion.v1" as const;

declare const kpFiniteBinderSemanticIdBrand: unique symbol;

export type KpFiniteBinderSemanticId = string & {
  readonly [kpFiniteBinderSemanticIdBrand]: "finite-binder-semantic-id";
};

export type KpFiniteBinderOperatorKind = "sum" | "product";

export interface KpFiniteBinderOperatorOccurrence {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "operator";
  readonly operator: KpFiniteBinderOperatorKind;
}

export interface KpFiniteBinderDeclarationOccurrence {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "binder-declaration";
  readonly symbol: string;
}

export interface KpFiniteBinderBoundOccurrence {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "lower-bound" | "upper-bound";
  readonly value: number;
}

export interface KpFiniteBinderReferenceOccurrence {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "bound-reference";
  readonly symbol: string;
  readonly bindsTo: KpFiniteBinderSemanticId;
}

export interface KpFiniteBinderBodyTemplate {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "body-template";
  readonly sourceLatex: string;
  readonly freeSymbols: readonly string[];
  readonly references: readonly KpFiniteBinderReferenceOccurrence[];
}

export interface KpFiniteBinderSource {
  readonly schemaVersion: "kp.finite-binder-source.v1";
  readonly kind: "finite-binder-source";
  readonly authority: typeof KP_FINITE_BINDER_VOCABULARY_AUTHORITY;
  readonly id: KpFiniteBinderSemanticId;
  readonly operator: KpFiniteBinderOperatorOccurrence;
  readonly binder: KpFiniteBinderDeclarationOccurrence;
  readonly lowerBound: KpFiniteBinderBoundOccurrence & {
    readonly role: "lower-bound";
  };
  readonly upperBound: KpFiniteBinderBoundOccurrence & {
    readonly role: "upper-bound";
  };
  readonly body: KpFiniteBinderBodyTemplate;
}

export interface KpFiniteBinderInstantiatedReference {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "instantiated-reference";
  readonly value: number;
  readonly derivedFrom: KpFiniteBinderSemanticId;
  readonly boundBy: KpFiniteBinderSemanticId;
}

export interface KpFiniteBinderBodyInstance {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "body-instance";
  readonly ordinal: number;
  readonly indexValue: number;
  readonly derivedFrom: KpFiniteBinderSemanticId;
  readonly references: readonly KpFiniteBinderInstantiatedReference[];
}

export function createKpFiniteBinderSemanticId<const Value extends string>(
  value: Value
): KpFiniteBinderSemanticId & Value {
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/u.test(value)) {
    throw new Error(
      `Invalid finite-binder semantic id ${JSON.stringify(value)}.`
    );
  }
  return value as KpFiniteBinderSemanticId & Value;
}

/**
 * This validator owns semantic occurrence identity only. Range legality,
 * endpoint parsing, expansion, and paint remain separate authorities so a
 * source template can never be mistaken for several persisted target glyphs.
 */
export function defineKpFiniteBinderSource(
  value: KpFiniteBinderSource
): KpFiniteBinderSource {
  const occurrences = [
    value.id,
    value.operator.id,
    value.binder.id,
    value.lowerBound.id,
    value.upperBound.id,
    value.body.id,
    ...value.body.references.map(({ id }) => id)
  ];
  if (new Set(occurrences).size !== occurrences.length) {
    throw new Error("Finite-binder source occurrence ids must be unique.");
  }
  if (!Number.isInteger(value.lowerBound.value) ||
      !Number.isInteger(value.upperBound.value)) {
    throw new Error("Finite-binder limits must be explicit integers.");
  }
  if (value.binder.symbol.trim().length === 0) {
    throw new Error("Finite-binder declaration requires a symbol.");
  }
  if (value.body.sourceLatex.trim().length === 0) {
    throw new Error("Finite-binder body template requires source LaTeX.");
  }
  if (value.body.freeSymbols.some((symbol) => symbol.trim().length === 0) ||
      new Set(value.body.freeSymbols).size !== value.body.freeSymbols.length) {
    throw new Error("Finite-binder body free symbols must be nonempty and unique.");
  }
  if (value.body.references.length === 0) {
    throw new Error("Finite-binder body must reference its declared binder.");
  }
  for (const reference of value.body.references) {
    if (reference.bindsTo !== value.binder.id ||
        reference.symbol !== value.binder.symbol) {
      throw new Error(
        `Finite-binder reference ${reference.id} is not owned by declaration ${value.binder.id}.`
      );
    }
  }
  return deepFreeze({
    ...value,
    operator: { ...value.operator },
    binder: { ...value.binder },
    lowerBound: { ...value.lowerBound },
    upperBound: { ...value.upperBound },
    body: {
      ...value.body,
      freeSymbols: [...value.body.freeSymbols],
      references: value.body.references.map((reference) => ({ ...reference }))
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
