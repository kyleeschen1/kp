import type { KpAnimationAsset } from "../animation/asset.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import {
  createKpEditorAnimationPlayerState,
  type KpEditorAnimationPlaybackStatus,
  type KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEquationSemanticTimelineCheckpoint
} from "../rendering/equation-visual-motif-timeline.ts";

export interface KpEditorAnimationPlaybackSession {
  readonly kind: "editor-animation-playback-session";
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly animation: KpAnimationAsset;
  readonly catalog: readonly KpAnimationAsset[];
  readonly player: KpEditorAnimationPlayerState;
  readonly tempoMultiplier: number;
  readonly lastTickMs?: number | undefined;
  readonly semanticCheckpointId?: string | undefined;
}

export type KpEditorAnimationPlaybackAction =
  | { readonly type: "play"; readonly nowMs: number }
  | { readonly type: "forward"; readonly nowMs: number }
  | { readonly type: "pause"; readonly nowMs?: number | undefined }
  | { readonly type: "tick"; readonly nowMs: number }
  | { readonly type: "seek"; readonly progress: number }
  | { readonly type: "resample" }
  | {
      readonly type: "seek-semantic-checkpoint";
      readonly checkpoint: KpEquationSemanticTimelineCheckpoint;
    }
  | { readonly type: "step"; readonly delta?: number | undefined }
  | { readonly type: "set-tempo"; readonly multiplier: number }
  | { readonly type: "rewind"; readonly nowMs: number }
  | { readonly type: "reset" };

export function createKpEditorAnimationPlaybackSession(input: {
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly animation: KpAnimationAsset;
  readonly catalog?: readonly KpAnimationAsset[] | undefined;
  readonly progress?: number | undefined;
}): KpEditorAnimationPlaybackSession {
  const catalog = [...(input.catalog ?? [])];

  return {
    kind: "editor-animation-playback-session",
    descriptor: input.descriptor,
    animation: input.animation,
    catalog,
    tempoMultiplier: 1,
    player: createKpEditorAnimationPlayerState({
      descriptor: input.descriptor,
      animation: input.animation,
      catalog,
      progress: input.progress
    })
  };
}

export function replaceKpEditorAnimationPlaybackSessionAsset(input: {
  readonly session: KpEditorAnimationPlaybackSession;
  readonly animation: KpAnimationAsset;
}): KpEditorAnimationPlaybackSession {
  if (input.animation.id !== input.session.animation.id) {
    throw new Error(
      `Cannot replace ${input.session.animation.id} with ${input.animation.id}.`
    );
  }
  const catalog = input.session.catalog.some(
    ({ id }) => id === input.animation.id
  )
    ? input.session.catalog.map((candidate) =>
        candidate.id === input.animation.id ? input.animation : candidate
      )
    : [...input.session.catalog, input.animation];
  const playbackStatus = input.session.player.playbackStatus === "playing"
    ? "paused"
    : input.session.player.playbackStatus;

  return {
    ...input.session,
    animation: input.animation,
    catalog,
    lastTickMs: undefined,
    player: createKpEditorAnimationPlayerState({
      descriptor: input.session.descriptor,
      animation: input.animation,
      catalog,
      playbackStatus,
      direction: input.session.player.direction,
      progress: input.session.player.progress
    })
  };
}

