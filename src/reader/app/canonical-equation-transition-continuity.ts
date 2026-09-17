import type {
  KpAnimationTransformationPhaseCohort
} from "../../animation/transformation-phase-cohorts.ts";
import type {
  KpReaderEquationLayoutSnapshot,
  KpReaderEquationResponsiveFitPlan
} from "../renderers/learner-public-api.ts";
import type {
  KpCorridorCertifiedEquationStageLayout
} from "../runtime/learner-public-api.ts";
import { assertKpMeasuredCanonicalEquationHandoff, type KpMeasuredCanonicalEquationHandoff } from "./canonical-equation-native-handoff.ts";

interface KpCanonicalEquationContinuityContext {
  readonly id: string;
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly fit: KpReaderEquationResponsiveFitPlan;
}

export interface KpCanonicalEquationTransitionCorrection {
  readonly x: number;
  readonly y: number;
}

export interface KpCanonicalEquationTransitionContinuitySeam {
  readonly fromTransitionId: string;
  readonly toTransitionId: string;
  readonly sharedObjectIds: readonly string[];
  readonly selectorCount: number;
  readonly maximumResidualPx: number;
  readonly maximumResidualAddress: string;
}

export interface KpCanonicalEquationTransitionContinuityCertificate {
  readonly kind: "canonical-equation-transition-continuity-certificate";
  readonly tolerancePx: number;
  readonly seams: readonly KpCanonicalEquationTransitionContinuitySeam[];
  readonly maximumResidualPx: number;
}

/**
 * Native endpoint clones may acquire a semantic-row offset from their
 * containing layout. Only one rigid translation per declared row is
 * repairable; shape or internal-spacing changes remain hard renderer errors.
 */
export function planKpCanonicalEquationTransitionCorrections(input: {
  readonly handoffs?: readonly KpMeasuredCanonicalEquationHandoff[];
  readonly cohorts: readonly KpAnimationTransformationPhaseCohort[];
  readonly contexts: ReadonlyMap<string, {
    readonly layout: KpReaderEquationLayoutSnapshot;
    readonly stageLayout?: KpCorridorCertifiedEquationStageLayout | undefined;
  }>;
  readonly tolerancePx?: number | undefined;
}): ReadonlyMap<
  string,
  ReadonlyMap<string, KpCanonicalEquationTransitionCorrection>
