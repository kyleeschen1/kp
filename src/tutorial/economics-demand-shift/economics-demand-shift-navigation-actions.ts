import type { KpTutorialTocDestination } from "../kp-tutorial-toc.ts";
import {
  findKpEconomicsMotionBlock,
  kpEconomicsMotionBlocks,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";

export const KP_ECONOMICS_NAVIGATION_ACTION_EVENT =
  "kp:economics-navigation-action";

export type KpEconomicsNavigationAction =
  | "previous-motion-passage"
  | "next-motion-passage"
  | "skip-motion"
  | "settle-motion"
  | "exit-motion";

export interface KpEconomicsNavigationActionDetail {
  readonly action: KpEconomicsNavigationAction;
  readonly blockId?: KpEconomicsMotionBlockId | undefined;
}

/** Resolve semantic destinations only; presentation controls may arrive later. */
export function resolveKpEconomicsNavigationAction(input: {
  readonly action: KpEconomicsNavigationAction;
  readonly blockId: KpEconomicsMotionBlockId;
}): KpTutorialTocDestination | undefined {
  const index = kpEconomicsMotionBlocks.findIndex(
    ({ id }) => id === input.blockId
  );
  if (index < 0) return undefined;
  if (input.action === "previous-motion-passage") {
    const previous = kpEconomicsMotionBlocks[index - 1];
    return previous === undefined ? undefined : { kind: "block", id: previous.id };
  }
  if (input.action === "next-motion-passage") {
    const next = kpEconomicsMotionBlocks[index + 1];
    return next === undefined ? undefined : { kind: "block", id: next.id };
  }
  if (input.action === "skip-motion" || input.action === "settle-motion") {
    const block = findKpEconomicsMotionBlock(input.blockId)!;
    return { kind: "checkpoint", id: block.checkpoints.at(-1)!.id };
  }
  const next = kpEconomicsMotionBlocks[index + 1];
  return next === undefined
    ? { kind: "section", id: "model-scope" }
    : { kind: "block", id: next.id };
}

export function isKpEconomicsNavigationActionDetail(
  value: unknown
): value is KpEconomicsNavigationActionDetail {
  if (typeof value !== "object" || value === null) return false;
  const action = (value as { action?: unknown }).action;
  const blockId = (value as { blockId?: unknown }).blockId;
  return [
    "previous-motion-passage",
    "next-motion-passage",
    "skip-motion",
    "settle-motion",
    "exit-motion"
  ].includes(String(action)) &&
    (blockId === undefined || findKpEconomicsMotionBlock(String(blockId)) !== undefined);
}
