import type {
  KpLawCheckResult,
  KpLawFailure
} from "./asset-laws.ts";
import {
  createGeneratedAlgebraTutorialFixtures
} from "./generated-algebra-tutorial-fixture.ts";
import {
  createGeneratedCalculusProblemFixtures
} from "./generated-calculus-problem-fixture.ts";
import type {
  GeneratedProblemAnimationFixture
} from "./generated-problem-fixture.ts";
import {
  createGeneratedLinearAlgebraProblemFixtures
} from "./generated-linear-algebra-problem-fixture.ts";

export type GeneratedProblemRegistryDomain =
  | "algebra"
  | "calculus"
  | "linear-algebra";

export interface GeneratedProblemRegistryRecord {
  readonly fixtureId: string;
  readonly familyId: string;
  readonly domain: GeneratedProblemRegistryDomain;
  readonly title: string;
  readonly bundleId: string;
  readonly animationId: string;
  readonly animationRowId: string;
  readonly traceId: string;
  readonly objectCount: number;
  readonly selectorCount: number;
  readonly transformationCount: number;
  readonly traceStepCount: number;
  readonly flashcardCount: number;
  readonly drillDownCount: number;
  readonly objectTypes: readonly string[];
  readonly transformationTypes: readonly string[];
  readonly transformDefinitionIds: readonly string[];
  readonly lawIds: readonly string[];
  readonly flashcardKinds: readonly string[];
  readonly searchFields: readonly string[];
}

export function createGeneratedProblemRegistryRecords():
  readonly GeneratedProblemRegistryRecord[] {
  return [
    ...createGeneratedAlgebraTutorialFixtures(),
    ...createGeneratedCalculusProblemFixtures(),
    ...createGeneratedLinearAlgebraProblemFixtures()
  ].map(createGeneratedProblemRegistryRecord);
}

export function findGeneratedProblemRegistryRecord(
  fixtureId: string
): GeneratedProblemRegistryRecord | undefined {
  return createGeneratedProblemRegistryRecords().find(
    (record) => record.fixtureId === fixtureId
  );
}

export function checkGeneratedProblemRegistrySurface(
  records: readonly GeneratedProblemRegistryRecord[] =
    createGeneratedProblemRegistryRecords()
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const fixtureIds = new Set<string>();
  const animationIds = new Set<string>();

  records.forEach((record, index) => {
    if (fixtureIds.has(record.fixtureId)) {
      failures.push({
        path: `records[${index}].fixtureId`,
        message: `Duplicate generated problem fixture id ${record.fixtureId}.`
      });
    }
    fixtureIds.add(record.fixtureId);

    if (animationIds.has(record.animationId)) {
      failures.push({
        path: `records[${index}].animationId`,
        message: `Duplicate generated problem animation id ${record.animationId}.`
      });
    }
    animationIds.add(record.animationId);

    if (record.animationId !== `animation.${record.fixtureId}`) {
      failures.push({
        path: `records[${index}].animationId`,
        message:
          `Generated problem registry record ${record.fixtureId} must map to animation.${record.fixtureId}.`
      });
    }

    if (record.objectCount < 1) {
      failures.push({
        path: `records[${index}].objectCount`,
        message:
          `Generated problem registry record ${record.fixtureId} must include semantic objects.`
      });
    }

    if (record.transformationCount < 1) {
      failures.push({
        path: `records[${index}].transformationCount`,
        message:
          `Generated problem registry record ${record.fixtureId} must include transformations.`
      });
    }

    if (record.traceStepCount < 1) {
      failures.push({
        path: `records[${index}].traceStepCount`,
        message:
          `Generated problem registry record ${record.fixtureId} must include trace steps.`
      });
    }
  });

  return {
    lawId: "generated-problem-registry.surface",
    passed: failures.length === 0,
    failures
  };
}

function createGeneratedProblemRegistryRecord(
  fixture: GeneratedProblemAnimationFixture
): GeneratedProblemRegistryRecord {
  const transformDefinitionIds = uniqueStrings(
    fixture.transformations.flatMap((transformation) =>
      transformation.definitionId === undefined
        ? []
        : [transformation.definitionId]
    )
  );
  const lawIds = uniqueStrings(
    fixture.transformations.flatMap((transformation) =>
      (transformation.lawRefs ?? []).map((lawRef) => lawRef.id)
    )
  );
  const objectTypes = uniqueStrings(
    fixture.bundle.objects.map((object) => object.objectType)
  );
  const transformationTypes = uniqueStrings(
    fixture.transformations.map((transformation) => transformation.transformType)
  );
  const flashcardKinds = uniqueStrings(
    fixture.flashcards.map((flashcard) => flashcard.kind)
  );
  const animationId = `animation.${fixture.id}`;
  const animationRowId = `animation-${fixture.id.replaceAll(".", "-")}`;
  const domain = generatedProblemDomainForFamily(fixture.familyId);

  return {
    fixtureId: fixture.id,
    familyId: fixture.familyId,
    domain,
    title: fixture.title,
    bundleId: fixture.bundle.id,
    animationId,
    animationRowId,
    traceId: fixture.trace.id,
    objectCount: fixture.bundle.objects.length,
    selectorCount: fixture.bundle.objects.reduce(
      (sum, object) => sum + object.selectors.length,
      0
    ),
    transformationCount: fixture.transformations.length,
    traceStepCount: fixture.trace.steps.length,
    flashcardCount: fixture.flashcards.length,
    drillDownCount: fixture.drillDownHooks.length,
    objectTypes,
    transformationTypes,
    transformDefinitionIds,
    lawIds,
    flashcardKinds,
    searchFields: uniqueStrings([
      "generated problem registry",
      "deterministic generated problem",
      fixture.id,
      fixture.familyId,
      domain,
      fixture.title,
      fixture.bundle.id,
      animationId,
      animationRowId,
      fixture.trace.id,
      ...objectTypes,
      ...transformationTypes,
      ...transformDefinitionIds,
      ...lawIds,
      ...flashcardKinds,
      ...fixture.bundle.objects.flatMap((object) => [
        object.id,
        object.title,
        object.objectType,
        ...object.selectors.flatMap((selector) => [
          selector.id,
          selector.kind,
          selector.label ?? "",
          selector.summary ?? ""
        ])
      ]),
      ...fixture.transformations.flatMap((transformation) => [
        transformation.id,
        transformation.title,
        transformation.transformType,
        transformation.definitionId ?? "",
        ...transformation.sourceObjectIds,
        ...transformation.targetObjectIds,
        ...(transformation.assumptions ?? []),
        ...(transformation.lawRefs ?? []).map((lawRef) => lawRef.id)
      ]),
      ...fixture.trace.steps.flatMap((step) => [
        step.id,
        step.latex,
        step.transformationId ?? "",
        step.rule ?? ""
      ]),
      ...fixture.flashcards.flatMap((flashcard) => [
        flashcard.id,
        flashcard.kind,
        flashcard.title,
        flashcard.prompt,
        ...(flashcard.selectorIds ?? []),
        ...(flashcard.transformationIds ?? [])
      ])
    ])
  };
}

function generatedProblemDomainForFamily(
  familyId: string
): GeneratedProblemRegistryDomain {
  if (familyId.startsWith("generated.calculus")) {
    return "calculus";
  }

  if (familyId.startsWith("generated.linear-algebra")) {
    return "linear-algebra";
  }

  return "algebra";
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))
  );
}
