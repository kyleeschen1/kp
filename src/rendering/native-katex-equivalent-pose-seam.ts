import type {
  KpAdjacentPhaseEquivalentPoseSeamIntent
} from "../animation/paint-continuity-plan-types.ts";
import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";
import type {
  KpNativeKatexEndpointOwnershipView
} from "./native-katex-endpoint-ownership.ts";
import {
  measureKpStageRelativeRectDelta,
  type KpNativeKatexPaintAtomObservation
} from "./native-katex-rendered-scene.ts";

export interface KpNativeKatexEquivalentPoseLeafEvidence {
  readonly leafId: string;
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly paintKind: string;
  readonly fromOwnerId: string;
  readonly toOwnerId: string;
  readonly fromRect: KpStageRelativeRect;
  readonly toRect: KpStageRelativeRect;
  readonly fromBaselineY: number | null;
  readonly toBaselineY: number | null;
  readonly fromStyleFingerprint: string;
  readonly toStyleFingerprint: string;
  readonly fromPaintFingerprint: string;
  readonly toPaintFingerprint: string;
}

export interface KpNativeKatexEquivalentPoseSeamCertificate {
  readonly kind: "native-katex-equivalent-pose-seam-certificate";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly intent: KpAdjacentPhaseEquivalentPoseSeamIntent;
  readonly from: KpNativeKatexEndpointOwnershipView;
  readonly to: KpNativeKatexEndpointOwnershipView;
  readonly fontRevision: number;
  readonly viewportKey: string;
  readonly leaves: readonly KpNativeKatexEquivalentPoseLeafEvidence[];
  readonly toJSON: () => never;
}

export type KpNativeKatexEquivalentPoseSeamIssueCode =
  | "seam.handle-mismatch"
  | "seam.endpoint-role"
  | "seam.leaf-inventory"
  | "seam.leaf-owner"
  | "seam.leaf-rect"
  | "seam.leaf-baseline"
  | "seam.leaf-style"
  | "seam.leaf-paint"
  | "seam.font-revision"
  | "seam.viewport-revision";

export interface KpNativeKatexEquivalentPoseSeamIssue {
  readonly code: KpNativeKatexEquivalentPoseSeamIssueCode;
  readonly leafId?: string | undefined;
  readonly message: string;
}

export type KpNativeKatexEquivalentPoseSeamResult =
  | {
      readonly status: "verified";
      readonly certificate: KpNativeKatexEquivalentPoseSeamCertificate;
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly KpNativeKatexEquivalentPoseSeamIssue[];
    };

