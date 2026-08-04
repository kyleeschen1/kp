import {
  compileKpLispBoundValuePropagation,
  sampleKpLispBoundValuePropagation,
  type KpLispBoundValuePropagationPlan,
  type KpLispBoundValuePropagationSample
} from "./lisp-bound-value-propagation.ts";
import {
  planKpLispLambdaBindingGeometry,
  type KpLispBindingCubicSegment,
  type KpLispLambdaBindingGeometry
} from "./lisp-lambda-binding-geometry.ts";
import {
  compileKpLispReconstructionChoreography,
  sampleKpLispReconstructionChoreography,
  type KpLispReconstructionPlan,
  type KpLispReconstructionSample
} from "./lisp-reconstruction-choreography.ts";
import { projectKpLispExpressionBeads } from
  "./lisp-s-expression-beads.ts";
import type {
  KpLispCanonicalMaterialState,
  KpLispSourceMaterialProjection,
  KpLispSourceMaterialToken
} from "./lisp-s-expression-material-projection.ts";
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
import type { KpLispLambdaApplicationFixture } from
  "../semantic/lisp-lambda-application-fixture.ts";

export interface KpLispApplicationMotionProgram {
  readonly id: "application-motion-program.lisp.lambda-application";
  readonly fixture: KpLispLambdaApplicationFixture;
  readonly material: KpLispSourceMaterialProjection;
  readonly application: KpLispCanonicalMaterialState;
  readonly reconstructed: KpLispCanonicalMaterialState;
  readonly geometry: KpLispResponsiveGeometry;
  readonly binding: KpLispLambdaBindingGeometry;
  readonly propagation: KpLispBoundValuePropagationPlan;
  readonly reconstruction: KpLispReconstructionPlan;
  readonly timeline: KpLispDwellTimeline;
  readonly tuning: KpLispInternalTuningProjection;
}

export interface KpLispApplicationSourceTokenFrame {
  readonly token: KpLispSourceMaterialToken;
  readonly rect: KpLispGeometryRect;
  readonly xEm: number;
  readonly yEm: number;
  readonly scale: number;
  readonly opacity: number;
  readonly transported: boolean;
}

export interface KpLispApplicationMotionFrame {
  readonly id: "application-motion-frame.lisp.lambda-application";
  readonly progress: number;
  readonly checkpointId: string;
  readonly phase:
    | "open"
    | "transfer"
    | "absorb"
    | "bind"
    | "propagate"
    | "fold-shells"
    | "hold-provenance"
    | "reconstruct"
    | "recenter"
    | "settled";
  readonly canonicalEndpoint: "application" | "reconstructed" | null;
  readonly geometry: KpLispResponsiveGeometry;
  readonly sourceState: KpLispCanonicalMaterialState;
  readonly reconstructedState: KpLispCanonicalMaterialState;
  readonly sourceTokens: readonly KpLispApplicationSourceTokenFrame[];
  readonly bindingBoxes: readonly {
    readonly materialId: string;
    readonly role: "parameter" | "occurrence";
    readonly strength: "strong" | "light";
    readonly rect: KpLispGeometryRect;
    readonly opacity: number;
  }[];
  readonly transientGuide: {
    readonly id: string;
    readonly d: string;
    readonly opacity: number;
    readonly wakeOpacity: number;
  } | null;
  readonly derivedValues: readonly {
    readonly materialId: string;
    readonly originIds: readonly string[];
    readonly nativeCode: string;
    readonly xEm: number;
    readonly yEm: number;
    readonly scale: number;
    readonly opacity: number;
  }[];
  readonly provenanceBead: {
    readonly id: string;
    readonly nativeCode: string;
    readonly consumedMaterialIds: readonly string[];
    readonly xEm: number;
    readonly yEm: number;
    readonly scale: number;
    readonly opacity: number;
  };
  readonly reconstructedTokens: readonly {
    readonly token: KpLispSourceMaterialToken;
    readonly xEm: number;
    readonly yEm: number;
    readonly scale: number;
    readonly opacity: number;
  }[];
  readonly accessibleDescription: string;
}

