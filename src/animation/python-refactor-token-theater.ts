import {
  assertKpVerifiedPythonRefactorMotionPlan,
  type KpPythonBindingPropagationTrackDraft,
  type KpPythonRefactorMotionTrackDraft,
  type KpVerifiedPythonRefactorMotionPlan
} from "./python-refactor-motion-plan.ts";
import type { KpPythonRefactorScoreV1 } from
  "../semantic/python-refactor-score.ts";
import {
  createKpPythonRefactorSourceProjections,
  type KpPythonProjectedEntity,
  type KpPythonRefactorSourceProjection,
  type KpPythonRefactorSourceProjectionId
} from "../semantic/python-refactor-source-projections.ts";
import type { KpPythonRefactorSemanticArtifactV1 } from
  "../semantic/python-refactor-semantic-model.ts";
import type { KpPythonTokenKind } from "../semantic/python-source-tokens.ts";

export interface KpPythonTheaterToken {
  readonly id: string;
  readonly text: string;
  readonly kind: KpPythonTokenKind;
  readonly entityId: string;
  readonly xCh: number;
  readonly yLine: number;
  readonly opacity: number;
  readonly scale: number;
  readonly role: "context" | "focus" | "transit" | "withdrawal";
}

export interface KpPythonTokenTheaterFrame {
  readonly active: boolean;
  readonly activeTrackId?: string;
  readonly localProgress: number;
  readonly tokens: readonly KpPythonTheaterToken[];
  readonly maxLineCount: number;
}

export interface KpPythonRefactorTokenProgram {
  readonly projections: ReadonlyMap<KpPythonRefactorSourceProjectionId, KpPythonTokenSnapshot>;
  readonly maxLineCount: number;
}

interface KpPythonTokenSnapshot {
  readonly id: KpPythonRefactorSourceProjectionId;
  readonly tokens: readonly KpPythonSnapshotToken[];
}

interface KpPythonSnapshotToken {
  readonly id: string;
  readonly text: string;
  readonly kind: KpPythonTokenKind;
  readonly entityId: string;
  readonly xCh: number;
  readonly yLine: number;
}

interface TrackInterval {
  readonly track: KpPythonRefactorMotionTrackDraft;
  readonly from: KpPythonRefactorSourceProjectionId;
  readonly to: KpPythonRefactorSourceProjectionId;
  readonly startProgress: number;
  readonly endProgress: number;
}

export function createKpPythonRefactorTokenProgram(
  semantics: KpPythonRefactorSemanticArtifactV1
): KpPythonRefactorTokenProgram {
  const projections = createKpPythonRefactorSourceProjections(semantics);
  const maxLineCount = Math.max(...projections.map(({ sourceText }) => lineCount(sourceText)));
  return Object.freeze({
    projections: new Map(projections.map((projection) => [
      projection.id,
      snapshot(projection, maxLineCount)
    ])),
    maxLineCount
  });
}

export function sampleKpPythonRefactorTokenTheater(input: {
  readonly program: KpPythonRefactorTokenProgram;
  readonly plan: KpVerifiedPythonRefactorMotionPlan;
  readonly score: KpPythonRefactorScoreV1;
  readonly progress: number;
  readonly reducedMotion?: boolean;
}): KpPythonTokenTheaterFrame {
  assertKpVerifiedPythonRefactorMotionPlan(input.plan);
  const progress = clamp(input.progress, 0, 1);
  const interval = intervals(input.plan, input.score).find((candidate) =>
    progress >= candidate.startProgress && progress < candidate.endProgress
  );
  if (interval === undefined || input.reducedMotion === true) {
    return Object.freeze({
      active: false,
      localProgress: 0,
      tokens: Object.freeze([]),
      maxLineCount: input.program.maxLineCount
    });
  }
  const raw = normalize(progress, interval.startProgress, interval.endProgress);
  const localProgress = smoothstep(raw);
  const tokens = interval.track.kind === "rule-fusion"
    ? sampleFusion(input.program, interval, localProgress)
    : interpolateProjection(
      requireSnapshot(input.program, interval.from),
      requireSnapshot(input.program, interval.to),
      localProgress,
      interval.track
    );
  return Object.freeze({
    active: true,
    activeTrackId: interval.track.id,
    localProgress: round(raw),
    tokens: Object.freeze(tokens.map((token) => Object.freeze(token))),
    maxLineCount: input.program.maxLineCount
  });
}

