import type {
  KpAssetSelector,
  KpSemanticAssetObject
} from "./asset.ts";
import type { SelectorCorrespondenceRecord } from "./correspondence.ts";
import {
  executeKpDistributionCanonicalOperation
} from "./distribution-canonical-operation.ts";
import {
  getGeneratedDistributionTutorialFixtureSpec
} from "./generated-algebra-fixture-registry.ts";
import {
  createGeneratedDistributionTutorialFixture,
  type GeneratedDistributionTutorialFixture
} from "./generated-algebra-tutorial-fixture.ts";

export type KpDistributionPressureCausalEventId =
  | "target-slots-reserved"
  | "factor-fan-out"
  | "products-settled"
  | "source-content-departed"
  | "grouping-retired"
  | "connector-attached"
  | "native-target-ready";

export function createKpCanonicalDistributionPressureContract(input: {
  readonly fixture?: GeneratedDistributionTutorialFixture | undefined;
} = {}) {
  const fixture = input.fixture ?? canonicalFixture();
  if (
    fixture.id !== "generated.distribution.expand-a-sum" ||
    fixture.familyId !== "generated.distribution"
  ) {
    throw new Error("The distribution pressure contract requires the canonical expand-a-sum fixture.");
  }
  const transformation = fixture.transformations[0];
  if (
    fixture.transformations.length !== 1 ||
    transformation?.transformType !== "distributeMultiplication"
  ) {
    throw new Error("The distribution pressure contract requires one distributeMultiplication transformation.");
  }
  const sourceObjectId = transformation.sourceObjectIds[0];
  const targetObjectId = transformation.targetObjectIds[0];
  if (
    transformation.sourceObjectIds.length !== 1 ||
    transformation.targetObjectIds.length !== 1 ||
    sourceObjectId === undefined ||
    targetObjectId === undefined
  ) {
    throw new Error("Distribution pressure requires one explicit source and target object.");
  }
  const sourceObject = requiredObject(fixture, sourceObjectId, "source");
  const targetObject = requiredObject(fixture, targetObjectId, "target");
  const source = {
    objectId: sourceObject.id,
    exactLatex: requiredLatex(sourceObject, "source", "a(b + c)"),
    factorSelectorId: requiredSelector(sourceObject, "factor", "source factor selector").id,
    leftAddendSelectorId:
      requiredSelector(sourceObject, "left-term", "source left addend selector").id,
    connectorSelectorId:
      requiredSelector(sourceObject, "plus", "source connector selector").id,
    rightAddendSelectorId:
      requiredSelector(sourceObject, "right-term", "source right addend selector").id,
    groupingSelectorIds: Object.freeze([
      requiredSelector(sourceObject, "left-paren", "source left grouping selector").id,
      requiredSelector(sourceObject, "right-paren", "source right grouping selector").id
    ] as const)
  } as const;
  const target = {
    objectId: targetObject.id,
    exactLatex: requiredLatex(targetObject, "target", "ab + ac"),
    leftFactorSelectorId:
      requiredSelector(targetObject, "left-factor", "target left factor selector").id,
    leftAddendSelectorId:
      requiredSelector(targetObject, "left-term", "target left addend selector").id,
    connectorSelectorId:
      requiredSelector(targetObject, "plus", "target connector selector").id,
    rightFactorSelectorId:
      requiredSelector(targetObject, "right-factor", "target right factor selector").id,
    rightAddendSelectorId:
      requiredSelector(targetObject, "right-term", "target right addend selector").id
  } as const;

  requireExactSelectorSet(sourceObject, [
    source.factorSelectorId,
    source.groupingSelectorIds[0],
    source.leftAddendSelectorId,
    source.connectorSelectorId,
    source.rightAddendSelectorId,
    source.groupingSelectorIds[1]
  ]);
  requireExactSelectorSet(targetObject, [
    target.leftFactorSelectorId,
    target.leftAddendSelectorId,
    target.connectorSelectorId,
    target.rightFactorSelectorId,
    target.rightAddendSelectorId
  ]);

  const operationExecution = executeKpDistributionCanonicalOperation({
    transformation,
    roleBindings: {
      "common-factor": source.factorSelectorId,
      "source-addends": [source.leftAddendSelectorId, source.rightAddendSelectorId],
      "source-connectors": source.connectorSelectorId,
      "grouping-artifacts": source.groupingSelectorIds,
      "factor-copies": [target.leftFactorSelectorId, target.rightFactorSelectorId],
      "distributed-addends": [target.leftAddendSelectorId, target.rightAddendSelectorId],
      "target-connectors": target.connectorSelectorId
    }
  });
  validateAuthoredCorrespondence({
    authored: transformation.correspondenceMap?.records,
    compiled: operationExecution.correspondenceMap.records
  });

  return Object.freeze({
    schemaVersion: "kp.distribution-pressure-contract.v1" as const,
    id: "contract.distribution.expand-a-sum" as const,
    animationId: "animation.generated.distribution.expand-a-sum" as const,
    lawId: "law.algebra.distributive-property" as const,
    direction: "expand-product-over-sum" as const,
    source: Object.freeze(source),
    target: Object.freeze(target),
    rewriteFrontier: Object.freeze({
      kind: "standalone-expression" as const,
      sourceObjectId,
      targetObjectId,
      anchoredContextSelectorIds: Object.freeze([] as const)
    }),
    factorFanOut: Object.freeze({
      relation: "fan-out" as const,
      sourceFactorSelectorId: source.factorSelectorId,
      targetFactorSelectorIds: Object.freeze([
        target.leftFactorSelectorId,
        target.rightFactorSelectorId
      ] as const),
      provenance: "derived-copies" as const,
      order: "source-addend-order" as const
    }),
    continuants: Object.freeze([
      continuant("left-addend", source.leftAddendSelectorId, target.leftAddendSelectorId),
      continuant("connector", source.connectorSelectorId, target.connectorSelectorId),
      continuant("right-addend", source.rightAddendSelectorId, target.rightAddendSelectorId)
    ]),
    productAttachments: Object.freeze([
      Object.freeze({
        id: "attachment.distribution.product.left" as const,
        order: 0 as const,
        memberSelectorIds: Object.freeze([
          target.leftFactorSelectorId,
          target.leftAddendSelectorId
        ] as const),
        topology: "ordered-product" as const
      }),
      Object.freeze({
        id: "attachment.distribution.product.right" as const,
        order: 1 as const,
        memberSelectorIds: Object.freeze([
          target.rightFactorSelectorId,
          target.rightAddendSelectorId
        ] as const),
        topology: "ordered-product" as const
      })
    ]),
    connectorAttachment: Object.freeze({
      sourceSelectorId: source.connectorSelectorId,
      targetSelectorId: target.connectorSelectorId,
      relation: "identity" as const,
      betweenProductAttachmentIds: Object.freeze([
        "attachment.distribution.product.left",
        "attachment.distribution.product.right"
      ] as const),
      motionConstraint: "follow-products-on-math-axis" as const
    }),
    groupingRetirement: Object.freeze({
      sourceSelectorIds: source.groupingSelectorIds,
      relation: "removal" as const,
      timing: "after-source-content-departs" as const
    }),
    forbiddenIdentityPairs: Object.freeze([
      forbiddenIdentity(source.factorSelectorId, target.leftFactorSelectorId),
      forbiddenIdentity(source.factorSelectorId, target.rightFactorSelectorId)
    ]),
    causalOrder: Object.freeze([
      edge("target-slots-reserved", "factor-fan-out"),
      edge("factor-fan-out", "products-settled"),
      edge("source-content-departed", "grouping-retired"),
      edge("products-settled", "native-target-ready"),
      edge("connector-attached", "native-target-ready"),
      edge("grouping-retired", "native-target-ready")
    ]),
    operationExecution,
    rewind: Object.freeze({
      targetObjectId: sourceObjectId,
      exactLatex: "a(b + c)" as const
    })
  });
}

