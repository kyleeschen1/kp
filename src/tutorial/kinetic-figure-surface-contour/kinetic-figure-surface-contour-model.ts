import {
  createKpSemanticDisplayFragment,
  createKpSemanticEntity,
  createKpSemanticEntityRegistry
} from "../../semantic/semantic-entity-provenance.ts";
import {
  createKpSemanticScene
} from "../../semantic/semantic-scene-protocol.ts";
import {
  createKpAnimationSaliencePlan
} from "../../animation/salience-plan.ts";
import {
  compileKpCrossViewAttentionPlan
} from "../cross-view-attention.ts";
import {
  validateKpCrossViewCorrespondenceMap,
  type KpCrossViewCorrespondenceMap
} from "../cross-view-correspondence.ts";

export const KP_SURFACE_CONTOUR_MODEL_SCHEMA =
  "kp.calculus.surface-contour-model.v1" as const;
export const KP_SURFACE_CONTOUR_SCORE_SCHEMA =
  "kp.calculus.surface-contour-score.v1" as const;

export const kpSurfaceContourEntityIds = Object.freeze({
  surface: "entity.calculus.surface-contour.paraboloid",
  slicingPlane: "entity.calculus.surface-contour.slicing-plane",
  intersection3d: "entity.calculus.surface-contour.level-set.intersection-3d",
  contour2d: "entity.calculus.surface-contour.level-set.contour-2d",
  contextContours: "entity.calculus.surface-contour.context-contours",
  levelParameter: "entity.calculus.surface-contour.level-parameter"
} as const);

export const kpSurfaceContourIdentityId =
  "identity.calculus.surface-contour.same-level-set" as const;

export interface KpSurfaceContourPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface KpSurfaceContourModelV1 {
  readonly schemaVersion: typeof KP_SURFACE_CONTOUR_MODEL_SCHEMA;
  readonly id: "model.calculus.surface-contour.paraboloid.v1";
  readonly equationLatex: "z=x^2+2y^2";
  readonly levelSetLatex: "x^2+2y^2=c";
  readonly level: Readonly<{
    min: number;
    max: number;
    initial: number;
    expanded: number;
  }>;
  readonly entityIds: typeof kpSurfaceContourEntityIds;
  readonly correspondence: KpCrossViewCorrespondenceMap;
}

export type KpSurfaceContourBeatSlug =
  | "read-the-surface"
  | "choose-a-height"
  | "find-the-intersection"
  | "project-the-contour"
  | "vary-the-level"
  | "read-the-map";

export type KpSurfaceContourAttentionAct =
  | "orient"
  | "identify-level"
  | "reveal-intersection"
  | "transmit-representation"
  | "compare-levels"
  | "interpret";

export type KpSurfaceContourRepresentation =
  | "surface-3d"
  | "top-down-level-set"
  | "contour-map";

export type KpSurfaceContourEntityId =
  typeof kpSurfaceContourEntityIds[keyof typeof kpSurfaceContourEntityIds];

export interface KpSurfaceContourBeatV1 {
  readonly id: `beat.calculus.surface-contour.${KpSurfaceContourBeatSlug}`;
  readonly ordinal: number;
  readonly slug: KpSurfaceContourBeatSlug;
  readonly title: string;
  readonly passage: string;
  readonly attentionAct: KpSurfaceContourAttentionAct;
  readonly representation: KpSurfaceContourRepresentation;
  readonly level: number;
  readonly targetEntityIds: readonly KpSurfaceContourEntityId[];
  readonly contextEntityIds: readonly KpSurfaceContourEntityId[];
  readonly presentEntityIds: readonly KpSurfaceContourEntityId[];
  readonly levelControl: "context" | "available";
}

export interface KpSurfaceContourScoreV1 {
  readonly schemaVersion: typeof KP_SURFACE_CONTOUR_SCORE_SCHEMA;
  readonly id: "score.calculus.surface-contour-focus-card.v1";
  readonly modelId: KpSurfaceContourModelV1["id"];
  readonly beats: readonly KpSurfaceContourBeatV1[];
}

export interface KpSurfaceContourEntityVisualState {
  readonly entityId: KpSurfaceContourEntityId;
  readonly presence: number;
  readonly attention: number;
}

export interface KpSurfaceContourSceneProjectionV1 {
  readonly level: number;
  readonly entities: Readonly<Record<
    KpSurfaceContourEntityId,
    KpSurfaceContourEntityVisualState
  >>;
  readonly levelControl: number;
  readonly viewProgress: number;
  readonly mapProgress: number;
}

