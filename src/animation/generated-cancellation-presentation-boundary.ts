import {
  kpCancellationOperationIdForTransformType,
  type KpCancellationOperationId
} from "../semantic/cancellation-presentation-authoring.ts";
import {
  createGeneratedLinearSolveTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import type {
  GeneratedLinearSolveTutorialFixtureSpec
} from "../semantic/generated-algebra-fixture-registry.ts";
import type {
  KpVerifiedInverseCancellationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  compileKpGeneratedAlgebraCancellationPresentationPlan
} from "./generated-algebra-cancellation-presentation.ts";

export const kpGeneratedCancellationDraftSchemaVersion =
  "kp.generated-cancellation-draft.v1" as const;

export interface KpGeneratedCancellationPresentation {
  readonly transformationId: string;
  readonly operationId: KpCancellationOperationId;
  readonly plan: KpVerifiedInverseCancellationPresentationPlan;
}

export interface KpGeneratedCancellationPresentationIssue {
  readonly code:
    | "draft.invalid"
    | "draft.unsupported"
    | "semantic.repair"
    | "presentation.repair";
  readonly path: string;
  readonly message: string;
}

export type KpGeneratedCancellationPresentationResult =
  | {
      readonly kind: "accepted";
      readonly fixtureId: string;
      readonly presentations:
        readonly KpGeneratedCancellationPresentation[];
    }
  | {
      readonly kind: "repair";
      readonly issues: readonly KpGeneratedCancellationPresentationIssue[];
    }
  | {
      readonly kind: "rejected";
      readonly issues: readonly KpGeneratedCancellationPresentationIssue[];
    };

const allowedKeys = new Set([
  "schemaVersion",
  "familyId",
  "id",
  "title",
  "variable",
  "addend",
  "coefficient",
  "solution"
]);

/**
 * External and LLM-authored data stops at algebraic meaning. The trusted
 * fixture compiler derives selector identities and lifecycle records, then the
 * nominal generated-operation compiler selects the role-complete plan.
 */
export function compileKpGeneratedCancellationPresentation(
  value: unknown
): KpGeneratedCancellationPresentationResult {
  if (!isRecord(value)) {
    return rejected(issue(
      "draft.invalid",
      "$",
      "Generated cancellation draft must be an object."
    ));
  }
  const unknownKeys = Object.keys(value).filter(
    (key) => !allowedKeys.has(key)
  );
  if (unknownKeys.length > 0) {
    return rejected(issue(
      "draft.unsupported",
      "$",
      `Generated cancellation drafts cannot author fields: ` +
      `${unknownKeys.sort().join(", ")}.`
    ));
  }
  if (
    value["schemaVersion"] !== kpGeneratedCancellationDraftSchemaVersion ||
    value["familyId"] !== "generated.linear-solve"
  ) {
    return rejected(issue(
      "draft.invalid",
      "$",
      `Expected ${kpGeneratedCancellationDraftSchemaVersion} for ` +
      "generated.linear-solve."
    ));
  }

  const semanticIssues = validateSemanticDraft(value);
  if (semanticIssues.length > 0) {
    return repair(semanticIssues);
  }
  const fixtureInput: GeneratedLinearSolveTutorialFixtureSpec = {
    id: value["id"] as string,
    title: value["title"] as string,
    variable: value["variable"] as string,
    solution: value["solution"] as number,
    ...(value["addend"] === undefined
      ? {}
      : { addend: value["addend"] as number }),
    ...(value["coefficient"] === undefined
      ? {}
      : { coefficient: value["coefficient"] as number })
  };

  try {
    const fixture = createGeneratedLinearSolveTutorialFixture(fixtureInput);
    const presentations = fixture.transformations.flatMap(
      (transformation): readonly KpGeneratedCancellationPresentation[] => {
        const operationId =
          kpCancellationOperationIdForTransformType(
            transformation.transformType
          );
        if (operationId === undefined) return [];
        const plan =
          compileKpGeneratedAlgebraCancellationPresentationPlan(
            transformation
          );
        if (plan === undefined) {
          throw new Error(
            `Generated cancellation ${transformation.id} lacks trusted ` +
            "presentation authority."
          );
        }
        return [Object.freeze({
          transformationId: transformation.id,
          operationId,
          plan
        })];
      }
    );
    if (presentations.length === 0) {
      return repair([issue(
        "presentation.repair",
        "$",
        "Generated algebra draft produced no supported cancellation."
      )]);
    }
    return Object.freeze({
      kind: "accepted",
      fixtureId: fixture.id,
      presentations: Object.freeze(presentations)
    });
  } catch (error) {
    return repair([issue(
      "presentation.repair",
      "$",
      error instanceof Error ? error.message : String(error)
    )]);
  }
}

function validateSemanticDraft(
  value: Readonly<Record<string, unknown>>
): readonly KpGeneratedCancellationPresentationIssue[] {
  const issues: KpGeneratedCancellationPresentationIssue[] = [];
  if (!isText(value["id"]) ||
      !/^generated\.linear-solve\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(
        value["id"]
      )) {
    issues.push(issue(
      "semantic.repair",
      "$.id",
      "id must be a generated.linear-solve namespace id."
    ));
  }
  if (!isText(value["title"])) {
    issues.push(issue(
      "semantic.repair",
      "$.title",
      "title must be non-empty."
    ));
  }
  if (
    !isText(value["variable"]) ||
    !/^[A-Za-z][A-Za-z0-9_]*$/.test(value["variable"])
  ) {
    issues.push(issue(
      "semantic.repair",
      "$.variable",
      "variable must be an algebraic identifier."
    ));
  }
  if (!isFiniteNumber(value["solution"])) {
    issues.push(issue(
      "semantic.repair",
      "$.solution",
      "solution must be a finite number."
    ));
  }
  if (
    value["addend"] === undefined &&
    value["coefficient"] === undefined
  ) {
    issues.push(issue(
      "semantic.repair",
      "$",
      "linear solve cancellation requires an addend or coefficient."
    ));
  }
  if (
    value["addend"] !== undefined &&
    (!isFiniteNumber(value["addend"]) || value["addend"] === 0)
  ) {
    issues.push(issue(
      "semantic.repair",
      "$.addend",
      "addend must be a finite non-zero number."
    ));
  }
  if (
    value["coefficient"] !== undefined &&
    (
      !isFiniteNumber(value["coefficient"]) ||
      !Number.isInteger(value["coefficient"]) ||
      value["coefficient"] === 0
    )
  ) {
    issues.push(issue(
      "semantic.repair",
      "$.coefficient",
      "coefficient must be a non-zero integer."
    ));
  }
  return Object.freeze(issues);
}

function rejected(
  issueValue: KpGeneratedCancellationPresentationIssue
): KpGeneratedCancellationPresentationResult {
  return Object.freeze({
    kind: "rejected",
    issues: Object.freeze([issueValue])
  });
}

function repair(
  issues: readonly KpGeneratedCancellationPresentationIssue[]
): KpGeneratedCancellationPresentationResult {
  return Object.freeze({
    kind: "repair",
    issues: Object.freeze([...issues])
  });
}

function issue(
  code: KpGeneratedCancellationPresentationIssue["code"],
  path: string,
  message: string
): KpGeneratedCancellationPresentationIssue {
  return Object.freeze({ code, path, message });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
