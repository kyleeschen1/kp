import {
  projectKpLispContainedJostle,
  type KpLispContainedJostleProjection
} from "./lisp-s-expression-contained-jostle.ts";
import {
  projectKpLispExpressionBeads,
  type KpLispExpressionBead
} from "./lisp-s-expression-beads.ts";
import {
  compileKpLispFoldSchedule,
  sampleKpLispFoldSchedule,
  type KpLispFoldSample,
  type KpLispFoldSchedule
} from "./lisp-s-expression-fold-schedule.ts";
import type {
  KpLispCanonicalMaterialState,
  KpLispSourceMaterialToken
} from "./lisp-s-expression-material-projection.ts";
import { resolveKpLispMaterialRoots } from
  "./lisp-s-expression-material-roots.ts";
import {
  projectKpLispResponsiveGeometry,
  type KpLispGeometryRect,
  type KpLispResponsiveGeometry
} from "./lisp-s-expression-responsive-geometry.ts";
import {
  compileKpLispDwellTimeline,
  defineKpLispInternalTuning,
  KP_LISP_AUTHORED_DWELL_BEATS,
  type KpLispDwellTimeline,
  type KpLispInternalTuningProjection
} from "./lisp-s-expression-timing.ts";
import type {
  KpLispSemanticModel,
  KpLispSExpression
} from "../semantic/lisp-semantic-model.ts";

export interface KpLispStructuralMotionProgram {
  readonly id: "structural-motion-program.lisp.lambda-application";
  readonly semantic: KpLispSemanticModel;
  readonly state: KpLispCanonicalMaterialState;
  readonly geometry: KpLispResponsiveGeometry;
  readonly foldSchedule: KpLispFoldSchedule;
  readonly timeline: KpLispDwellTimeline;
  readonly tuning: KpLispInternalTuningProjection;
  readonly beads: readonly KpLispExpressionBead[];
  readonly roots: readonly KpLispStructuralRoot[];
  readonly parents: readonly KpLispStructuralParent[];
}

export interface KpLispStructuralRoot {
  readonly expressionId: string;
  readonly xEm: number;
  readonly yEm: number;
}

export interface KpLispStructuralParent {
  readonly expressionId: string;
  readonly parentExpressionId: string | null;
  readonly siblingIndex: number;
  readonly siblingCount: number;
}

export interface KpLispStructuralTokenFrame {
  readonly token: KpLispSourceMaterialToken;
  readonly rect: KpLispGeometryRect;
  readonly xEm: number;
  readonly yEm: number;
  readonly scale: number;
  readonly opacity: number;
  readonly compression: number;
  readonly active: boolean;
}

export interface KpLispStructuralBeadFrame {
  readonly bead: KpLispExpressionBead;
  readonly xEm: number;
  readonly yEm: number;
  readonly scale: number;
  readonly opacity: number;
  readonly detailed: boolean;
}

export interface KpLispStructuralMotionFrame {
  readonly id: "structural-motion-frame.lisp.lambda-application";
  readonly progress: number;
  readonly checkpointId: string;
  readonly phase: "activate" | "drift" | "fold" | "inspect" | "unfold" | "settled";
  readonly direction: "fold" | "unfold";
  readonly geometry: KpLispResponsiveGeometry;
  readonly state: KpLispCanonicalMaterialState;
  readonly frontierExpressionIds: readonly string[];
  readonly tokens: readonly KpLispStructuralTokenFrame[];
  readonly beads: readonly KpLispStructuralBeadFrame[];
  readonly accessibleDescription: string;
}

export function compileKpLispStructuralMotionProgram(input: {
  readonly semantic: KpLispSemanticModel;
  readonly state: KpLispCanonicalMaterialState;
  readonly availableWidthPx: number;
  readonly tuning?: KpLispInternalTuningProjection | undefined;
}): KpLispStructuralMotionProgram {
  if (input.state.id !== "application" ||
      input.state.nativeCode !== input.semantic.sourceText) {
    throw new Error("Structural motion requires the certified application source.");
  }
  const tuning = input.tuning ?? defineKpLispInternalTuning();
  const geometry = projectKpLispResponsiveGeometry(
    input.semantic,
    input.state,
    input.availableWidthPx,
    null
  );
  const roots = resolveRootGeometry(input.semantic, geometry);

  return Object.freeze({
    id: "structural-motion-program.lisp.lambda-application",
    semantic: input.semantic,
    state: input.state,
    geometry,
    foldSchedule: compileKpLispFoldSchedule(input.semantic),
    timeline: compileKpLispDwellTimeline(
      KP_LISP_AUTHORED_DWELL_BEATS.filter(({ block }) => block === "structure"),
      tuning
    ),
    tuning,
    beads: projectKpLispExpressionBeads(input.semantic),
    roots,
    parents: Object.freeze(collectParents(input.semantic.root))
  });
}