function intervals(
  plan: KpVerifiedPythonRefactorMotionPlan,
  score: KpPythonRefactorScoreV1
): readonly TrackInterval[] {
  const checkpoint = (stageId: string): number => {
    const stage = score.stages.find(({ id }) => id === stageId);
    if (stage === undefined) throw new Error(`Missing Python motion stage ${stageId}.`);
    return stage.checkpointMs / score.durationMs;
  };
  const compare = checkpoint("stage.compare-duplicates");
  return plan.tracks.map((track) => {
    if (track.kind === "structural-introduction") {
      return {
        track,
        from: "projection.python.before",
        to: "projection.python.helper-introduced",
        startProgress: compare,
        endProgress: checkpoint(track.stageId)
      };
    }
    if (track.kind === "rule-fusion") {
      return {
        track,
        from: "projection.python.helper-introduced",
        to: "projection.python.helper-introduced",
        startProgress: checkpoint("stage.introduce-helper"),
        endProgress: checkpoint(track.stageId)
      };
    }
    const cost = track.targetEntityId === "call.shipping-cost.after";
    return {
      track,
      from: cost ? "projection.python.helper-introduced" : "projection.python.cost-replaced",
      to: cost ? "projection.python.cost-replaced" : "projection.python.final",
      startProgress: checkpoint(cost ? "stage.move-shared-rule" : "stage.replace-cost-call"),
      endProgress: checkpoint(track.stageId)
    };
  });
}

function interpolateProjection(
  from: KpPythonTokenSnapshot,
  to: KpPythonTokenSnapshot,
  progress: number,
  track: KpPythonRefactorMotionTrackDraft
): KpPythonTheaterToken[] {
  const fromById = new Map(from.tokens.map((token) => [token.id, token]));
  const toById = new Map(to.tokens.map((token) => [token.id, token]));
  const ids = new Set([...fromById.keys(), ...toById.keys()]);
  const output: KpPythonTheaterToken[] = [];
  const introduction = track.kind === "structural-introduction";
  const propagation = track.kind === "binding-propagation" ? track : undefined;
  const declarationAnchor = propagation && findDeclarationAnchor(from, propagation);
  const sourceRuleTokens = propagation === undefined
    ? []
    : from.tokens.filter(({ entityId }) => entityId === propagation.replacedEntityId);
  const sourceArgument = sourceRuleTokens.find(({ text }) => text === "total");

  ids.forEach((id) => {
    const source = fromById.get(id);
    const target = toById.get(id);
    if (source && target) {
      const movement = introduction
        ? smoothstep(clamp(progress / 0.64, 0, 1))
        : propagation ? smoothstep(normalize(progress, 0.46, 0.9)) : progress;
      output.push(frameToken(target, {
        xCh: lerp(source.xCh, target.xCh, movement),
        yLine: lerp(source.yLine, target.yLine, movement),
        role: "context"
      }));
      return;
    }
    if (target) {
      if (introduction && target.entityId === track.deferredEntityId) {
        output.push(frameToken(target, { opacity: 0, scale: 0.76, role: "focus" }));
        return;
      }
      if (propagation && declarationAnchor &&
          target.entityId === propagation.targetEntityId &&
          target.text === "qualifies_for_free_shipping") {
        const travel = smoothstep(normalize(progress, 0.08, 0.82));
        const point = quadraticPoint(
          { x: declarationAnchor.xCh, y: declarationAnchor.yLine },
          {
            x: Math.max(declarationAnchor.xCh, target.xCh) + 20,
            y: lerp(declarationAnchor.yLine, target.yLine, 0.45) - 1.25
          },
          { x: target.xCh, y: target.yLine },
          travel
        );
        output.push(frameToken(target, {
          id: `propagating.${target.id}`,
          xCh: point.x,
          yLine: point.y,
          opacity: smoothstep(clamp(progress / 0.14, 0, 1)),
          scale: lerp(0.9, 1, smoothstep(clamp(progress / 0.5, 0, 1))),
          role: "transit"
        }));
        return;
      }
      if (propagation) {
        if (target.text === "total" && sourceArgument) {
          const travel = smoothstep(normalize(progress, 0.18, 0.78));
          const point = quadraticPoint(
            { x: sourceArgument.xCh, y: sourceArgument.yLine },
            { x: target.xCh, y: sourceArgument.yLine - 1.1 },
            { x: target.xCh, y: target.yLine },
            travel
          );
          output.push(frameToken(target, {
            id: `propagating.argument.${propagation.targetEntityId}`,
            xCh: point.x,
            yLine: point.y,
            role: "transit"
          }));
          return;
        }
        const entrance = smoothstep(normalize(progress, 0.58, 0.86));
        output.push(frameToken(target, {
          opacity: entrance,
          scale: lerp(0.68, 1, entrance),
          role: "focus"
        }));
        return;
      }
      const entrance = smoothstep(normalize(progress, 0.34, 0.84));
      output.push(frameToken(target, {
        opacity: entrance,
        scale: lerp(0.94, 1, entrance),
        role: "focus"
      }));
      return;
    }
    if (source) {
      if (propagation && source.entityId === propagation.replacedEntityId &&
          source.text === "total") return;
      const withdrawal = propagation && source.entityId === propagation.replacedEntityId
        ? smoothstep(normalize(progress, 0.12, 0.68))
        : smoothstep(progress);
      output.push(frameToken(source, {
        opacity: 1 - withdrawal,
        scale: lerp(1, 0.72, withdrawal),
        yLine: source.yLine - withdrawal * 0.18,
        role: "withdrawal"
      }));
    }
  });
  if (introduction) {
    const deferred = to.tokens.find(({ entityId }) => entityId === track.deferredEntityId);
    if (deferred) {
      const entrance = smoothstep(normalize(progress, 0.34, 0.84));
      output.push(frameToken(deferred, {
        id: `slot.${track.deferredEntityId}`,
        text: "···",
        opacity: entrance,
        scale: lerp(0.72, 1, entrance),
        role: "focus"
      }));
    }
  }
  return output;
}

