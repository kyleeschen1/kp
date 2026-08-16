import {
  isKpVerifiedSemanticMotionCompilation,
  mintKpSemanticMotionCompilerReady
} from "./semantic-motion-compiler-authority.ts";
import type { KpVerifiedSemanticMotionCompilation } from "./semantic-motion-compiler-contract.ts";
import type { KpSemanticMotionEventKind } from "./semantic-motion-precedence-compiler.ts";
import {
  isKpResolvedSemanticMotionRecipe,
  type KpResolvedSemanticMotionRecipe,
  type KpSemanticMotionRecipeCapabilityId,
  type KpSemanticMotionRecipeId
} from "./semantic-motion-recipe-resolver.ts";

export interface KpSemanticMotionTrackWindow {
  readonly start: number;
  readonly end: number;
}

export interface KpSemanticMotionTrack {
  readonly id: string;
  readonly eventId: string;
  readonly eventKind: KpSemanticMotionEventKind;
  readonly capabilityId: KpSemanticMotionRecipeCapabilityId;
  readonly window: KpSemanticMotionTrackWindow;
  readonly interpolation: "linear" | "smoothstep";
  readonly cohortIds: readonly string[];
  readonly attachmentIds: readonly string[];
  readonly correspondenceRecordIds: readonly string[];
}

declare const kpSemanticMotionChoreographyAuthority: unique symbol;

export type KpCompiledSemanticMotionChoreography = Readonly<{
  kind: "compiled-semantic-motion-choreography";
  id: string;
  requestId: string;
  recipeId: KpSemanticMotionRecipeId;
  clockCoupling: "external-shared-progress";
  compilation: KpVerifiedSemanticMotionCompilation;
  resolution: KpResolvedSemanticMotionRecipe;
  tracks: readonly KpSemanticMotionTrack[];
  [kpSemanticMotionChoreographyAuthority]: true;
}>;

export interface KpSemanticMotionTrackSample {
  readonly trackId: string;
  readonly eventId: string;
  readonly capabilityId: KpSemanticMotionRecipeCapabilityId;
  readonly progress: number;
  readonly active: boolean;
  readonly complete: boolean;
}

export interface KpSemanticMotionChoreographySample {
  readonly choreographyId: string;
  readonly requestedProgress: number;
  readonly semanticProgress: number;
  readonly direction: "forward" | "rewind";
  readonly reducedMotion: boolean;
  readonly settledStateId: string | undefined;
  readonly tracks: readonly KpSemanticMotionTrackSample[];
}

interface RecipeSchedulePolicy {
  readonly eventWeights: Readonly<Record<KpSemanticMotionEventKind, number>>;
  readonly eventCapabilities: Readonly<Record<KpSemanticMotionEventKind, KpSemanticMotionRecipeCapabilityId | undefined>>;
  readonly interpolation: "linear" | "smoothstep";
}

const compiledChoreographies = new WeakSet<object>();

