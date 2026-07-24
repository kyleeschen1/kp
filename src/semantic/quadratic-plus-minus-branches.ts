import type { KpQuadraticExactRational } from "./quadratic-branching-fixture.ts";
import type {
  KpQuadraticMethodId,
  KpQuadraticSolutionMethodGraph
} from "./quadratic-solution-method-graph.ts";
import type { KpQuadraticSolutionSet } from "./quadratic-solution-set.ts";

export type KpQuadraticBranchSign = "minus" | "plus";

export interface KpQuadraticSolutionBranch {
  readonly id: string;
  readonly methodId: KpQuadraticMethodId;
  readonly sign: KpQuadraticBranchSign;
  readonly rootMemberId: string;
  readonly evidence: {
    readonly center: KpQuadraticExactRational;
    readonly signedOffset: KpQuadraticExactRational;
    readonly result: KpQuadraticExactRational;
    readonly lawId: "law.arithmetic.signed-offset";
  };
  readonly dependsOn: readonly string[];
}

export interface KpQuadraticBranchDerivationOperation {
  readonly id: string;
  readonly lawId: string;
  readonly sourceExpression: string;
  readonly targetExpression: string;
  readonly dependsOn: readonly string[];
}

export interface KpQuadraticPlusMinusBranchSet {
  readonly schemaVersion: "kp.quadratic-plus-minus-branch-set.v1";
  readonly id: string;
  readonly methodId: KpQuadraticMethodId;
  readonly sourceNodeId: string;
  readonly derivation: readonly KpQuadraticBranchDerivationOperation[];
  readonly split: {
    readonly id: string;
    readonly relation: "one-to-many";
    readonly sourceNodeId: string;
    readonly targetBranchIds: readonly string[];
  };
  readonly branches: readonly KpQuadraticSolutionBranch[];
  readonly reunionPrerequisite: {
    readonly solutionSetId: string;
    readonly requiredBranchIds: readonly string[];
    readonly relation: "complete-exact-set";
  };
}

export interface KpQuadraticBranchDiagnostic {
  readonly code:
    | "branch-cardinality"
    | "branch-identity"
    | "method-ownership"
    | "dependency-order"
    | "derivation-chain"
    | "root-ownership"
    | "asymmetry"
    | "evidence-mismatch"
    | "reunion-prerequisite";
  readonly path: string;
  readonly message: string;
}

export function createCanonicalKpQuadraticPlusMinusBranches(input: {
  readonly graph: KpQuadraticSolutionMethodGraph;
  readonly solutionSet: KpQuadraticSolutionSet;
}): readonly KpQuadraticPlusMinusBranchSet[] {
  const center = rational(5n, 2n);
  const radius = rational(1n, 2n);
  return Object.freeze(input.graph.paths.map((path) => {
    const sourceEdge = input.graph.edges.find(
      (edge) => edge.id === path.edgeIds.at(-1)
    );
    if (sourceEdge === undefined) {
      throw new Error(`Method ${path.id} lacks a terminal branch dependency.`);
    }
    const sourceNodeId = sourceEdge.sourceNodeId;
    const derivation = methodDerivation(path.id, sourceEdge.operationRef);
    const branchDependency = derivation.at(-1)!.id;
    const branches = Object.freeze([
      branch(path.id, "minus", center, negate(radius), "root:2/1", branchDependency),
      branch(path.id, "plus", center, radius, "root:3/1", branchDependency)
    ]);
    const branchIds = Object.freeze(branches.map(({ id }) => id));
    const branchSet = Object.freeze({
      schemaVersion: "kp.quadratic-plus-minus-branch-set.v1" as const,
      id: `branches.${path.id}`,
      methodId: path.id,
      sourceNodeId,
      derivation,
      split: Object.freeze({
        id: `split.${path.id}.plus-minus`,
        relation: "one-to-many" as const,
        sourceNodeId,
        targetBranchIds: branchIds
      }),
      branches,
      reunionPrerequisite: Object.freeze({
        solutionSetId: input.solutionSet.id,
        requiredBranchIds: branchIds,
        relation: "complete-exact-set" as const
      })
    });
    const diagnostics = validateKpQuadraticPlusMinusBranchSet(
      branchSet,
      input.graph,
      input.solutionSet
    );
    if (diagnostics.length > 0) {
      throw new Error(diagnostics.map((issue) => issue.message).join(" "));
    }
    return branchSet;
  }));
}

