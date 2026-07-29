import type {
  KpAnimatedPresentationCoverage
} from "../../animation/operation-presentation-plan-types.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import {
  createSemanticTransformationRef
} from "../../semantic/animation.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../../domain-ir/public-api.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../../semantic/transformation-composition.ts";
import {
  projectKpReaderEquationRenderPlan
} from "./equation-render-plan.ts";
import type {
  KpReaderEquationTransitionPresentationPlan
} from "./equation-transition-presentation-plan.ts";

export type KpEquationPresentationCatalogDirection =
  | "forward"
  | "rewind";

export type KpEquationPresentationCatalogEntryStatus =
  | "verified-animated"
  | "explicit-static"
  | "incomplete";

export type KpEquationPresentationCatalogIssueCode =
  | "catalog.duplicate-animation"
  | "catalog.missing-transformation"
  | "catalog.presentation-planning-failed"
  | "catalog.missing-transition"
  | "catalog.semantic-fallback"
  | "catalog.directional-coverage-mismatch";

export interface KpEquationPresentationCatalogEntry {
  readonly animationId: string;
  readonly transformationId: string;
  readonly direction: KpEquationPresentationCatalogDirection;
  readonly status: KpEquationPresentationCatalogEntryStatus;
  readonly planKind?:
    KpReaderEquationTransitionPresentationPlan["planKind"] | undefined;
  readonly staticReason?: string | undefined;
}

export interface KpEquationPresentationCatalogIssue {
  readonly code: KpEquationPresentationCatalogIssueCode;
  readonly animationId: string;
  readonly transformationId?: string | undefined;
  readonly direction?: KpEquationPresentationCatalogDirection | undefined;
  readonly message: string;
}

export interface KpEquationPresentationCatalogExclusion {
  readonly animationId: string;
  readonly transformationId: string;
  readonly reason: "not-an-equation-transition";
  readonly message: string;
}

export interface KpEquationPresentationCatalogReport {
  readonly kind: "equation-presentation-catalog-report";
  readonly animationCount: number;
  readonly claimedTransformationCount: number;
  readonly equationTransformationCount: number;
  readonly excludedTransformationCount: number;
  readonly directionalEntryCount: number;
  readonly coverage: KpAnimatedPresentationCoverage;
  readonly entries: readonly KpEquationPresentationCatalogEntry[];
  readonly exclusions:
    readonly KpEquationPresentationCatalogExclusion[];
  readonly issues: readonly KpEquationPresentationCatalogIssue[];
}

export interface KpEquationPresentationCatalogPromotionDecision {
  readonly kind: "equation-presentation-catalog-promotion-decision";
  readonly status: "approved" | "blocked";
  readonly coverage: KpAnimatedPresentationCoverage;
  readonly diagnostics: readonly string[];
}

/**
 * Catalog promotion is stricter than catalog validity: an explicit static
 * checkpoint is an honest supported state, but it cannot be advertised as a
 * fully animated canonical implementation.
 */
export function decideKpEquationPresentationCatalogPromotion(
  report: KpEquationPresentationCatalogReport
): KpEquationPresentationCatalogPromotionDecision {
  const diagnostics = report.issues.map(({ code, message }) =>
    `${code}: ${message}`
  );
  if (
    report.coverage === "contains-explicit-static" &&
    diagnostics.length === 0
  ) {
    diagnostics.push(
      "Catalog contains explicit static checkpoints and is not fully animated."
    );
  }
  if (
    report.coverage === "incomplete" &&
    diagnostics.length === 0
  ) {
    diagnostics.push("Catalog presentation coverage is incomplete.");
  }
  return Object.freeze({
    kind: "equation-presentation-catalog-promotion-decision",
    status:
      report.coverage === "verified-animated" &&
      diagnostics.length === 0
        ? "approved"
        : "blocked",
    coverage: report.coverage,
    diagnostics: Object.freeze(diagnostics)
  });
}

