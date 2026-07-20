import type { KpReaderClockSource } from "./playback-clock.ts";

export type KpReaderClockAuthorityEventKind = "begin" | "update" | "end";

export interface KpReaderClockAuthorityState {
  readonly authority: KpReaderClockSource;
  readonly userEngaged: boolean;
  readonly lastSequence: number;
}

export interface KpReaderClockAuthorityEvent {
  readonly kind: KpReaderClockAuthorityEventKind;
  readonly source: KpReaderClockSource;
  readonly sequence: number;
}

export interface KpReaderClockAuthorityDecision {
  readonly accepted: boolean;
  readonly state: KpReaderClockAuthorityState;
  readonly reason:
    | "claimed"
    | "updated"
    | "released"
    | "stale-sequence"
    | "inactive-source"
    | "user-authority-preserved";
}

export function createKpReaderClockAuthorityState(): KpReaderClockAuthorityState {
  return { authority: "initial", userEngaged: false, lastSequence: -1 };
}

export function reduceKpReaderClockAuthority(
  state: KpReaderClockAuthorityState,
  event: KpReaderClockAuthorityEvent
): KpReaderClockAuthorityDecision {
  if (!Number.isInteger(event.sequence) || event.sequence <= state.lastSequence) {
    return { accepted: false, state, reason: "stale-sequence" };
  }
  if (event.kind === "begin") return beginAuthority(state, event);
  if (event.source !== state.authority) {
    return { accepted: false, state, reason: "inactive-source" };
  }
  if (event.kind === "update") {
    return {
      accepted: true,
      state: { ...state, lastSequence: event.sequence },
      reason: "updated"
    };
  }
  return {
    accepted: true,
    state: {
      authority: "scroll",
      userEngaged: state.userEngaged,
      lastSequence: event.sequence
    },
    reason: "released"
  };
}

function beginAuthority(
  state: KpReaderClockAuthorityState,
  event: KpReaderClockAuthorityEvent
): KpReaderClockAuthorityDecision {
  const userSource = event.source === "scroll" || event.source === "controls";
  if (!userSource && state.userEngaged && event.source !== state.authority) {
    return { accepted: false, state, reason: "user-authority-preserved" };
  }
  if (event.source === "initial") {
    return state.authority === "initial"
      ? {
          accepted: true,
          state: { ...state, lastSequence: event.sequence },
          reason: "claimed"
        }
      : { accepted: false, state, reason: "inactive-source" };
  }
  return {
    accepted: true,
    state: {
      authority: event.source,
      userEngaged: state.userEngaged || userSource,
      lastSequence: event.sequence
    },
    reason: "claimed"
  };
}
