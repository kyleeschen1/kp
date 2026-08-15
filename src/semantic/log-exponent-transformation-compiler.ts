import {
  type KpApplyNaturalLogBothSidesOperation,
  type KpLogExponentAuthoredOperation
} from "./log-exponent-authored-operations.ts";
import {
  compileKpLogExponentStateRoles,
  findKpLogExponentRoleBinding,
  type KpCompiledLogExponentStateRoles,
  type KpLogExponentSemanticRole
} from "./log-exponent-compiler-authority.ts";
import {
  listKpLogExponentExpressionNodes,
  type KpLogExponentSolveState
} from "./log-exponent-solve-states.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRecord
} from "./correspondence.ts";

declare const kpCompiledLogExponentOperationAuthority: unique symbol;
const compiledOperations = new WeakSet<object>();

export interface KpCompiledLogExponentOperation {
  readonly schemaVersion: "kp.compiled-log-exponent-operation.v1";
  readonly operation: KpLogExponentAuthoredOperation;
  readonly sourceRoles: KpCompiledLogExponentStateRoles;
  readonly targetRoles: KpCompiledLogExponentStateRoles;
  readonly transformation: KpSemanticTransformation;
  readonly [kpCompiledLogExponentOperationAuthority]: true;
}

export function compileKpApplyNaturalLogBothSides(input: {
  readonly operation: KpApplyNaturalLogBothSidesOperation;
  readonly source: KpLogExponentSolveState;
  readonly target: KpLogExponentSolveState;
}): KpCompiledLogExponentOperation {
  assertEndpoints(input.operation, input.source, input.target);
  const sourceRoles = compileKpLogExponentStateRoles(input.source);
  const targetRoles = compileKpLogExponentStateRoles(input.target);
  const records: readonly SelectorCorrespondenceRecord[] = Object.freeze([
    preserve("equality", sourceRoles, targetRoles, "identity", "Equality remains the same relation."),
    preserve("power", sourceRoles, targetRoles, "role-change", "The full power becomes the left logarithm argument."),
    preserve("base", sourceRoles, targetRoles, "identity", "The exponential base remains two."),
    preserve("exponent", sourceRoles, targetRoles, "identity", "The unknown exponent remains x."),
    preserve("right-value", sourceRoles, targetRoles, "role-change", "Seven becomes the right logarithm argument."),
    Object.freeze({
      id: "correspondence.apply-log.introduce-balanced-wrappers",
      relation: "introduction" as const,
      sourceSelectorIds: Object.freeze([]),
      targetSelectorIds: Object.freeze([
        occurrence(targetRoles, "left-log"),
        occurrence(targetRoles, "right-log")
      ]),
      summary: "Introduce both natural-log wrappers as one balanced operation."
    })
  ]);
  const correspondenceMap: CorrespondenceMap = Object.freeze({
    id: "correspondence.log-exponent.apply-log-both-sides",
    records
  });
  assertCorrespondenceComplete(input.source, input.target, correspondenceMap);
  const transformation = Object.freeze(createKpSemanticTransformation({
    id: "transformation.log-exponent.apply-log-both-sides",
    transformType: "applyNaturalLogBothSides",
    title: "Apply natural logarithm to both sides",
    sourceObjectIds: [input.source.id],
    targetObjectIds: [input.target.id],
    preserves: ["identity", "structure", "value"],
    correspondenceMap,
    assumptions: [...input.operation.assumptionIds],
    lawRefs: [{
      id: "law.equation.apply-injective-function",
      level: "strict",
      summary: "Natural logarithm is injective on the positive reals."
    }]
  }));
  return authorize({
    schemaVersion: "kp.compiled-log-exponent-operation.v1",
    operation: input.operation,
    sourceRoles,
    targetRoles,
    transformation
  });
}

export function isKpCompiledLogExponentOperation(
  value: unknown
): value is KpCompiledLogExponentOperation {
  return typeof value === "object" && value !== null && compiledOperations.has(value);
}

function preserve(
  role: KpLogExponentSemanticRole,
  source: KpCompiledLogExponentStateRoles,
  target: KpCompiledLogExponentStateRoles,
  relation: "identity" | "role-change",
  summary: string
): SelectorCorrespondenceRecord {
  return Object.freeze({
    id: `correspondence.apply-log.${role}`,
    relation,
    sourceSelectorIds: Object.freeze([occurrence(source, role)]),
    targetSelectorIds: Object.freeze([occurrence(target, role)]),
    summary
  });
}

function occurrence(
  roles: KpCompiledLogExponentStateRoles,
  role: KpLogExponentSemanticRole
): string {
  const binding = findKpLogExponentRoleBinding(roles, role);
  if (binding?.occurrenceIds.length !== 1) {
    throw new Error(`Log-exponent role ${role} must bind exactly one occurrence in ${roles.stateId}.`);
  }
  return binding.occurrenceIds[0]!;
}

function assertEndpoints(
  operation: KpApplyNaturalLogBothSidesOperation,
  source: KpLogExponentSolveState,
  target: KpLogExponentSolveState
): void {
  if (
    operation.sourceStateId !== source.id ||
    operation.targetStateId !== target.id ||
    source.kind !== "source-equation" ||
    target.kind !== "logged-both-sides"
  ) {
    throw new Error("Apply-log compilation requires the canonical source and logged endpoint states.");
  }
}

function assertCorrespondenceComplete(
  source: KpLogExponentSolveState,
  target: KpLogExponentSolveState,
  correspondenceMap: CorrespondenceMap
): void {
  const issues = [
    ...validateCorrespondenceMap(correspondenceMap, {
      sourceSelectorIds: listKpLogExponentExpressionNodes(source).map(({ id }) => id),
      targetSelectorIds: listKpLogExponentExpressionNodes(target).map(({ id }) => id)
    }),
    ...checkCorrespondenceMapRewindLaw(correspondenceMap)
  ];
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
}

function authorize(
  value: Omit<KpCompiledLogExponentOperation, typeof kpCompiledLogExponentOperationAuthority>
): KpCompiledLogExponentOperation {
  const compiled = Object.freeze(value) as KpCompiledLogExponentOperation;
  compiledOperations.add(compiled);
  return compiled;
}