/**
 * Every transformation claimed by an equation render target is planned alone
 * in both directions. This bypasses timeline sampling on purpose: a catalog
 * item cannot hide an unplanned operation behind a phase that never activates.
 */
export function checkKpEquationPresentationCatalog(
  assets: readonly KpAnimationAsset[]
): KpEquationPresentationCatalogReport {
  const entries: KpEquationPresentationCatalogEntry[] = [];
  const exclusions: KpEquationPresentationCatalogExclusion[] = [];
  const issues: KpEquationPresentationCatalogIssue[] = [];
  const seenAnimationIds = new Set<string>();
  let claimedTransformationCount = 0;
  let equationTransformationCount = 0;

  for (const animation of assets) {
    if (seenAnimationIds.has(animation.id)) {
      issues.push(issue({
        code: "catalog.duplicate-animation",
        animationId: animation.id,
        message: `Catalog repeats animation ${animation.id}.`
      }));
      continue;
    }
    seenAnimationIds.add(animation.id);
    const transformationIds = equationTransformationIds(animation);
    claimedTransformationCount += transformationIds.length;
    const transformations = new Map(
      animation.transformations.map((transformation) => [
        transformation.id,
        transformation
      ])
    );

    for (const transformationId of transformationIds) {
      if (!transformations.has(transformationId)) {
        issues.push(issue({
          code: "catalog.missing-transformation",
          animationId: animation.id,
          transformationId,
          message:
            `Equation target in ${animation.id} references missing ` +
            `transformation ${transformationId}.`
        }));
        continue;
      }
      const transformation = transformations.get(transformationId)!;
      const semantic = compileKpSemanticEquationTransitionResult({
        transformation,
        bundle: animation.bundle,
        unsupportedPolicy: "typed-gap"
      });
      if (semantic.ir === undefined) {
        exclusions.push(Object.freeze({
          animationId: animation.id,
          transformationId,
          reason: "not-an-equation-transition",
          message:
            semantic.diagnostics.map(({ message }) => message).join(" ") ||
            `${transformationId} does not compile to equation transition IR.`
        }));
        continue;
      }
      equationTransformationCount += 1;
      const directional: KpEquationPresentationCatalogEntry[] = [];
      for (const direction of ["forward", "rewind"] as const) {
        const result = inspectDirection({
          animation,
          transformationId,
          direction
        });
        entries.push(result.entry);
        directional.push(result.entry);
        if (result.issue !== undefined) issues.push(result.issue);
      }
      if (
        directional.length === 2 &&
        (
          directional[0]?.status !== directional[1]?.status ||
          directional[0]?.planKind !== directional[1]?.planKind ||
          directional[0]?.staticReason !== directional[1]?.staticReason
        )
      ) {
        issues.push(issue({
          code: "catalog.directional-coverage-mismatch",
          animationId: animation.id,
          transformationId,
          message:
            `Equation transformation ${transformationId} does not have ` +
            "matching forward and rewind presentation coverage."
        }));
      }
    }
  }

  const coverage =
    issues.length > 0 ||
    equationTransformationCount === 0 ||
    entries.some(({ status }) => status === "incomplete")
      ? "incomplete"
      : entries.some(({ status }) => status === "explicit-static")
        ? "contains-explicit-static"
        : "verified-animated";
  return Object.freeze({
    kind: "equation-presentation-catalog-report",
    animationCount: seenAnimationIds.size,
    claimedTransformationCount,
    equationTransformationCount,
    excludedTransformationCount: exclusions.length,
    directionalEntryCount: entries.length,
    coverage,
    entries: Object.freeze(entries),
    exclusions: Object.freeze(exclusions),
    issues: Object.freeze(issues)
  });
}

function equationTransformationIds(
  animation: KpAnimationAsset
): readonly string[] {
  const targets = animation.renderTargets.filter(
    ({ kind }) => kind === "equation"
  );
  if (targets.length === 0) return [];
  const allTransformationIds = animation.transformations.map(({ id }) => id);
  return Object.freeze([...new Set(targets.flatMap((target) =>
    target.transformationIds ?? allTransformationIds
  ))]);
}

