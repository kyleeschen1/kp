import type {
  KpTutorialMotionBridgeAuthoring
} from "./kp-tutorial-motion-bridge-authoring.ts";

export function renderKpTutorialMotionBridgeStatic(input: {
  readonly bridge: KpTutorialMotionBridgeAuthoring;
  readonly beforeHtml: string;
  readonly afterHtml: string;
}): string {
  if (input.beforeHtml.trim() === "" || input.afterHtml.trim() === "") {
    throw new Error("Static motion bridge requires prose on both sides.");
  }
  // Both statements remain real light-DOM paragraphs. Enhancement may add
  // geometry between them, but it never owns or reconstructs their content.
  return [
    `<kp-motion-bridge class="kp-tutorial-motion-bridge" data-kp-motion-bridge="${input.bridge.id}" data-kp-motion-bridge-distance="${input.bridge.distance}" data-kp-motion-block="${input.bridge.motionBlockId}" data-kp-motion-from-checkpoint="${input.bridge.fromCheckpointId}" data-kp-motion-to-checkpoint="${input.bridge.toCheckpointId}">`,
    `<p data-kp-motion-bridge-before="${input.bridge.beforePassageId}">${input.beforeHtml}</p>`,
    `<p data-kp-motion-bridge-after="${input.bridge.afterPassageId}">${input.afterHtml}</p>`,
    "</kp-motion-bridge>"
  ].join("");
}
