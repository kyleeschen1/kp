import {
  compileKpSymbolMotionContract,
  type KpCompiledSymbolMotionContract
} from "./symbol-motion-contract.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../semantic/log-exponent-transformation-tree.ts";
import type {
  KpCompiledLogExponentOperation
} from "../semantic/log-exponent-transformation-compiler.ts";
import {
  compileKpFunctionWrapInvocationGroup,
  type KpCompiledFunctionWrapInvocationGroup
} from "./function-wrap-invocation.ts";
import {
  createKpClosedDispatchRegistry,
  requireKpClosedDispatchEntry
} from "../domain-ir/equation-extension-registry.ts";
import type { KpLogExponentOperationKind } from "../semantic/log-exponent-operation-dispatch.ts";
import {
  compileKpRegisteredBothSidesCausalBinding,
  type KpRegisteredBothSidesCausalBinding
} from "./registered-both-sides-causal-binding.ts";

export interface KpLogExponentSymbolMotionPlan {
  readonly operationId: string;
  readonly contract: KpCompiledSymbolMotionContract;
  readonly functionWrapInvocationGroup?:
    KpCompiledFunctionWrapInvocationGroup | undefined;
  readonly bothSidesCausalBinding?:
    KpRegisteredBothSidesCausalBinding | undefined;
}

export function compileKpLogExponentSymbolMotionPlans(
  operations: readonly KpCompiledLogExponentOperation[] =
    kpCanonicalLogExponentTransformationTree.operations
): readonly KpLogExponentSymbolMotionPlan[] {
  return Object.freeze(operations.map((operation) => {
    const dispatch = requireKpClosedDispatchEntry(
      kpLogExponentSymbolMotionDispatch,
      operation.operation.kind
    );
    const contract = dispatch.compileContract(operation);
    const functionWrapInvocationGroup =
      dispatch.compileFunctionWrapInvocationGroup?.(operation, contract);
    const bothSidesCausalBinding =
      compileKpRegisteredBothSidesCausalBinding({
        transformation: operation.transformation,
        branchRoles: Object.freeze({
          ...operation.sourceRoles.branchByOccurrenceId,
          ...operation.targetRoles.branchByOccurrenceId
        }),
        direction: "forward"
      });
    return Object.freeze({
      operationId: operation.operation.id,
      contract,
      ...(functionWrapInvocationGroup === undefined
        ? {}
        : { functionWrapInvocationGroup }),
      ...(bothSidesCausalBinding === undefined
        ? {}
        : { bothSidesCausalBinding })
    });
  }));
}

interface KpLogExponentSymbolMotionDispatchEntry {
  readonly id: KpLogExponentOperationKind;
  readonly compileContract: (
    operation: KpCompiledLogExponentOperation
  ) => KpCompiledSymbolMotionContract;
  readonly compileFunctionWrapInvocationGroup?: (
    operation: KpCompiledLogExponentOperation,
    contract: KpCompiledSymbolMotionContract
  ) => KpCompiledFunctionWrapInvocationGroup;
}

export const kpLogExponentSymbolMotionDispatch =
  createKpClosedDispatchRegistry<KpLogExponentOperationKind, KpLogExponentSymbolMotionDispatchEntry>(
    "log-exponent symbol motion",
    [
      Object.freeze({
        id: "apply-natural-log-both-sides" as const,
        compileContract: compileApplyLogContract,
        compileFunctionWrapInvocationGroup:
          compileApplyLogFunctionWrapInvocationGroup
      }),
      Object.freeze({
        id: "extract-log-power-exponent" as const,
        compileContract: compileExtractExponentContract
      }),
      Object.freeze({
        id: "divide-both-sides-by-log-base" as const,
        compileContract: compileDivideByLogBaseContract
      })
    ]
  );

function compileApplyLogFunctionWrapInvocationGroup(
  operation: KpCompiledLogExponentOperation,
  contract: KpCompiledSymbolMotionContract
): KpCompiledFunctionWrapInvocationGroup {
  const motif = contract.canonicalMotifs[0];
  if (motif === undefined || contract.canonicalMotifs.length !== 1) {
    throw new Error(
      `Apply-log contract ${contract.id} requires one canonical wrap declaration.`
    );
  }
  const continuants = new Map(contract.continuants.map((rule) => [
    rule.id,
    rule
  ]));
  return compileKpFunctionWrapInvocationGroup({
    id: operation.transformation.id,
    branches: motif.branches.map((branch) => {
      const argumentRules = branch.argumentContinuantIds.map((id) => {
        const rule = continuants.get(id);
        if (rule === undefined) {
          throw new Error(
            `Apply-log function-wrap branch ${branch.id} lacks continuant ${id}.`
          );
        }
        return rule;
      });
      const enclosureIds = new Set(
        (branch.enclosureEntityRoles ?? []).map(({ entityId }) => entityId)
      );
      return {
        id: branch.id,
        semanticObjectId: operation.targetRoles.stateId,
        sourceArgumentEntityIds: argumentRules.flatMap(
          ({ sourceEntityIds }) => sourceEntityIds
        ),
        targetArgumentEntityIds: argumentRules.flatMap(
          ({ targetEntityIds }) => targetEntityIds
        ),
        functionEntityIds: branch.wrapperEntityIds.filter(
          (entityId) => !enclosureIds.has(entityId)
        ),
        enclosureEntityRoles: branch.enclosureEntityRoles ?? []
      };
    })
  });
}

