import prose from "./surface-contour-prose.generated.json" with { type: "json" };
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { createKpSurfaceContourModel, createKpSurfaceContourScore, type KpSurfaceContourScoreV1, type KpSurfaceContourBeatV1 } from "./kinetic-figure-surface-contour-model.ts";
import { createKpSurfaceContourStageAuthority, renderKpSurfaceContourStage } from "./kinetic-figure-surface-contour-stage.ts";

// Static and interactive callers share these exact semantic projections;
// importing a card's initial content must not import its playback controller.

export interface KpSurfaceContourFocusCardAuthority {
  readonly model: ReturnType<typeof createKpSurfaceContourModel>;
  readonly score: KpSurfaceContourScoreV1;
  readonly stageAuthority: ReturnType<
    typeof createKpSurfaceContourStageAuthority
  >;
}

export function createKpSurfaceContourFocusCardAuthority():
KpSurfaceContourFocusCardAuthority {
  const model = createKpSurfaceContourModel();
  return Object.freeze({
    model,
    score: createKpSurfaceContourScore(model),
    stageAuthority: createKpSurfaceContourStageAuthority()
  });
}

export function readKpSurfaceContourFocusCardInitialIndex(
  authority: KpSurfaceContourFocusCardAuthority,
  hash: string
): number {
  return readBeatIndexFromHash(authority.score, hash);
}

export function renderKpSurfaceContourFocusCard(input: {
  readonly authority: KpSurfaceContourFocusCardAuthority;
  readonly initialIndex: number;
}): string {
  const { model, score, stageAuthority } = input.authority;
  const initialIndex = boundedIndex(input.initialIndex, score.beats.length);
  const initial = score.beats[initialIndex]!;
  return `<section class="kp-surface-contour-focus-card-section" aria-labelledby="kp-surface-contour-focus-card-title">
    <header class="kp-surface-contour-page__intro">
      <p>Focus Deck · Multivariable calculus</p>
      <h1 id="kp-surface-contour-focus-card-title">How does a surface become a contour map?</h1>
    </header>
    ${renderKpFocusDeckScaffold({
      id: "focus-deck.calculus.surface-contour.v1",
      ariaLabel: "Surface and contour Focus Deck",
      activeBeatSlug: initial.slug,
      headerTrailingHtml:
        '<span class="kp-surface-contour-focus-card__header-detail">One level set · one changing view</span>',
      stageHtml: renderKpSurfaceContourStage({ model, authority: stageAuthority }),
      beats: score.beats.map((beat, index) => ({
        slug: beat.slug,
        title: beat.title,
        html: (prose as Readonly<Record<string, string>>)[beat.id]!,
        domId: `beat.${beat.slug}`,
        attributes: {
          "data-kp-surface-contour-beat": beat.slug,
          "data-kp-surface-contour-beat-index": String(index),
          "data-kp-surface-contour-beat-active": String(index === initialIndex)
        }
      })),
      rootAttributes: {
        "data-kp-surface-contour-deck": true,
        "data-kp-surface-contour-active-beat": initial.slug,
        "data-kp-surface-contour-position": initialIndex.toFixed(4),
        "data-kp-surface-contour-transition": "settled"
      },
      scrubberAttributes: {
        "data-kp-surface-contour-state": true
      },
      replayAttributes: {
        "data-kp-surface-contour-replay": true
      },
      replayHidden: false
    })}
  </section>`;
}

export function beatHash(beat: KpSurfaceContourBeatV1): string {
  return `#beat.${beat.slug}`;
}

export function readBeatIndexFromHash(
  score: KpSurfaceContourScoreV1,
  hash: string
): number {
  return findBeatIndexFromHash(score, hash) ?? 0;
}

export function findBeatIndexFromHash(
  score: KpSurfaceContourScoreV1,
  hash: string
): number | undefined {
  const normalized = decodeURIComponent(hash.replace(/^#/u, ""));
  const index = score.beats.findIndex((beat) => `beat.${beat.slug}` === normalized);
  return index < 0 ? undefined : index;
}

export function boundedIndex(value: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(value)));
}