function inspectDirection(input: {
  readonly animation: KpAnimationAsset;
  readonly transformationId: string;
  readonly direction: KpEquationPresentationCatalogDirection;
}): {
  readonly entry: KpEquationPresentationCatalogEntry;
  readonly issue?: KpEquationPresentationCatalogIssue | undefined;
} {
  try {
    const transformation = input.animation.transformations.find(
      ({ id }) => id === input.transformationId
    )!;
    // Catalog coverage concerns one operation's presentation authority. An
    // isolated leaf prevents an unrelated parallel timeline cohort from
    // turning this check into a composition/layout audit.
    const animation: KpAnimationAsset = {
      ...input.animation,
      transformations: [transformation],
      transformationTree: createEditableSemanticTransformationTree({
        root: createSemanticTransformationLeaf(
          createSemanticTransformationRef({
            id: transformation.id,
            kind: transformation.transformType,
            sourceObjectIds: transformation.sourceObjectIds,
            targetObjectIds: transformation.targetObjectIds,
            preserves: transformation.preserves,
            summary: transformation.title
          })
        )
      })
    };
    const renderPlan = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame: {
        id:
          `catalog-frame.${input.animation.id}.` +
          `${input.transformationId}.${input.direction}`,
        animationId: input.animation.id,
        clock: {
          direction: input.direction,
          progress: 0.5
        },
        phase: {
          phaseIndex: 0,
          phaseId: `catalog-phase.${input.transformationId}`
        },
        activeTransformationIds: [input.transformationId],
        focusSelectorIds: []
      }
    });
    const transition = renderPlan.transitions.find(
      ({ id }) => id === input.transformationId
    );
    if (transition === undefined) {
      const message =
        renderPlan.diagnostics.map(({ message }) => message).join(" ") ||
        `Equation transformation ${input.transformationId} produced no transition.`;
      return incomplete(input, "catalog.missing-transition", message);
    }
    if (
      transition.semanticStatus !== "ready" &&
      transition.presentationPlan.planKind !== "explicit-static-checkpoint"
    ) {
      return incomplete(
        input,
        "catalog.semantic-fallback",
        `Equation transformation ${input.transformationId} has fallback ` +
        "semantics without an explicit static checkpoint."
      );
    }
    if (
      transition.presentationPlan.planKind ===
      "explicit-static-checkpoint"
    ) {
      return {
        entry: Object.freeze({
          animationId: input.animation.id,
          transformationId: input.transformationId,
          direction: input.direction,
          status: "explicit-static",
          planKind: transition.presentationPlan.planKind,
          staticReason: transition.presentationPlan.staticCheckpoint.reason
        })
      };
    }
    return {
      entry: Object.freeze({
        animationId: input.animation.id,
        transformationId: input.transformationId,
        direction: input.direction,
        status: "verified-animated",
        planKind: transition.presentationPlan.planKind
      })
    };
  } catch (error) {
    return incomplete(
      input,
      "catalog.presentation-planning-failed",
      error instanceof Error ? error.message : String(error)
    );
  }
}

function incomplete(
  input: {
    readonly animation: KpAnimationAsset;
    readonly transformationId: string;
    readonly direction: KpEquationPresentationCatalogDirection;
  },
  code: KpEquationPresentationCatalogIssueCode,
  message: string
): {
  readonly entry: KpEquationPresentationCatalogEntry;
  readonly issue: KpEquationPresentationCatalogIssue;
} {
  return {
    entry: Object.freeze({
      animationId: input.animation.id,
      transformationId: input.transformationId,
      direction: input.direction,
      status: "incomplete"
    }),
    issue: issue({
      code,
      animationId: input.animation.id,
      transformationId: input.transformationId,
      direction: input.direction,
      message
    })
  };
}

function issue(
  value: KpEquationPresentationCatalogIssue
): KpEquationPresentationCatalogIssue {
  return Object.freeze(value);
}
