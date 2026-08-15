import type {
  KpAssetBundle,
  KpAssetSelector,
  KpSemanticAssetObject
} from "./asset.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";
import {
  inferKpCancellationPresentationIntent,
  type KpCancellationTeachingGoal
} from "./cancellation-presentation-authoring.ts";
import type {
  KpCancellationPresentationIntent
} from "./cancellation-presentation-intent.ts";
import type { SelectorCorrespondenceRecord } from "./correspondence.ts";
import {
  getGeneratedLinearSolveTutorialFixtureSpec
} from "./generated-algebra-fixture-registry.ts";
import {
  createGeneratedLinearSolveTutorialFixture,
  type GeneratedLinearSolveTutorialFixture
} from "./generated-algebra-tutorial-fixture.ts";
import {
  isKpCompilerGeneratedAlgebraTransformation,
  kpGeneratedAlgebraTransformationFamilyId
} from "./generated-algebra-transformation-authority.ts";

const FIXTURE_ID = "generated.linear-solve.x-plus-3";
const OPERATION_ID = "kp.algebra.cancel-additive-inverses";
const CANCELLATION_RECORD_ID = "generated-additive-inverses-cancel";
const SOURCE_LATEX = "x + 3 - 3 = 7 - 3";
const TARGET_LATEX = "x = 7 - 3";

export type KpCancellationPressureCausalEventId =
  | "inverse-approach-started"
  | "inverse-contact-established"
  | "cancelled-material-retired"
  | "survivors-compacted"
  | "native-target-ready";

export type KpCancellationPressureContinuantRole =
  | "variable"
  | "relation"
  | "right-value"
  | "right-inverse";

export interface KpCancellationPressureContinuant {
  readonly role: KpCancellationPressureContinuantRole;
  readonly sourceSelectorId: string;
  readonly targetSelectorId: string;
  readonly label: string;
}

export interface KpCancellationPressureContract {
  readonly schemaVersion: "kp.cancellation-pressure-contract.v1";
  readonly id: "contract.cancellation.generated-x-plus-3";
  readonly animationId: "animation.generated.cancellation.additive-inverses";
  readonly fixtureId: typeof FIXTURE_ID;
  readonly operationId: typeof OPERATION_ID;
  readonly transformationId: string;
  readonly source: {
    readonly objectId: string;
    readonly exactLatex: typeof SOURCE_LATEX;
    readonly selectorIds: readonly string[];
  };
  readonly target: {
    readonly objectId: string;
    readonly exactLatex: typeof TARGET_LATEX;
    readonly selectorIds: readonly string[];
  };
  readonly inversePair: {
    readonly relation: "cancelation";
    readonly correspondenceRecordId: typeof CANCELLATION_RECORD_ID;
    readonly sourceSelectorIds: readonly [string, string];
    readonly signedLabels: readonly ["+3", "-3"];
    readonly provenance: "authored-additive-inverse-pair";
    readonly owner: "left-additive-slot";
  };
  readonly continuants: readonly KpCancellationPressureContinuant[];
  readonly protectedEqualGlyphs: readonly [
    {
      readonly rule: "distinct-source-identity";
      readonly leftSelectorId: string;
      readonly rightSelectorId: string;
      readonly label: "-3";
    },
    {
      readonly rule: "protected-target-successor";
      readonly sourceSelectorId: string;
      readonly targetSelectorId: string;
      readonly excludedSourceSelectorId: string;
      readonly label: "-3";
    }
  ];
  readonly presentation: {
    readonly teachingGoal: Extract<KpCancellationTeachingGoal, "preserve-flow">;
    readonly intent: KpCancellationPresentationIntent;
    readonly identityBeat: "implicit";
  };
  readonly lifecycle: {
    readonly cancelledPair: "explicit-cancelation";
    readonly identity: "implicit-additive-identity";
    readonly continuants: "identity-preserving";
    readonly introducedEndpointMaterial: readonly [];
  };
  readonly causalOrder: readonly {
    readonly before: KpCancellationPressureCausalEventId;
    readonly after: KpCancellationPressureCausalEventId;
  }[];
  readonly rewind: {
    readonly targetObjectId: string;
    readonly exactLatex: typeof SOURCE_LATEX;
    readonly reconstruction: "restore-authored-inverse-pair-from-shared-contact";
  };
}

export interface CreateKpCanonicalCancellationPressureContractInput {
  readonly fixture?: GeneratedLinearSolveTutorialFixture | undefined;
}

/**
 * This contract deliberately validates correspondence semantics before nominal
 * compiler provenance. Tests can therefore explain a forged identity precisely
 * instead of hiding it behind the broader "untrusted fixture" boundary.
 */