> {
  const tolerancePx = input.tolerancePx ?? 0.5;
  validateHandoffs(input.handoffs, input.cohorts, input.contexts);
  if (!(tolerancePx >= 0) || !Number.isFinite(tolerancePx)) {
    throw new Error("Canonical equation correction tolerance must be finite.");
  }
  const corrections = new Map<
    string,
    ReadonlyMap<string, KpCanonicalEquationTransitionCorrection>
  >();
  const first = input.cohorts[0];
  if (first === undefined) return corrections;
  const firstContext = requireLayoutContext(input.contexts, first.id);
  corrections.set(first.id, new Map(
    correctionGroups(firstContext).map(({ rowId }) => [
      rowId,
      Object.freeze({ x: 0, y: 0 })
    ])
  ));
  for (const [index, cohort] of input.cohorts.slice(0, -1).entries()) {
    const next = input.cohorts[index + 1]!;
    const source = requireLayoutContext(input.contexts, cohort.id);
    const target = requireLayoutContext(input.contexts, next.id);
    const sourceCorrections = corrections.get(cohort.id)!;
    const sharedObjectIds = cohort.targetObjectIds.filter((objectId) =>
      next.sourceObjectIds.includes(objectId)
    );
    const handoff = resolveHandoff(input.handoffs, cohort, next);
    const sourceAnchors = handoff?.sourceAnchors ?? endpointAnchors(
      source.layout,
      "target",
      sharedObjectIds
    );
    const targetAnchors = handoff?.targetAnchors ?? endpointAnchors(
      target.layout,
      "source",
      sharedObjectIds
    );
    const allKeys = [...sourceAnchors.keys()].sort();
    if (!sameStrings(allKeys, [...targetAnchors.keys()].sort()) || allKeys.length === 0) {
      throw new Error(
        `Canonical equation seam ${cohort.id} -> ${next.id} changed its endpoint closure.`
      );
    }
    const sourceGroups = correctionGroups(source);
    const targetGroups = correctionGroups(target);
    if (!sameStrings(
      sourceGroups.map(({ role }) => role).sort(),
      targetGroups.map(({ role }) => role).sort()
    )) {
      throw new Error(
        `Canonical equation seam ${cohort.id} -> ${next.id} changed semantic rows.`
      );
    }
    const covered = new Set<string>();
    const nextCorrections = new Map<string, KpCanonicalEquationTransitionCorrection>();
    for (const targetGroup of targetGroups) {
      const sourceGroup = sourceGroups.find(({ role }) =>
        role === targetGroup.role
      )!;
      const keys = allKeys.filter((key) => {
        const sourceSelector = sourceAnchors.get(key)!.selectorId;
        const targetSelector = targetAnchors.get(key)!.selectorId;
        return sourceGroup.selectorIds.has(sourceSelector) &&
          targetGroup.selectorIds.has(targetSelector);
      });
      if (keys.length === 0 || keys.some((key) => covered.has(key))) {
        throw new Error(
          `Canonical equation seam ${cohort.id} -> ${next.id} has ambiguous row ` +
          `${targetGroup.role}.`
        );
      }
      keys.forEach((key) => covered.add(key));
      const sourceCorrection = sourceCorrections.get(sourceGroup.rowId)!;
      const candidates = keys.map((key) => {
        const from = sourceAnchors.get(key)!.rect;
        const to = targetAnchors.get(key)!.rect;
        if (
          Math.abs(from.width - to.width) > tolerancePx ||
          Math.abs(from.height - to.height) > tolerancePx
        ) {
          throw new Error(
            `Canonical equation seam ${cohort.id} -> ${next.id} changed paint shape at ${key} ` +
            `(${from.width} × ${from.height} -> ${to.width} × ${to.height}px).`
          );
        }
        return {
          key,
          x: from.left + sourceCorrection.x - to.left,
          y: from.top + sourceCorrection.y - to.top
        };
      });
      const correction = candidates[0]!;
      const nonRigid = candidates.find((candidate) =>
        Math.abs(candidate.x - correction.x) > tolerancePx ||
        Math.abs(candidate.y - correction.y) > tolerancePx
      );
      if (nonRigid !== undefined) {
        throw new Error(
          `Canonical equation seam ${cohort.id} -> ${next.id} is non-rigid ` +
          `inside row ${targetGroup.role} at ${nonRigid.key} ` +
          `(residual ${nonRigid.x - correction.x}, ${nonRigid.y - correction.y}px); renderer geometry ` +
          "must not be patched per glyph."
        );
      }
      nextCorrections.set(targetGroup.rowId, Object.freeze({
        x: correction.x,
        y: correction.y
      }));
    }
    if (covered.size !== allKeys.length) {
      throw new Error(
        `Canonical equation seam ${cohort.id} -> ${next.id} has endpoint paint ` +
        "outside its semantic row authority."
      );
    }
    corrections.set(next.id, nextCorrections);
  }
  return corrections;
}

function correctionGroups(context: {
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly stageLayout?: KpCorridorCertifiedEquationStageLayout | undefined;
}) {
  if (context.stageLayout === undefined) {
    return [{
      role: "canonical-phase",
      rowId: "canonical-phase",
      selectorIds: new Set(context.layout.anchors.map(({ selectorId }) =>
        selectorId
      ))
    }];
  }
  const envelopes = new Map(context.stageLayout.measuredInput.envelopes.map(
    (envelope) => [envelope.id, envelope]
  ));
  return context.stageLayout.rows.map((row) => {
    const role = context.stageLayout!.measuredInput.intent.rows.find(
      ({ id }) => id === row.id
    )?.role;
    if (role === undefined) {
      throw new Error(`Canonical equation stage row ${row.id} has no role.`);
    }
    return {
      role,
      rowId: row.id,
      selectorIds: new Set(row.envelopeIds.flatMap((id) =>
        envelopes.get(id)?.memberOwnerIds ?? []
      ))
    };
  });
}