export function validateKpQuadraticPlusMinusBranchSet(
  branchSet: KpQuadraticPlusMinusBranchSet,
  graph: KpQuadraticSolutionMethodGraph,
  solutionSet: KpQuadraticSolutionSet
): readonly KpQuadraticBranchDiagnostic[] {
  const diagnostics: KpQuadraticBranchDiagnostic[] = [];
  const minus = branchSet.branches.find(({ sign }) => sign === "minus");
  const plus = branchSet.branches.find(({ sign }) => sign === "plus");
  if (branchSet.branches.length !== 2 || minus === undefined || plus === undefined) {
    diagnostics.push(issue("branch-cardinality", "branches", `Branch set ${branchSet.id} requires exactly one plus and one minus branch.`));
    return Object.freeze(diagnostics);
  }
  const derivationIds = new Set<string>();
  let derivationDependency = graph.edges.find(
    ({ targetNodeId, methodId }) =>
      targetNodeId === graph.targetNodeId && methodId === branchSet.methodId
  )?.operationRef;
  branchSet.derivation.forEach((operation, index) => {
    if (
      derivationDependency === undefined ||
      operation.id.trim().length === 0 ||
      operation.lawId.trim().length === 0 ||
      operation.sourceExpression.trim().length === 0 ||
      operation.targetExpression.trim().length === 0 ||
      operation.dependsOn.length !== 1 ||
      operation.dependsOn[0] !== derivationDependency ||
      derivationIds.has(operation.id) ||
      (index > 0 &&
        branchSet.derivation[index - 1]?.targetExpression !==
          operation.sourceExpression)
    ) {
      diagnostics.push(issue(
        "derivation-chain",
        `derivation[${index}]`,
        `Branch derivation ${operation.id} must preserve one exact ordered dependency and contiguous expressions.`
      ));
    }
    derivationIds.add(operation.id);
    derivationDependency = operation.id;
  });
  if (branchSet.derivation.length === 0) {
    diagnostics.push(issue(
      "derivation-chain",
      "derivation",
      `Branch set ${branchSet.id} requires an explicit candidate derivation.`
    ));
  }
  for (const branch of branchSet.branches) {
    const expectedId = `branch.${branchSet.methodId}.${branch.sign}`;
    if (branch.id !== expectedId) {
      diagnostics.push(issue("branch-identity", `branches.${branch.sign}.id`, `Branch ${branch.sign} must retain stable identity ${expectedId}.`));
    }
    if (branch.methodId !== branchSet.methodId) {
      diagnostics.push(issue("method-ownership", `branches.${branch.sign}.methodId`, `Branch ${branch.id} belongs to a different method.`));
    }
    if (
      branch.dependsOn.length !== 1 ||
      branch.dependsOn[0] !== branchSet.derivation.at(-1)?.id
    ) {
      diagnostics.push(issue("dependency-order", `branches.${branch.sign}.dependsOn`, `Branch ${branch.id} requires a unique ordered semantic dependency.`));
    }
    const member = solutionSet.members.find(({ id }) => id === branch.rootMemberId);
    if (member === undefined) {
      diagnostics.push(issue("root-ownership", `branches.${branch.sign}.rootMemberId`, `Branch ${branch.id} references a root outside the exact solution set.`));
    }
    if (
      !sameRational(addRationals(branch.evidence.center, branch.evidence.signedOffset), branch.evidence.result) ||
      member === undefined ||
      !sameRational(member.value, branch.evidence.result)
    ) {
      diagnostics.push(issue("evidence-mismatch", `branches.${branch.sign}.evidence`, `Branch ${branch.id} signed-offset evidence does not derive its exact root.`));
    }
  }
  if (
    minus.rootMemberId === plus.rootMemberId ||
    !sameRational(minus.evidence.center, plus.evidence.center) ||
    !sameRational(minus.evidence.signedOffset, negate(plus.evidence.signedOffset))
  ) {
    diagnostics.push(issue("asymmetry", "branches", `Branch set ${branchSet.id} must contain symmetric, non-overlapping plus and minus evidence.`));
  }
  const source = graph.nodes.find(({ id }) => id === branchSet.sourceNodeId);
  if (source?.ownerMethodId !== branchSet.methodId) {
    diagnostics.push(issue("method-ownership", "sourceNodeId", `Branch set ${branchSet.id} must originate from its method-owned terminal state.`));
  }
  const branchIds = new Set(branchSet.branches.map(({ id }) => id));
  const splitIds = branchSet.split.targetBranchIds;
  const reunionIds = branchSet.reunionPrerequisite.requiredBranchIds;
  if (
    branchSet.split.sourceNodeId !== branchSet.sourceNodeId ||
    splitIds.length !== branchIds.size ||
    splitIds.some((id) => !branchIds.has(id)) ||
    reunionIds.length !== branchIds.size ||
    reunionIds.some((id) => !branchIds.has(id)) ||
    branchSet.reunionPrerequisite.solutionSetId !== solutionSet.id
  ) {
    diagnostics.push(issue("reunion-prerequisite", "reunionPrerequisite", `Branch set ${branchSet.id} must split and reunite the complete exact branch set.`));
  }
  return Object.freeze(diagnostics);
}

