import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetBundle,
  type KpAssetMetadataValue
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type {
  KpCarrierPreservingSimplificationEvidenceCandidate
} from "./carrier-preserving-simplification-evidence.ts";

export interface KpCarrierPreservingSimplificationExemplar {
  readonly id: "operation-evaluation.two-times-one-carrier";
  readonly title: "2 \\times 1 → 2";
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}

const EXEMPLAR_ID = "operation-evaluation.two-times-one-carrier";
const SOURCE_ID = `expression.${EXEMPLAR_ID}.source`;
const TARGET_ID = `expression.${EXEMPLAR_ID}.target`;
const TRANSFORMATION_ID = `transform.${EXEMPLAR_ID}.simplify-identity`;
const OPERATION_ID = "kp.algebra.simplify-multiplicative-identity";
const LAW_ID = "law.arithmetic.multiplicative-identity";

export const kpTwoTimesOneCarrierSelectorIds = Object.freeze({
  sourceCarrier: `${SOURCE_ID}.carrier`,
  sourceOperator: `${SOURCE_ID}.operator`,
  sourceIdentityWitness: `${SOURCE_ID}.identity-witness`,
  targetCarrier: `${TARGET_ID}.carrier`
} as const);

/**
 * This fixture deliberately gives equal source/target glyphs different state-
 * local IDs. Their identity comes only from the correspondence record, which
 * prevents glyph equality from becoming semantic authority.
 */
export function createKpTwoTimesOneCarrierExemplar():
KpCarrierPreservingSimplificationExemplar {
  const bundle = createKpAssetBundle({
    id: `asset.${EXEMPLAR_ID}`,
    title: "Two times one carrier-preserving simplification",
    objects: [
      createKpSemanticAssetObject({
        id: SOURCE_ID,
        objectType: "expression",
        title: "Multiplicative identity expression",
        value: { latex: "2 \\times 1" },
        selectors: [
          selector(kpTwoTimesOneCarrierSelectorIds.sourceCarrier, "2", "term", {
            evaluationRole: "carrier",
            semanticOperationId: OPERATION_ID
          }),
          selector(kpTwoTimesOneCarrierSelectorIds.sourceOperator, "\\times", "operator", {
            evaluationRole: "removed-operator",
            semanticOperationId: OPERATION_ID
          }),
          selector(kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness, "1", "term", {
            evaluationRole: "identity-witness",
            identityLawId: LAW_ID,
            semanticOperationId: OPERATION_ID
          })
        ]
      }),
      createKpSemanticAssetObject({
        id: TARGET_ID,
        objectType: "expression",
        title: "Preserved carrier",
        value: { latex: "2" },
        selectors: [
          selector(kpTwoTimesOneCarrierSelectorIds.targetCarrier, "2", "term", {
            evaluationRole: "carrier-target",
            semanticOperationId: OPERATION_ID
          })
        ],
        provenance: {
          kind: "transformed",
          sourceIds: [SOURCE_ID],
          transformationId: TRANSFORMATION_ID
        }
      })
    ]
  });
  const transformation = createKpSemanticTransformation({
    id: TRANSFORMATION_ID,
    transformType: "simplifyMultiplicativeIdentity",
    title: "Remove the multiplicative identity while preserving its carrier",
    sourceObjectIds: [SOURCE_ID],
    targetObjectIds: [TARGET_ID],
    preserves: ["identity", "value"],
    correspondenceMap: {
      id: `${TRANSFORMATION_ID}.correspondence`,
      records: [
        {
          id: `${TRANSFORMATION_ID}.carrier-persists`,
          relation: "identity",
          sourceSelectorIds: [kpTwoTimesOneCarrierSelectorIds.sourceCarrier],
          targetSelectorIds: [kpTwoTimesOneCarrierSelectorIds.targetCarrier],
          summary: "The left factor remains the same semantic value in the result."
        },
        {
          id: `${TRANSFORMATION_ID}.operator-removed`,
          relation: "removal",
          sourceSelectorIds: [kpTwoTimesOneCarrierSelectorIds.sourceOperator],
          targetSelectorIds: [],
          summary: "The multiplication operator exits with the identity witness."
        },
        {
          id: `${TRANSFORMATION_ID}.identity-witness-removed`,
          relation: "removal",
          sourceSelectorIds: [
            kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
          ],
          targetSelectorIds: [],
          summary: "The multiplicative identity witness exits without becoming the result."
        }
      ]
    },
    assumptions: ["One is the multiplicative identity: 2 × 1 = 2."],
    lawRefs: [{ id: LAW_ID, level: "strict" }]
  });

  return Object.freeze({
    id: EXEMPLAR_ID,
    title: "2 \\times 1 → 2",
    bundle,
    transformation
  });
}

export function createKpTwoTimesOneCarrierEvidenceCandidate():
KpCarrierPreservingSimplificationEvidenceCandidate {
  return Object.freeze({
    schemaVersion: "kp.carrier-preserving-simplification-evidence.v1" as const,
    id: "kp.carrier-evidence.two-times-one.v1",
    transformationId: TRANSFORMATION_ID,
    endpoints: Object.freeze({
      sourceObjectId: SOURCE_ID,
      targetObjectId: TARGET_ID
    }),
    carrier: Object.freeze({
      correspondenceRecordId: `${TRANSFORMATION_ID}.carrier-persists`,
      sourceSelectorId: kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
      targetSelectorId: kpTwoTimesOneCarrierSelectorIds.targetCarrier
    }),
    identityLawWitness: Object.freeze({
      lawId: LAW_ID,
      sourceSelectorId:
        kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness,
      removalRecordId: `${TRANSFORMATION_ID}.identity-witness-removed`
    }),
    removedSyntaxCohort: Object.freeze({
      selectorIds: Object.freeze([
        kpTwoTimesOneCarrierSelectorIds.sourceOperator,
        kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
      ] as const),
      correspondenceRecordIds: Object.freeze([
        `${TRANSFORMATION_ID}.operator-removed`,
        `${TRANSFORMATION_ID}.identity-witness-removed`
      ] as const)
    }),
    stationaryContext: Object.freeze([])
  });
}

function selector(
  id: string,
  label: string,
  kind: "term" | "operator",
  metadata: Readonly<Record<string, KpAssetMetadataValue>>
) {
  return { id, kind, label, metadata };
}