export function sampleKpLispStructuralMotion(
  program: KpLispStructuralMotionProgram,
  progress: number
): KpLispStructuralMotionFrame {
  const normalizedProgress = stableUnit(progress);
  const located = locateStructuralTime(program.timeline, normalizedProgress);
  const foldState = resolveFoldState(located);
  const foldSamples = sampleKpLispFoldSchedule(
    program.foldSchedule,
    foldState.progress,
    foldState.direction
  );
  const phase = resolvePhase(located);
  const frontierExpressionIds = resolveFrontier(
    program.foldSchedule,
    foldSamples,
    located.checkpoint.id,
    phase
  );
  const jostle = resolveJostle(program, located, phase);
  const roots = new Map(program.roots.map((root) => [root.expressionId, root]));
  const samples = new Map(foldSamples.map((sample) => [sample.expressionId, sample]));
  const parents = new Map(program.parents.map((entry) => [
    entry.expressionId,
    entry
  ]));

  return Object.freeze({
    id: "structural-motion-frame.lisp.lambda-application",
    progress: normalizedProgress,
    checkpointId: located.checkpoint.id,
    phase,
    direction: foldState.direction,
    geometry: program.geometry,
    state: program.state,
    frontierExpressionIds: Object.freeze(frontierExpressionIds),
    tokens: Object.freeze(program.state.tokens.map((token) => projectTokenFrame(
      token,
      program.geometry,
      required(samples, token.ownerExpressionId, "fold sample"),
      required(roots, token.ownerExpressionId, "material root"),
      jostle,
      program.tuning
    ))),
    beads: Object.freeze(program.beads.map((bead) => projectBeadFrame(
      bead,
      required(samples, bead.expressionId, "fold sample"),
      required(parents, bead.expressionId, "structural parent"),
      samples,
      roots,
      frontierExpressionIds,
      phase,
      program.tuning
    ))),
    accessibleDescription: describeFrame(phase, located.checkpoint.id)
  });
}

interface LocatedStructuralTime {
  readonly checkpoint: KpLispDwellTimeline["checkpoints"][number];
  readonly inTransition: boolean;
  readonly transitionProgress: number;
  readonly dwellProgress: number;
}

function locateStructuralTime(
  timeline: KpLispDwellTimeline,
  progress: number
): LocatedStructuralTime {
  const time = stable(progress * timeline.duration);
  const checkpoint = timeline.checkpoints.find(({ dwell }) => time <= dwell.end) ??
    timeline.checkpoints.at(-1)!;
  const inTransition = time < checkpoint.transition.end;
  return Object.freeze({
    checkpoint,
    inTransition,
    transitionProgress: intervalProgress(checkpoint.transition, time),
    dwellProgress: intervalProgress(checkpoint.dwell, time)
  });
}

function resolveFoldState(located: LocatedStructuralTime): {
  readonly direction: "fold" | "unfold";
  readonly progress: number;
} {
  const local = located.inTransition ? located.transitionProgress : 1;
  switch (located.checkpoint.id) {
    case "source-readable": return { direction: "fold", progress: 0 };
    case "leaf-forms-folded": return { direction: "fold", progress: stable(local / 3) };
    case "lambda-form-folded": return { direction: "fold", progress: stable((1 + local) / 3) };
    case "application-folded": return { direction: "fold", progress: stable((2 + local) / 3) };
    case "source-restored": return {
      direction: "unfold",
      progress: stable(located.inTransition ? located.transitionProgress : 1)
    };
    default: throw new Error(`Unknown structural checkpoint ${located.checkpoint.id}.`);
  }
}

function resolvePhase(
  located: LocatedStructuralTime
): KpLispStructuralMotionFrame["phase"] {
  if (located.checkpoint.id === "source-readable") {
    return located.dwellProgress < 0.22 ? "activate" : "drift";
  }
  if (located.checkpoint.id === "source-restored") {
    return located.inTransition ? "unfold" : "settled";
  }
  return located.inTransition ? "fold" : "inspect";
}

