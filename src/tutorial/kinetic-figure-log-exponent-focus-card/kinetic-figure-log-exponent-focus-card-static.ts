import instruction from "./log-exponent-instruction.generated.json" with { type: "json" };
import { createKpLogExponentAnimationAsset, kpLogExponentAnimationId } from "../../animation/log-exponent-adapter.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpEditorAnimationDescriptor } from "../../editor/animation-descriptor.ts";
import { createKpEditorAnimationLibrary } from "../../editor/animation-library.ts";
import { renderKpEditorAnimationPlayerShell } from "../../editor/animation-player-shell.ts";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { readKpLogExponentFocusCardBeatIndexFromHash, type KpLogExponentFocusCardScoreV1 } from "./kinetic-figure-log-exponent-focus-card-model.ts";

// Static and interactive callers share these exact semantic projections;
// importing a card's initial content must not import its playback controller.

export interface KpLogExponentFocusCardAuthority {
  readonly animation: KpAnimationAsset;
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly score: KpLogExponentFocusCardScoreV1;
}

export function createKpLogExponentFocusCardAuthority():
KpLogExponentFocusCardAuthority {
  const animation = createKpLogExponentAnimationAsset();
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ animationId }) => animationId === kpLogExponentAnimationId
  );
  if (descriptor === undefined) {
    throw new Error("Missing canonical log-exponent animation descriptor.");
  }
  return Object.freeze({
    animation,
    descriptor,
    score: instruction.score as KpLogExponentFocusCardScoreV1
  });
}

export function renderKpLogExponentFocusCard(input: {
  readonly authority: KpLogExponentFocusCardAuthority;
  readonly initialIndex: number;
}): string {
  const { score, descriptor } = input.authority;
  const initialIndex = boundedIndex(input.initialIndex, score.beats.length);
  const initial = score.beats[initialIndex]!;
  const player = renderKpEditorAnimationPlayerShell({
    descriptor,
    chrome: "catalogue"
  });
  return `<section class="kp-log-exponent-focus-card-section" aria-labelledby="kp-log-exponent-focus-card-title">
    <header class="kp-supply-tax-page__intro">
      <p>Focus Deck · Algebra</p>
      <h1 id="kp-log-exponent-focus-card-title">How do logarithms release an exponent?</h1>
    </header>
    ${renderKpFocusDeckScaffold({
      id: "focus-deck.algebra.log-exponent.v1",
      ariaLabel: "Logarithmic equation-solving Focus Deck",
      activeBeatSlug: initial.slug,
      headerTrailingHtml:
        '<span class="kp-log-exponent-focus-card__header-detail">One equation · three governed rewrites</span>',
      stageHtml: `<figure class="kp-focus-deck__stage kp-log-exponent-focus-card__stage" data-kp-log-exponent-focus-card-stage>
        <figcaption class="kp-focus-deck__visually-hidden">Solve two to the x equals seven by applying logarithms, extracting the exponent, and isolating x.</figcaption>
        ${player}
      </figure>`,
      beats: score.beats.map((beat) => ({
        slug: beat.slug,
        title: beat.title,
        html: (instruction.phraseHtml as Readonly<Record<string, string>>)[beat.id]!,
        domId: `beat.log-exponent.${beat.slug}`,
        attributes: {
          "data-kp-log-exponent-focus-card-beat": beat.slug,
          "data-kp-log-exponent-timeline-progress":
            beat.timelineProgress.toFixed(6)
        }
      })),
      rootAttributes: {
        "data-kp-log-exponent-focus-card": true,
        "data-kp-log-exponent-transition": "settled",
        "data-kp-log-exponent-timeline-progress":
          initial.timelineProgress.toFixed(6),
        "data-kp-log-exponent-playback-phase": "settled",
        "data-kp-log-exponent-playback-tempo": "1.00",
        "data-kp-log-exponent-animation-status": "preparing"
      },
      replayAttributes: {
        "data-kp-log-exponent-focus-card-replay": true
      },
      replayHidden: !initial.ownsMotionFromPrevious,
      classAliases: {
        root: "kp-log-exponent-focus-card"
      }
    })}
  </section>`;
}

export function readKpLogExponentFocusCardInitialIndex(
  authority: KpLogExponentFocusCardAuthority,
  hash: string
): number {
  return readKpLogExponentFocusCardBeatIndexFromHash(authority.score, hash);
}

export function boundedIndex(value: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(value)));
}

