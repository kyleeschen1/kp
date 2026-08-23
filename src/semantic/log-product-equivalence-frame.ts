import {
  compileKpStateRetentionProjection,
  isKpVerifiedStateRetentionProjection,
  type KpVerifiedStateRetentionProjection
} from "../domain-ir/state-retention-projection.ts";
import {
  compileKpLogProductEquivalenceOccurrencesV2,
  type KpCompiledLogProductEquivalenceOccurrencesV2
} from "../domain-ir/log-product-equivalence-occurrences-v2.ts";
import {
  compileKpLogProductEquivalencePaintOwnershipV2,
  type KpCompiledLogProductEquivalencePaintOwnershipV2
} from "../domain-ir/log-product-equivalence-paint-ownership-v2.ts";
import {
  compileKpEquationGrammarV2
} from "../domain-ir/equation-grammar-v2.ts";
import {
  compileKpEquationPresentationPlanV2,
  type KpCompiledEquationPresentationPlanV2,
  type KpEquationPresentationDomainPayloadV2
} from "../domain-ir/equation-presentation-plan-v2.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from
  "./log-product-transformation-compiler.ts";
import {
  kpCanonicalLogProductSemanticMotionBundle
} from "./log-product-semantic-motion.ts";
import { listKpLogProductExpressionNodes } from "./log-product-states.ts";

declare const kpVerifiedLogProductEquivalenceFrameBrand: unique symbol;

export const KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID =
  "animation.algebra.log-product.equivalence-frame" as const;

export const kpLogProductEquivalenceFrameOccurrenceIds = Object.freeze({
  source: "occurrence.log-product-equivalence.retained-witness",
  relation: "occurrence.log-product-equivalence.equality",
  target: "occurrence.log-product-equivalence.native-target"
} as const);

export interface KpLogProductEquivalenceDomainPayloadV2
  extends KpEquationPresentationDomainPayloadV2 {
  readonly kind: "equation-domain.log-product-equivalence.v2";
  readonly equalityEntityId: string;
  readonly factorContinuityRecordIds: readonly string[];
  readonly targetWrapperEntityIds: readonly string[];
  readonly targetOperatorEntityIds: readonly string[];
  readonly connectorEntityIds: readonly string[];
}

export type KpVerifiedLogProductEquivalenceFrame = Readonly<{
  schemaVersion: "kp.log-product-equivalence-frame.v1";
  kind: "verified-log-product-equivalence-frame";
  animationId: typeof KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID;
  operationId: string;
  sourceLatex: string;
  relationLatex: "=";
  targetLatex: string;
  projection: KpVerifiedStateRetentionProjection;
  occurrences: KpCompiledLogProductEquivalenceOccurrencesV2;
  paintOwnership: KpCompiledLogProductEquivalencePaintOwnershipV2;
  presentationPlan:
    KpCompiledEquationPresentationPlanV2<
      KpLogProductEquivalenceDomainPayloadV2
    >;
  readonly [kpVerifiedLogProductEquivalenceFrameBrand]: true;
}>;

const verifiedFrames = new WeakSet<object>();

export function createKpLogProductEquivalenceFrame():
KpVerifiedLogProductEquivalenceFrame {
  const operation = kpCanonicalCompiledLogProductOperation;
  const { source, target } = operation.contract;
  const expressionReferentId = "referent.log-product.equivalent-expression";
  const relationReferentId = "referent.log-product.equality";
  const projection = compileKpStateRetentionProjection({
    schemaVersion: "kp.state-retention-projection-draft.v1",
    id: "projection.log-product.equivalence-frame",
    policy: "equivalence-frame",
    semanticTransitionId: operation.transformation.id,
    referents: [{
      id: expressionReferentId,
      meaningId: "meaning.logarithm-product-law-equivalence"
    }, {
      id: relationReferentId,
      meaningId: "meaning.equality"
    }],
    sourceOccurrence: {
      id: kpLogProductEquivalenceFrameOccurrenceIds.source,
      stateId: source.id,
      kind: "source-state",
      referentIds: [expressionReferentId]
    },
    relationOccurrence: {
      id: kpLogProductEquivalenceFrameOccurrenceIds.relation,
      stateId: "state.log-product-equivalence.relation",
      kind: "relation",
      referentIds: [relationReferentId]
    },
    targetOccurrence: {
      id: kpLogProductEquivalenceFrameOccurrenceIds.target,
      stateId: target.id,
      kind: "target-state",
      referentIds: [expressionReferentId]
    },
    selectedOccurrenceId: kpLogProductEquivalenceFrameOccurrenceIds.target,
    historicalSnapshots: []
  });
  const occurrences = compileKpLogProductEquivalenceOccurrencesV2({
    transitionId: `transition.${operation.transformation.id}`,
    relationStateId: "state.log-product-equivalence.relation",
    relationEntityId: "selector.log-product-equivalence.relation",
    operation
  });
  const paintOwnership = compileKpLogProductEquivalencePaintOwnershipV2({
    occurrences
  });
  const presentationPlan = compilePresentationPlan({
    equalityEntityId: "selector.log-product-equivalence.relation",
    transitionId: occurrences.transitionId
  });
  const frame = Object.freeze({
    schemaVersion: "kp.log-product-equivalence-frame.v1" as const,
    kind: "verified-log-product-equivalence-frame" as const,
    animationId: KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID,
    operationId: operation.transformation.id,
    sourceLatex: source.latex,
    relationLatex: "=" as const,
    targetLatex: target.latex,
    projection,
    occurrences,
    paintOwnership,
    presentationPlan
  }) as KpVerifiedLogProductEquivalenceFrame;
  verifiedFrames.add(frame);
  return frame;
}