export function compileKpLispApplicationMotionProgram(input: {
  readonly fixture: KpLispLambdaApplicationFixture;
  readonly material: KpLispSourceMaterialProjection;
  readonly availableWidthPx: number;
  readonly tuning?: KpLispInternalTuningProjection | undefined;
}): KpLispApplicationMotionProgram {
  const application = canonical(input.material, "application");
  const reconstructed = canonical(input.material, "reconstructed");
  const tuning = input.tuning ?? defineKpLispInternalTuning();
  const geometry = projectKpLispResponsiveGeometry(
    input.fixture.semantic,
    application,
    input.availableWidthPx,
    "expr.application"
  );
  const binding = planKpLispLambdaBindingGeometry(
    input.fixture.semantic,
    geometry,
    tuning
  );
  const propagation = compileKpLispBoundValuePropagation(input.fixture, binding);
  const reconstruction = compileKpLispReconstructionChoreography(
    input.fixture,
    input.material,
    projectKpLispExpressionBeads(input.fixture.semantic),
    propagation
  );
  return Object.freeze({
    id: "application-motion-program.lisp.lambda-application",
    fixture: input.fixture,
    material: input.material,
    application,
    reconstructed,
    geometry,
    binding,
    propagation,
    reconstruction,
    timeline: compileKpLispDwellTimeline(
      KP_LISP_AUTHORED_DWELL_BEATS.filter(({ block }) => block === "application"),
      tuning
    ),
    tuning
  });
}

export function sampleKpLispApplicationMotion(
  program: KpLispApplicationMotionProgram,
  progress: number
): KpLispApplicationMotionFrame {
  const normalizedProgress = stableUnit(progress);
  const located = locateTime(program.timeline, normalizedProgress);
  const stageProgress = stageProgressFor(located);
  const propagation = sampleKpLispBoundValuePropagation(
    program.propagation,
    stageProgress.propagation
  );
  const reconstruction = sampleKpLispReconstructionChoreography(
    program.reconstruction,
    stageProgress.reconstruction
  );
  const phase = resolvePhase(located, propagation, reconstruction);
  const centers = new Map(program.geometry.tokens.map(({ materialId, rect }) => [
    materialId,
    center(rect)
  ]));
  const reconstructionById = new Map(reconstruction.sourceMaterials.map((item) => [
    item.materialId,
    item
  ]));
  const destinationByReference = new Map(propagation.destinations.map((item) => [
    item.referenceMaterialId,
    item
  ]));
  const pathPoint = pointOnPath(
    program.binding.transfer.segments,
    propagation.source.pathProgress
  );

  return Object.freeze({
    id: "application-motion-frame.lisp.lambda-application",
    progress: normalizedProgress,
    checkpointId: located.checkpoint.id,
    phase,
    canonicalEndpoint: phase === "settled"
      ? "reconstructed"
      : normalizedProgress === 0 ? "application" : null,
    geometry: program.geometry,
    sourceState: program.application,
    reconstructedState: program.reconstructed,
    sourceTokens: Object.freeze(program.application.tokens.map((token) => {
      const placement = requiredPlacement(program.geometry, token.id);
      const reconstructionMaterial = required(
        reconstructionById,
        token.id,
        "reconstruction material"
      );
      const shellCompression = sourceShellCompression(
        program.reconstruction,
        token,
        stageProgress.reconstruction
      );
      const target = shellTarget(program, token, centers);
      const easedCompression = smoothstep(shellCompression);
      const transported = token.id === program.propagation.value.sourceMaterialId &&
        propagation.source.location !== "consumed";
      const reference = destinationByReference.get(token.id);
      const propagationOpacity = token.id === program.propagation.value.sourceMaterialId
        ? propagation.source.opacity
        : reference?.referenceOpacity ?? 1;
      const transferPosition = token.id === program.propagation.value.sourceMaterialId
        ? propagation.source.location === "path"
          ? pathPoint
          : required(centers, program.propagation.parameterMaterialId, "parameter center")
        : center(placement.rect);
      const baseX = transferPosition.xEm - placement.rect.widthEm / 2;
      const baseY = transferPosition.yEm - placement.rect.heightEm / 2;
      return Object.freeze({
        token,
        rect: placement.rect,
        xEm: stable(lerp(baseX, target.xEm - placement.rect.widthEm / 2, easedCompression)),
        yEm: stable(lerp(baseY, target.yEm - placement.rect.heightEm / 2, easedCompression)),
        scale: stable(propagation.source.location === "consumed" &&
          token.id === program.propagation.value.sourceMaterialId
          ? 0.001
          : (token.id === program.propagation.value.sourceMaterialId
              ? propagation.source.scale
              : 1) * Math.max(0.001, 1 - easedCompression)),
        opacity: stable(propagationOpacity * reconstructionMaterial.opacity),
        transported
      });
    })),
    bindingBoxes: Object.freeze(program.binding.boxes.map((box) => Object.freeze({
      materialId: box.materialId,
      role: box.role,
      strength: box.strength,
      rect: box.rect,
      opacity: box.role === "parameter"
        ? Number(propagation.parameterBoxActive)
        : Number(propagation.occurrenceBoxesActive)
    }))),
    transientGuide: propagation.phase === "transfer" &&
      stageProgress.reconstruction === 0
      ? Object.freeze({
        id: program.binding.transfer.id,
        d: pathData(program.binding.transfer.segments),
        opacity: stable(0.22 + propagation.wakeOpacity * 0.38),
        wakeOpacity: propagation.wakeOpacity
      })
      : null,
    derivedValues: Object.freeze(propagation.destinations.map((destination) => {
      const placement = requiredPlacement(program.geometry, destination.referenceMaterialId);
      return Object.freeze({
        materialId: destination.derivedMaterialId,
        originIds: requiredDestination(
          program.propagation,
          destination.derivedMaterialId
        ).originIds,
        nativeCode: destination.nativeCode,
        xEm: placement.rect.xEm,
        yEm: placement.rect.yEm,
        scale: destination.valueScale,
        opacity: stable(destination.valueOpacity * (1 - reconstruction.reconstructed.opacity))
      });
    })),
    provenanceBead: projectProvenanceBead(
      program,
      reconstruction,
      centers
    ),
    reconstructedTokens: projectReconstructedTokens(
      program,
      reconstruction,
      centers
    ),
    accessibleDescription: describe(phase)
  });
}

