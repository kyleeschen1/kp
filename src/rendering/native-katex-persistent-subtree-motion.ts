import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type { KpNativeKatexSemanticPaintRelation } from
  "./native-katex-base-scene-plan.ts";
import {
  isKpRootPersistentSubtreeCertificate,
  type KpRootPersistentSubtreeCertificate,
  type KpRootPersistentSubtreeCorrespondence
} from "../semantic/root-persistent-subtree-certificate.ts";

const KP_SUBTREE_RIGIDITY_TOLERANCE_PX = 1 / 64;

export interface KpNativeKatexPersistentSubtreeMember {
  readonly semanticId: string;
  readonly path: readonly number[];
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly sourceAtomId: string;
  readonly targetAtomId: string;
  readonly sourceLocalRect: KpStageRelativeRect;
  readonly targetLocalRect: KpStageRelativeRect;
  readonly localResidual: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
}

export interface KpNativeKatexPersistentSubtreeMotionBinding {
  readonly kind: "native-katex-persistent-subtree-motion-binding";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly certificateId: string;
  readonly motionMode: "rigid" | "translation-with-local-residuals";
  readonly sourceRootGroupId: string;
  readonly targetRootGroupId: string;
  readonly members: readonly KpNativeKatexPersistentSubtreeMember[];
  readonly relations: readonly KpNativeKatexSemanticPaintRelation[];
  readonly toJSON: () => never;
}

/**
 * Semantic subtree identity is durable, while internal KaTeX spacing is a
 * measured renderer fact. Binding every certified paint leaf preserves both:
 * the subtree travels on one clock and local layout residuals reach zero
 * before native target paint takes ownership.
 */