function methodDerivation(
  methodId: KpQuadraticMethodId,
  dependency: string
): readonly KpQuadraticBranchDerivationOperation[] {
  const operations = methodId === "method.quadratic.completing-square"
    ? [
        derivationOperation(
          "operation.quadratic.take-square-roots-and-branch-sign",
          "law.equation.square-root-both-sides",
          "(x-5/2)^2=1/4",
          "x-5/2=±sqrt(1/4)",
          dependency
        ),
        derivationOperation(
          "operation.quadratic.evaluate-principal-square-root",
          "law.arithmetic.principal-square-root",
          "x-5/2=±sqrt(1/4)",
          "x-5/2=±1/2",
          "operation.quadratic.take-square-roots-and-branch-sign"
        ),
        derivationOperation(
          "operation.quadratic.isolate-signed-candidates",
          "law.equation.add-both-sides",
          "x-5/2=±1/2",
          "x=5/2±1/2",
          "operation.quadratic.evaluate-principal-square-root"
        ),
        derivationOperation(
          "operation.quadratic.normalize-signed-candidates",
          "law.arithmetic.equivalent-fractions",
          "x=5/2±1/2",
          "x=(5±1)/2",
          "operation.quadratic.isolate-signed-candidates"
        )
      ]
    : [
        derivationOperation(
          "operation.quadratic.retain-formula-candidates",
          "law.arithmetic.equivalent-fractions",
          "x=2 or x=3",
          "x=2 or x=3",
          dependency
        )
      ];
  return Object.freeze(operations);
}

function derivationOperation(
  id: string,
  lawId: string,
  sourceExpression: string,
  targetExpression: string,
  dependency: string
): KpQuadraticBranchDerivationOperation {
  return Object.freeze({
    id,
    lawId,
    sourceExpression,
    targetExpression,
    dependsOn: Object.freeze([dependency])
  });
}

function branch(
  methodId: KpQuadraticMethodId,
  sign: KpQuadraticBranchSign,
  center: KpQuadraticExactRational,
  signedOffset: KpQuadraticExactRational,
  rootMemberId: string,
  dependency: string
): KpQuadraticSolutionBranch {
  return Object.freeze({
    id: `branch.${methodId}.${sign}`,
    methodId,
    sign,
    rootMemberId,
    evidence: Object.freeze({
      center: Object.freeze({ ...center }),
      signedOffset: Object.freeze({ ...signedOffset }),
      result: Object.freeze(addRationals(center, signedOffset)),
      lawId: "law.arithmetic.signed-offset" as const
    }),
    dependsOn: Object.freeze([dependency])
  });
}

function addRationals(
  left: KpQuadraticExactRational,
  right: KpQuadraticExactRational
): KpQuadraticExactRational {
  return rational(
    BigInt(left.numerator) * BigInt(right.denominator) +
      BigInt(right.numerator) * BigInt(left.denominator),
    BigInt(left.denominator) * BigInt(right.denominator)
  );
}

function negate(value: KpQuadraticExactRational): KpQuadraticExactRational {
  return rational(-BigInt(value.numerator), BigInt(value.denominator));
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

function rational(numerator: bigint, denominator: bigint): KpQuadraticExactRational {
  if (denominator === 0n) throw new Error("Branch rational denominator must be non-zero.");
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

function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function issue(
  code: KpQuadraticBranchDiagnostic["code"],
  path: string,
  message: string
): KpQuadraticBranchDiagnostic {
  return Object.freeze({ code, path, message });
}