export const kpCanonicalLogExponentSymbolMotionPlans =
  compileKpLogExponentSymbolMotionPlans();

function commonContractInput(
  operation: KpCompiledLogExponentOperation
) {
  const records = operation.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(
      `Log-exponent operation ${operation.operation.id} lacks correspondence.`
    );
  }
  const continuants = records
    .filter(({ relation }) =>
      relation === "identity" || relation === "role-change"
    )
    .map((record) => ({
      id: continuantId(record.id),
      correspondenceRecordId: record.id,
      metricTransition: record.relation === "role-change"
        ? "interpolate-to-target-metrics" as const
        : "preserve-source-metrics" as const
    }));
  return {
    id: `symbol-motion.${operation.transformation.id}`,
    transformation: operation.transformation,
    continuants
  };
}

function compileApplyLogContract(
  operation: KpCompiledLogExponentOperation
): KpCompiledSymbolMotionContract {
  return compileKpSymbolMotionContract({
        ...commonContractInput(operation),
        canonicalMotifs: [{
          id: `motif.${operation.transformation.id}.canonical-wrap`,
          canonicalOperationId: "kp.core.wrap",
          wrapperIntroductionRecordId:
            "correspondence.apply-log.introduce-balanced-wrappers",
          branches: [
            {
              id: "wrap-branch.left",
              argumentContinuantIds: [
                continuantId("correspondence.apply-log.power"),
                continuantId("correspondence.apply-log.base"),
                continuantId("correspondence.apply-log.unknown-x")
              ],
              wrapperEntityIds: [
                "logged.left.log",
                "logged.left.log.operator",
                "logged.left.log.open",
                "logged.left.log.close"
              ],
              enclosureEntityRoles: [
                {
                  entityId: "logged.left.log.open",
                  side: "leading"
                },
                {
                  entityId: "logged.left.log.close",
                  side: "trailing"
                }
              ]
            },
            {
              id: "wrap-branch.right",
              argumentContinuantIds: [
                continuantId("correspondence.apply-log.right-value")
              ],
              wrapperEntityIds: [
                "logged.right.log",
                "logged.right.log.operator"
              ]
            }
          ]
        }]
      });
}

function compileExtractExponentContract(
  operation: KpCompiledLogExponentOperation
): KpCompiledSymbolMotionContract {
  return compileKpSymbolMotionContract({
        ...commonContractInput(operation),
        rigidCompounds: [
          {
            id: `motion-unit.${operation.transformation.id}.residual-log-two`,
            memberContinuantIds: [
              continuantId(
                "correspondence.extract-exponent.logged-power-value"
              ),
              continuantId(
                "correspondence.extract-exponent.log-left-operator"
              ),
              continuantId("correspondence.extract-exponent.base")
            ]
          },
          {
            id: `motion-unit.${operation.transformation.id}.unchanged-log-seven`,
            memberContinuantIds: [
              continuantId(
                "correspondence.extract-exponent.log-right-value"
              ),
              continuantId(
                "correspondence.extract-exponent.log-right-operator"
              ),
              continuantId("correspondence.extract-exponent.right-value")
            ]
          }
        ],
        structuralShells: [
          {
            id: `shell.${operation.transformation.id}.log-enclosure`,
            correspondenceRecordId:
              "correspondence.extract-exponent.retire-log-enclosure",
            timing: "after-continuants-depart"
          },
          {
            id: `shell.${operation.transformation.id}.power`,
            correspondenceRecordId:
              "correspondence.extract-exponent.retire-power-container",
            timing: "after-continuants-depart"
          },
          {
            id: `shell.${operation.transformation.id}.product`,
            correspondenceRecordId:
              "correspondence.extract-exponent.introduce-product-container",
            timing: "after-continuants-settle"
          }
        ]
      });
}

function compileDivideByLogBaseContract(
  operation: KpCompiledLogExponentOperation
): KpCompiledSymbolMotionContract {
  return compileKpSymbolMotionContract({
        ...commonContractInput(operation),
        rigidCompounds: [
          {
            id: `motion-unit.${operation.transformation.id}.log-seven`,
            memberContinuantIds: [
              continuantId(
                "correspondence.divide-log-base.log-right-value"
              ),
              continuantId(
                "correspondence.divide-log-base.log-right-operator"
              ),
              continuantId("correspondence.divide-log-base.right-value")
            ]
          },
          {
            id: `motion-unit.${operation.transformation.id}.log-two`,
            memberContinuantIds: [
              continuantId(
                "correspondence.divide-log-base.log-base-value"
              ),
              continuantId(
                "correspondence.divide-log-base.log-left-operator"
              ),
              continuantId("correspondence.divide-log-base.base")
            ]
          }
        ],
        structuralShells: [
          {
            id: `shell.${operation.transformation.id}.product`,
            correspondenceRecordId:
              "correspondence.divide-log-base.retire-product-container",
            timing: "after-continuants-depart"
          },
          {
            id: `shell.${operation.transformation.id}.quotient`,
            correspondenceRecordId:
              "correspondence.divide-log-base.introduce-quotient-container",
            timing: "after-continuants-settle"
          }
        ]
      });
}

function continuantId(correspondenceRecordId: string): string {
  return `symbol-continuant.${correspondenceRecordId}`;
}
