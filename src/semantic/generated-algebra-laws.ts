import type {
  KpLawCheckResult,
  KpLawFailure
} from "./asset-laws.ts";
import {
  checkKpFlashcardReferenceClosure
} from "./asset-laws.ts";
import type {
  GeneratedAlgebraTutorialFixture
} from "./generated-algebra-tutorial-fixture.ts";
import type {
  KpSemanticTransformation
} from "./asset-transformation.ts";
import type {
  GeneratedAlgebraFixtureFamilyId
} from "./generated-algebra-fixture-registry.ts";
import {
  listGeneratedAlgebraTransformDefinitions,
  type GeneratedAlgebraTransformDefinition
} from "./generated-algebra-transform-definition-registry.ts";

type GeneratedAlgebraConsistencyTransformKind =
  | "cancellation"
  | "simplification";

export function checkGeneratedAlgebraCancellationSimplificationConsistency(
  fixtures: readonly GeneratedAlgebraTutorialFixture[]
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  fixtures.forEach((fixture, fixtureIndex) => {
    fixture.transformations.forEach((transformation, transformationIndex) => {
      const kind = classifyConsistencyTransform(transformation);

      if (kind === undefined) {
        return;
      }

      const path = `fixtures[${fixtureIndex}].transformations[${transformationIndex}]`;
      const label = kind === "cancellation" ? "cancellation" : "simplification";

      if (!transformation.preserves.includes("value")) {
        failures.push({
          path: `${path}.preserves`,
          message:
            `Generated algebra ${label} transform ${transformation.id} must preserve value.`
        });
      }

      if ((transformation.lawRefs ?? []).length === 0) {
        failures.push({
          path: `${path}.lawRefs`,
          message:
            `Generated algebra ${label} transform ${transformation.id} must cite at least one law.`
        });
      }

      if (kind === "cancellation" && transformation.correspondence.length === 0) {
        failures.push({
          path: `${path}.correspondence`,
          message:
            `Generated algebra cancellation transform ${transformation.id} must keep correspondence for persisted selectors.`
        });
      }
    });
  });

  return {
    lawId: "generated-algebra.cancellation-simplification-consistency",
    passed: failures.length === 0,
    failures
  };
}

export function checkGeneratedAlgebraFlashcardConsistency(
  fixtures: readonly GeneratedAlgebraTutorialFixture[]
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  fixtures.forEach((fixture, fixtureIndex) => {
    fixture.flashcards.forEach((card, cardIndex) => {
      const path = `fixtures[${fixtureIndex}].flashcards[${cardIndex}]`;
      const expectedIdPrefix = `card.${fixture.id}.`;

      if (!card.id.startsWith(expectedIdPrefix)) {
        failures.push({
          path: `${path}.id`,
          message:
            `Generated algebra flashcard ${card.id} id must start with ${expectedIdPrefix.slice(0, -1)}.`
        });
      }

      if (card.assetId !== fixture.bundle.id) {
        failures.push({
          path: `${path}.assetId`,
          message:
            `Generated algebra flashcard ${card.id} must reference asset ${fixture.bundle.id}.`
        });
      }

      if (card.prompt.trim().length === 0) {
        failures.push({
          path: `${path}.prompt`,
          message:
            `Generated algebra flashcard ${card.id} must have a non-empty prompt.`
        });
      }

      if (
        card.kind === "explain-transform" &&
        (card.transformationIds ?? []).length === 0
      ) {
        failures.push({
          path: `${path}.transformationIds`,
          message:
            `Generated algebra explain-transform flashcard ${card.id} must reference at least one transformation.`
        });
      }

      checkKpFlashcardReferenceClosure(card, {
        bundle: fixture.bundle,
        transformations: fixture.transformations
      }).failures.forEach((failure) => {
        failures.push({
          path: `${path}.${failure.path}`,
          message: failure.message
        });
      });
    });
  });

  return {
    lawId: "generated-algebra.flashcard-consistency",
    passed: failures.length === 0,
    failures
  };
}

export function checkGeneratedAlgebraTransformDefinitionCoverage(
  fixtures: readonly GeneratedAlgebraTutorialFixture[],
  definitions: readonly GeneratedAlgebraTransformDefinition[] =
    listGeneratedAlgebraTransformDefinitions()
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const promotedFamilies = new Set(
    definitions.map((definition) => definition.familyId)
  );
  const definitionsByFamilyAndType = new Map<
    string,
    GeneratedAlgebraTransformDefinition
  >();

  definitions.forEach((definition) => {
    definitionsByFamilyAndType.set(
      generatedTransformDefinitionKey(definition.familyId, definition.transformType),
      definition
    );
  });

  fixtures.forEach((fixture, fixtureIndex) => {
    if (!promotedFamilies.has(fixture.familyId)) {
      return;
    }

    fixture.transformations.forEach((transformation, transformationIndex) => {
      const definition = definitionsByFamilyAndType.get(
        generatedTransformDefinitionKey(fixture.familyId, transformation.transformType)
      );
      const path = `fixtures[${fixtureIndex}].transformations[${transformationIndex}]`;

      if (definition === undefined) {
        failures.push({
          path: `${path}.transformType`,
          message:
            `Generated algebra transform ${transformation.id} has no promoted definition for ${fixture.familyId}.${transformation.transformType}.`
        });
        return;
      }

      if ((definition.lawRefs ?? []).length === 0) {
        failures.push({
          path: `${path}.transformType`,
          message:
            `Generated algebra transform definition ${definition.id} must cite at least one law.`
        });
      }
    });
  });

  return {
    lawId: "generated-algebra.transform-definition-coverage",
    passed: failures.length === 0,
    failures
  };
}

function classifyConsistencyTransform(
  transformation: KpSemanticTransformation
): GeneratedAlgebraConsistencyTransformKind | undefined {
  if (transformation.transformType.startsWith("cancel")) {
    return "cancellation";
  }

  if (
    transformation.transformType.startsWith("simplify") ||
    transformation.transformType === "unwrapUnitExponent"
  ) {
    return "simplification";
  }

  return undefined;
}

function generatedTransformDefinitionKey(
  familyId: GeneratedAlgebraFixtureFamilyId,
  transformType: string
): string {
  return `${familyId}:${transformType}`;
}
