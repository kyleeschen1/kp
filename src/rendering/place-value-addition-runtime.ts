import type {
  KpReaderClockSample
} from "../reader/runtime/playback-clock.ts";
import {
  compileKpPlaceValueWrittenColumnProjection,
  type KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  certifyKpPlaceValueSemanticFoundation,
  type KpVerifiedPlaceValueSemanticFoundation
} from "../architecture/place-value-addition-semantic-foundation.ts";
import type {
  KpPlaceValueAdditionBeat,
  KpPlaceValueAdditionState
} from "../semantic/place-value-addition-trace.ts";
import {
  compileKpPlaceValueBaseTenProjection,
  sampleKpPlaceValueBaseTenFrame,
  type KpPlaceValueBaseTenFrame,
  type KpPlaceValueBaseTenProjection
} from "./place-value-addition-base-ten-projection.ts";
import {
  compileKpPlaceValueOnesEvaluation,
  type KpPlaceValueOnesEvaluation
} from "./place-value-addition-ones-evaluation.ts";

declare const kpPlaceValueRuntimeSessionBrand: unique symbol;
declare const kpPlaceValueRuntimeFrameBrand: unique symbol;

const sealedSessions = new WeakSet<object>();
const sealedFrames = new WeakSet<object>();

export type KpPlaceValueRuntimeView = "written" | "base-ten";

export interface KpPlaceValueAdditionRuntimeSession {
  readonly schemaVersion: "kp.place-value-addition-runtime-session.v1";
  readonly id: "runtime-session.place-value-addition.278-plus-156";
  readonly rendererSessionId:
    "renderer-session.place-value-addition.278-plus-156";
  readonly rendererSessionCount: 1;
  readonly clockAuthority: "reader-playback-clock";
  readonly foundation: KpVerifiedPlaceValueSemanticFoundation;
  readonly written: KpPlaceValueWrittenColumnProjection;
  readonly baseTen: KpPlaceValueBaseTenProjection;
  readonly onesEvaluation: KpPlaceValueOnesEvaluation;
  readonly mountedViews: readonly ["written", "base-ten"];
  readonly [kpPlaceValueRuntimeSessionBrand]: true;
}

export interface KpPlaceValueAdditionRuntimeFrame {
  readonly schemaVersion: "kp.place-value-addition-runtime-frame.v1";
  readonly sessionId: KpPlaceValueAdditionRuntimeSession["id"];
  readonly rendererSessionId:
    KpPlaceValueAdditionRuntimeSession["rendererSessionId"];
  readonly clock: Pick<
    KpReaderClockSample,
    "source" | "progress" | "progressPermille" | "direction" | "sequence"
  >;
  readonly beat: KpPlaceValueAdditionBeat;
  readonly beatProgress: number;
  readonly sourceState: KpPlaceValueAdditionState;
  readonly targetState: KpPlaceValueAdditionState;
  readonly stableState: KpPlaceValueAdditionState;
  readonly written: KpPlaceValueWrittenColumnProjection;
  readonly baseTen: {
    readonly source: KpPlaceValueBaseTenFrame;
    readonly target: KpPlaceValueBaseTenFrame;
    readonly stable: KpPlaceValueBaseTenFrame;
  };
  readonly responsive: {
    readonly mode: "wide-both" | "phone-selected";
    readonly mountedViews: readonly ["written", "base-ten"];
    readonly visibleViews:
      | readonly ["written", "base-ten"]
      | readonly [KpPlaceValueRuntimeView];
    readonly selectedView: KpPlaceValueRuntimeView;
  };
  readonly [kpPlaceValueRuntimeFrameBrand]: true;
}

export function createKpPlaceValueAdditionRuntimeSession():
KpPlaceValueAdditionRuntimeSession {
  const foundation = certifyKpPlaceValueSemanticFoundation();
  const written = compileKpPlaceValueWrittenColumnProjection(foundation);
  const baseTen = compileKpPlaceValueBaseTenProjection(foundation);
  const onesEvaluation = compileKpPlaceValueOnesEvaluation(
    foundation.presentation
  );
  if (
    written.traceId !== foundation.trace.id ||
    baseTen.traceId !== foundation.trace.id
  ) {
    throw new Error(
      "Place-value runtime views must share one sealed semantic trace."
    );
  }
  const session = Object.freeze({
    schemaVersion: "kp.place-value-addition-runtime-session.v1" as const,
    id: "runtime-session.place-value-addition.278-plus-156" as const,
    rendererSessionId:
      "renderer-session.place-value-addition.278-plus-156" as const,
    rendererSessionCount: 1 as const,
    clockAuthority: "reader-playback-clock" as const,
    foundation,
    written,
    baseTen,
    onesEvaluation,
    mountedViews: Object.freeze(["written", "base-ten"] as const)
  });
  sealedSessions.add(session);
  return session as unknown as KpPlaceValueAdditionRuntimeSession;
}

