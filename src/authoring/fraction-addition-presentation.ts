import { assertCompiledFractionChain, type CompiledFractionChain } from "./fraction-chain-compilation.ts";
import { FractionChainRepair } from "./fraction-chain-source.ts";
import { createVerifiedIntegerNumeratorMergeAnimation } from "../animation/numerator-split-merge-equation-adapter.ts";
import { createVerifiedFractionNumeratorEvaluationAnimation } from "../animation/operation-evaluation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../reader/renderers/equation-render-plan.ts";
import { compileKpEquationAssetMigrationV2 } from "../domain-ir/equation-asset-migration-v2.ts";
import { compileKpEquationEvaluationFamilyCertificateV2 } from "../domain-ir/equation-evaluation-family-certificate-v2.ts";

const issued = new WeakSet<object>();
export function resolveFractionAdditionPresentation(compilation: CompiledFractionChain, index: number) {
  assertCompiledFractionChain(compilation);
  const step = compilation.steps[index];
  if (step?.kind !== "combine") throw new FractionChainRepair("fraction-chain.presentation", `$.moves[${index}]`, "Select a checked raw fraction combination.");
  const merge = createVerifiedIntegerNumeratorMergeAnimation(step.authority);
  const evaluation = createVerifiedFractionNumeratorEvaluationAnimation(step.authority);
  for (const [animation, expected] of [[merge, "fraction-material"], [evaluation, "successor-synthesis"]] as const) {
    const plan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, direction: "forward", progress: .5 }) });
    if (plan.diagnostics.length || plan.transitions.length !== 1 || plan.transitions[0]?.presentationPlan.planKind !== expected)
      throw new FractionChainRepair("fraction-chain.presentation", `$.moves[${index}]`, "The registered fraction merge and numerator evaluation must each supply their native operation plan.");
  }
  const transformation = evaluation.transformations[0]!;
  const record = transformation.correspondenceMap!.records.find(record => record.relation === "fan-in")!;
  const migration = compileKpEquationAssetMigrationV2({ animation: evaluation,
    operations: [{ transformationId: transformation.id, operationId: "kp.arithmetic.add", semanticClass: "evaluation",
      roleBindings: { "operands-before": record.sourceSelectorIds, "result-after": record.targetSelectorIds }, projectionIntent: "replacement" }] });
  const authority = migration.presentationPlan.transitions[0]?.evaluationAuthority;
  if (!authority) throw new FractionChainRepair("fraction-chain.presentation", `$.moves[${index}]`, "Missing canonical numerator evaluation authority.");
  const result = compileKpEquationEvaluationFamilyCertificateV2({ bundle: evaluation.bundle, transformation, authority });
  if (result.status !== "certified") throw new FractionChainRepair("fraction-chain.presentation", `$.moves[${index}]`, result.diagnostics.map(d => d.message).join("; "));
  const presentation = Object.freeze({ compilation, index, merge, evaluation, evaluationCertificate: result.certificate });
  issued.add(presentation);
  return presentation;
}
export type FractionAdditionPresentation = ReturnType<typeof resolveFractionAdditionPresentation>;
export function assertFractionAdditionPresentation(value: FractionAdditionPresentation) {
  if (!issued.has(value)) throw new TypeError("Use the issued fraction addition presentation.");
}