function sampleFusion(
  program: KpPythonRefactorTokenProgram,
  interval: TrackInterval,
  progress: number
): KpPythonTheaterToken[] {
  if (interval.track.kind !== "rule-fusion") return [];
  const snapshot = requireSnapshot(program, interval.from);
  const sources = interval.track.sourceEntityIds.map((entityId) =>
    snapshot.tokens.filter((token) => token.entityId === entityId)
  );
  const target = snapshot.tokens.filter(
    (token) => token.entityId === interval.track.targetEntityId
  );
  const focused = new Set([
    ...interval.track.sourceEntityIds,
    interval.track.targetEntityId
  ]);
  const arrival = smoothstep(normalize(progress, 0, 0.68));
  const settlementHandoff = smoothstep(normalize(progress, 0.82, 1));
  const base = snapshot.tokens.map((token) => frameToken(token, {
    ...(token.entityId === interval.track.targetEntityId
      ? { opacity: settlementHandoff, scale: lerp(0.76, 1, settlementHandoff) }
      : {}),
    role: focused.has(token.entityId) ? "focus" : "context"
  }));
  const targetOrigin = target[0];
  if (!targetOrigin) return base;
  const slotExit = smoothstep(normalize(progress, 0.5, 0.7));
  base.push(frameToken(targetOrigin, {
    id: `slot.${interval.track.targetEntityId}`,
    text: "···",
    opacity: 1 - slotExit,
    scale: lerp(1, 0.72, slotExit),
    role: "focus"
  }));
  sources.forEach((bundle, bundleIndex) => {
    bundle.forEach((source, tokenIndex) => {
      const destination = target[tokenIndex];
      if (!destination) return;
      const bow = bundleIndex === 0 ? 5 : -4;
      const point = quadraticPoint(
        { x: source.xCh, y: source.yLine },
        {
          x: lerp(source.xCh, destination.xCh, 0.5) + bow,
          y: lerp(source.yLine, destination.yLine, 0.5) - 0.8
        },
        { x: destination.xCh, y: destination.yLine },
        arrival
      );
      base.push(frameToken(source, {
        id: `fusion.${bundleIndex}.${source.id}`,
        xCh: point.x,
        yLine: point.y,
        opacity: 1 - settlementHandoff,
        role: "transit"
      }));
    });
  });
  return base;
}