export function createKpSurfaceContourModel(): KpSurfaceContourModelV1 {
  const correspondence: KpCrossViewCorrespondenceMap = Object.freeze({
    id: "correspondence-map.calculus.surface-contour.v1",
    members: Object.freeze([
      Object.freeze({
        id: "member.calculus.surface-contour.intersection-3d",
        viewId: "view.calculus.surface-contour.graph-3d",
        selectorId: kpSurfaceContourEntityIds.intersection3d,
        role: "surface-plane intersection"
      }),
      Object.freeze({
        id: "member.calculus.surface-contour.contour-2d",
        viewId: "view.calculus.surface-contour.graph-2d",
        selectorId: kpSurfaceContourEntityIds.contour2d,
        role: "level-set contour"
      })
    ]),
    identities: Object.freeze([
      Object.freeze({
        id: kpSurfaceContourIdentityId,
        meaning: "The same solutions to x² + 2y² = c in two projections.",
        memberIds: Object.freeze([
          "member.calculus.surface-contour.intersection-3d",
          "member.calculus.surface-contour.contour-2d"
        ])
      })
    ]),
    correspondences: Object.freeze([
      Object.freeze({
        id: "correspondence.calculus.surface-contour.intersection-to-contour",
        sourceMemberId: "member.calculus.surface-contour.intersection-3d",
        targetMemberId: "member.calculus.surface-contour.contour-2d",
        kind: "representation-to-representation" as const,
        reversible: true,
        summary: "Transmit the surface-plane intersection into its contour-map representation."
      })
    ])
  });
  const issues = validateKpCrossViewCorrespondenceMap(correspondence);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join(" "));
  }
  return Object.freeze({
    schemaVersion: KP_SURFACE_CONTOUR_MODEL_SCHEMA,
    id: "model.calculus.surface-contour.paraboloid.v1",
    equationLatex: "z=x^2+2y^2",
    levelSetLatex: "x^2+2y^2=c",
    level: Object.freeze({ min: 0.8, max: 4, initial: 1.6, expanded: 3.6 }),
    entityIds: kpSurfaceContourEntityIds,
    correspondence
  });
}

export function createKpSurfaceContourScore(
  model: KpSurfaceContourModelV1 = createKpSurfaceContourModel()
): KpSurfaceContourScoreV1 {
  const ids = model.entityIds;
  const beats = Object.freeze([
    beat({
      slug: "read-the-surface",
      ordinal: 1,
      title: "Read height on the surface",
      passage: "The bowl is the graph of $z=x^2+2y^2$. Every point on it stores an input $(x,y)$ and the corresponding height $z$.",
      attentionAct: "orient",
      representation: "surface-3d",
      level: model.level.initial,
      targetEntityIds: [ids.surface],
      contextEntityIds: [],
      presentEntityIds: [ids.surface],
      levelControl: "context"
    }),
    beat({
      slug: "choose-a-height",
      ordinal: 2,
      title: "Choose one output value",
      passage: "Fix a height $z=c$. The horizontal plane collects every point in space with that same output value.",
      attentionAct: "identify-level",
      representation: "surface-3d",
      level: model.level.initial,
      targetEntityIds: [ids.slicingPlane, ids.levelParameter],
      contextEntityIds: [ids.surface],
      presentEntityIds: [
        ids.surface,
        ids.slicingPlane,
        ids.levelParameter
      ],
      levelControl: "context"
    }),
    beat({
      slug: "find-the-intersection",
      ordinal: 3,
      title: "Keep only points on both",
      passage: "Where the plane meets the bowl, both equations are true. Their intersection is the level set $x^2+2y^2=c$.",
      attentionAct: "reveal-intersection",
      representation: "surface-3d",
      level: model.level.initial,
      targetEntityIds: [ids.intersection3d],
      contextEntityIds: [ids.surface, ids.slicingPlane],
      presentEntityIds: [
        ids.surface,
        ids.slicingPlane,
        ids.intersection3d
      ],
      levelControl: "context"
    }),
    beat({
      slug: "project-the-contour",
      ordinal: 4,
      title: "Look at the same set from above",
      passage: "Now rotate the whole scene toward a top-down view. The highlighted ellipse stays put semantically: only our viewpoint changes.",
      attentionAct: "transmit-representation",
      representation: "top-down-level-set",
      level: model.level.initial,
      targetEntityIds: [ids.intersection3d],
      contextEntityIds: [ids.surface, ids.slicingPlane],
      presentEntityIds: [
        ids.surface,
        ids.slicingPlane,
        ids.intersection3d
      ],
      levelControl: "context"
    }),
    beat({
      slug: "vary-the-level",
      ordinal: 5,
      title: "Encode height on the map",
      passage: "With vertical depth removed, the same ellipse becomes a contour. Raising $c$ now widens the contour instead of lifting it on the page.",
      attentionAct: "compare-levels",
      representation: "contour-map",
      level: model.level.expanded,
      targetEntityIds: [
        ids.levelParameter,
        ids.contour2d
      ],
      contextEntityIds: [ids.surface],
      presentEntityIds: [ids.surface, ids.contour2d, ids.levelParameter],
      levelControl: "available"
    }),
    beat({
      slug: "read-the-map",
      ordinal: 6,
      title: "Interpret contour spacing",
      passage: "Each nested contour records another height. Here the ellipses spread farther in $x$ than in $y$, revealing that the surface rises twice as quickly in the $y$ direction.",
      attentionAct: "interpret",
      representation: "contour-map",
      level: model.level.expanded,
      targetEntityIds: [ids.contour2d, ids.contextContours],
      contextEntityIds: [ids.levelParameter],
      presentEntityIds: [ids.contour2d, ids.contextContours, ids.levelParameter],
      levelControl: "available"
    })
  ] satisfies readonly KpSurfaceContourBeatV1[]);

  validateScore(model, beats);
  createSalienceAuthority(model);
  return Object.freeze({
    schemaVersion: KP_SURFACE_CONTOUR_SCORE_SCHEMA,
    id: "score.calculus.surface-contour-focus-card.v1",
    modelId: model.id,
    beats
  });
}