export function compileKpSemanticMotionChoreography(
  resolution: KpResolvedSemanticMotionRecipe
): KpCompiledSemanticMotionChoreography {
  if (!isKpResolvedSemanticMotionRecipe(resolution)) {
    throw new Error("Choreography compilation requires original recipe-resolution authority.");
  }
  const precedence = resolution.precedence;
  const request = precedence.structure.lifecycle.provenance.endpointFrontier.request;
  const policy = schedulePolicy(resolution.recipeId);
  const eventById = new Map(precedence.events.map((event) => [event.id, event] as const));
  const predecessors = new Map<string, string[]>();
  precedence.edges.forEach(({ beforeEventId, afterEventId }) => {
    predecessors.set(afterEventId, [...(predecessors.get(afterEventId) ?? []), beforeEventId]);
  });
  const scoreById = new Map<string, { start: number; end: number }>();
  precedence.topologicalLayers.flat().forEach((eventId) => {
    const event = eventById.get(eventId);
    if (event === undefined) throw new Error(`Verified precedence is missing event ${eventId}.`);
    const capabilityId = policy.eventCapabilities[event.kind];
    if (capabilityId === undefined || !resolution.capabilityIds.includes(capabilityId)) {
      throw new Error(`Recipe ${resolution.recipeId} does not bind semantic event ${event.kind}.`);
    }
    const start = Math.max(0, ...(predecessors.get(eventId) ?? []).map((id) => scoreById.get(id)?.end ?? 0));
    const end = start + policy.eventWeights[event.kind];
    scoreById.set(eventId, { start, end });
  });
  const extent = Math.max(...[...scoreById.values()].map(({ end }) => end));
  if (!Number.isFinite(extent) || extent <= 0) throw new Error("Semantic choreography requires a positive schedule extent.");
  const tracks = precedence.events.map((event) => {
    const score = scoreById.get(event.id)!;
    return Object.freeze({
      id: `track.${request.operation.transformationId}.${event.id}`,
      eventId: event.id,
      eventKind: event.kind,
      capabilityId: policy.eventCapabilities[event.kind]!,
      window: Object.freeze({
        start: round(score.start / extent),
        end: round(score.end / extent)
      }),
      interpolation: policy.interpolation,
      cohortIds: Object.freeze([...event.cohortIds]),
      attachmentIds: Object.freeze([...event.attachmentIds]),
      correspondenceRecordIds: Object.freeze([...event.correspondenceRecordIds])
    });
  });
  validateLoweredTracks(precedence.edges, tracks);
  const usedCapabilities = new Set(tracks.map(({ capabilityId }) => capabilityId));
  if (resolution.capabilityIds.some((capabilityId) => !usedCapabilities.has(capabilityId))) {
    throw new Error(`Recipe ${resolution.recipeId} contains an unbound capability.`);
  }
  const outcome = mintKpSemanticMotionCompilerReady(request);
  if (outcome.status !== "ready" || !isKpVerifiedSemanticMotionCompilation(outcome.compilation)) {
    throw new Error("Semantic choreography compiler failed to mint executable authority.");
  }
  const choreography = Object.freeze({
    kind: "compiled-semantic-motion-choreography" as const,
    id: `choreography.${request.operation.transformationId}.${resolution.recipeId}`,
    requestId: request.id,
    recipeId: resolution.recipeId,
    clockCoupling: "external-shared-progress" as const,
    compilation: outcome.compilation,
    resolution,
    tracks: Object.freeze(tracks)
  }) as KpCompiledSemanticMotionChoreography;
  compiledChoreographies.add(choreography);
  return choreography;
}

export function isKpCompiledSemanticMotionChoreography(
  value: unknown
): value is KpCompiledSemanticMotionChoreography {
  return typeof value === "object" && value !== null && compiledChoreographies.has(value);
}

export function sampleKpSemanticMotionChoreography(input: {
  readonly choreography: KpCompiledSemanticMotionChoreography;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly reducedMotion?: boolean | undefined;
}): KpSemanticMotionChoreographySample {
  if (!isKpCompiledSemanticMotionChoreography(input.choreography)) {
    throw new Error("Semantic motion sampling requires original choreography authority.");
  }
  const requestedProgress = clamp01(input.progress);
  const directedProgress = input.direction === "forward" ? requestedProgress : 1 - requestedProgress;
  const semanticProgress = input.reducedMotion === true
    ? directedProgress < 0.5 ? 0 : 1
    : directedProgress;
  const request = input.choreography.resolution.precedence.structure.lifecycle.provenance.endpointFrontier.request;
  return Object.freeze({
    choreographyId: input.choreography.id,
    requestedProgress,
    semanticProgress: round(semanticProgress),
    direction: input.direction,
    reducedMotion: input.reducedMotion === true,
    settledStateId: semanticProgress === 0
      ? request.sourceState.id
      : semanticProgress === 1
        ? request.targetState.id
        : undefined,
    tracks: Object.freeze(input.choreography.tracks.map((track) => {
      const progress = interpolate(track, semanticProgress);
      return Object.freeze({
        trackId: track.id,
        eventId: track.eventId,
        capabilityId: track.capabilityId,
        progress,
        active: progress > 0 && progress < 1,
        complete: progress === 1
      });
    }))
  });
}

