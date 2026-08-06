export const kpSalienceLevels = Object.freeze([
  "focus",
  "normal",
  "context",
  "dim",
  "ghost",
  "absent"
] as const);

export const kpSalienceIdentityFamilies = Object.freeze([
  "neutral",
  "cyan",
  "blue",
  "violet",
  "red",
  "amber",
  "green"
] as const);

export type KpSalienceLevel = typeof kpSalienceLevels[number];
export type KpSalienceIdentityFamily =
  typeof kpSalienceIdentityFamilies[number];

export interface KpSemanticSalienceState {
  readonly level: KpSalienceLevel;
  readonly identityFamily: KpSalienceIdentityFamily;
  readonly presence: number;
}

export interface KpSemanticSalienceTransition {
  readonly from: KpSemanticSalienceState;
  readonly to: KpSemanticSalienceState;
}

const stateKeys = Object.freeze(["identityFamily", "level", "presence"]);

/** Semantic state deliberately excludes renderer paint, geometry, and clocks. */
export function createKpSemanticSalienceState(
  input: KpSemanticSalienceState
): KpSemanticSalienceState {
  const keys = Object.keys(input).sort();
  if (keys.length !== stateKeys.length ||
      keys.some((key, index) => key !== stateKeys[index])) {
    throw new Error("Semantic salience state contains renderer-owned fields.");
  }
  if (!kpSalienceLevels.includes(input.level)) {
    throw new Error(`Unknown salience level ${String(input.level)}.`);
  }
  if (!kpSalienceIdentityFamilies.includes(input.identityFamily)) {
    throw new Error(`Unknown salience identity family ${String(input.identityFamily)}.`);
  }
  if (!Number.isFinite(input.presence) || input.presence < 0 ||
      input.presence > 1) {
    throw new Error("Salience presence must be between 0 and 1.");
  }
  return Object.freeze({ ...input });
}

/** Every semantic endpoint is directly seekable and therefore reversible. */
export function createKpSemanticSalienceTransition(input: {
  readonly from: KpSemanticSalienceState;
  readonly to: KpSemanticSalienceState;
}): KpSemanticSalienceTransition {
  return Object.freeze({
    from: createKpSemanticSalienceState(input.from),
    to: createKpSemanticSalienceState(input.to)
  });
}