function findDeclarationAnchor(
  snapshot: KpPythonTokenSnapshot,
  track: KpPythonBindingPropagationTrackDraft
): KpPythonSnapshotToken | undefined {
  return snapshot.tokens.find(({ entityId, text }) =>
    entityId === track.declarationEntityId && text === "qualifies_for_free_shipping"
  );
}

function snapshot(
  projection: KpPythonRefactorSourceProjection,
  maxLineCount: number
): KpPythonTokenSnapshot {
  const tokens: KpPythonSnapshotToken[] = [];
  const occurrences = new Map<string, number>();
  const yOffset = (maxLineCount - lineCount(projection.sourceText)) / 2;
  for (const lexical of projection.tokens) {
    const owner = smallestOwner(projection.entities, lexical.startOffset, lexical.endOffset);
    if (owner === undefined) {
      throw new Error(`Python token ${lexical.text} at ${lexical.startOffset} has no AST owner.`);
    }
    const ownerId = stableOwnerId(owner);
    const occurrenceKey = `${ownerId}\u0000${lexical.text}`;
    const occurrence = occurrences.get(occurrenceKey) ?? 0;
    occurrences.set(occurrenceKey, occurrence + 1);
    const location = lineAndColumn(projection.sourceText, lexical.startOffset);
    tokens.push(Object.freeze({
      id: `token.${ownerId}.${lexical.kind}.${encodeToken(lexical.text)}.${occurrence}`,
      text: lexical.text,
      kind: lexical.kind,
      entityId: owner.id,
      xCh: location.column,
      yLine: location.line + yOffset
    }));
  }
  return Object.freeze({ id: projection.id, tokens: Object.freeze(tokens) });
}

function smallestOwner(
  entities: readonly KpPythonProjectedEntity[],
  startOffset: number,
  endOffset: number
): KpPythonProjectedEntity | undefined {
  return entities
    .filter(({ sourceRange }) =>
      sourceRange.startOffset <= startOffset && sourceRange.endOffset >= endOffset
    )
    .sort((left, right) =>
      (left.sourceRange.endOffset - left.sourceRange.startOffset) -
      (right.sourceRange.endOffset - right.sourceRange.startOffset)
    )[0];
}

function stableOwnerId(entity: KpPythonProjectedEntity): string {
  if (entity.kind !== "function") return entity.id;
  if (entity.id.includes("shipping-cost")) return "function.shipping-cost";
  if (entity.id.includes("shipping-message")) return "function.shipping-message";
  return entity.id;
}

function frameToken(
  token: KpPythonSnapshotToken,
  overrides: Partial<KpPythonTheaterToken>
): KpPythonTheaterToken {
  return {
    id: overrides.id ?? token.id,
    text: overrides.text ?? token.text,
    kind: token.kind,
    entityId: token.entityId,
    xCh: round(overrides.xCh ?? token.xCh),
    yLine: round(overrides.yLine ?? token.yLine),
    opacity: round(overrides.opacity ?? 1),
    scale: round(overrides.scale ?? 1),
    role: overrides.role ?? "context"
  };
}

function requireSnapshot(
  program: KpPythonRefactorTokenProgram,
  id: KpPythonRefactorSourceProjectionId
): KpPythonTokenSnapshot {
  const result = program.projections.get(id);
  if (!result) throw new Error(`Missing Python token projection ${id}.`);
  return result;
}

function lineAndColumn(source: string, offset: number): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n");
  return { line: lines.length - 1, column: lines.at(-1)?.length ?? 0 };
}

function lineCount(source: string): number {
  return source.split("\n").length;
}

function encodeToken(value: string): string {
  return [...value].map((character) => character.codePointAt(0)?.toString(16)).join("-");
}

function quadraticPoint(
  start: { readonly x: number; readonly y: number },
  control: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
  progress: number
): { x: number; y: number } {
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
    y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y
  };
}

function normalize(value: number, start: number, end: number): number {
  return end === start ? 1 : clamp((value - start) / (end - start), 0, 1);
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