function schedulePolicy(recipeId: KpSemanticMotionRecipeId): RecipeSchedulePolicy {
  switch (recipeId) {
    case "recipe.semantic-motion.log-quotient-fusion.v1":
      return Object.freeze({
        eventWeights: eventWeights({ orient: 1.2, clearance: 0.7, departure: 1.4, arrival: 1.4, attachment: 0.8 }),
        interpolation: "smoothstep" as const,
        eventCapabilities: Object.freeze({
          orient: "semantic.fuse-operator-applications",
          clearance: "semantic.clear-source-structure",
          departure: "semantic.transfer-arguments",
          arrival: "semantic.transfer-arguments",
          contact: undefined,
          recognition: undefined,
          retirement: undefined,
          attachment: "semantic.attach-target-structure",
          settlement: undefined,
          "native-target-ready": "semantic.settle-native-target"
        })
      });
    case "recipe.semantic-motion.distribution-fan-out.v1":
      return Object.freeze({
        eventWeights: eventWeights({ orient: 0.8, departure: 1.2, arrival: 1.4, attachment: 0.7, settlement: 1.2 }),
        interpolation: "smoothstep" as const,
        eventCapabilities: Object.freeze({
          orient: "semantic.reserve-target-members",
          clearance: undefined,
          departure: "semantic.fan-out-factor",
          arrival: "semantic.fan-out-factor",
          contact: undefined,
          recognition: undefined,
          retirement: undefined,
          attachment: "semantic.attach-connector",
          settlement: "semantic.settle-ordered-products",
          "native-target-ready": "semantic.settle-native-target"
        })
      });
    case "recipe.semantic-motion.inverse-cancellation.v1":
      return Object.freeze({
        eventWeights: eventWeights({ orient: 0.8, contact: 1.6, retirement: 0.7, settlement: 1.1 }),
        interpolation: "smoothstep" as const,
        eventCapabilities: Object.freeze({
          orient: "semantic.establish-inverse-contact",
          clearance: undefined,
          departure: undefined,
          arrival: undefined,
          contact: "semantic.establish-inverse-contact",
          recognition: undefined,
          retirement: "semantic.retire-inverse-pair",
          attachment: undefined,
          settlement: "semantic.compact-survivors",
          "native-target-ready": "semantic.settle-native-target"
        })
      });
    case "recipe.semantic-motion.log-product-fission.v1":
      return Object.freeze({
        eventWeights: eventWeights({
          orient: 0.7,
          clearance: 1.6,
          departure: 0.8,
          arrival: 1.6,
          attachment: 0.7,
          settlement: 0.8
        }),
        interpolation: "smoothstep" as const,
        eventCapabilities: Object.freeze({
          orient: "semantic.reserve-target-members",
          clearance: "semantic.release-application-shells",
          departure: "semantic.fission-operator-application",
          arrival: "semantic.transfer-arguments",
          contact: undefined,
          recognition: undefined,
          retirement: undefined,
          attachment: "semantic.attach-connector",
          settlement: "semantic.settle-ordered-applications",
          "native-target-ready": "semantic.settle-native-target"
        })
      });
  }
}

function eventWeights(
  overrides: Partial<Record<KpSemanticMotionEventKind, number>>
): Readonly<Record<KpSemanticMotionEventKind, number>> {
  // Durations are family-local ordering weights. They are normalized only
  // after the semantic DAG is complete, so no operation exports milliseconds.
  return Object.freeze({
    orient: 1,
    clearance: 1,
    departure: 1,
    arrival: 1,
    contact: 1,
    recognition: 1,
    retirement: 1,
    attachment: 1,
    settlement: 1,
    "native-target-ready": 0.3,
    ...overrides
  });
}

function validateLoweredTracks(
  edges: KpResolvedSemanticMotionRecipe["precedence"]["edges"],
  tracks: readonly KpSemanticMotionTrack[]
): void {
  const byEventId = new Map(tracks.map((track) => [track.eventId, track] as const));
  edges.forEach(({ beforeEventId, afterEventId }) => {
    const before = byEventId.get(beforeEventId);
    const after = byEventId.get(afterEventId);
    if (before === undefined || after === undefined || before.window.end > after.window.start) {
      throw new Error(`Lowered semantic schedule violates precedence ${beforeEventId} -> ${afterEventId}.`);
    }
  });
  const ready = tracks.filter(({ eventKind }) => eventKind === "native-target-ready");
  if (ready.length !== 1 || ready[0]!.window.end !== 1) {
    throw new Error("Native target readiness must be the unique terminal track.");
  }
}

function interpolate(track: KpSemanticMotionTrack, progress: number): number {
  if (progress <= track.window.start) return 0;
  if (progress >= track.window.end) return 1;
  const local = (progress - track.window.start) / (track.window.end - track.window.start);
  return round(track.interpolation === "linear" ? local : local * local * (3 - 2 * local));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Semantic motion progress must be finite.");
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