export function createKpCanonicalCancellationPressureContract(
  input: CreateKpCanonicalCancellationPressureContractInput = {}
): KpCancellationPressureContract {
  const fixture = input.fixture ?? canonicalFixture();
  if (fixture.id !== FIXTURE_ID) {
    throw new Error(`Cancellation pressure requires fixture ${FIXTURE_ID}.`);
  }
  if (fixture.familyId !== "generated.linear-solve") {
    throw new Error("Cancellation pressure requires the generated.linear-solve family.");
  }

  const transformation = onlyCancellationTransformation(fixture);
  const source = requiredObject(
    fixture.bundle,
    onlyId(transformation.sourceObjectIds, "source")
  );
  const target = requiredObject(
    fixture.bundle,
    onlyId(transformation.targetObjectIds, "target")
  );
  assertExactLatex(source, SOURCE_LATEX, "source");
  assertExactLatex(target, TARGET_LATEX, "target");

  const sourceIds = selectorIds(source);
  const targetIds = selectorIds(target);
  const leftAddend = selectorBySuffix(source, "lhs.addend");
  const leftInverse = selectorBySuffix(source, "lhs.subtract");
  const rightInverse = selectorBySuffix(source, "rhs.subtract");
  const expectedCanceled = [leftAddend.id, leftInverse.id] as const;
  const records = transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Cancellation pressure requires an explicit correspondence map.");
  }
  const cancellationRecord = records.find(
    ({ id }) => id === CANCELLATION_RECORD_ID
  );
  if (
    cancellationRecord?.relation !== "cancelation" ||
    !sameIds(cancellationRecord.sourceSelectorIds, expectedCanceled) ||
    cancellationRecord.targetSelectorIds.length !== 0
  ) {
    throw new Error("Cancellation pressure requires the exact authored left inverse pair.");
  }

  const continuantRoles = [
    ["variable", "lhs.variable"],
    ["relation", "equals"],
    ["right-value", "rhs.value"],
    ["right-inverse", "rhs.subtract"]
  ] as const;
  const continuants = continuantRoles.map(([role, suffix]) => {
    const sourceSelector = selectorBySuffix(source, suffix);
    const targetSelector = selectorBySuffix(target, suffix);
    const record = identityRecordForTarget(records, targetSelector.id);
    if (
      record === undefined ||
      record.sourceSelectorIds.length !== 1 ||
      record.sourceSelectorIds[0] !== sourceSelector.id
    ) {
      throw new Error(
        "Cancellation continuant correspondence does not match the canonical frontier."
      );
    }
    return {
      role,
      sourceSelectorId: sourceSelector.id,
      targetSelectorId: targetSelector.id,
      label: requiredLabel(sourceSelector)
    };
  });

  for (const record of records) {
    if (
      record.relation === "identity" &&
      record.sourceSelectorIds.some((id) => expectedCanceled.includes(id))
    ) {
      throw new Error("Canceled material cannot also preserve identity.");
    }
  }
  const expectedIdentitySources = new Set(
    continuants.map(({ sourceSelectorId }) => sourceSelectorId)
  );
  const expectedIdentityTargets = new Set(
    continuants.map(({ targetSelectorId }) => targetSelectorId)
  );
  const identityRecords = records.filter(({ relation }) => relation === "identity");
  if (
    identityRecords.length !== continuants.length ||
    identityRecords.some((record) =>
      record.sourceSelectorIds.length !== 1 ||
      record.targetSelectorIds.length !== 1 ||
      !expectedIdentitySources.has(record.sourceSelectorIds[0]!) ||
      !expectedIdentityTargets.has(record.targetSelectorIds[0]!)
    )
  ) {
    throw new Error(
      "Cancellation continuant correspondence does not match the canonical frontier."
    );
  }

  const teachingGoal = "preserve-flow" as const;
  const presentationIntent = inferKpCancellationPresentationIntent({
    operationId: OPERATION_ID,
    teachingGoal
  });

  if (
    !isKpCompilerGeneratedAlgebraTransformation(transformation) ||
    kpGeneratedAlgebraTransformationFamilyId(transformation) !==
      "generated.linear-solve"
  ) {
    throw new Error(
      "Cancellation pressure requires compiler-generated linear-solve authority."
    );
  }

  const rightInverseTarget = continuants[3]!;
  return deepFreeze({
    schemaVersion: "kp.cancellation-pressure-contract.v1",
    id: "contract.cancellation.generated-x-plus-3",
    animationId: "animation.generated.cancellation.additive-inverses",
    fixtureId: FIXTURE_ID,
    operationId: OPERATION_ID,
    transformationId: transformation.id,
    source: {
      objectId: source.id,
      exactLatex: SOURCE_LATEX,
      selectorIds: sourceIds
    },
    target: {
      objectId: target.id,
      exactLatex: TARGET_LATEX,
      selectorIds: targetIds
    },
    inversePair: {
      relation: "cancelation",
      correspondenceRecordId: CANCELLATION_RECORD_ID,
      sourceSelectorIds: expectedCanceled,
      signedLabels: ["+3", "-3"],
      provenance: "authored-additive-inverse-pair",
      owner: "left-additive-slot"
    },
    continuants,
    protectedEqualGlyphs: [
      {
        rule: "distinct-source-identity",
        leftSelectorId: leftInverse.id,
        rightSelectorId: rightInverse.id,
        label: "-3"
      },
      {
        rule: "protected-target-successor",
        sourceSelectorId: rightInverse.id,
        targetSelectorId: rightInverseTarget.targetSelectorId,
        excludedSourceSelectorId: leftInverse.id,
        label: "-3"
      }
    ],
    presentation: {
      teachingGoal,
      intent: presentationIntent,
      identityBeat: "implicit"
    },
    lifecycle: {
      cancelledPair: "explicit-cancelation",
      identity: "implicit-additive-identity",
      continuants: "identity-preserving",
      introducedEndpointMaterial: []
    },
    causalOrder: [
      {
        before: "inverse-approach-started",
        after: "inverse-contact-established"
      },
      {
        before: "inverse-contact-established",
        after: "cancelled-material-retired"
      },
      {
        before: "cancelled-material-retired",
        after: "survivors-compacted"
      },
      {
        before: "survivors-compacted",
        after: "native-target-ready"
      }
    ],
    rewind: {
      targetObjectId: source.id,
      exactLatex: SOURCE_LATEX,
      reconstruction: "restore-authored-inverse-pair-from-shared-contact"
    }
  });
}