export function isKpVerifiedLogProductEquivalenceFrame(
  value: unknown
): value is KpVerifiedLogProductEquivalenceFrame {
  return typeof value === "object" && value !== null &&
    verifiedFrames.has(value) &&
    isKpVerifiedStateRetentionProjection(
      (value as KpVerifiedLogProductEquivalenceFrame).projection
    );
}

export const kpLogProductEquivalenceFrame =
  createKpLogProductEquivalenceFrame();

function compilePresentationPlan(input: {
  readonly equalityEntityId: string;
  readonly transitionId: string;
}): KpCompiledEquationPresentationPlanV2<
  KpLogProductEquivalenceDomainPayloadV2
> {
  const runtime = kpCanonicalLogProductSemanticMotionBundle;
  const { operation, request } = runtime;
  const records = operation.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Log equivalence presentation requires correspondence.");
  }
  const factorContinuityRecordIds = operation.contract.family.factors.map(
    ({ name }) => `correspondence.log-product.${name}-argument-continuity`
  );
  const targetNodes = listKpLogProductExpressionNodes(
    operation.contract.target
  );
  const connectorSemanticIds = new Set(
    operation.contract.family.connectorSemanticIds
  );
  const connectorEntityIds = targetNodes
    .filter(({ semanticId }) => connectorSemanticIds.has(semanticId))
    .map(({ id }) => id);
  const targetWrapperEntityIds = operation.contract.family.factors.flatMap(
    ({ targetWrapper }) => targetNodes
      .filter(({ semanticId }) => Object.values(targetWrapper).includes(
        semanticId
      ))
      .map(({ id }) => id)
  );
  const targetOperatorSemanticIds = new Set(
    operation.contract.family.factors.map(({ targetWrapper }) =>
      targetWrapper.operator)
  );
  const targetOperatorEntityIds = targetNodes
    .filter(({ semanticId }) => targetOperatorSemanticIds.has(semanticId))
    .map(({ id }) => id);
  const grammarResult = compileKpEquationGrammarV2({
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.log-product-equivalence.v2",
    assetId: KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID,
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: request.semanticSource,
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states: [{
      ...request.sourceState,
      objectIds: [...request.sourceState.objectIds,
        "object.log-product-equivalence.relation"],
      entityIds: [...request.sourceState.entityIds, input.equalityEntityId]
    }, {
      ...request.targetState,
      objectIds: [...request.targetState.objectIds,
        "object.log-product-equivalence.relation"],
      entityIds: [...request.targetState.entityIds, input.equalityEntityId]
    }],
    transitions: [{
      id: input.transitionId,
      transformationId: operation.transformation.id,
      sourceStateId: request.sourceState.id,
      targetStateId: request.targetState.id,
      operation: {
        operationId: request.operation.operationId,
        semanticClass: "transformation",
        roleBindings: request.operation.roleBindings,
        correspondenceMap: request.operation.correspondenceMap,
        semanticAuthorityIds: [
          operation.contract.lawId,
          operation.transformation.id
        ]
      },
      projection: { intent: "equivalence" },
      typographyPolicyId: "typography.equation.stage.v2",
      typographyRequirements: { largeOperators: [] },
      teachingIntent: request.teachingIntent
    }]
  });
  if (grammarResult.status !== "compiled") {
    throw new Error(
      `Log equivalence grammar v2 failed: ` +
      grammarResult.diagnostics.map(({ message }) => message).join("; ")
    );
  }
  const targetEntityIds = request.targetState.entityIds.filter(
    (id) => !connectorEntityIds.includes(id)
  );
  const planResult = compileKpEquationPresentationPlanV2({
    grammar: grammarResult.grammar,
    transitIntents: [{
      transitionId: input.transitionId,
      boundaries: [{
        id: "boundary.log-product-equivalence.equality",
        kind: "preserve-readable-semantic-boundary",
        boundaryEntityIds: [input.equalityEntityId],
        crossingRecordIds: factorContinuityRecordIds
      }],
      arrivals: [{
        id: "arrival.log-product-equivalence.target-syntax",
        kind: "join-semantic-target-cohort",
        recordIds: records.map(({ id }) => id),
        targetEntityIds,
        connectorEntityIds
      }]
    }],
    domainPayloads: [{
      kind: "equation-domain.log-product-equivalence.v2",
      transitionId: input.transitionId,
      authorityId: operation.contract.lawId,
      equalityEntityId: input.equalityEntityId,
      factorContinuityRecordIds,
      targetWrapperEntityIds,
      targetOperatorEntityIds,
      connectorEntityIds
    } satisfies KpLogProductEquivalenceDomainPayloadV2]
  });
  if (planResult.status !== "compiled") {
    throw new Error(
      `Log equivalence presentation v2 failed: ` +
      planResult.diagnostics.map(({ message }) => message).join("; ")
    );
  }
  return planResult.plan;
}
