import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import {
  sampleKpEquationEnclosureChoreography,
  type KpEquationEnclosureChoreographyFrame
} from "./equation-enclosure-choreography.ts";

export interface KpEquationTokenMotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface KpEquationTokenMotionFrameToken {
  readonly motionId: string;
  readonly side: "source" | "target";
  readonly pose: KpEquationTokenMotionPose;
}

export interface KpEquationTokenMotionFrame {
  readonly transitionId: string;
  readonly progress: number;
  readonly tokens: readonly KpEquationTokenMotionFrameToken[];
  readonly enclosureChoreography?: KpEquationEnclosureChoreographyFrame | undefined;
}

interface EnclosureChoreographyContext {
  readonly frame: KpEquationEnclosureChoreographyFrame;
  readonly persistentBounds: {
    readonly left: number;
    readonly width: number;
  };
  readonly enclosureMotionIds: ReadonlySet<string>;
}

export function sampleKpEquationTokenMotion(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): KpEquationTokenMotionFrame {
  const p = clamp01(progress);
  const tokens = new Map<string, KpEquationTokenMotionFrameToken>();
  const enclosureChoreography = createEnclosureChoreographyContext(geometry, p);
  for (const relation of geometry.relations) {
    for (const token of sampleRelation(geometry, relation, p, enclosureChoreography)) {
      tokens.set(`${token.side}:${token.motionId}`, token);
    }
  }
  return {
    transitionId: geometry.transitionId,
    progress: p,
    tokens: [...tokens.values()],
    ...(enclosureChoreography === undefined
      ? {}
      : { enclosureChoreography: enclosureChoreography.frame })
  };
}

export function applyKpEquationTokenMotionFrame(
  geometry: KpMeasuredEquationTransitionGeometry,
  frame: KpEquationTokenMotionFrame
): void {
  const elements = new Map([
    ...geometry.sourceTokens.map((token) => [`source:${token.motionId}`, token.element] as const),
    ...geometry.targetTokens.map((token) => [`target:${token.motionId}`, token.element] as const)
  ]);
  for (const token of frame.tokens) {
    const element = elements.get(`${token.side}:${token.motionId}`);
    if (element === undefined) continue;
    element.style.opacity = String(token.pose.opacity);
    element.style.transform =
      `translate(${token.pose.x}px, ${token.pose.y}px) scale(${token.pose.scale})`;
    element.style.transformOrigin = "center center";
  }
}

function sampleRelation(
  geometry: KpMeasuredEquationTransitionGeometry,
  relation: KpMeasuredEquationTransitionRelationGeometry,
  progress: number,
  enclosureChoreography: EnclosureChoreographyContext | undefined
): readonly KpEquationTokenMotionFrameToken[] {
  const sourceTokens = relationTokens(geometry.sourceTokens, relation.source?.motionIds ?? []);
  const targetTokens = relationTokens(geometry.targetTokens, relation.target?.motionIds ?? []);
  const eased = smoothstep(progress);
  switch (relation.lifecycle) {
    case "persist":
    case "role-change":
      const travelProgress = relation.lifecycle === "role-change"
        ? enclosureChoreography?.frame.persistentTravelProgress ?? eased
        : eased;
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: progress === 1 ? 0 : 1,
          x: (relation.delta?.x ?? 0) * travelProgress,
          y: (relation.delta?.y ?? 0) * travelProgress,
          scale: 1 + ((averageScale(relation) - 1) * travelProgress)
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: progress === 1 ? 1 : 0,
          x: 0,
          y: 0,
          scale: 1
        }))
      ];
    case "enter":
      if (enclosureChoreography?.frame.kind === "wrap") {
        return targetTokens.map((token) => sampleEnclosureArtifactToken(
          token,
          "target",
          enclosureChoreography
        ));
      }
      return targetTokens.map((token) => frameToken(token, "target", {
        opacity: eased,
        x: 0,
        y: 6 * (1 - eased),
        scale: 0.85 + 0.15 * eased
      }));
    case "exit":
      if (enclosureChoreography?.frame.kind === "unwrap") {
        return sourceTokens.map((token) => sampleEnclosureArtifactToken(
          token,
          "source",
          enclosureChoreography
        ));
      }
      return sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - eased,
        x: 0,
        y: 0,
        scale: 1 - 0.1 * eased
      }));
    case "cancel":
      return sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - eased,
        x: 0,
        y: relation.lifecycle === "cancel" ? -4 * eased : 0,
        scale: 1 - (relation.lifecycle === "cancel" ? 0.3 * eased : 0.1 * eased)
      }));
    case "merge": {
      const reveal = lateProgress(progress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - reveal,
          x: (relation.delta?.x ?? 0) * eased,
          y: (relation.delta?.y ?? 0) * eased,
          scale: 1 - 0.2 * eased
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: reveal,
          x: 0,
          y: 0,
          scale: 0.85 + 0.15 * reveal
        }))
      ];
    }
    case "split": {
      const reveal = lateProgress(progress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - reveal,
          x: (relation.delta?.x ?? 0) * eased,
          y: (relation.delta?.y ?? 0) * eased,
          scale: 1
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: reveal,
          x: -(relation.delta?.x ?? 0) * (1 - eased),
          y: -(relation.delta?.y ?? 0) * (1 - eased),
          scale: 0.85 + 0.15 * reveal
        }))
      ];
    }
    case "artifact":
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - eased, x: 0, y: 0, scale: 1
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: eased, x: 0, y: 0, scale: 0.9 + 0.1 * eased
        }))
      ];
    case "focus":
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1, x: 0, y: 0, scale: 1 + 0.06 * Math.sin(Math.PI * progress)
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: 1, x: 0, y: 0, scale: 1 + 0.06 * Math.sin(Math.PI * progress)
        }))
      ];
  }
}

function createEnclosureChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): EnclosureChoreographyContext | undefined {
  const persistent = geometry.relations.find(
    (relation) => relation.lifecycle === "role-change" && relation.source !== undefined && relation.target !== undefined
  );
  const kind = geometry.enclosureChoreographyKind;
  if (persistent === undefined || kind === undefined) return undefined;

  const entering = geometry.relations.filter(
    (relation) => relation.lifecycle === "enter" && relation.target !== undefined
  );
  const exiting = geometry.relations.filter(
    (relation) => relation.lifecycle === "exit" && relation.source !== undefined
  );
  if (kind === "wrap" && entering.length === 0) return undefined;
  if (kind === "unwrap" && exiting.length === 0) return undefined;

  const persistentBounds = kind === "wrap"
    ? persistent.target!.bounds
    : persistent.source!.bounds;
  const artifactMotionIds = (kind === "wrap" ? entering : exiting).flatMap(
    (relation) => kind === "wrap"
      ? relation.target?.motionIds ?? []
      : relation.source?.motionIds ?? []
  );
  const artifactTokens = relationTokens(
    kind === "wrap" ? geometry.targetTokens : geometry.sourceTokens,
    artifactMotionIds
  );

  return {
    frame: sampleKpEquationEnclosureChoreography(kind, progress),
    persistentBounds,
    enclosureMotionIds: nearestEnclosureMotionIds(artifactTokens, persistentBounds)
  };
}

function nearestEnclosureMotionIds(
  tokens: readonly AnnotatedMotionToken[],
  persistentBounds: { readonly left: number; readonly width: number }
): ReadonlySet<string> {
  // The closest artifact on each side is the enclosure; farther artifacts such
  // as a function label use the later outer-artifact phase.
  const center = persistentBounds.left + persistentBounds.width / 2;
  const left = nearestToken(tokens.filter((token) => tokenCenterX(token) < center), center);
  const right = nearestToken(tokens.filter((token) => tokenCenterX(token) >= center), center);
  return new Set([left?.motionId, right?.motionId].filter(
    (motionId): motionId is string => motionId !== undefined
  ));
}

function nearestToken(
  tokens: readonly AnnotatedMotionToken[],
  center: number
): AnnotatedMotionToken | undefined {
  return [...tokens].sort(
    (left, right) => Math.abs(tokenCenterX(left) - center) - Math.abs(tokenCenterX(right) - center)
  )[0];
}

function sampleEnclosureArtifactToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  context: EnclosureChoreographyContext
): KpEquationTokenMotionFrameToken {
  const isEnclosure = context.enclosureMotionIds.has(token.motionId);
  const visibility = isEnclosure
    ? context.frame.enclosureVisibility
    : context.frame.outerArtifactVisibility;
  const center = context.persistentBounds.left + context.persistentBounds.width / 2;
  const direction = tokenCenterX(token) < center ? -1 : 1;
  const travel = 1 - visibility;

  return frameToken(token, side, {
    opacity: visibility,
    x: direction * (isEnclosure ? 8 : 10) * travel,
    y: 0,
    scale: isEnclosure ? 1 : 0.35 + 0.65 * visibility
  });
}

function tokenCenterX(token: AnnotatedMotionToken): number {
  return token.localRect.left + token.localRect.width / 2;
}

function relationTokens(
  tokens: readonly AnnotatedMotionToken[],
  motionIds: readonly string[]
): readonly AnnotatedMotionToken[] {
  const ids = new Set(motionIds);
  return tokens.filter((token) => ids.has(token.motionId));
}

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
}

function averageScale(relation: KpMeasuredEquationTransitionRelationGeometry): number {
  if (relation.delta === undefined) return 1;
  return (relation.delta.scaleX + relation.delta.scaleY) / 2;
}

function lateProgress(progress: number): number {
  return smoothstep(clamp01((progress - 0.55) / 0.45));
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