export function validateAndMintKpNativeKatexEquivalentPoseSeam(input: {
  readonly intent: KpAdjacentPhaseEquivalentPoseSeamIntent;
  readonly from: KpNativeKatexEndpointOwnershipView;
  readonly to: KpNativeKatexEndpointOwnershipView;
  readonly geometryTolerancePx?: number | undefined;
}): KpNativeKatexEquivalentPoseSeamResult {
  const issues: KpNativeKatexEquivalentPoseSeamIssue[] = [];
  const tolerance = input.geometryTolerancePx ?? 1 / 64;
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Equivalent-pose tolerance must be finite and non-negative.");
  }
  if (input.from.endpoint !== "target" || input.to.endpoint !== "source") {
    issues.push(issue(
      "seam.endpoint-role",
      "Adjacent phase seam must transfer from a target view to a source view."
    ));
  }
  if (input.from.handle !== input.to.handle) {
    issues.push(issue(
      "seam.handle-mismatch",
      "Adjacent phases must share the same immutable endpoint handle."
    ));
  }
  const fromHandle = input.from.handle;
  const toHandle = input.to.handle;
  if (fromHandle.revision.fontRevision !== toHandle.revision.fontRevision) {
    issues.push(issue(
      "seam.font-revision",
      "Adjacent endpoint handles use different font revisions."
    ));
  }
  if (fromHandle.revision.viewportKey !== toHandle.revision.viewportKey) {
    issues.push(issue(
      "seam.viewport-revision",
      "Adjacent endpoint handles use different viewport revisions."
    ));
  }

  const fromAtoms = leafMap(fromHandle.observation.atoms, issues, "from");
  const toAtoms = leafMap(toHandle.observation.atoms, issues, "to");
  const leafIds = [...new Set([...fromAtoms.keys(), ...toAtoms.keys()])].sort();
  const evidence: KpNativeKatexEquivalentPoseLeafEvidence[] = [];
  for (const leafId of leafIds) {
    const fromAtom = fromAtoms.get(leafId);
    const toAtom = toAtoms.get(leafId);
    if (fromAtom === undefined || toAtom === undefined) {
      issues.push(issue(
        "seam.leaf-inventory",
        `Semantic paint leaf ${leafId} is absent from one adjacent endpoint.`,
        leafId
      ));
      continue;
    }
    const fromOwner = uniqueOwner(input.from, fromAtom.id);
    const toOwner = uniqueOwner(input.to, toAtom.id);
    if (fromOwner === undefined || toOwner === undefined) {
      issues.push(issue(
        "seam.leaf-owner",
        `Semantic paint leaf ${leafId} lacks one exclusive owner per phase.`,
        leafId
      ));
      continue;
    }
    if (measureKpStageRelativeRectDelta(fromAtom.rect, toAtom.rect) > tolerance) {
      issues.push(issue(
        "seam.leaf-rect",
        `Semantic paint leaf ${leafId} changes ink geometry at the seam.`,
        leafId
      ));
    }
    const fromBaseline = fromAtom.baselineY;
    const toBaseline = toAtom.baselineY;
    if (
      fromBaseline === undefined ||
      toBaseline === undefined ||
      (fromBaseline === null) !== (toBaseline === null) ||
      (
        fromBaseline !== null &&
        toBaseline !== null &&
        Math.abs(fromBaseline - toBaseline) > tolerance
      )
    ) {
      issues.push(issue(
        "seam.leaf-baseline",
        `Semantic paint leaf ${leafId} changes or lacks baseline evidence.`,
        leafId
      ));
    }
    if (fromAtom.styleFingerprint !== toAtom.styleFingerprint) {
      issues.push(issue(
        "seam.leaf-style",
        `Semantic paint leaf ${leafId} changes computed style at the seam.`,
        leafId
      ));
    }
    if (
      fromAtom.visualKey !== toAtom.visualKey ||
      fromAtom.paintKind !== toAtom.paintKind ||
      fromAtom.semanticEntityId !== toAtom.semanticEntityId ||
      fromAtom.presentationGroupId !== toAtom.presentationGroupId
    ) {
      issues.push(issue(
        "seam.leaf-paint",
        `Semantic paint leaf ${leafId} changes physical or semantic identity.`,
        leafId
      ));
    }
    evidence.push(Object.freeze({
      leafId,
      semanticEntityId: fromAtom.semanticEntityId,
      presentationGroupId: fromAtom.presentationGroupId,
      paintKind: fromAtom.paintKind,
      fromOwnerId: fromOwner,
      toOwnerId: toOwner,
      fromRect: Object.freeze({ ...fromAtom.rect }),
      toRect: Object.freeze({ ...toAtom.rect }),
      fromBaselineY: fromBaseline ?? null,
      toBaselineY: toBaseline ?? null,
      fromStyleFingerprint: fromAtom.styleFingerprint,
      toStyleFingerprint: toAtom.styleFingerprint,
      fromPaintFingerprint: fromAtom.visualKey,
      toPaintFingerprint: toAtom.visualKey
    }));
  }
  if (issues.length > 0) {
    return Object.freeze({
      status: "invalid",
      issues: Object.freeze(issues)
    });
  }
  const certificate = Object.freeze({
    kind: "native-katex-equivalent-pose-seam-certificate" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    intent: input.intent,
    from: input.from,
    to: input.to,
    fontRevision: fromHandle.revision.fontRevision,
    viewportKey: fromHandle.revision.viewportKey,
    leaves: Object.freeze(evidence),
    toJSON(): never {
      throw new Error(
        "Native KaTeX equivalent-pose certificates cannot enter durable state."
      );
    }
  });
  return Object.freeze({ status: "verified", certificate });
}

function leafMap(
  atoms: readonly KpNativeKatexPaintAtomObservation[],
  issues: KpNativeKatexEquivalentPoseSeamIssue[],
  side: "from" | "to"
): ReadonlyMap<string, KpNativeKatexPaintAtomObservation> {
  const result = new Map<string, KpNativeKatexPaintAtomObservation>();
  for (const atom of atoms) {
    const key = atom.id.replace(/^(?:source|target)\./u, "");
    if (result.has(key)) {
      issues.push(issue(
        "seam.leaf-inventory",
        `Adjacent ${side} endpoint duplicates semantic paint leaf ${key}.`,
        key
      ));
    } else {
      result.set(key, atom);
    }
  }
  return result;
}

function uniqueOwner(
  view: KpNativeKatexEndpointOwnershipView,
  atomId: string
): string | undefined {
  const owners = view.owners.filter(({ leafAtomIds }) =>
    leafAtomIds.includes(atomId)
  );
  return owners.length === 1 ? owners[0]!.id : undefined;
}

function issue(
  code: KpNativeKatexEquivalentPoseSeamIssueCode,
  message: string,
  leafId?: string
): KpNativeKatexEquivalentPoseSeamIssue {
  return Object.freeze({ code, message, ...(leafId === undefined ? {} : {
    leafId
  }) });
}