function resolveFrontier(
  schedule: KpLispFoldSchedule,
  samples: readonly KpLispFoldSample[],
  checkpointId: string,
  phase: KpLispStructuralMotionFrame["phase"]
): string[] {
  if (checkpointId === "source-readable") return ["expr.body"];
  const active = samples.filter(({ contentCompression, parenthesisCompression }) =>
    (contentCompression > 0 && contentCompression < 1) ||
    (parenthesisCompression > 0 && parenthesisCompression < 1)
  ).map(({ expressionId }) => expressionId);
  if (active.length > 0) return active;
  if (phase === "settled") return [];
  if (checkpointId === "leaf-forms-folded") return schedule.frontiers[0]?.expressionIds.slice() ?? [];
  if (checkpointId === "lambda-form-folded") return ["expr.lambda"];
  if (checkpointId === "application-folded") return ["expr.application"];
  return [];
}

function resolveJostle(
  program: KpLispStructuralMotionProgram,
  located: LocatedStructuralTime,
  phase: KpLispStructuralMotionFrame["phase"]
): KpLispContainedJostleProjection {
  const progress = phase === "activate" || phase === "drift"
    ? located.dwellProgress
    : 0;
  return projectKpLispContainedJostle(program.state, "expr.body", progress);
}

function projectTokenFrame(
  token: KpLispSourceMaterialToken,
  geometry: KpLispResponsiveGeometry,
  fold: KpLispFoldSample,
  root: KpLispStructuralRoot,
  jostle: KpLispContainedJostleProjection,
  tuning: KpLispInternalTuningProjection
): KpLispStructuralTokenFrame {
  const placement = geometry.tokens.find(({ materialId }) => materialId === token.id);
  if (placement === undefined) throw new Error(`Lisp material ${token.id} lacks geometry.`);
  const compression = token.kind === "atom"
    ? fold.contentCompression
    : fold.parenthesisCompression;
  const eased = smoothstep(compression);
  const jostlePose = jostle.poses.find(({ materialId }) => materialId === token.id);
  const owner = geometry.expressions.find(({ expressionId }) =>
    expressionId === token.ownerExpressionId);
  // Lisp source often places an atom directly against its opening parenthesis.
  // Keep this first exemplar's drift on the block axis so motion cannot borrow
  // nonexistent inline whitespace or make the membrane appear permeable.
  const jostleX = 0;
  const jostleY = jostlePose?.active === true && owner !== undefined
    ? jostlePose.blockOffset * owner.rect.heightEm * tuning.values.jostleAmplitude
    : 0;
  const targetX = root.xEm - placement.rect.widthEm / 2;
  const targetY = root.yEm - placement.rect.heightEm / 2;

  return Object.freeze({
    token,
    rect: placement.rect,
    xEm: stable(lerp(placement.rect.xEm, targetX, eased) + jostleX),
    yEm: stable(lerp(placement.rect.yEm, targetY, eased) + jostleY),
    scale: stable(Math.max(0.001, 1 - eased)),
    opacity: stable(Math.max(0, 1 - eased)),
    compression,
    active: jostlePose?.active === true
  });
}

function projectBeadFrame(
  bead: KpLispExpressionBead,
  ownFold: KpLispFoldSample,
  parent: KpLispStructuralParent,
  samples: ReadonlyMap<string, KpLispFoldSample>,
  roots: ReadonlyMap<string, KpLispStructuralRoot>,
  frontierExpressionIds: readonly string[],
  phase: KpLispStructuralMotionFrame["phase"],
  tuning: KpLispInternalTuningProjection
): KpLispStructuralBeadFrame {
  const ownRoot = required(roots, bead.expressionId, "bead root");
  const reveal = smoothRange(0.2, 1, Math.min(
    ownFold.contentCompression,
    ownFold.parenthesisCompression
  ));
  const parentFold = parent.parentExpressionId === null
    ? undefined
    : required(samples, parent.parentExpressionId, "parent fold sample");
  const parentRoot = parent.parentExpressionId === null
    ? ownRoot
    : required(roots, parent.parentExpressionId, "parent bead root");
  const consumed = smoothstep(parentFold?.contentCompression ?? 0);
  const entryScale = tuning.values.compression * lerp(0.72, 1, reveal);
  const laneOffset = parent.siblingCount > 1
    ? (parent.siblingIndex - (parent.siblingCount - 1) / 2) * 1.5
    : 0;

  return Object.freeze({
    bead,
    xEm: stable(lerp(ownRoot.xEm, parentRoot.xEm, consumed)),
    yEm: stable(lerp(ownRoot.yEm + laneOffset, parentRoot.yEm, consumed)),
    scale: stable(Math.max(0.001, entryScale * (1 - consumed))),
    opacity: stable(reveal * (1 - consumed)),
    detailed: bead.particles.length > 1 && reveal > 0.9 && (
      frontierExpressionIds.includes(bead.expressionId) ||
      (parent.parentExpressionId === null && phase === "inspect")
    )
  });
}