interface LocatedTime {
  readonly checkpoint: KpLispDwellTimeline["checkpoints"][number];
  readonly inTransition: boolean;
  readonly transitionProgress: number;
}

function locateTime(timeline: KpLispDwellTimeline, progress: number): LocatedTime {
  const time = stable(progress * timeline.duration);
  const checkpoint = timeline.checkpoints.find(({ dwell }) => time <= dwell.end) ??
    timeline.checkpoints.at(-1)!;
  const inTransition = time < checkpoint.transition.end;
  return Object.freeze({
    checkpoint,
    inTransition,
    transitionProgress: intervalProgress(checkpoint.transition, time)
  });
}

function stageProgressFor(located: LocatedTime): {
  readonly propagation: number;
  readonly reconstruction: number;
} {
  const local = located.inTransition ? located.transitionProgress : 1;
  switch (located.checkpoint.id) {
    case "binding-ready": return { propagation: 0, reconstruction: 0 };
    case "parameter-bound": return {
      propagation: stable(local * 0.58),
      reconstruction: 0
    };
    case "body-propagated": return {
      propagation: stable(0.58 + local * 0.42),
      reconstruction: 0
    };
    case "body-reconstructed": return {
      propagation: 1,
      reconstruction: local
    };
    default: throw new Error(`Unknown application checkpoint ${located.checkpoint.id}.`);
  }
}

function resolvePhase(
  located: LocatedTime,
  propagation: KpLispBoundValuePropagationSample,
  reconstruction: KpLispReconstructionSample
): KpLispApplicationMotionFrame["phase"] {
  if (located.checkpoint.id === "binding-ready") return "open";
  if (located.checkpoint.id === "parameter-bound") {
    if (!located.inTransition) return "bind";
    return propagation.phase === "transfer" ? "transfer" : "absorb";
  }
  if (located.checkpoint.id === "body-propagated") return "propagate";
  if (!located.inTransition) return "settled";
  return reconstruction.phase;
}