export function evaluateKpSurfaceContourHeight(x: number, y: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("Surface coordinates must be finite.");
  }
  return x * x + 2 * y * y;
}

export function sampleKpSurfaceContourLevelSet(input: {
  readonly level: number;
  readonly sampleCount?: number | undefined;
}): readonly KpSurfaceContourPoint[] {
  const level = requireLevel(input.level);
  const sampleCount = Math.max(8, Math.floor(input.sampleCount ?? 97));
  return Object.freeze(Array.from({ length: sampleCount }, (_, index) => {
    const angle = index / (sampleCount - 1) * Math.PI * 2;
    return Object.freeze({
      x: Math.sqrt(level) * Math.cos(angle),
      y: Math.sqrt(level / 2) * Math.sin(angle),
      z: level
    });
  }));
}

export function projectKpSurfaceContourBeat(
  score: KpSurfaceContourScoreV1,
  beatIndex: number
): KpSurfaceContourSceneProjectionV1 {
  const beat = score.beats[boundedIndex(beatIndex, score.beats.length)]!;
  return projectionForBeat(beat);
}

export function interpolateKpSurfaceContourProjection(input: {
  readonly from: KpSurfaceContourSceneProjectionV1;
  readonly to: KpSurfaceContourSceneProjectionV1;
  readonly progress: number;
}): KpSurfaceContourSceneProjectionV1 {
  const progress = boundedUnit(input.progress);
  const entityIds = Object.values(kpSurfaceContourEntityIds);
  const entries = entityIds.map((entityId) => {
    const from = input.from.entities[entityId];
    const to = input.to.entities[entityId];
    return [entityId, Object.freeze({
      entityId,
      presence: interpolate(from.presence, to.presence, progress),
      attention: interpolate(from.attention, to.attention, smoothstep(progress))
    })] as const;
  });
  return Object.freeze({
    level: interpolate(input.from.level, input.to.level, smoothstep(progress)),
    entities: Object.freeze(Object.fromEntries(entries)) as
      KpSurfaceContourSceneProjectionV1["entities"],
    viewProgress: interpolate(
      input.from.viewProgress,
      input.to.viewProgress,
      smoothstep(progress)
    ),
    mapProgress: interpolate(
      input.from.mapProgress,
      input.to.mapProgress,
      smoothstep(progress)
    ),
    levelControl: interpolate(
      input.from.levelControl,
      input.to.levelControl,
      smoothstep(progress)
    )
  });
}

export function withKpSurfaceContourLevel(
  projection: KpSurfaceContourSceneProjectionV1,
  level: number
): KpSurfaceContourSceneProjectionV1 {
  return Object.freeze({ ...projection, level: requireLevel(level) });
}

function projectionForBeat(
  beat: KpSurfaceContourBeatV1
): KpSurfaceContourSceneProjectionV1 {
  const present = new Set(beat.presentEntityIds);
  const targets = new Set(beat.targetEntityIds);
  const contexts = new Set(beat.contextEntityIds);
  const entries = Object.values(kpSurfaceContourEntityIds).map((entityId) => [
    entityId,
    Object.freeze({
      entityId,
      presence: present.has(entityId) ? 1 : 0,
      attention: targets.has(entityId) ? 1 : contexts.has(entityId) ? 0.28 : 0
    })
  ] as const);
  return Object.freeze({
    level: beat.level,
    entities: Object.freeze(Object.fromEntries(entries)) as
      KpSurfaceContourSceneProjectionV1["entities"],
    viewProgress: beat.representation === "surface-3d" ? 0 : 1,
    mapProgress: beat.representation === "contour-map" ? 1 : 0,
    levelControl: beat.levelControl === "available" ? 1 : 0
  });
}