function resolveRootGeometry(
  semantic: KpLispSemanticModel,
  geometry: KpLispResponsiveGeometry
): readonly KpLispStructuralRoot[] {
  const definitions = new Map(resolveKpLispMaterialRoots(semantic).map((root) => [
    root.expressionId,
    root
  ]));
  const tokenCenters = new Map(geometry.tokens.map(({ materialId, rect }) => [
    materialId,
    center(rect)
  ]));
  const resolved = new Map<string, KpLispStructuralRoot>();
  const visit = (expressionId: string): KpLispStructuralRoot => {
    const cached = resolved.get(expressionId);
    if (cached !== undefined) return cached;
    const definition = required(definitions, expressionId, "root definition");
    const anchors = definition.anchorIds.map((id) =>
      tokenCenters.get(id) ?? visit(id));
    const root = Object.freeze({
      expressionId,
      xEm: stable(anchors.reduce((sum, point) => sum + point.xEm, 0) / anchors.length),
      yEm: stable(anchors.reduce((sum, point) => sum + point.yEm, 0) / anchors.length)
    });
    resolved.set(expressionId, root);
    return root;
  };
  for (const id of definitions.keys()) visit(id);
  return Object.freeze([...resolved.values()]);
}

function collectParents(
  expression: KpLispSExpression,
  parentExpressionId: string | null = null,
  siblingIndex = 0,
  siblingCount = 1
): KpLispStructuralParent[] {
  if (expression.kind === "atom") return [];
  const childLists = expression.children.filter((child) => child.kind === "list");
  return [
    Object.freeze({
      expressionId: expression.id,
      parentExpressionId,
      siblingIndex,
      siblingCount
    }),
    ...childLists.flatMap((child, index) =>
      collectParents(child, expression.id, index, childLists.length))
  ];
}

function describeFrame(
  phase: KpLispStructuralMotionFrame["phase"],
  checkpointId: string
): string {
  switch (phase) {
    case "activate": return "Read the complete Lisp expression before its structure moves.";
    case "drift": return "The atoms in the innermost executable list move gently inside their parentheses.";
    case "fold": return "Contents gather toward their expression root before the wrapping parentheses follow.";
    case "inspect": return checkpointId === "application-folded"
      ? "The complete application is folded into one source-derived expression bead."
      : "The current recursive frontier rests as source-derived expression beads.";
    case "unfold": return "The expression expands in exact reverse order: parentheses open before their contents return.";
    case "settled": return "The complete selectable Lisp source is restored.";
  }
}

function required<T>(
  values: ReadonlyMap<string, T>,
  id: string,
  label: string
): T {
  const value = values.get(id);
  if (value === undefined) throw new Error(`Missing ${label} for ${id}.`);
  return value;
}

function center(rect: KpLispGeometryRect): { readonly xEm: number; readonly yEm: number } {
  return Object.freeze({
    xEm: stable(rect.xEm + rect.widthEm / 2),
    yEm: stable(rect.yEm + rect.heightEm / 2)
  });
}

function intervalProgress(
  interval: { readonly start: number; readonly end: number },
  time: number
): number {
  if (interval.end === interval.start) return 1;
  return stableUnit((time - interval.start) / (interval.end - interval.start));
}

function smoothstep(value: number): number {
  const unit = stableUnit(value);
  return stable(unit * unit * (3 - 2 * unit));
}

function smoothRange(start: number, end: number, value: number): number {
  return smoothstep((value - start) / (end - start));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function stableUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return stable(Math.max(0, Math.min(1, value)));
}

function stable(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}
