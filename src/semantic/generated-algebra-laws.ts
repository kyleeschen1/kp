import type {
  KpLawCheckResult,
  KpLawFailure
} from "./asset-laws.ts";
import type {
  GeneratedAlgebraTutorialFixture
} from "./generated-algebra-tutorial-fixture.ts";
import type {
  KpSemanticTransformation
} from "./asset-transformation.ts";

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