/**
 * Adjacent transitions may use separate native DOM, but a shared semantic
 * endpoint must occupy identical fitted screen geometry before ownership can
 * switch. This turns a previously visual-only seam into a measured contract.
 */
export function certifyKpCanonicalEquationTransitionContinuity(input: {
  readonly handoffs?: readonly KpMeasuredCanonicalEquationHandoff[];
  readonly cohorts: readonly KpAnimationTransformationPhaseCohort[];
  readonly contexts: ReadonlyMap<string, KpCanonicalEquationContinuityContext>;
  readonly tolerancePx?: number | undefined;
}): KpCanonicalEquationTransitionContinuityCertificate {
  const tolerancePx = input.tolerancePx ?? 0.5;
  validateHandoffs(input.handoffs, input.cohorts, input.contexts);
  if (!(tolerancePx >= 0) || !Number.isFinite(tolerancePx)) {
    throw new Error("Canonical equation continuity tolerance must be finite.");
  }
  const seams = input.cohorts.slice(0, -1).map((cohort, index) => {
    const nextCohort = input.cohorts[index + 1]!;
    const from = requireContext(input.contexts, cohort.id);
    const to = requireContext(input.contexts, nextCohort.id);
    const sharedObjectIds = cohort.targetObjectIds.filter((objectId) =>
      nextCohort.sourceObjectIds.includes(objectId)
    );
    const handoff = resolveHandoff(input.handoffs, cohort, nextCohort);
    if (sharedObjectIds.length === 0 && handoff === undefined) {
      throw new Error(
        `Canonical equation transitions ${cohort.id} and ${nextCohort.id} ` +
        "lack a shared semantic endpoint."
      );
    }
    const sourceAnchors = handoff?.sourceAnchors ?? endpointAnchors(
      from.layout,
      "target",
      sharedObjectIds
    );
    const targetAnchors = handoff?.targetAnchors ?? endpointAnchors(
      to.layout,
      "source",
      sharedObjectIds
    );
    const sourceKeys = [...sourceAnchors.keys()].sort();
    const targetKeys = [...targetAnchors.keys()].sort();
    if (!sameStrings(sourceKeys, targetKeys)) {
      throw new Error(
        `Canonical equation seam ${cohort.id} -> ${nextCohort.id} ` +
        "changes the selector closure of its shared endpoint."
      );
    }
    const residuals = sourceKeys.flatMap((key) => {
      const source = fittedRect(sourceAnchors.get(key)!.rect, from.fit);
      const target = fittedRect(targetAnchors.get(key)!.rect, to.fit);
      return (["left", "top", "width", "height"] as const).map((metric) => ({
        address: `${key}:${metric}`,
        value: Math.abs(source[metric] - target[metric])
      }));
    });
    const maximum = residuals.reduce((worst, residual) =>
      residual.value > worst.value ? residual : worst,
    { address: "none", value: 0 });
    const maximumResidualPx = maximum.value;
    if (maximumResidualPx > tolerancePx) {
      const failures = residuals
        .filter(({ value }) => value > tolerancePx)
        .sort((left, right) => right.value - left.value)
        .slice(0, 5)
        .map(({ address, value }) => `${address}=${value.toFixed(3)}px`)
        .join(", ");
      throw new Error(
        `Canonical equation seam ${cohort.id} -> ${nextCohort.id} has ` +
        `${maximumResidualPx.toFixed(3)}px residual; expected at most ` +
        `${tolerancePx.toFixed(3)}px (${failures}).`
      );
    }
    return Object.freeze({
      fromTransitionId: cohort.id,
      toTransitionId: nextCohort.id,
      sharedObjectIds: Object.freeze(handoff ? [handoff.authority.semanticStateId] : [...sharedObjectIds]),
      selectorCount: sourceKeys.length,
      maximumResidualPx,
      maximumResidualAddress: maximum.address
    });
  });
  return Object.freeze({
    kind: "canonical-equation-transition-continuity-certificate" as const,
    tolerancePx,
    seams: Object.freeze(seams),
    maximumResidualPx: Math.max(
      0,
      ...seams.map(({ maximumResidualPx }) => maximumResidualPx)
    )
  });
}

