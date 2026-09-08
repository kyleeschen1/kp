import type { KpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { KpReasoningEvidence } from "./evidence.ts";
import { bindKpReasoningSupport } from "./support.ts";
import { pinKpReasoningReference, type KpReasoningReference } from "./references.ts";
import { KpReasoningRepairGap } from "./source.ts";

export interface KpReasoningPosition {
  readonly reference: KpReasoningReference;
  readonly progress: number;
}
export interface KpReasoningNavigationSnapshot {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly parentId: string;
  readonly view: "parent" | "reason";
  readonly position: KpReasoningPosition;
  readonly returnTo?: KpReasoningPosition;
}

/** Disclosure borrows the existing clock; it does not sample, schedule or retime motion. */
export function createKpReasoningNavigator(
  evidence: KpReasoningEvidence, clock: KpReaderTimelinePlaybackClock
) {
  const support = bindKpReasoningSupport(evidence);
  const count = evidence.states.length - 1;
  const end = support.procedure.operations.length / count;
  let view: "parent" | "reason" = "parent";
  let returnTo: KpReasoningPosition | undefined;
  let disposed = false;
  const assertLive = () => {
    if (disposed) throw new KpReasoningRepairGap("kp.reasoning.navigation-disposed", "$.navigation", "Mount a live navigation instance.");
  };
  const position = (progress: number): KpReasoningPosition => {
    if (!Number.isFinite(progress) || progress < 0 || progress > end) throw new KpReasoningRepairGap(
      "kp.reasoning.navigation-range", "$.position.progress", "Select a position inside the supported parent procedure.");
    const checkpoint = support.procedure.checkpoints.findIndex((_ref, index) => index / count === progress);
    const reference = checkpoint >= 0 ? support.procedure.checkpoints[checkpoint]!
      : pinKpReasoningReference(evidence, "operation", evidence.steps[Math.floor(progress * count)]!.id);
    return Object.freeze({ reference, progress });
  };
  const validatePosition = (value: KpReasoningPosition): KpReasoningPosition => {
    if (typeof value !== "object" || value === null) throw new KpReasoningRepairGap(
      "kp.reasoning.navigation-position", "$.position", "Restore an explicit revision-pinned position.");
    const expected = position(value.progress);
    const ref = value.reference;
    if (!ref || ref.sourceId !== expected.reference.sourceId || ref.revisionId !== expected.reference.revisionId
      || ref.id !== expected.reference.id || ref.kind !== expected.reference.kind || ref.timelineAuthority !== "none") {
      throw new KpReasoningRepairGap("kp.reasoning.navigation-reference", "$.position.reference",
        "The semantic reference must match this exact source revision and clock position.");
    }
    return expected;
  };
  const capture = (): KpReasoningNavigationSnapshot => {
    assertLive();
    return Object.freeze({
      sourceId: evidence.source.id, revisionId: evidence.revisionId, parentId: support.parentId,
      view, position: position(clock.getSnapshot().progress), ...(returnTo ? { returnTo } : {})
    });
  };
  position(clock.getSnapshot().progress);
  // Semantic checkpoints own control destinations. Prose pagination is not an
  // input: compressing a reading cannot collapse several operations into Next.
  const checkpoints = Object.freeze(support.procedure.checkpoints.map((_ref, index) => index / count));
  const go = (progress: number, animate: boolean) => {
    assertLive(); position(progress);
    clock.pause();
    if (!animate) clock.seek(progress);
    else clock.play({ direction: progress >= clock.getSnapshot().progress ? "forward" : "rewind", stopAt: progress });
  };
  return Object.freeze({
    end,
    stepCount: checkpoints.length - 1,
    getStepPosition: () => clock.getSnapshot().progress * count,
    seekStep(step: number, animate = false) {
      go(step / count, animate);
    },
    step(direction: "forward" | "rewind", animate = true) {
      assertLive();
      const progress = clock.getSnapshot().progress;
      const target = direction === "forward"
        ? checkpoints.find(value => value > progress) ?? end
        : [...checkpoints].reverse().find(value => value < progress) ?? 0;
      go(target, animate);
    },
    getView: () => view,
    capture,
    open() {
      assertLive();
      if (view === "reason") return capture();
      const saved = position(clock.getSnapshot().progress);
      clock.pause();
      returnTo = saved;
      view = "reason";
      clock.seek(0);
      return capture();
    },
    returnToParent() {
      assertLive();
      if (view === "parent") return capture();
      const saved = validatePosition(returnTo!);
      clock.pause();
      view = "parent";
      returnTo = undefined;
      clock.seek(saved.progress);
      return capture();
    },
    restore(value: unknown) {
      assertLive();
      const snapshot = value as KpReasoningNavigationSnapshot | null;
      if (!snapshot || snapshot.sourceId !== evidence.source.id || snapshot.revisionId !== evidence.revisionId
        || snapshot.parentId !== support.parentId || !["parent", "reason"].includes(snapshot.view)) {
        throw new KpReasoningRepairGap("kp.reasoning.navigation-revision", "$.navigation",
          "Restore the exact source revision and parent; source edits require a new valid navigation projection.");
      }
      const next = validatePosition(snapshot.position);
      const saved = snapshot.view === "reason" ? validatePosition(snapshot.returnTo!) : undefined;
      if (snapshot.view === "parent" && snapshot.returnTo !== undefined) throw new KpReasoningRepairGap(
        "kp.reasoning.navigation-return", "$.returnTo", "A parent view cannot carry an active child return frame.");
      // Validate the entire request before touching the last valid clock/view.
      clock.pause();
      view = snapshot.view;
      returnTo = saved;
      clock.seek(next.progress, "url");
      return capture();
    },
    dispose() { disposed = true; }
  });
}
