import type {
  KpAnimatedPresentationCoverage,
  KpVerifiedOperationPresentationPlan
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
import {
  resolveKpExecutableSuccessorMotifProgramRoute,
  type KpExecutableSuccessorMotifPrimitiveRoute
} from "./executable-successor-motif-program-adapter.ts";

const kpEquationPresentationCatalogReportAuthority = Symbol(
  "kp.equation-presentation-catalog-report"
);
const verifiedCatalogReports = new WeakSet<object>();

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
  | "catalog.missing-execution-route"
  | "catalog.unverified-report"
  | "catalog.directional-coverage-mismatch";

export type KpEquationPresentationExecutionRoute =
  | {
      readonly kind: "verified-operation-plan";
      readonly planKind:
        KpVerifiedOperationPresentationPlan["planKind"];
      readonly planIds: readonly [string, ...string[]];
    }
  | {
      readonly kind: "executable-motif-program";
      readonly programId: string;
      readonly programVersion: string;
      readonly programKind: "operation-evaluation";
      readonly primitiveRoute: KpExecutableSuccessorMotifPrimitiveRoute;
    };

export interface KpEquationPresentationCatalogEntry {
  readonly animationId: string;
  readonly transformationId: string;
  readonly direction: KpEquationPresentationCatalogDirection;
  readonly progress: number;
  readonly status: KpEquationPresentationCatalogEntryStatus;
  readonly planKind?:
    KpReaderEquationTransitionPresentationPlan["planKind"] | undefined;
  readonly operationPlanKind?:
    KpVerifiedOperationPresentationPlan["planKind"] | undefined;
  readonly executionRoute?:
    KpEquationPresentationExecutionRoute | undefined;
  readonly staticReason?: string | undefined;
  readonly sourceObjectIds?: readonly string[] | undefined;
  readonly targetObjectIds?: readonly string[] | undefined;
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
  readonly [kpEquationPresentationCatalogReportAuthority]: true;
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
  if (!verifiedCatalogReports.has(report)) {
    return Object.freeze({
      kind: "equation-presentation-catalog-promotion-decision",
      status: "blocked",
      coverage: "incomplete",
      diagnostics: Object.freeze([
        "catalog.unverified-report: Catalog promotion requires a fresh " +
        "conformance report, not caller-authored coverage."
      ])
    });
  }
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
        bundle: animation.bundle
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
        const result = inspectKpEquationPresentationOperation({
          animation,
          transformationId,
          direction,
          progress: 0.5
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
          directional[0]?.staticReason !== directional[1]?.staticReason ||
          routeFingerprint(directional[0]?.executionRoute) !==
            routeFingerprint(directional[1]?.executionRoute)
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
  const report = Object.freeze({
    kind: "equation-presentation-catalog-report",
    animationCount: seenAnimationIds.size,
    claimedTransformationCount,
    equationTransformationCount,
    excludedTransformationCount: exclusions.length,
    directionalEntryCount: entries.length,
    coverage,
    entries: Object.freeze(entries),
    exclusions: Object.freeze(exclusions),
    issues: Object.freeze(issues),
    [kpEquationPresentationCatalogReportAuthority]: true as const
  });
  verifiedCatalogReports.add(report);
  return report;
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

export function inspectKpEquationPresentationOperation(input: {
  readonly animation: KpAnimationAsset;
  readonly transformationId: string;
  readonly direction: KpEquationPresentationCatalogDirection;
  readonly progress: number;
}): {
  readonly entry: KpEquationPresentationCatalogEntry;
  readonly issue?: KpEquationPresentationCatalogIssue | undefined;
} {
  try {
    if (
      !Number.isFinite(input.progress) ||
      input.progress < 0 ||
      input.progress > 1
    ) {
      throw new Error("Catalog property progress must be between zero and one.");
    }
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
          progress: input.progress
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
          progress: input.progress,
          status: "explicit-static",
          planKind: transition.presentationPlan.planKind,
          staticReason: transition.presentationPlan.staticCheckpoint.reason,
          sourceObjectIds: Object.freeze(
            transition.source.map(({ objectId }) => objectId)
          ),
          targetObjectIds: Object.freeze(
            transition.target.map(({ objectId }) => objectId)
          )
        })
      };
    }
    const executionRoute = presentationExecutionRoute(
      transition.presentationPlan
    );
    if (executionRoute === undefined) {
      const message =
        `Equation transformation ${input.transformationId} declares ` +
        `${transition.presentationPlan.planKind} presentation without a ` +
        "verified executable route.";
      return {
        entry: Object.freeze({
          animationId: input.animation.id,
          transformationId: input.transformationId,
          direction: input.direction,
          progress: input.progress,
          status: "incomplete",
          planKind: transition.presentationPlan.planKind,
          sourceObjectIds: Object.freeze(
            transition.source.map(({ objectId }) => objectId)
          ),
          targetObjectIds: Object.freeze(
            transition.target.map(({ objectId }) => objectId)
          )
        }),
        issue: issue({
          code: "catalog.missing-execution-route",
          animationId: input.animation.id,
          transformationId: input.transformationId,
          direction: input.direction,
          message
        })
      };
    }
    const verifiedPlanKind = executionRoute.kind === "verified-operation-plan"
      ? executionRoute.planKind
      : operationPlanKind(transition.presentationPlan);
    return {
      entry: Object.freeze({
        animationId: input.animation.id,
        transformationId: input.transformationId,
        direction: input.direction,
        progress: input.progress,
        status: "verified-animated",
        planKind: transition.presentationPlan.planKind,
        ...(verifiedPlanKind === undefined
          ? {}
          : { operationPlanKind: verifiedPlanKind }),
        executionRoute,
        sourceObjectIds: Object.freeze(
          transition.source.map(({ objectId }) => objectId)
        ),
        targetObjectIds: Object.freeze(
          transition.target.map(({ objectId }) => objectId)
        )
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

function presentationExecutionRoute(
  plan: KpReaderEquationTransitionPresentationPlan
): KpEquationPresentationExecutionRoute | undefined {
  switch (plan.planKind) {
    case "factoring":
      return verifiedOperationRoute([
        plan.factoringMotifBinding.operationPresentationPlan
      ]);
    case "distribution":
      return plan.distributionOperationPlans.length === 0
        ? undefined
        : verifiedOperationRoute(
            plan.distributionOperationPlans as readonly [
              KpVerifiedOperationPresentationPlan,
              ...KpVerifiedOperationPresentationPlan[]
            ]
          );
    case "fraction-material":
      return verifiedOperationRoute([
        plan.fractionMaterialPresentationPlan
      ]);
    case "structural-succession":
      return verifiedOperationRoute([
        plan.structuralSuccession.operationPresentationPlan
      ]);
    case "successor-synthesis": {
      const route = resolveKpExecutableSuccessorMotifProgramRoute(
        plan.executableProgram
      );
      if (
        route.programKind !== "operation-evaluation" ||
        route.primitiveRoute !== "native-katex-successor-synthesis"
      ) {
        return undefined;
      }
      return Object.freeze({
        kind: "executable-motif-program",
        programId: route.programId,
        programVersion: route.programVersion,
        programKind: route.programKind,
        primitiveRoute: route.primitiveRoute
      });
    }
    case "operation-choreography":
      return plan.operationChoreography.operationPresentationPlan === undefined
        ? undefined
        : verifiedOperationRoute([
            plan.operationChoreography.operationPresentationPlan
          ]);
    case "default-motion":
    case "visual-motif":
    case "explicit-static-checkpoint":
      return undefined;
  }
}

function verifiedOperationRoute(
  plans: readonly [
    KpVerifiedOperationPresentationPlan,
    ...KpVerifiedOperationPresentationPlan[]
  ]
): KpEquationPresentationExecutionRoute {
  const planKind = plans[0].planKind;
  if (plans.some((plan) => plan.planKind !== planKind)) {
    throw new Error(
      "One presentation execution route cannot mix operation-plan kinds."
    );
  }
  return Object.freeze({
    kind: "verified-operation-plan",
    planKind,
    planIds: Object.freeze(plans.map(({ id }) => id)) as
      readonly [string, ...string[]]
  });
}

function routeFingerprint(
  route: KpEquationPresentationExecutionRoute | undefined
): string {
  if (route === undefined) return "";
  return route.kind === "executable-motif-program"
    ? [
        route.kind,
        route.programId,
        route.programVersion,
        route.programKind,
        route.primitiveRoute
      ].join(":")
    : [
        route.kind,
        route.planKind
      ].join(":");
}

function incomplete(
  input: {
    readonly animation: KpAnimationAsset;
    readonly transformationId: string;
    readonly direction: KpEquationPresentationCatalogDirection;
    readonly progress: number;
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
      progress: input.progress,
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

function operationPlanKind(
  plan: KpReaderEquationTransitionPresentationPlan
): KpVerifiedOperationPresentationPlan["planKind"] | undefined {
  switch (plan.planKind) {
    case "factoring":
      return plan.factoringMotifBinding.operationPresentationPlan.planKind;
    case "distribution":
      return plan.distributionOperationPlans[0]?.planKind;
    case "fraction-material":
      return plan.fractionMaterialPresentationPlan.planKind;
    case "structural-succession":
      return plan.structuralSuccession.operationPresentationPlan.planKind;
    case "successor-synthesis":
      return plan.successorSyntheses[0]?.operationPresentationPlan?.planKind;
    case "operation-choreography":
      return plan.operationChoreography.operationPresentationPlan?.planKind;
    case "default-motion":
    case "visual-motif":
    case "explicit-static-checkpoint":
      return undefined;
  }
}

function issue(
  value: KpEquationPresentationCatalogIssue
): KpEquationPresentationCatalogIssue {
  return Object.freeze(value);
}
