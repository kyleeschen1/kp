export type KpEqualityMode = "exact" | "approximate";

export interface KpEquality<Value> {
  readonly kind: "equality";
  readonly id: string;
  readonly mode: KpEqualityMode;
  readonly equals: (left: Value, right: Value) => boolean;
}

export type KpLawEvidence =
  | Readonly<{
      kind: "proved";
      authorityId: string;
    }>
  | Readonly<{
      kind: "tested";
      suiteId: string;
      equalityId: string;
    }>
  | Readonly<{
      kind: "assumed";
      assumptionId: string;
      rationale: string;
    }>;

export interface KpLawClaim<Name extends string = string> {
  readonly kind: "law-claim";
  readonly name: Name;
  readonly carrierId: string;
  readonly operationIds: readonly string[];
  readonly equalityId: string;
  readonly evidence: KpLawEvidence;
}

export function createKpEquality<Value>(input: {
  readonly id: string;
  readonly mode: KpEqualityMode;
  readonly equals: (left: Value, right: Value) => boolean;
}): KpEquality<Value> {
  requireText(input.id, "Equality id");
  return Object.freeze({
    kind: "equality" as const,
    id: input.id,
    mode: input.mode,
    equals: input.equals
  });
}

export function createKpLawEvidence(
  evidence: KpLawEvidence
): KpLawEvidence {
  switch (evidence.kind) {
    case "proved":
      requireText(evidence.authorityId, "Law proof authority id");
      break;
    case "tested":
      requireText(evidence.suiteId, "Law test suite id");
      requireText(evidence.equalityId, "Law test equality id");
      break;
    case "assumed":
      requireText(evidence.assumptionId, "Law assumption id");
      requireText(evidence.rationale, "Law assumption rationale");
      break;
  }
  return Object.freeze({ ...evidence });
}

export function createKpLawClaim<const Name extends string>(input: {
  readonly name: Name;
  readonly carrierId: string;
  readonly operationIds: readonly string[];
  readonly equalityId: string;
  readonly evidence: KpLawEvidence;
}): KpLawClaim<Name> {
  requireText(input.name, "Law name");
  requireText(input.carrierId, `Law ${input.name} carrier id`);
  requireText(input.equalityId, `Law ${input.name} equality id`);
  if (input.operationIds.length === 0) {
    throw new Error(`Law ${input.name} requires at least one operation id.`);
  }
  input.operationIds.forEach((id) => requireText(
    id,
    `Law ${input.name} operation id`
  ));
  if (new Set(input.operationIds).size !== input.operationIds.length) {
    throw new Error(`Law ${input.name} repeats an operation id.`);
  }
  const evidence = createKpLawEvidence(input.evidence);
  if (evidence.kind === "tested" && evidence.equalityId !== input.equalityId) {
    throw new Error(
      `Law ${input.name} test evidence must use equality ${input.equalityId}.`
    );
  }
  return Object.freeze({
    kind: "law-claim" as const,
    name: input.name,
    carrierId: input.carrierId,
    operationIds: Object.freeze([...input.operationIds]),
    equalityId: input.equalityId,
    evidence
  });
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
