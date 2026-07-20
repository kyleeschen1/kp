import type { KpLinearEquationStoryAnimationStage } from "./linear-equation-story-animation-stage.ts";

export interface KpLinearEquationStoryProgressController {
  bind(stage: KpLinearEquationStoryAnimationStage): void;
  unbind(): void;
  seek(progressPermille: number, animate: boolean): void;
  dispose(): void;
}

export function createLinearEquationStoryProgressController(input: {
  readonly durationMs?: number;
  readonly reducedMotion?: () => boolean;
} = {}): KpLinearEquationStoryProgressController {
  const durationMs = input.durationMs ?? 620;
  let stage: KpLinearEquationStoryAnimationStage | undefined;
  let target = 0;
  let frame = 0;
  let disposed = false;

  function cancel(): void {
    if (frame === 0) return;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function apply(animate: boolean): void {
    cancel();
    if (stage === undefined) return;
    const destination = target / 1000;
    const reduced = input.reducedMotion?.() ?? browserReducedMotion();
    if (!animate || reduced || durationMs <= 0) {
      stage.setProgress(destination);
      return;
    }
    const start = stage.getProgress();
    const startedAt = performance.now();
    const tick = (now: number) => {
      if (disposed || stage === undefined) return;
      const elapsed = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
      const eased = 1 - Math.pow(1 - elapsed, 3);
      stage.setProgress(start + (destination - start) * eased);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    frame = requestAnimationFrame(tick);
  }

  return {
    bind(nextStage) {
      if (disposed) throw new Error("Symbolic story progress controller is disposed.");
      stage = nextStage;
      apply(false);
    },
    unbind() {
      cancel();
      stage = undefined;
    },
    seek(progressPermille, animate) {
      if (disposed) return;
      target = clampPermille(progressPermille);
      apply(animate);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel();
      stage = undefined;
    }
  };
}

function clampPermille(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1000, Math.max(0, value));
}

function browserReducedMotion(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