export const kpCanonicalCancellationPressureContract =
  createKpCanonicalCancellationPressureContract();

function canonicalFixture(): GeneratedLinearSolveTutorialFixture {
  const spec = getGeneratedLinearSolveTutorialFixtureSpec(FIXTURE_ID);
  if (spec === undefined) {
    throw new Error(`Missing canonical generated fixture ${FIXTURE_ID}.`);
  }
  return createGeneratedLinearSolveTutorialFixture(spec);
}

function onlyCancellationTransformation(
  fixture: GeneratedLinearSolveTutorialFixture
): KpSemanticTransformation {
  const candidates = fixture.transformations.filter(
    ({ transformType }) => transformType === "cancelAdditiveInverses"
  );
  if (candidates.length !== 1) {
    throw new Error("Cancellation pressure requires exactly one additive cancellation.");
  }
  return candidates[0]!;
}

function requiredObject(
  bundle: KpAssetBundle,
  objectId: string
): KpSemanticAssetObject {
  const object = bundle.objects.find(({ id }) => id === objectId);
  if (object === undefined) throw new Error(`Missing semantic object ${objectId}.`);
  return object;
}

function onlyId(ids: readonly string[], endpoint: string): string {
  if (ids.length !== 1) {
    throw new Error(`Cancellation pressure requires one ${endpoint} object.`);
  }
  return ids[0]!;
}

function assertExactLatex(
  object: KpSemanticAssetObject,
  expected: string,
  endpoint: string
): void {
  const value = object.value as { readonly latex?: unknown };
  if (value.latex !== expected) {
    throw new Error(
      `Cancellation pressure ${endpoint} must be exactly ${expected}.`
    );
  }
}

function selectorBySuffix(
  object: KpSemanticAssetObject,
  suffix: string
): KpAssetSelector {
  const id = `${object.id}.${suffix}`;
  const selector = object.selectors.find((candidate) => candidate.id === id);
  if (selector === undefined) throw new Error(`Missing canonical selector ${id}.`);
  return selector;
}

function selectorIds(object: KpSemanticAssetObject): readonly string[] {
  return object.selectors.map(({ id }) => id);
}

function identityRecordForTarget(
  records: readonly SelectorCorrespondenceRecord[],
  targetSelectorId: string
): SelectorCorrespondenceRecord | undefined {
  return records.find((record) =>
    record.relation === "identity" &&
    record.targetSelectorIds.includes(targetSelectorId)
  );
}

function requiredLabel(selector: KpAssetSelector): string {
  if (selector.label === undefined) {
    throw new Error(`Canonical selector ${selector.id} requires a label.`);
  }
  return selector.label;
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach((child) => deepFreeze(child));
  return Object.freeze(value);
}
