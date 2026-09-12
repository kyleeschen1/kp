import instruction from "./typescript-instruction.generated.json" with { type: "json" };
import { sampleKpTypeScriptRefactorMotionFrame } from "../../animation/typescript-refactor-motion-frame.ts";
import { renderKpTypeScriptRefactorCodeHtml } from "../../rendering/typescript-refactor-code-html.ts";
import { kpTypeScriptFreeShippingPublicPath } from "../../public-web/typescript-free-shipping-route.ts";
import { createKpTypeScriptFreeShippingRuntimeProjection } from "../../public-web/typescript-free-shipping-runtime.ts";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { readKpTypeScriptFocusCardBeatIndexFromHash, type KpTypeScriptFocusCardScoreV1 } from "./kinetic-figure-typescript-focus-card-model.ts";

// Static and interactive callers share these exact semantic projections;
// importing a card's initial content must not import its playback controller.

export interface KpTypeScriptFocusCardAuthority {
  readonly runtime: ReturnType<
    typeof createKpTypeScriptFreeShippingRuntimeProjection
  >;
  readonly score: KpTypeScriptFocusCardScoreV1;
}

export function createKpTypeScriptFocusCardAuthority():
KpTypeScriptFocusCardAuthority {
  const runtime = createKpTypeScriptFreeShippingRuntimeProjection();
  return Object.freeze({
    runtime,
    score: instruction.score as KpTypeScriptFocusCardScoreV1
  });
}

export function renderKpTypeScriptFocusCard(input: {
  readonly authority: KpTypeScriptFocusCardAuthority;
  readonly initialIndex: number;
}): string {
  const { runtime, score } = input.authority;
  const initialIndex = boundedIndex(input.initialIndex, score.beats.length);
  const initial = score.beats[initialIndex]!;
  const runtimeStage = requireRuntimeStage(runtime, initial.stageId);
  const motion = sampleKpTypeScriptRefactorMotionFrame({
    score: runtime.score,
    progress: initial.timelineProgress
  });
  const code = renderKpTypeScriptRefactorCodeHtml({
    semantics: runtime.semantics,
    stageId: runtimeStage.id,
    narration: runtimeStage.narration,
    activeProjectionId: motion.accessibleProjectionId,
    focusSelectorIds: runtimeStage.focusSelectorIds,
    theme: "light",
    accessibleDescription:
      `${runtime.accessibility.title}. ${runtimeStage.narration}`
  });
  return `<section class="kp-typescript-focus-card-section" aria-labelledby="kp-typescript-focus-card-title">
    <header class="kp-supply-tax-page__intro kp-typescript-focus-card__intro">
      <p>Focus Deck · TypeScript</p>
      <h1 id="kp-typescript-focus-card-title">How do two rules become one?</h1>
    </header>
    ${renderKpFocusDeckScaffold({
      id: "focus-deck.programming.typescript-free-shipping.v1",
      ariaLabel: "TypeScript extract-helper Focus Deck",
      activeBeatSlug: initial.slug,
      headerTrailingHtml:
        `<a class="kp-typescript-focus-card__source-link" href="${kpTypeScriptFreeShippingPublicPath}#refactor-stage">Read the article</a>`,
      stageHtml: `<figure class="kp-focus-deck__stage kp-typescript-focus-card__stage" data-kp-typescript-focus-card-stage>
        <figcaption class="kp-focus-deck__visually-hidden">Two duplicated free-shipping conditions become one named TypeScript helper while program behavior remains unchanged.</figcaption>
        ${code}
      </figure>`,
      beats: score.beats.map((beat) => ({
        slug: beat.slug,
        title: beat.title,
        html: (instruction.phraseHtml as Readonly<Record<string, string>>)[beat.id]!,
        domId: beat.id,
        attributes: {
          "data-kp-typescript-focus-card-beat": beat.slug,
          "data-kp-typescript-stage-id": beat.stageId,
          "data-kp-typescript-source-block-id": beat.sourceBlockId,
          "data-kp-typescript-timeline-progress":
            beat.timelineProgress.toFixed(6)
        }
      })),
      rootAttributes: {
        "data-kp-typescript-focus-card": true,
        "data-kp-typescript-animation-id": runtime.id,
        "data-kp-typescript-focus-card-transition": "settled",
        "data-kp-typescript-focus-card-timeline-progress":
          initial.timelineProgress.toFixed(6),
        "data-kp-typescript-focus-card-deck-position":
          initialIndex.toFixed(4),
        "data-kp-typescript-focus-card-source-block": initial.sourceBlockId
      },
      replayAttributes: {
        "data-kp-typescript-focus-card-replay": true
      },
      replayHidden: !initial.ownsMotionFromPrevious,
      classAliases: {
        root: "kp-typescript-focus-card"
      }
    })}
  </section>`;
}

export function readKpTypeScriptFocusCardInitialIndex(
  authority: KpTypeScriptFocusCardAuthority,
  hash: string
): number {
  return readKpTypeScriptFocusCardBeatIndexFromHash(authority.score, hash);
}

export function requireRuntimeStage(
  runtime: KpTypeScriptFocusCardAuthority["runtime"],
  stageId: string
) {
  const stage = runtime.score.stages.find(({ id }) => id === stageId);
  if (stage === undefined) {
    throw new Error(`TypeScript Focus Deck cannot resolve ${stageId}.`);
  }
  return stage;
}

export function boundedIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(index)));
}

