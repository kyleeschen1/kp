import {
  createKpSemanticSalienceState,
  type KpSalienceIdentityFamily,
  type KpSalienceLevel,
  type KpSemanticSalienceState
} from "./semantic-salience-state.ts";

export const kpSalienceSignals = Object.freeze([
  "selected",
  "focused",
  "contextual",
  "ghost",
  "entering",
  "withdrawing"
] as const);

export type KpSalienceSignal = typeof kpSalienceSignals[number];
export type KpPresencePhase = "present" | "entering" | "withdrawing" | "absent";

export interface KpResolvedSemanticSalience {
  readonly state: KpSemanticSalienceState;
  readonly presencePhase: KpPresencePhase;
}

export function resolveKpSemanticSalience(input: {
  readonly baseLevel: KpSalienceLevel;
  readonly identityFamily: KpSalienceIdentityFamily;
  readonly presence: number;
  readonly signals?: readonly KpSalienceSignal[];
}): KpResolvedSemanticSalience {
  const signals = new Set(input.signals ?? []);
  for (const signal of signals) {
    if (!kpSalienceSignals.includes(signal)) {
      throw new Error(`Unknown salience signal ${String(signal)}.`);
    }
  }
  if (signals.has("entering") && signals.has("withdrawing")) {
    throw new Error("Salience presence cannot enter and withdraw simultaneously.");
  }
  const presence = clamp(input.presence);
  const level = resolveLevel({
    baseLevel: input.baseLevel,
    presence,
    signals
  });
  return Object.freeze({
    state: createKpSemanticSalienceState({
      level,
      identityFamily: input.identityFamily,
      presence
    }),
    presencePhase: presence === 0
      ? "absent"
      : signals.has("entering")
        ? "entering"
        : signals.has("withdrawing")
          ? "withdrawing"
          : "present"
  });
}

function resolveLevel(input: {
  readonly baseLevel: KpSalienceLevel;
  readonly presence: number;
  readonly signals: ReadonlySet<KpSalienceSignal>;
}): KpSalienceLevel {
  if (input.presence === 0) return "absent";
  if (input.signals.has("selected") || input.signals.has("focused")) {
    return "focus";
  }
  if (input.signals.has("ghost")) return "ghost";
  if (input.signals.has("contextual")) return "context";
  return input.baseLevel;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Salience presence must be finite.");
  return Math.min(1, Math.max(0, value));
}