function sourceShellCompression(
  plan: KpLispReconstructionPlan,
  token: KpLispSourceMaterialToken,
  progress: number
): number {
  const ledger = plan.ledger.find(({ sourceMaterialId }) =>
    sourceMaterialId === token.id);
  if (ledger?.foldOwnerExpressionId === null || ledger === undefined) return 0;
  const fold = plan.shellFold.find(({ expressionId }) =>
    expressionId === ledger.foldOwnerExpressionId);
  if (fold === undefined) return 0;
  return smoothstep(intervalProgress(
    token.kind === "atom" ? fold.contents : fold.parentheses,
    progress
  ));
}

function shellTarget(
  program: KpLispApplicationMotionProgram,
  token: KpLispSourceMaterialToken,
  centers: ReadonlyMap<string, KpLispPoint>
): KpLispPoint {
  const ledger = program.reconstruction.ledger.find(({ sourceMaterialId }) =>
    sourceMaterialId === token.id);
  switch (ledger?.foldOwnerExpressionId) {
    case "expr.parameters":
      return required(centers, "occurrence.x.binder", "parameter root");
    case "expr.lambda":
    case "expr.application":
      return required(centers, "occurrence.lambda", "lambda root");
    default:
      return required(centers, token.id, "source center");
  }
}

function projectProvenanceBead(
  program: KpLispApplicationMotionProgram,
  sample: KpLispReconstructionSample,
  centers: ReadonlyMap<string, KpLispPoint>
): KpLispApplicationMotionFrame["provenanceBead"] {
  const consumed = new Set(program.reconstruction.provenanceBead.consumedMaterialIds);
  const nativeCode = program.application.tokens.filter(({ id }) => consumed.has(id))
    .map(({ lexeme }) => lexeme).join("");
  const root = required(centers, "occurrence.lambda", "application provenance root");
  return Object.freeze({
    id: program.reconstruction.provenanceBead.id,
    nativeCode,
    consumedMaterialIds: program.reconstruction.provenanceBead.consumedMaterialIds,
    xEm: root.xEm,
    yEm: root.yEm - 1.45,
    scale: sample.provenanceBead.scale * program.tuning.values.compression,
    opacity: sample.provenanceBead.opacity
  });
}

function projectReconstructedTokens(
  program: KpLispApplicationMotionProgram,
  sample: KpLispReconstructionSample,
  centers: ReadonlyMap<string, KpLispPoint>
): KpLispApplicationMotionFrame["reconstructedTokens"] {
  const targetCenter = Object.freeze({
    xEm: program.geometry.stage.widthEm / 2,
    yEm: program.geometry.stage.heightEm / 2
  });
  const advance = program.geometry.characterAdvanceEm;
  const width = program.reconstructed.nativeCode.length * advance;
  const destinationReferences = new Set(program.propagation.destinations.map(
    ({ referenceMaterialId }) => referenceMaterialId
  ));
  return Object.freeze(program.reconstructed.tokens.map((token) => {
    // Reconstruction first occupies the exact source-body glyph position, so
    // ownership can crossfade without a doubled or jumping typographic image.
    const originId = token.originIds.find((id) => destinationReferences.has(id)) ??
      token.originIds.find((id) => centers.has(id));
    if (originId === undefined) {
      throw new Error(`Reconstructed material ${token.id} lacks visible source geometry.`);
    }
    const source = required(centers, originId, "reconstruction origin");
    const target = point(
      targetCenter.xEm - width / 2 + token.source.start * advance +
        token.lexeme.length * advance / 2,
      targetCenter.yEm
    );
    return Object.freeze({
      token,
      xEm: stable(lerp(
        source.xEm - token.lexeme.length * advance / 2,
        target.xEm - token.lexeme.length * advance / 2,
        sample.reconstructed.recenterProgress
      )),
      yEm: stable(lerp(
        source.yEm - 0.6,
        target.yEm - 0.6,
        sample.reconstructed.recenterProgress
      )),
      scale: 1,
      opacity: sample.reconstructed.opacity
    });
  }));
}

