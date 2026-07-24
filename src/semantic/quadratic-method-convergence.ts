import type {
  KpQuadraticExactRational,
  KpQuadraticSemanticFixture
} from "./quadratic-branching-fixture.ts";
import type {
  KpQuadraticPlusMinusBranchSet,
  KpQuadraticSolutionBranch
} from "./quadratic-plus-minus-branches.ts";
import type { KpQuadraticMethodId } from "./quadratic-solution-method-graph.ts";
import type { KpQuadraticSolutionSet } from "./quadratic-solution-set.ts";

export interface KpQuadraticRootContribution {
  readonly methodId: KpQuadraticMethodId;
  readonly branchId: string;
  readonly sign: "minus" | "plus";
  readonly evidenceLawId: "law.arithmetic.signed-offset";
}

export interface KpQuadraticRootReunion {
  readonly rootMemberId: string;
  readonly value: KpQuadraticExactRational;
  readonly contributions: readonly KpQuadraticRootContribution[];
}

export interface KpQuadraticMethodConvergence {
  readonly schemaVersion: "kp.quadratic-method-convergence.v1";
  readonly id: "convergence.quadratic.canonical.methods";
  readonly fixtureId: string;
  readonly solutionSetId: string;
  readonly methodIds: readonly KpQuadraticMethodId[];
  readonly reunions: readonly KpQuadraticRootReunion[];
}

export interface KpQuadraticConvergenceDiagnostic {
  readonly code:
    | "method-coverage"
    | "solution-set-mismatch"
    | "duplicate-contribution"
    | "root-conflict"
    | "root-substitution";
  readonly path: string;
  readonly message: string;
}

export function compileKpQuadraticMethodConvergence(input: {
  readonly fixture: KpQuadraticSemanticFixture;
  readonly solutionSet: KpQuadraticSolutionSet;
  readonly branchSets: readonly KpQuadraticPlusMinusBranchSet[];
}): KpQuadraticMethodConvergence {
  const methodIds = Object.freeze(
    [...input.branchSets.map(({ methodId }) => methodId)].sort()
  );
  const reunions = Object.freeze(input.solutionSet.members.map((member) => {
    const branches = input.branchSets.flatMap(({ branches: candidates }) =>
      candidates.filter(({ rootMemberId }) => rootMemberId === member.id)
    );
    return Object.freeze({
      rootMemberId: member.id,
      value: Object.freeze({ ...member.value }),
      contributions: Object.freeze(branches
        .map(contribution)
        .sort((left, right) => left.methodId.localeCompare(right.methodId)))
    });
  }));
  const convergence = Object.freeze({
    schemaVersion: "kp.quadratic-method-convergence.v1" as const,
    id: "convergence.quadratic.canonical.methods" as const,
    fixtureId: input.fixture.id,
    solutionSetId: input.solutionSet.id,
    methodIds,
    reunions
  });
  const diagnostics = validateKpQuadraticMethodConvergence({
    convergence,
    fixture: input.fixture,
    solutionSet: input.solutionSet,
    branchSets: input.branchSets
  });
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map((issue) => issue.message).join(" "));
  }
  return convergence;
}

export function validateKpQuadraticMethodConvergence(input: {
  readonly convergence: KpQuadraticMethodConvergence;
  readonly fixture: KpQuadraticSemanticFixture;
  readonly solutionSet: KpQuadraticSolutionSet;
  readonly branchSets: readonly KpQuadraticPlusMinusBranchSet[];
}): readonly KpQuadraticConvergenceDiagnostic[] {
  const diagnostics: KpQuadraticConvergenceDiagnostic[] = [];
  const expectedMethods = new Set([
    "method.quadratic.completing-square",
    "method.quadratic.formula"
  ]);
  const methodIds = new Set(input.convergence.methodIds);
  if (
    methodIds.size !== expectedMethods.size ||
    [...expectedMethods].some((id) => !methodIds.has(id as KpQuadraticMethodId))
  ) {
    diagnostics.push(issue("method-coverage", "methodIds", "Convergence requires both exact quadratic methods once."));
  }
  if (
    input.convergence.fixtureId !== input.fixture.id ||
    input.convergence.solutionSetId !== input.solutionSet.id ||
    input.convergence.reunions.length !== input.solutionSet.members.length
  ) {
    diagnostics.push(issue("solution-set-mismatch", "reunions", "Convergence must target the fixture's complete exact solution set."));
  }
  input.convergence.reunions.forEach((reunion, index) => {
    const member = input.solutionSet.members.find(({ id }) => id === reunion.rootMemberId);
    const contributionKeys = reunion.contributions.map(
      ({ methodId, branchId }) => `${methodId}:${branchId}`
    );
    if (new Set(contributionKeys).size !== contributionKeys.length) {
      diagnostics.push(issue("duplicate-contribution", `reunions[${index}].contributions`, `Root ${reunion.rootMemberId} repeats a method-branch contribution.`));
    }
    if (
      member === undefined ||
      !sameRational(member.value, reunion.value) ||
      reunion.contributions.length !== expectedMethods.size ||
      [...expectedMethods].some((methodId) =>
        !reunion.contributions.some((candidate) => candidate.methodId === methodId)
      )
    ) {
      diagnostics.push(issue("root-conflict", `reunions[${index}]`, `Root ${reunion.rootMemberId} does not have one agreeing contribution from each method.`));
    }
    const sourceBranches = input.branchSets.flatMap(({ branches }) => branches);
    for (const contribution of reunion.contributions) {
      const branch = sourceBranches.find(({ id }) => id === contribution.branchId);
      if (
        branch === undefined ||
        branch.methodId !== contribution.methodId ||
        branch.rootMemberId !== reunion.rootMemberId ||
        !sameRational(branch.evidence.result, reunion.value)
      ) {
        diagnostics.push(issue("root-conflict", `reunions[${index}].contributions`, `Contribution ${contribution.branchId} conflicts with canonical root ${reunion.rootMemberId}.`));
      }
    }
    if (member !== undefined && !isExactRoot(input.fixture, member.value)) {
      diagnostics.push(issue("root-substitution", `reunions[${index}].value`, `Canonical root ${reunion.rootMemberId} fails exact substitution into the source equation.`));
    }
  });
  return Object.freeze(diagnostics);
}

function contribution(branch: KpQuadraticSolutionBranch): KpQuadraticRootContribution {
  return Object.freeze({
    methodId: branch.methodId,
    branchId: branch.id,
    sign: branch.sign,
    evidenceLawId: branch.evidence.lawId
  });
}

function isExactRoot(
  fixture: KpQuadraticSemanticFixture,
  root: KpQuadraticExactRational
): boolean {
  const a = BigInt(fixture.coefficients.a);
  const b = BigInt(fixture.coefficients.b);
  const c = BigInt(fixture.coefficients.c);
  const numerator = BigInt(root.numerator);
  const denominator = BigInt(root.denominator);
  return (
    a * numerator * numerator +
      b * numerator * denominator +
      c * denominator * denominator ===
    0n
  );
}

function sameRational(
  left: KpQuadraticExactRational,
  right: KpQuadraticExactRational
): boolean {
  return (
    BigInt(left.numerator) * BigInt(right.denominator) ===
    BigInt(right.numerator) * BigInt(left.denominator)
  );
}

function issue(
  code: KpQuadraticConvergenceDiagnostic["code"],
  path: string,
  message: string
): KpQuadraticConvergenceDiagnostic {
  return Object.freeze({ code, path, message });
}
