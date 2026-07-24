import type {
  KpQuadraticExactRational,
  KpQuadraticSemanticFixture
} from "./quadratic-branching-fixture.ts";

export type KpQuadraticDiscriminantClass =
  | "two-distinct-real-roots"
  | "one-repeated-real-root"
  | "no-real-roots";

export interface KpQuadraticSolutionMember {
  readonly id: string;
  readonly value: KpQuadraticExactRational;
  readonly multiplicity: number;
}

export interface KpQuadraticSolutionSet {
  readonly schemaVersion: "kp.quadratic-solution-set.v1";
  readonly id: string;
  readonly variable: string;
  readonly discriminant: {
    readonly value: KpQuadraticExactRational;
    readonly classification: KpQuadraticDiscriminantClass;
  };
  readonly members: readonly KpQuadraticSolutionMember[];
}

export function createKpQuadraticSolutionSetFromFixture(
  fixture: KpQuadraticSemanticFixture
): KpQuadraticSolutionSet {
  return createKpQuadraticSolutionSet({
    id: `${fixture.id}.solution-set`,
    variable: fixture.variable,
    discriminant: fixture.discriminant,
    roots: fixture.verifiedRoots
  });
}

export function createKpQuadraticSolutionSet(input: {
  readonly id: string;
  readonly variable: string;
  readonly discriminant: KpQuadraticExactRational;
  readonly roots: readonly KpQuadraticExactRational[];
}): KpQuadraticSolutionSet {
  requireText(input.id, "Quadratic solution-set id");
  requireText(input.variable, "Quadratic solution-set variable");
  const discriminant = normalizeKpQuadraticRational(input.discriminant);
  const classification = classifyKpQuadraticDiscriminant(discriminant);
  const roots = input.roots
    .map(normalizeKpQuadraticRational)
    .sort(compareKpQuadraticRationals);
  const members = collapseRoots(roots);

  requireDiscriminantMultiplicity(classification, members);

  return Object.freeze({
    schemaVersion: "kp.quadratic-solution-set.v1" as const,
    id: input.id,
    variable: input.variable,
    discriminant: Object.freeze({
      value: Object.freeze(discriminant),
      classification
    }),
    members: Object.freeze(members)
  });
}

export function classifyKpQuadraticDiscriminant(
  value: KpQuadraticExactRational
): KpQuadraticDiscriminantClass {
  const normalized = normalizeKpQuadraticRational(value);
  const numerator = BigInt(normalized.numerator);
  if (numerator > 0n) return "two-distinct-real-roots";
  if (numerator < 0n) return "no-real-roots";
  return "one-repeated-real-root";
}

export function sameKpQuadraticSolutionSet(
  left: KpQuadraticSolutionSet,
  right: KpQuadraticSolutionSet
): boolean {
  if (
    left.variable !== right.variable ||
    left.discriminant.classification !==
      right.discriminant.classification ||
    left.members.length !== right.members.length
  ) {
    return false;
  }
  return left.members.every((member, index) => {
    const other = right.members[index];
    return (
      other !== undefined &&
      member.id === other.id &&
      member.multiplicity === other.multiplicity
    );
  });
}

export function normalizeKpQuadraticRational(
  value: KpQuadraticExactRational
): KpQuadraticExactRational {
  let numerator = BigInt(value.numerator);
  let denominator = BigInt(value.denominator);
  if (denominator === 0n) {
    throw new Error("Exact quadratic rational denominator must be non-zero.");
  }
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const divisor = gcd(numerator, denominator);
  return {
    numerator: String(numerator / divisor),
    denominator: String(denominator / divisor)
  };
}

function collapseRoots(
  roots: readonly KpQuadraticExactRational[]
): KpQuadraticSolutionMember[] {
  const members: KpQuadraticSolutionMember[] = [];
  for (const root of roots) {
    const id = exactRationalIdentity(root);
    const prior = members.at(-1);
    if (prior?.id === id) {
      members[members.length - 1] = Object.freeze({
        ...prior,
        multiplicity: prior.multiplicity + 1
      });
      continue;
    }
    members.push(
      Object.freeze({
        id,
        value: Object.freeze({ ...root }),
        multiplicity: 1
      })
    );
  }
  return members;
}

function requireDiscriminantMultiplicity(
  classification: KpQuadraticDiscriminantClass,
  members: readonly KpQuadraticSolutionMember[]
): void {
  const multiplicities = members.map((member) => member.multiplicity);
  const valid =
    (classification === "two-distinct-real-roots" &&
      members.length === 2 &&
      multiplicities.every((value) => value === 1)) ||
    (classification === "one-repeated-real-root" &&
      members.length === 1 &&
      multiplicities[0] === 2) ||
    (classification === "no-real-roots" && members.length === 0);
  if (!valid) {
    throw new Error(
      `Quadratic ${classification} discriminant does not match supplied root multiplicity.`
    );
  }
}

function exactRationalIdentity(value: KpQuadraticExactRational): string {
  return `root:${value.numerator}/${value.denominator}`;
}

function compareKpQuadraticRationals(
  left: KpQuadraticExactRational,
  right: KpQuadraticExactRational
): number {
  const difference =
    BigInt(left.numerator) * BigInt(right.denominator) -
    BigInt(right.numerator) * BigInt(left.denominator);
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
