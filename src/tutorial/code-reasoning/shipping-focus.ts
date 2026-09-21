import { mountCodeFocus } from "./code-focus.ts";
import { mountCodeSourceCopy } from "./code-source-copy.ts";
import { createKpTypeScriptRefactorSourceProjections } from "../../semantic/typescript-refactor-source-projections.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from "../../animation/typescript-refactor-motion-frame.ts";
import type { createKpTypeScriptFreeShippingRuntimeProjection } from "../../public-web/typescript-free-shipping-runtime.ts";

export function mountShippingFocus(root: HTMLElement, stage: HTMLElement,
  asset: ReturnType<typeof createKpTypeScriptFreeShippingRuntimeProjection>,
  host: { progress(): number; seek(p: number): void; travel(p: number): void; settle(p: number): boolean }
) {
  const required = <T extends HTMLElement>(selector: string): T => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Shipping focus is missing ${selector}`);
    return node;
  };
  const sourceSlot = required<HTMLElement>("[data-code-source-slot]");
  const wrapper = required<HTMLElement>("[data-shipping-focus]");
  const projections = createKpTypeScriptRefactorSourceProjections(asset.semantics);
  const stops = asset.score.stages.map(beat => beat.checkpointMs / asset.score.durationMs);
  const nearest = () => stops.reduce((best, p) => Math.abs(p - host.progress()) <= Math.abs(best - host.progress()) ? p : best);
  const snapshot = () => {
    const motion = sampleKpTypeScriptRefactorMotionFrame({ score: asset.score, progress: nearest(), reducedMotion: true });
    const projection = projections.find(item => item.id === motion.accessibleProjectionId);
    if (!projection) throw new Error("Shipping checkpoint has no complete source projection");
    return { source: projection.sourceText, label: "complete code version" };
  };
  const controls = {
    button: required<HTMLButtonElement>("[data-shipping-copy]"),
    status: required<HTMLElement>("[data-shipping-copy-status]"),
    fallback: required<HTMLElement>("[data-shipping-copy-fallback]"),
    source: required<HTMLTextAreaElement>("[data-shipping-copy-source]")
  };
  const focus = mountCodeFocus(wrapper, stage, host, {
    card: required<HTMLElement>(".shipping-focus-card"),
    slot: required<HTMLElement>("[data-shipping-focus-slot]"),
    note: required<HTMLElement>("[data-shipping-fit-note]"),
    thoughts: asset.score.stages.map(beat => ({ id: beat.id, title: beat.narration })),
    thought(p) {
      const frame = sampleKpTypeScriptRefactorMotionFrame({ score: asset.score, progress: p });
      const beat = asset.score.stages.find(item => item.id === frame.stage.stageId)!;
      return { id: beat.id, title: beat.narration };
    }, stops
  });
  const disposeCopy = mountCodeSourceCopy(stage, controls, snapshot, () => host.settle(nearest()));
  sourceSlot.hidden = true;
  root.dataset["codeFocus"] = "true";
  return { render: focus.render, dispose() {
    disposeCopy(); focus.dispose(); wrapper.hidden = true;
    sourceSlot.hidden = false; delete root.dataset["codeFocus"];
  } };
}