function validateHandoffs(handoffs: readonly KpMeasuredCanonicalEquationHandoff[] | undefined, cohorts: readonly KpAnimationTransformationPhaseCohort[],
  contexts: ReadonlyMap<string, { readonly layout: KpReaderEquationLayoutSnapshot }>) {
  const boundaries = new Set<string>();
  for (const handoff of handoffs ?? []) {
    assertKpMeasuredCanonicalEquationHandoff(handoff);
    if (contexts.get(handoff.fromTransitionId)?.layout.measurementIdentity !== handoff.sourceMeasurementIdentity ||
        contexts.get(handoff.toTransitionId)?.layout.measurementIdentity !== handoff.targetMeasurementIdentity)
      throw new Error("Native handoff measurement is stale or from another layout application.");
    const index = cohorts.findIndex(cohort => cohort.id === handoff.fromTransitionId), next = cohorts[index + 1];
    if (index < 0 || !next || next.id !== handoff.toTransitionId || boundaries.has(handoff.fromTransitionId) ||
        JSON.stringify(cohorts[index]!.targetObjectIds) !== JSON.stringify([handoff.authority.source.object.id]) ||
        JSON.stringify(next.sourceObjectIds) !== JSON.stringify([handoff.authority.target.object.id]))
      throw new Error("Native handoff must cover one exact adjacent endpoint boundary.");
    boundaries.add(handoff.fromTransitionId);
  }
}
function resolveHandoff(handoffs: readonly KpMeasuredCanonicalEquationHandoff[] | undefined,
  from: KpAnimationTransformationPhaseCohort, to: KpAnimationTransformationPhaseCohort) {
  return handoffs?.find(handoff => handoff.fromTransitionId === from.id && handoff.toTransitionId === to.id);
}
function endpointAnchors(
  layout: KpReaderEquationLayoutSnapshot,
  side: "source" | "target",
  objectIds: readonly string[]
): ReadonlyMap<string, KpReaderEquationLayoutSnapshot["anchors"][number]> {
  const allowed = new Set(objectIds);
  return new Map(layout.anchors
    .filter((anchor) => anchor.side === side && allowed.has(anchor.objectId))
    .map((anchor) => [`${anchor.objectId}:${anchor.selectorId}`, anchor]));
}

function fittedRect(
  rect: KpReaderEquationLayoutSnapshot["anchors"][number]["rect"],
  fit: KpReaderEquationResponsiveFitPlan
) {
  return {
    left: rect.left * fit.scale + fit.translateX,
    top: rect.top * fit.scale + fit.translateY,
    width: rect.width * fit.scale,
    height: rect.height * fit.scale
  };
}

function requireContext(
  contexts: ReadonlyMap<string, KpCanonicalEquationContinuityContext>,
  id: string
): KpCanonicalEquationContinuityContext {
  const context = contexts.get(id);
  if (context === undefined) {
    throw new Error(`Canonical equation continuity lacks context ${id}.`);
  }
  return context;
}

function requireLayoutContext<T extends {
  readonly layout: KpReaderEquationLayoutSnapshot;
}>(contexts: ReadonlyMap<string, T>, id: string): T {
  const context = contexts.get(id);
  if (context === undefined) {
    throw new Error(`Canonical equation continuity lacks context ${id}.`);
  }
  return context;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