export function reduceKpEditorAnimationPlaybackSession(
  session: KpEditorAnimationPlaybackSession,
  action: KpEditorAnimationPlaybackAction
): KpEditorAnimationPlaybackSession {
  switch (action.type) {
    case "play":
      return resampleSession(session, {
        playbackStatus: "playing",
        progress: session.player.playbackStatus === "complete"
          ? 0
          : session.player.progress,
        lastTickMs: normalizeTimestamp(action.nowMs)
      });
    case "forward":
      return resampleSession(session, {
        playbackStatus: "playing",
        direction: "forward",
        // Direction changes mirror the clock so the rendered frame is
        // continuous; replaying a completed forward run begins at its source.
        progress: session.player.direction === "rewind"
          ? 1 - session.player.progress
          : session.player.playbackStatus === "complete"
            ? 0
            : session.player.progress,
        lastTickMs: normalizeTimestamp(action.nowMs)
      });
    case "pause": {
      const sampled = action.nowMs === undefined
        ? session
        : advanceSession(session, action.nowMs);

      return resampleSession(sampled, {
        playbackStatus: "paused",
        progress: sampled.player.progress
      });
    }
    case "tick":
      return advanceSession(session, action.nowMs);
    case "seek":
      return resampleSession(session, {
        playbackStatus: "paused",
        progress: action.progress
      });
    case "resample":
      return resampleSession(session, {
        playbackStatus: session.player.playbackStatus,
        progress: session.player.progress
      });
    case "seek-semantic-checkpoint":
      return resampleSession(session, {
        playbackStatus: "paused",
        progress: session.player.direction === "forward"
          ? action.checkpoint.progress
          : 1 - action.checkpoint.progress,
        semanticCheckpointId: action.checkpoint.id
      });
    case "step":
      return resampleSession(session, {
        playbackStatus: "paused",
        progress: session.player.progress + (action.delta ?? stepSize(session))
      });
    case "set-tempo":
      if (!Number.isFinite(action.multiplier) || action.multiplier < 0.5 || action.multiplier > 2) {
        throw new Error("Editor animation tempo multiplier must be between 0.5 and 2.");
      }
      return { ...session, tempoMultiplier: action.multiplier };
    case "rewind":
      return resampleSession(session, {
        playbackStatus: "playing",
        direction: "rewind",
        // Rewind progress is mirrored so switching direction does not jump.
        progress: session.player.direction === "rewind"
          ? session.player.progress
          : 1 - session.player.progress,
        lastTickMs: normalizeTimestamp(action.nowMs)
      });
    case "reset":
      return resampleSession(session, {
        playbackStatus: "idle",
        direction: "forward",
        progress: 0
      });
  }
}

function advanceSession(
  session: KpEditorAnimationPlaybackSession,
  nowMs: number
): KpEditorAnimationPlaybackSession {
  if (
    session.player.playbackStatus !== "playing" ||
    session.lastTickMs === undefined
  ) {
    return session;
  }

  const durationMs = session.player.durationMs;
  if (durationMs === undefined || !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(
      `Editor animation ${session.player.animationId} requires a positive duration for playback.`
    );
  }

  const timestamp = normalizeTimestamp(nowMs);
  const deltaMs = Math.max(0, timestamp - session.lastTickMs);
  const progress = Math.min(
    1,
    session.player.progress + deltaMs * session.tempoMultiplier / durationMs
  );
  const complete = progress >= 1;

  return resampleSession(session, {
    playbackStatus: complete ? "complete" : "playing",
    progress,
    ...(complete ? {} : { lastTickMs: timestamp })
  });
}

function resampleSession(
  session: KpEditorAnimationPlaybackSession,
  update: {
    readonly playbackStatus: KpEditorAnimationPlaybackStatus;
    readonly direction?: KpEditorAnimationPlayerState["direction"] | undefined;
    readonly progress: number;
    readonly lastTickMs?: number | undefined;
    readonly semanticCheckpointId?: string | undefined;
  }
): KpEditorAnimationPlaybackSession {
  return {
    ...session,
    player: createKpEditorAnimationPlayerState({
      descriptor: session.descriptor,
      animation: session.animation,
      catalog: session.catalog,
      playbackStatus: update.playbackStatus,
      direction: update.direction ?? session.player.direction,
      progress: update.progress
    }),
    ...(update.lastTickMs === undefined
      ? { lastTickMs: undefined }
      : { lastTickMs: update.lastTickMs }),
    ...(update.semanticCheckpointId === undefined
      ? { semanticCheckpointId: undefined }
      : { semanticCheckpointId: update.semanticCheckpointId })
  };
}

function stepSize(session: KpEditorAnimationPlaybackSession): number {
  const beatCount = session.player.beatCount;
  return beatCount === undefined || beatCount <= 0 ? 0.01 : 1 / beatCount;
}

function normalizeTimestamp(timestamp: number): number {
  return Number.isFinite(timestamp) ? Math.max(0, timestamp) : 0;
}