function createSalienceAuthority(model: KpSurfaceContourModelV1): void {
  const ids = model.entityIds;
  const registry = createKpSemanticEntityRegistry({
    entities: Object.entries(ids).map(([role, id]) => createKpSemanticEntity({
      id,
      semanticKind: `surface-contour-${role}`,
      label: role,
      provenance: { kind: "authored", sourceId: model.id }
    })),
    displayFragments: Object.values(ids).flatMap((id, index) => {
      const views = id === ids.intersection3d || id === ids.contour2d
        ? [id === ids.intersection3d ? "graph-3d" : "graph-2d"]
        : ["stage"];
      return views.map((view) => createKpSemanticDisplayFragment({
        id: `${model.id}.fragment.${index}.${view}`,
        semanticEntityId: id,
        fragmentRole: "primary",
        ordinal: 0
      }));
    })
  });
  const scene = createKpSemanticScene({
    id: "scene.calculus.surface-contour.v1",
    surfaceKind: "mixed",
    title: "A level set in a surface graph and contour map",
    registry,
    groups: [{
      id: kpSurfaceContourIdentityId,
      memberEntityIds: [ids.intersection3d, ids.contour2d],
      label: "Same level set across representations"
    }]
  });
  const transmission = compileKpCrossViewAttentionPlan({
    id: "attention.calculus.surface-contour.cross-view.v1",
    map: model.correspondence,
    correspondenceIds: [
      "correspondence.calculus.surface-contour.intersection-to-contour"
    ]
  });
  createKpAnimationSaliencePlan({
    id: "salience.calculus.surface-contour.v1",
    scenes: [scene],
    intents: [
      {
        id: "intent.calculus.surface-contour.notice-surface",
        kind: "notice",
        targetEntityIds: [ids.surface],
        summary: "Read the paraboloid as a height graph."
      },
      {
        id: "intent.calculus.surface-contour.notice-plane",
        kind: "notice",
        targetEntityIds: [ids.slicingPlane, ids.levelParameter],
        summary: "Fix one output height."
      },
      {
        id: "intent.calculus.surface-contour.notice-intersection",
        kind: "notice",
        targetEntityIds: [ids.intersection3d],
        summary: "Keep points shared by the surface and plane."
      },
      ...transmission.salience.intents,
      {
        id: "intent.calculus.surface-contour.compare-levels",
        kind: "compare",
        leftEntityIds: [ids.intersection3d],
        rightEntityIds: [ids.contour2d],
        summary: "Compare one changing level in both representations."
      }
    ]
  });
}

function beat(
  input: Omit<KpSurfaceContourBeatV1, "id">
): KpSurfaceContourBeatV1 {
  return Object.freeze({
    ...input,
    id: `beat.calculus.surface-contour.${input.slug}` as const,
    targetEntityIds: Object.freeze([...input.targetEntityIds]),
    contextEntityIds: Object.freeze([...input.contextEntityIds]),
    presentEntityIds: Object.freeze([...input.presentEntityIds])
  });
}

function validateScore(
  model: KpSurfaceContourModelV1,
  beats: readonly KpSurfaceContourBeatV1[]
): void {
  if (beats.length !== 6) throw new Error("Surface-contour score requires six beats.");
  const known = new Set(Object.values(model.entityIds));
  const slugs = new Set<string>();
  beats.forEach((entry, index) => {
    if (entry.ordinal !== index + 1) throw new Error("Surface-contour ordinals must be consecutive.");
    if (slugs.has(entry.slug)) throw new Error(`Duplicate surface-contour slug ${entry.slug}.`);
    slugs.add(entry.slug);
    for (const id of [
      ...entry.targetEntityIds,
      ...entry.contextEntityIds,
      ...entry.presentEntityIds
    ]) {
      if (!known.has(id)) throw new Error(`Unknown surface-contour entity ${id}.`);
    }
    for (const id of entry.targetEntityIds) {
      if (!entry.presentEntityIds.includes(id)) {
        throw new Error(`Target ${id} must be present in ${entry.id}.`);
      }
    }
  });
}

function requireLevel(level: number): number {
  if (!Number.isFinite(level) || level <= 0) {
    throw new Error("Level-set height must be positive and finite.");
  }
  return level;
}

function boundedIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(index)));
}

function boundedUnit(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Progress must be finite.");
  return Math.max(0, Math.min(1, value));
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}
