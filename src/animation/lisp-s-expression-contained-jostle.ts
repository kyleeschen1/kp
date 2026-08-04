import type {
  KpLispCanonicalMaterialState,
  KpLispSourceMaterialToken
} from "./lisp-s-expression-material-projection.ts";

export interface KpLispContainedJostlePose {
  readonly materialId: string;
  readonly ownerExpressionId: string;
  readonly sourceOrder: number;
  readonly active: boolean;
  readonly inline: number;
  readonly block: number;
  readonly inlineOffset: number;
  readonly blockOffset: number;
}

export interface KpLispContainedJostleProjection {
  readonly id: "contained-jostle.lisp";
  readonly stateId: KpLispCanonicalMaterialState["id"];
  readonly activeExpressionId: string | null;
  readonly progress: number;
  readonly membranes: readonly {
    readonly expressionId: string;
    readonly openMaterialId: string;
    readonly closeMaterialId: string;
  }[];
  readonly poses: readonly KpLispContainedJostlePose[];
}

/**
 * Projects repeatable motion into owner-local normalized coordinates. Pixel
 * geometry remains a renderer concern, while ordering and containment remain
 * true at every direct seek.
 */
export function projectKpLispContainedJostle(
  state: KpLispCanonicalMaterialState,
  activeExpressionId: string | null,
  progress: number
): KpLispContainedJostleProjection {
  const groups = groupAtomsByOwner(state.tokens);
  if (activeExpressionId !== null && !groups.has(activeExpressionId)) {
    throw new Error(
      `Active Lisp expression ${activeExpressionId} has no certified atom material.`
    );
  }
  const normalizedProgress = stableUnit(progress);
  const poses = [...groups.entries()].flatMap(([ownerExpressionId, atoms]) =>
    atoms.map((atom, index) => projectPose(
      atom,
      ownerExpressionId,
      index,
      atoms.length,
      ownerExpressionId === activeExpressionId,
      normalizedProgress
    ))
  ).sort((left, right) => left.sourceOrder - right.sourceOrder);

  return Object.freeze({
    id: "contained-jostle.lisp",
    stateId: state.id,
    activeExpressionId,
    progress: normalizedProgress,
    membranes: Object.freeze(projectMembranes(state.tokens)),
    poses: Object.freeze(poses)
  });
}

function projectPose(
  atom: KpLispSourceMaterialToken,
  ownerExpressionId: string,
  index: number,
  count: number,
  active: boolean,
  progress: number
): KpLispContainedJostlePose {
  const gap = 1 / (count + 1);
  const anchor = (index + 1) * gap;
  const envelope = Math.sin(Math.PI * progress);
  const inlineWave = Math.sin(
    Math.PI * 2 * progress * 2 + seedPhase(`${atom.id}:inline`)
  );
  const blockWave = Math.sin(
    Math.PI * 2 * progress * 3 + seedPhase(`${atom.id}:block`)
  );
  const inlineOffset = active ? gap * 0.18 * envelope * inlineWave : 0;
  const blockOffset = active ? 0.16 * envelope * blockWave : 0;

  return Object.freeze({
    materialId: atom.id,
    ownerExpressionId,
    sourceOrder: atom.source.start,
    active,
    inline: stableUnit(anchor + inlineOffset),
    block: stableUnit(0.5 + blockOffset),
    inlineOffset: stableSigned(inlineOffset),
    blockOffset: stableSigned(blockOffset)
  });
}

function groupAtomsByOwner(
  tokens: readonly KpLispSourceMaterialToken[]
): Map<string, KpLispSourceMaterialToken[]> {
  const groups = new Map<string, KpLispSourceMaterialToken[]>();
  for (const token of tokens) {
    if (token.kind !== "atom") continue;
    const group = groups.get(token.ownerExpressionId) ?? [];
    group.push(token);
    groups.set(token.ownerExpressionId, group);
  }
  for (const atoms of groups.values()) {
    atoms.sort((left, right) => left.source.start - right.source.start);
  }
  return groups;
}

function projectMembranes(
  tokens: readonly KpLispSourceMaterialToken[]
): KpLispContainedJostleProjection["membranes"] {
  const delimiters = new Map<string, {
    openMaterialId?: string;
    closeMaterialId?: string;
  }>();
  for (const token of tokens) {
    if (token.kind === "atom") continue;
    const pair = delimiters.get(token.ownerExpressionId) ?? {};
    if (token.kind === "open-paren") pair.openMaterialId = token.id;
    else pair.closeMaterialId = token.id;
    delimiters.set(token.ownerExpressionId, pair);
  }
  return [...delimiters.entries()].map(([expressionId, pair]) => {
    if (pair.openMaterialId === undefined || pair.closeMaterialId === undefined) {
      throw new Error(`Lisp expression ${expressionId} lacks a certified membrane.`);
    }
    return Object.freeze({
      expressionId,
      openMaterialId: pair.openMaterialId,
      closeMaterialId: pair.closeMaterialId
    });
  });
}

function seedPhase(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
}

function stableUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(1, value)) * 1e12) / 1e12;
}

function stableSigned(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 1e12) / 1e12;
}