export type KpDistributionPressureContract =
  ReturnType<typeof createKpCanonicalDistributionPressureContract>;

export const kpCanonicalDistributionPressureContract =
  createKpCanonicalDistributionPressureContract();

function canonicalFixture(): GeneratedDistributionTutorialFixture {
  const spec = getGeneratedDistributionTutorialFixtureSpec(
    "generated.distribution.expand-a-sum"
  );
  if (spec === undefined) {
    throw new Error("The canonical distribution fixture is unavailable.");
  }
  return createGeneratedDistributionTutorialFixture(spec);
}

function requiredObject(
  fixture: GeneratedDistributionTutorialFixture,
  objectId: string,
  endpoint: "source" | "target"
): KpSemanticAssetObject {
  const object = fixture.bundle.objects.find(({ id }) => id === objectId);
  if (object === undefined) {
    throw new Error(`Distribution pressure is missing its ${endpoint} object ${objectId}.`);
  }
  return object;
}

function requiredLatex<T extends "a(b + c)" | "ab + ac">(
  object: KpSemanticAssetObject,
  endpoint: "source" | "target",
  expected: T
): T {
  const value = object.value;
  const latex = typeof value === "object" && value !== null && "latex" in value
    ? (value as { readonly latex?: unknown }).latex
    : undefined;
  if (latex !== expected) {
    throw new Error(
      `Distribution pressure ${endpoint} endpoint must be exactly ${expected}.`
    );
  }
  return expected;
}