function pointOnPath(
  segments: readonly KpLispBindingCubicSegment[],
  progress: number
): KpLispPoint {
  const scaled = stableUnit(progress) * segments.length;
  const index = Math.min(segments.length - 1, Math.floor(scaled));
  const local = index === segments.length - 1 && progress === 1
    ? 1
    : scaled - index;
  const segment = segments[index]!;
  const inverse = 1 - local;
  return point(
    inverse ** 3 * segment.start.xEm +
      3 * inverse ** 2 * local * segment.control1.xEm +
      3 * inverse * local ** 2 * segment.control2.xEm +
      local ** 3 * segment.end.xEm,
    inverse ** 3 * segment.start.yEm +
      3 * inverse ** 2 * local * segment.control1.yEm +
      3 * inverse * local ** 2 * segment.control2.yEm +
      local ** 3 * segment.end.yEm
  );
}

function pathData(segments: readonly KpLispBindingCubicSegment[]): string {
  const first = segments[0];
  if (first === undefined) throw new Error("Lisp binding route requires a segment.");
  return [
    `M ${first.start.xEm} ${first.start.yEm}`,
    ...segments.map(({ control1, control2, end }) =>
      `C ${control1.xEm} ${control1.yEm} ${control2.xEm} ${control2.yEm} ${end.xEm} ${end.yEm}`)
  ].join(" ");
}

function requiredDestination(
  plan: KpLispBoundValuePropagationPlan,
  derivedMaterialId: string
): KpLispBoundValuePropagationPlan["destinations"][number] {
  const destination = plan.destinations.find((candidate) =>
    candidate.derivedMaterialId === derivedMaterialId);
  if (destination === undefined) throw new Error(`Missing derived ${derivedMaterialId}.`);
  return destination;
}

function requiredPlacement(
  geometry: KpLispResponsiveGeometry,
  materialId: string
): KpLispResponsiveGeometry["tokens"][number] {
  const placement = geometry.tokens.find((candidate) =>
    candidate.materialId === materialId);
  if (placement === undefined) throw new Error(`Missing placement for ${materialId}.`);
  return placement;
}

function canonical(
  projection: KpLispSourceMaterialProjection,
  id: KpLispCanonicalMaterialState["id"]
): KpLispCanonicalMaterialState {
  const state = projection.canonicalStates.find((candidate) => candidate.id === id);
  if (state === undefined) throw new Error(`Missing canonical Lisp state ${id}.`);
  return state;
}

interface KpLispPoint { readonly xEm: number; readonly yEm: number }

function center(rect: KpLispGeometryRect): KpLispPoint {
  return point(rect.xEm + rect.widthEm / 2, rect.yEm + rect.heightEm / 2);
}

function point(xEm: number, yEm: number): KpLispPoint {
  return Object.freeze({ xEm: stable(xEm), yEm: stable(yEm) });
}

function required<T>(values: ReadonlyMap<string, T>, id: string, label: string): T {
  const value = values.get(id);
  if (value === undefined) throw new Error(`Missing ${label} for ${id}.`);
  return value;
}

function describe(phase: KpLispApplicationMotionFrame["phase"]): string {
  switch (phase) {
    case "open": return "The lambda application is open, with the parameter ready to receive its argument.";
    case "transfer": return "The source value 4 travels along a temporary arch toward parameter x.";
    case "absorb": return "The value 4 contracts into the parameter and disappears there.";
    case "bind": return "The parameter now holds the value 4; the body occurrence is the next destination.";
    case "propagate": return "The bound value reappears as 4 at the certified x occurrence in the function body.";
    case "fold-shells": return "Consumed application shells fold recursively into a temporary provenance bead.";
    case "hold-provenance": return "The temporary bead accounts for source material not present in the reconstructed body.";
    case "reconstruct": return "The native body expression, plus 4 1, appears from certified source material.";
    case "recenter": return "The reconstructed body moves to the center as the temporary provenance bead exits.";
    case "settled": return "The ordinary selectable Lisp expression plus 4 1 is settled.";
  }
}

function intervalProgress(
  interval: { readonly start: number; readonly end: number },
  value: number
): number {
  if (interval.end === interval.start) return 1;
  return stableUnit((value - interval.start) / (interval.end - interval.start));
}

function smoothstep(value: number): number {
  const unit = stableUnit(value);
  return stable(unit * unit * (3 - 2 * unit));
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
