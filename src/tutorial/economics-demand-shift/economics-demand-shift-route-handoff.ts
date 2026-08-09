import {
  kpEconomicsDemandShiftDeckScenes,
  writeKpEconomicsDemandShiftDeckScene
} from "./economics-demand-shift-deck.ts";
import {
  findKpEconomicsMotionBlock,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import { readKpEconomicsDemandShiftView } from
  "./economics-demand-shift-view.ts";

export interface KpEconomicsDemandShiftRouteHandoff {
  readonly blockId: KpEconomicsMotionBlockId;
  readonly progress: number;
  readonly passageId: string;
  readonly anchorViewportTop?: number | undefined;
  readonly scrollY: number;
}

/** Capture semantic state from either the published or Svelte projection. */
export function captureKpEconomicsDemandShiftRouteHandoff(input: {
  readonly root: ParentNode;
  readonly scrollY: number;
}): KpEconomicsDemandShiftRouteHandoff | undefined {
  const presentation = input.root.querySelector<HTMLElement>(
    "[data-kp-tutorial-review-root], [data-kp-economics-static-publication]"
  );
  if (presentation === null) return undefined;
  const blockId = findKpEconomicsMotionBlock(
    presentation.dataset["kpTutorialReviewMotionBlock"] ??
      presentation.dataset["kpEconomicsTutorialMotionBlock"]
  )?.id;
  if (blockId === undefined) return undefined;
  const rawProgress = Number(
    presentation.dataset["kpTutorialReviewProgress"] ??
      presentation.dataset["kpEconomicsTutorialMotionProgress"]
  );
  const progress = Number.isFinite(rawProgress)
    ? Math.max(0, Math.min(1, rawProgress))
    : 0;
  const passageId = presentation.dataset["kpTutorialReviewPassage"] ??
    presentation.querySelector<HTMLElement>(
      "[data-kp-economics-deck-scene-active='true']"
    )?.dataset["kpEconomicsDeckPassage"] ??
    findKpEconomicsMotionBlock(blockId)!.passageId;
  const anchor = findPassageAnchor(presentation, passageId);
  return Object.freeze({
    blockId,
    progress,
    passageId,
    ...(anchor === undefined
      ? {}
      : { anchorViewportTop: anchor.getBoundingClientRect().top }),
    scrollY: input.scrollY
  });
}

/** Deck scene is a projection of the retained semantic passage/playhead. */
export function projectKpEconomicsDemandShiftHandoffSearch(input: {
  readonly search: string;
  readonly handoff?: KpEconomicsDemandShiftRouteHandoff | undefined;
}): string {
  if (
    input.handoff === undefined ||
    readKpEconomicsDemandShiftView(input.search) !== "deck"
  ) return input.search;
  const exactPassage = kpEconomicsDemandShiftDeckScenes.findIndex(
    ({ passageId }) => passageId === input.handoff!.passageId
  );
  const sceneIndex = exactPassage >= 0
    ? exactPassage
    : nearestSceneIndex(input.handoff);
  return writeKpEconomicsDemandShiftDeckScene({
    search: input.search,
    sceneIndex
  });
}

export function restoreKpEconomicsDemandShiftRouteScroll(input: {
  readonly root: ParentNode;
  readonly ownerWindow: Window;
  readonly handoff: KpEconomicsDemandShiftRouteHandoff;
}): void {
  const presentation = input.root.querySelector<HTMLElement>(
    "[data-kp-tutorial-review-root], [data-kp-economics-static-publication]"
  );
  const anchor = presentation === null
    ? undefined
    : findPassageAnchor(presentation, input.handoff.passageId);
  if (anchor !== undefined && input.handoff.anchorViewportTop !== undefined) {
    input.ownerWindow.scrollTo({
      top: Math.max(
        0,
        input.ownerWindow.scrollY + anchor.getBoundingClientRect().top -
          input.handoff.anchorViewportTop
      ),
      behavior: "auto"
    });
    return;
  }
  input.ownerWindow.scrollTo({
    top: Math.min(
      input.handoff.scrollY,
      Math.max(0, input.ownerWindow.document.documentElement.scrollHeight -
        input.ownerWindow.innerHeight)
    ),
    behavior: "auto"
  });
}

function nearestSceneIndex(
  handoff: KpEconomicsDemandShiftRouteHandoff
): number {
  let selected = 0;
  let distance = Number.POSITIVE_INFINITY;
  for (const [index, scene] of kpEconomicsDemandShiftDeckScenes.entries()) {
    if (scene.target.blockId !== handoff.blockId) continue;
    const candidate = Math.abs(scene.target.progress - handoff.progress);
    if (candidate <= distance) {
      selected = index;
      distance = candidate;
    }
  }
  return selected;
}

function findPassageAnchor(
  root: ParentNode,
  passageId: string
): HTMLElement | undefined {
  return [...root.querySelectorAll<HTMLElement>(
    "[data-kp-economics-tutorial-passage], [data-kp-economics-deck-passage]"
  )].find((element) =>
    element.dataset["kpEconomicsTutorialPassage"] === passageId ||
    element.dataset["kpEconomicsDeckPassage"] === passageId
  );
}