function requiredSelector(
  object: KpSemanticAssetObject,
  suffix: string,
  label: string
): KpAssetSelector {
  const expectedId = `${object.id}.${suffix}`;
  const selector = object.selectors.find(({ id }) => id === expectedId);
  if (selector === undefined) {
    throw new Error(`Distribution pressure is missing its ${label} ${expectedId}.`);
  }
  return selector;
}

function requireExactSelectorSet(
  object: KpSemanticAssetObject,
  expected: readonly string[]
): void {
  const actual = object.selectors.map(({ id }) => id);
  if (
    actual.length !== expected.length ||
    actual.some((id) => !expected.includes(id)) ||
    new Set(actual).size !== actual.length
  ) {
    throw new Error(
      `Distribution pressure endpoint ${object.id} must expose its exact semantic selectors.`
    );
  }
}

function validateAuthoredCorrespondence(input: {
  readonly authored: readonly SelectorCorrespondenceRecord[] | undefined;
  readonly compiled: readonly SelectorCorrespondenceRecord[];
}): void {
  if (input.authored === undefined) {
    throw new Error("Distribution pressure requires authored correspondence authority.");
  }
  const authoredFanOut = input.authored[0];
  if (authoredFanOut?.relation !== "fan-out") {
    throw new Error("Distribution pressure requires explicit factor fan-out correspondence.");
  }
  const shape = (record: SelectorCorrespondenceRecord) => ({
    relation: record.relation,
    sourceSelectorIds: [...record.sourceSelectorIds],
    targetSelectorIds: [...record.targetSelectorIds]
  });
  const authored = input.authored.map(shape);
  const compiled = input.compiled.map(shape);
  const compiledWithCallerLifecycle = compiled.map((record, index) =>
    index === compiled.length - 1 && record.relation === "artifact"
      ? { ...record, relation: "removal" as const }
      : record
  );
  if (JSON.stringify(authored) !== JSON.stringify(compiledWithCallerLifecycle)) {
    throw new Error(
      "Distribution pressure authored correspondence must match canonical fan-out, attachment, and grouping provenance."
    );
  }
}

function continuant(
  role: "left-addend" | "connector" | "right-addend",
  sourceSelectorId: string,
  targetSelectorId: string
) {
  return Object.freeze({
    role,
    relation: "identity" as const,
    sourceSelectorId,
    targetSelectorId
  });
}

function forbiddenIdentity(sourceSelectorId: string, targetSelectorId: string) {
  return Object.freeze({
    sourceSelectorId,
    targetSelectorId,
    reason:
      "A distributed factor copy is derived through fan-out; equal glyphs do not establish identity."
  });
}

function edge(
  before: KpDistributionPressureCausalEventId,
  after: KpDistributionPressureCausalEventId
) {
  return Object.freeze({ before, after });
}
