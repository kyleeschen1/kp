import type {
  KpLogProductKineticFigureStateId
} from "./kinetic-figure-log-product-model.ts";

export type KpLogProductFocusDeckBeatId =
  | "orient"
  | "locate-product"
  | "product-law"
  | "apply-product-law";

export interface KpLogProductFocusDeckBeat {
  readonly id: KpLogProductFocusDeckBeatId;
  readonly ordinal: number;
  readonly label: string;
  readonly figureStateId: KpLogProductKineticFigureStateId;
  readonly attentionStateId: KpLogProductKineticFigureStateId;
  readonly ownsMotion: boolean;
  readonly sourcePassageStateId: KpLogProductKineticFigureStateId;
}

/**
 * Focus Deck beats are editorial projections over the existing four-state
 * figure. Keeping the rule beat at the source pose makes the following edge,
 * rather than a resting slide, own the canonical rewrite.
 */
export const kpLogProductFocusDeckBeats:
readonly KpLogProductFocusDeckBeat[] = Object.freeze([
  Object.freeze({
    id: "orient",
    ordinal: 1,
    label: "Read the product",
    figureStateId: "whole",
    attentionStateId: "whole",
    ownsMotion: false,
    sourcePassageStateId: "whole"
  }),
  Object.freeze({
    id: "locate-product",
    ordinal: 2,
    label: "Find multiplication",
    figureStateId: "product",
    attentionStateId: "product",
    ownsMotion: false,
    sourcePassageStateId: "product"
  }),
  Object.freeze({
    id: "product-law",
    ordinal: 3,
    label: "Match the product law",
    figureStateId: "whole",
    // Matching still concerns the product recognized in the prior beat. Keep
    // that entity salient until the rewrite edge actually takes attention.
    attentionStateId: "product",
    ownsMotion: false,
    sourcePassageStateId: "transform"
  }),
  Object.freeze({
    id: "apply-product-law",
    ordinal: 4,
    label: "Apply the law",
    figureStateId: "transform",
    attentionStateId: "result",
    ownsMotion: true,
    sourcePassageStateId: "result"
  })
]);

export const kpLogProductFocusDeckBeatIds = Object.freeze(
  kpLogProductFocusDeckBeats.map(({ id }) => id)
) as readonly KpLogProductFocusDeckBeatId[];

export function readKpLogProductFocusDeckBeat(
  value: string | undefined
): KpLogProductFocusDeckBeat {
  const normalized = value?.startsWith("beat.")
    ? value.slice("beat.".length)
    : value;
  return kpLogProductFocusDeckBeats.find(({ id }) => id === normalized) ??
    kpLogProductFocusDeckBeats[0]!;
}

export function kpLogProductFocusDeckHash(
  beatId: KpLogProductFocusDeckBeatId
): `#beat.${KpLogProductFocusDeckBeatId}` {
  return `#beat.${beatId}`;
}

export function readKpLogProductFocusDeckBeatFromHash(
  hash: string
): KpLogProductFocusDeckBeat {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  return readKpLogProductFocusDeckBeat(value);
}

export function adjacentKpLogProductFocusDeckBeat(input: {
  readonly beatId: KpLogProductFocusDeckBeatId;
  readonly direction: -1 | 1;
}): KpLogProductFocusDeckBeat {
  const index = kpLogProductFocusDeckBeats.findIndex(
    ({ id }) => id === input.beatId
  );
  const bounded = Math.max(
    0,
    Math.min(kpLogProductFocusDeckBeats.length - 1, index + input.direction)
  );
  return kpLogProductFocusDeckBeats[bounded]!;
}