export function sampleKpPlaceValueAdditionRuntime(input: {
  readonly session: KpPlaceValueAdditionRuntimeSession;
  readonly clock: KpReaderClockSample;
  readonly viewportWidth: number;
  readonly selectedView?: KpPlaceValueRuntimeView | undefined;
}): KpPlaceValueAdditionRuntimeFrame {
  if (!isKpPlaceValueAdditionRuntimeSession(input.session)) {
    throw new Error(
      "Place-value runtime sampling requires its sealed shared session."
    );
  }
  if (
    !Number.isFinite(input.viewportWidth) ||
    input.viewportWidth <= 0
  ) {
    throw new Error("Place-value runtime requires a positive viewport width.");
  }
  const clock = freezeClock(input.clock);
  const beatIndex = reference.beats.findIndex((beat, index) =>
    clock.progressPermille < beat.endPermille ||
    index === reference.beats.length - 1
  );
  const referenceBeat = reference.beats[beatIndex];
  const beat = input.session.foundation.trace.beats[beatIndex];
  if (referenceBeat === undefined || beat === undefined) {
    throw new Error("Place-value runtime could not resolve its trace beat.");
  }
  const sourceState = requireState(
    input.session,
    beat.fromStateId ?? beat.toStateId
  );
  const targetState = requireState(input.session, beat.toStateId);
  const beatProgress = clampUnit(
    (clock.progressPermille - referenceBeat.startPermille) /
      (referenceBeat.endPermille - referenceBeat.startPermille)
  );
  // Exact beat boundaries belong to the next beat. Its source is the prior
  // target, so direct seek, rewind, and autoplay all expose the same stable
  // semantic state without a terminal-to-first-frame flash.
  const stableState = beatProgress >= 1 ? targetState : sourceState;
  const selectedView = input.selectedView ?? "written";
  const wide = input.viewportWidth >= 881;
  const frame = Object.freeze({
    schemaVersion: "kp.place-value-addition-runtime-frame.v1" as const,
    sessionId: input.session.id,
    rendererSessionId: input.session.rendererSessionId,
    clock,
    beat,
    beatProgress,
    sourceState,
    targetState,
    stableState,
    written: input.session.written,
    baseTen: Object.freeze({
      source: sampleKpPlaceValueBaseTenFrame(
        input.session.baseTen,
        sourceState.id
      ),
      target: sampleKpPlaceValueBaseTenFrame(
        input.session.baseTen,
        targetState.id
      ),
      stable: sampleKpPlaceValueBaseTenFrame(
        input.session.baseTen,
        stableState.id
      )
    }),
    responsive: Object.freeze({
      mode: wide ? "wide-both" as const : "phone-selected" as const,
      mountedViews: input.session.mountedViews,
      visibleViews: wide
        ? Object.freeze(["written", "base-ten"] as const)
        : Object.freeze([selectedView] as const),
      selectedView
    })
  });
  sealedFrames.add(frame);
  return frame as unknown as KpPlaceValueAdditionRuntimeFrame;
}

export function isKpPlaceValueAdditionRuntimeSession(
  value: unknown
): value is KpPlaceValueAdditionRuntimeSession {
  return typeof value === "object" &&
    value !== null &&
    sealedSessions.has(value);
}

export function isKpPlaceValueAdditionRuntimeFrame(
  value: unknown
): value is KpPlaceValueAdditionRuntimeFrame {
  return typeof value === "object" &&
    value !== null &&
    sealedFrames.has(value);
}

function requireState(
  session: KpPlaceValueAdditionRuntimeSession,
  stateId: KpPlaceValueAdditionState["id"]
): KpPlaceValueAdditionState {
  const state = session.foundation.trace.states.find(
    (candidate) => candidate.id === stateId
  );
  if (state === undefined) {
    throw new Error(`Place-value runtime lacks state ${stateId}.`);
  }
  return state;
}

function freezeClock(
  clock: KpReaderClockSample
): KpPlaceValueAdditionRuntimeFrame["clock"] {
  if (
    !Number.isFinite(clock.progress) ||
    clock.progress < 0 ||
    clock.progress > 1 ||
    clock.progressPermille !== Math.round(clock.progress * 1_000)
  ) {
    throw new Error(
      "Place-value runtime requires one valid reader playback-clock sample."
    );
  }
  return Object.freeze({
    source: clock.source,
    progress: clock.progress,
    progressPermille: clock.progressPermille,
    direction: clock.direction,
    sequence: clock.sequence
  });
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}