export function bindKpNativeKatexPersistentSubtreeMotion(input: {
  readonly certificate: KpRootPersistentSubtreeCertificate;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpNativeKatexPersistentSubtreeMotionBinding {
  if (!isKpRootPersistentSubtreeCertificate(input.certificate)) {
    throw new Error(
      "Native KaTeX persistent-subtree motion requires certified identity."
    );
  }
  if (
    input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage
  ) {
    throw new Error(
      "Native KaTeX persistent-subtree motion crossed endpoint ownership."
    );
  }
  const sourceRoot = uniqueRootGroup(
    input.source,
    input.certificate.sourceRootEntityId
  );
  const targetRoot = uniqueRootGroup(
    input.target,
    input.certificate.targetRootEntityId
  );
  const members = input.certificate.correspondences.flatMap((correspondence) =>
    bindCorrespondence({
      correspondence,
      source: input.source,
      target: input.target,
      sourceRootRect: sourceRoot.rect,
      targetRootRect: targetRoot.rect
    })
  );
  assertExactCoverage({
    expected: sourceRoot.atomIds,
    actual: members.map(({ sourceAtomId }) => sourceAtomId),
    endpoint: "source"
  });
  assertExactCoverage({
    expected: targetRoot.atomIds,
    actual: members.map(({ targetAtomId }) => targetAtomId),
    endpoint: "target"
  });
  if (members.length === 0) {
    throw new Error("Persistent subtree has no addressable native paint.");
  }
  const paintedCorrespondences = input.certificate.correspondences.filter(
    (correspondence) => members.some(({ sourceEntityId, targetEntityId }) =>
      sourceEntityId === correspondence.sourceEntityId &&
      targetEntityId === correspondence.targetEntityId
    )
  );
  const relations = paintedCorrespondences.map((correspondence, index) =>
    Object.freeze({
      id: `paint.persistent-subtree.${input.certificate.id}.${index}`,
      relation: "persist" as const,
      sourceEntityIds: Object.freeze([correspondence.sourceEntityId]),
      targetEntityIds: Object.freeze([correspondence.targetEntityId])
    })
  );
  const motionMode = members.every(({ localResidual }) =>
    Object.values(localResidual).every((value) =>
      Math.abs(value) <= KP_SUBTREE_RIGIDITY_TOLERANCE_PX
    )
  ) ? "rigid" as const : "translation-with-local-residuals" as const;
  return Object.freeze({
    kind: "native-katex-persistent-subtree-motion-binding" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    certificateId: input.certificate.id,
    motionMode,
    sourceRootGroupId: sourceRoot.id,
    targetRootGroupId: targetRoot.id,
    members: Object.freeze(members),
    relations: Object.freeze(relations),
    toJSON(): never {
      throw new Error(
        "Native KaTeX persistent-subtree bindings cannot enter durable state."
      );
    }
  });
}

function bindCorrespondence(input: {
  readonly correspondence: KpRootPersistentSubtreeCorrespondence;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly sourceRootRect: KpStageRelativeRect;
  readonly targetRootRect: KpStageRelativeRect;
}): readonly KpNativeKatexPersistentSubtreeMember[] {
  const sources = input.source.atoms.filter(({ semanticEntityId }) =>
    semanticEntityId === input.correspondence.sourceEntityId
  );
  const targets = input.target.atoms.filter(({ semanticEntityId }) =>
    semanticEntityId === input.correspondence.targetEntityId
  );
  if (sources.length === 0 && targets.length === 0) return [];
  const sourceByKey = groupByCompatibility(sources);
  const targetByKey = groupByCompatibility(targets);
  const keys = [...new Set([...sourceByKey.keys(), ...targetByKey.keys()])]
    .sort();
  return keys.flatMap((key) => {
    const compatibleSources = sourceByKey.get(key) ?? [];
    const compatibleTargets = targetByKey.get(key) ?? [];
    if (compatibleSources.length !== compatibleTargets.length) {
      throw new Error(
        `Persistent subtree ${input.correspondence.semanticId} changes ` +
        `native paint topology for ${key}.`
      );
    }
    return compatibleSources.map((sourceAtom, index) => {
      const targetAtom = compatibleTargets[index]!;
      const sourceLocalRect = localRect(sourceAtom.rect, input.sourceRootRect);
      const targetLocalRect = localRect(targetAtom.rect, input.targetRootRect);
      return Object.freeze({
        semanticId: input.correspondence.semanticId,
        path: Object.freeze([...input.correspondence.path]),
        sourceEntityId: input.correspondence.sourceEntityId,
        targetEntityId: input.correspondence.targetEntityId,
        sourceAtomId: sourceAtom.id,
        targetAtomId: targetAtom.id,
        sourceLocalRect: Object.freeze(sourceLocalRect),
        targetLocalRect: Object.freeze(targetLocalRect),
        localResidual: Object.freeze({
          left: targetLocalRect.left - sourceLocalRect.left,
          top: targetLocalRect.top - sourceLocalRect.top,
          width: targetLocalRect.width - sourceLocalRect.width,
          height: targetLocalRect.height - sourceLocalRect.height
        })
      });
    });
  });
}

function uniqueRootGroup(
  observation: KpNativeKatexRenderedSceneObservation,
  semanticEntityId: string
) {
  const groups = observation.groups.filter((group) =>
    group.semanticEntityId === semanticEntityId
  );
  if (groups.length !== 1) {
    throw new Error(
      `Persistent subtree requires one native root group for ${semanticEntityId}.`
    );
  }
  return groups[0]!;
}

function groupByCompatibility(
  atoms: readonly KpNativeKatexPaintAtomObservation[]
): Map<string, KpNativeKatexPaintAtomObservation[]> {
  const result = new Map<string, KpNativeKatexPaintAtomObservation[]>();
  atoms.forEach((atom) => {
    const key = `${atom.paintKind}:${atom.visualKey}`;
    const current = result.get(key) ?? [];
    current.push(atom);
    current.sort((left, right) => left.id.localeCompare(right.id));
    result.set(key, current);
  });
  return result;
}

function assertExactCoverage(input: {
  readonly expected: readonly string[];
  readonly actual: readonly string[];
  readonly endpoint: "source" | "target";
}): void {
  const actual = new Set(input.actual);
  const duplicate = input.actual.find((id, index) =>
    input.actual.indexOf(id) !== index
  );
  const missing = input.expected.find((id) => !actual.has(id));
  const extra = input.actual.find((id) => !input.expected.includes(id));
  if (
    duplicate !== undefined || missing !== undefined || extra !== undefined ||
    input.expected.length !== input.actual.length
  ) {
    throw new Error(
      `Persistent subtree ${input.endpoint} paint coverage is not total ` +
      `(duplicate=${duplicate ?? "none"}, missing=${missing ?? "none"}, ` +
      `extra=${extra ?? "none"}).`
    );
  }
}

function localRect(
  rect: KpStageRelativeRect,
  root: KpStageRelativeRect
): KpStageRelativeRect {
  return {
    left: rect.left - root.left,
    top: rect.top - root.top,
    width: rect.width,
    height: rect.height
  };
}
