import type { KpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { KpReasoningEvidence } from "./evidence.ts";
import { bindKpReasoningSupport } from "./support.ts";
import { pinKpReasoningReference, type KpReasoningReference } from "./references.ts";
import { KpReasoningRepairGap } from "./source.ts";
import { createKpFocusDeckCheckpointMap, resolveKpFocusDeckGestureTarget } from "../../tutorial/focus-deck-beat-navigation.ts";
import { boundKpFocusDeckTravel } from "../../tutorial/focus-deck-continuous-navigation.ts";
import { navigateKpFocusDeckPlayback } from "../../tutorial/focus-deck-playback.ts";

export interface KpReasoningPosition {
  readonly reference: KpReasoningReference;
  readonly progress: number;
}
interface KpReasoningNavigationIdentity {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly parentId: string;
  readonly position: KpReasoningPosition;
}
export type KpReasoningNavigationSnapshot = KpReasoningNavigationIdentity & (
  | { readonly view: "parent"; readonly returnTo?: never }
  | { readonly view: "reason"; readonly returnTo: KpReasoningPosition }
);

const scrubAuthority: unique symbol = Symbol("reasoning-scrub");
export interface KpReasoningScrub {
  readonly [scrubAuthority]: true;
  update(step: number): void;
  finish(animate?: boolean): void;
  cancel(): void;
}
export interface KpReasoningPassageGesture {
  readonly [scrubAuthority]: true;
  update(step: number, nowMs: number): void;
  finish(nowMs: number, animate?: boolean): void;
  cancel(): void;
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
  let scrub: object | undefined;
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
      position: position(clock.getSnapshot().progress),
      ...(view === "reason" ? { view, returnTo: validatePosition(returnTo!) } : { view })
    });
  };
  position(clock.getSnapshot().progress);
  // Semantic checkpoints own control destinations. Prose pagination is not an
  // input: compressing a reading cannot collapse several operations into Next.
  const stops = createKpFocusDeckCheckpointMap(support.procedure.checkpoints.map((_ref, index) => index / count));
  const { checkpoints } = stops;
  const go = (progress: number, animate: boolean, settle = false) => {
    assertLive(); position(progress);
    scrub = undefined;
    navigateKpFocusDeckPlayback(clock, settle
      ? { kind: "settle-gesture", target: progress, motion: animate ? "full" : "reduced",
          durationMs: Math.max(160, Math.min(380, Math.abs(progress - clock.getSnapshot().progress) * clock.durationMs)) }
      : animate ? { kind: "play-transition", target: progress, motion: "full" }
        : { kind: "restore-position", target: progress });
  };
  return Object.freeze({
    end,
    stepCount: checkpoints.length - 1,
    getStepPosition: () => stops.positionAt(clock.getSnapshot().progress),
    beginScrub(): KpReasoningScrub {
      assertLive(); clock.pause();
      const token = {};
      scrub = token;
      // Browser releases can arrive after disclosure, interruption or disposal.
      // Only the currently issued gesture owns permission to settle the clock.
      const live = () => !disposed && scrub === token;
      return Object.freeze({
        [scrubAuthority]: true as const,
        update(step: number) {
          if (!live()) return;
          const progress = stops.progressAt(step); position(progress); clock.seek(progress);
        },
        finish(animate = true) {
          if (!live()) return;
          go(checkpoints[Math.round(stops.positionAt(clock.getSnapshot().progress))]!, animate, true);
        },
        cancel() { if (live()) scrub = undefined; }
      });
    },
    beginPassageGesture(nowMs: number): KpReasoningPassageGesture {
      assertLive();
      if (!Number.isFinite(nowMs)) throw new Error("Gesture time must be finite.");
      clock.pause();
      const token = {}; scrub = token;
      const live = () => !disposed && scrub === token;
      const anchor = Math.round(stops.positionAt(clock.getSnapshot().progress));
      let last = stops.positionAt(clock.getSnapshot().progress), at = nowMs, velocity = 0, moved = false;
      return Object.freeze({
        [scrubAuthority]: true as const,
        update(step: number, now: number) {
          if (!live()) return;
          if (!Number.isFinite(step) || !Number.isFinite(now) || now < at) throw new Error("Invalid gesture sample.");
          const bounded = boundKpFocusDeckTravel(step, checkpoints.length - 1);
          const elapsed = now - at;
          moved ||= Math.abs(bounded - last) > 1e-8;
          velocity = elapsed > 0 && elapsed <= 100 ? (bounded - last) / elapsed : 0;
          last = bounded; at = now;
          clock.seek(stops.progressAt(bounded));
        },
        finish(now: number, animate = true) {
          if (!live()) return;
          if (!Number.isFinite(now) || now < at) throw new Error("Invalid gesture release.");
          const target = moved ? resolveKpFocusDeckGestureTarget(anchor, last, now - at <= 100 ? velocity : 0, checkpoints.length - 1)
            : Math.round(last);
          go(checkpoints[target]!, animate, true);
        },
        cancel() { if (live()) scrub = undefined; }
      });
    },
    seekStep(step: number, animate = false) {
      // Keep this domain's typed diagnostic before entering the shared mapper.
      position(step / count);
      go(stops.progressAt(step), animate);
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
      scrub = undefined;
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
      scrub = undefined;
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
      scrub = undefined;
      clock.pause();
      view = snapshot.view;
      returnTo = saved;
      clock.seek(next.progress, "url");
      return capture();
    },
    dispose() { scrub = undefined; disposed = true; }
  });
}
