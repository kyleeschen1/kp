import {
  type KpApplyNaturalLogBothSidesOperation,
  type KpDivideByLogBaseOperation,
  type KpExtractLogPowerExponentOperation,
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
    preserve("apply-log", "equality", sourceRoles, targetRoles, "identity", "Equality remains the same relation."),
    preserve("apply-log", "power", sourceRoles, targetRoles, "role-change", "The full power becomes the left logarithm argument."),
    preserve("apply-log", "base", sourceRoles, targetRoles, "identity", "The exponential base remains two."),
    preserve("apply-log", "unknown-x", sourceRoles, targetRoles, "identity", "The unknown remains x in exponent position."),
    preserve("apply-log", "right-value", sourceRoles, targetRoles, "role-change", "Seven becomes the right logarithm argument."),
    Object.freeze({
      id: "correspondence.apply-log.introduce-balanced-wrappers",
      relation: "introduction" as const,
      sourceSelectorIds: Object.freeze([]),
      targetSelectorIds: Object.freeze([
        occurrence(targetRoles, "logged-power-value"),
        occurrence(targetRoles, "log-right-value")
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

export function compileKpExtractLogPowerExponent(input: {
  readonly operation: KpExtractLogPowerExponentOperation;
  readonly source: KpLogExponentSolveState;
  readonly target: KpLogExponentSolveState;
}): KpCompiledLogExponentOperation {
  assertExtractionEndpoints(input.operation, input.source, input.target);
  const sourceRoles = compileKpLogExponentStateRoles(input.source);
  const targetRoles = compileKpLogExponentStateRoles(input.target);
  const records: readonly SelectorCorrespondenceRecord[] = Object.freeze([
    preserve("extract-exponent", "equality", sourceRoles, targetRoles, "identity", "Equality remains the same relation."),
    preserve("extract-exponent", "base", sourceRoles, targetRoles, "identity", "The base remains the logarithm argument."),
    preserve("extract-exponent", "unknown-x", sourceRoles, targetRoles, "role-change", "The same x moves from exponent to coefficient."),
    preserve("extract-exponent", "log-right-value", sourceRoles, targetRoles, "identity", "The right logarithm remains unchanged."),
    preserve("extract-exponent", "right-value", sourceRoles, targetRoles, "identity", "Seven remains the right logarithm argument."),
    relate(
      "extract-exponent",
      "logged-power-value",
      "extracted-product",
      sourceRoles,
      targetRoles,
      "role-change",
      "The equivalent left value changes from log-of-power to exponent-times-log-base."
    ),
    Object.freeze({
      id: "correspondence.extract-exponent.retire-power-container",
      relation: "removal" as const,
      sourceSelectorIds: Object.freeze([occurrence(sourceRoles, "power")]),
      targetSelectorIds: Object.freeze([]),
      summary: "The power container retires after its exponent and base acquire their target roles."
    }),
    Object.freeze({
      id: "correspondence.extract-exponent.derive-log-base-value",
      relation: "introduction" as const,
      sourceSelectorIds: Object.freeze([]),
      targetSelectorIds: Object.freeze([occurrence(targetRoles, "log-base-value")]),
      summary: "The power law introduces the natural logarithm of the base."
    })
  ]);
  const correspondenceMap: CorrespondenceMap = Object.freeze({
    id: "correspondence.log-exponent.extract-exponent",
    records
  });
  assertCorrespondenceComplete(input.source, input.target, correspondenceMap);
  const transformation = Object.freeze(createKpSemanticTransformation({
    id: "transformation.log-exponent.extract-exponent",
    transformType: "extractLogPowerExponent",
    title: "Extract the exponent with the logarithm power law",
    sourceObjectIds: [input.source.id],
    targetObjectIds: [input.target.id],
    preserves: ["identity", "value"],
    correspondenceMap,
    assumptions: [...input.operation.assumptionIds],
    lawRefs: [{
      id: input.operation.lawId,
      level: "strict",
      summary: "For a positive base, ln(a^x) equals x ln(a)."
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

export function compileKpDivideByLogBase(input: {
  readonly operation: KpDivideByLogBaseOperation;
  readonly source: KpLogExponentSolveState;
  readonly target: KpLogExponentSolveState;
}): KpCompiledLogExponentOperation {
  assertDivisionEndpoints(input.operation, input.source, input.target);
  const sourceRoles = compileKpLogExponentStateRoles(input.source);
  const targetRoles = compileKpLogExponentStateRoles(input.target);
  const records: readonly SelectorCorrespondenceRecord[] = Object.freeze([
    preserve("divide-log-base", "equality", sourceRoles, targetRoles, "identity", "Equality remains the same relation."),
    preserve("divide-log-base", "unknown-x", sourceRoles, targetRoles, "role-change", "The same x moves from coefficient position to the isolated left side."),
    preserve("divide-log-base", "log-right-value", sourceRoles, targetRoles, "role-change", "The right logarithm becomes the quotient numerator."),
    preserve("divide-log-base", "right-value", sourceRoles, targetRoles, "role-change", "Seven remains inside the numerator logarithm."),
    preserve("divide-log-base", "log-base-value", sourceRoles, targetRoles, "role-change", "The base logarithm becomes the quotient denominator."),
    preserve("divide-log-base", "base", sourceRoles, targetRoles, "role-change", "Two remains inside the denominator logarithm."),
    Object.freeze({
      id: "correspondence.divide-log-base.retire-product-container",
      relation: "removal" as const,
      sourceSelectorIds: Object.freeze([occurrence(sourceRoles, "extracted-product")]),
      targetSelectorIds: Object.freeze([]),
      summary: "The product container retires after division isolates x."
    }),
    Object.freeze({
      id: "correspondence.divide-log-base.introduce-quotient-container",
      relation: "introduction" as const,
      sourceSelectorIds: Object.freeze([]),
      targetSelectorIds: Object.freeze([occurrence(targetRoles, "solved-quotient")]),
      summary: "The quotient container records division of the right side by ln(2)."
    })
  ]);
  const correspondenceMap: CorrespondenceMap = Object.freeze({
    id: "correspondence.log-exponent.divide-by-log-base",
    records
  });
  assertCorrespondenceComplete(input.source, input.target, correspondenceMap);
  const transformation = Object.freeze(createKpSemanticTransformation({
    id: "transformation.log-exponent.divide-by-log-base",
    transformType: "divideBothSidesByLogBase",
    title: "Divide both sides by the logarithm of the base",
    sourceObjectIds: [input.source.id],
    targetObjectIds: [input.target.id],
    preserves: ["identity", "value"],
    correspondenceMap,
    assumptions: [...input.operation.assumptionIds],
    lawRefs: [{
      id: input.operation.lawId,
      level: "strict",
      summary: "Dividing both sides by the same nonzero value preserves equality."
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
  prefix: string,
  role: KpLogExponentSemanticRole,
  source: KpCompiledLogExponentStateRoles,
  target: KpCompiledLogExponentStateRoles,
  relation: "identity" | "role-change",
  summary: string
): SelectorCorrespondenceRecord {
  return relate(prefix, role, role, source, target, relation, summary);
}

function relate(
  prefix: string,
  sourceRole: KpLogExponentSemanticRole,
  targetRole: KpLogExponentSemanticRole,
  source: KpCompiledLogExponentStateRoles,
  target: KpCompiledLogExponentStateRoles,
  relation: "identity" | "role-change",
  summary: string
): SelectorCorrespondenceRecord {
  return Object.freeze({
    id: `correspondence.${prefix}.${sourceRole}`,
    relation,
    sourceSelectorIds: Object.freeze([occurrence(source, sourceRole)]),
    targetSelectorIds: Object.freeze([occurrence(target, targetRole)]),
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

function assertExtractionEndpoints(
  operation: KpExtractLogPowerExponentOperation,
  source: KpLogExponentSolveState,
  target: KpLogExponentSolveState
): void {
  if (
    operation.sourceStateId !== source.id ||
    operation.targetStateId !== target.id ||
    source.kind !== "logged-both-sides" ||
    target.kind !== "exponent-extracted"
  ) {
    throw new Error("Exponent extraction requires the canonical logged and extracted endpoint states.");
  }
}

function assertDivisionEndpoints(
  operation: KpDivideByLogBaseOperation,
  source: KpLogExponentSolveState,
  target: KpLogExponentSolveState
): void {
  if (
    operation.sourceStateId !== source.id ||
    operation.targetStateId !== target.id ||
    source.kind !== "exponent-extracted" ||
    target.kind !== "solved-equation"
  ) {
    throw new Error("Log-base division requires the canonical extracted and solved endpoint states.");
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
