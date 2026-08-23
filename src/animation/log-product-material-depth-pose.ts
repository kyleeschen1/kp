import type {
  KpLogProductMaterialPlane,
  KpLogProductMaterialVerb
} from "./log-product-material-depth-roles.ts";

export type KpLogProductMaterialDepthMode =
  | "material"
  | "flat"
  | "no-depth";

export interface KpLogProductMaterialDepthPose {
  readonly plane: KpLogProductMaterialPlane;
  readonly normalizedDepth: number;
  readonly activity: number;
}

export interface KpLogProductMaterialDepthSampleRequest {
  readonly mode: KpLogProductMaterialDepthMode;
  readonly verb: KpLogProductMaterialVerb;
  readonly progress: number;
}

const SURFACE_DEPTH = 0;
const ACTIVE_DEPTH = 1;
const SUBSURFACE_DEPTH = -1;

const planeDepth = Object.freeze({
  surface: SURFACE_DEPTH,
  active: ACTIVE_DEPTH,
  subsurface: SUBSURFACE_DEPTH
} satisfies Readonly<Record<KpLogProductMaterialPlane, number>>);

interface KpLogProductMaterialVerbProfile {
  readonly from: KpLogProductMaterialPlane;
  readonly to: KpLogProductMaterialPlane;
  readonly fromActivity: number;
  readonly toActivity: number;
}

const verbProfiles = Object.freeze({
  rest: {
    from: "surface",
    to: "surface",
    fromActivity: 0,
    toActivity: 0
  },
  activate: {
    from: "surface",
    to: "active",
    fromActivity: 0,
    toActivity: 1
  },
  impress: {
    from: "active",
    to: "subsurface",
    fromActivity: 1,
    toActivity: 1
  },
  withdraw: {
    from: "active",
    to: "subsurface",
    fromActivity: 1,
    toActivity: 0
  },
  release: {
    from: "surface",
    to: "active",
    fromActivity: 0,
    toActivity: 1
  },
  transport: {
    from: "active",
    to: "active",
    fromActivity: 1,
    toActivity: 1
  },
  receive: {
    from: "subsurface",
    to: "active",
    fromActivity: 0,
    toActivity: 1
  },
  resolve: {
    from: "subsurface",
    to: "active",
    fromActivity: 0,
    toActivity: 1
  },
  settle: {
    from: "active",
    to: "surface",
    fromActivity: 1,
    toActivity: 0
  }
} as const satisfies Readonly<
  Record<KpLogProductMaterialVerb, KpLogProductMaterialVerbProfile>
>);

const flatPose: KpLogProductMaterialDepthPose = Object.freeze({
  plane: "surface",
  normalizedDepth: SURFACE_DEPTH,
  activity: 0
});

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const progress = clampUnit(value);
  return progress * progress * (3 - 2 * progress);
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function resolvePlane(
  profile: KpLogProductMaterialVerbProfile,
  progress: number
): KpLogProductMaterialPlane {
  if (progress <= 0) return profile.from;
  if (progress >= 1) return profile.to;
  return "active";
}

// This sampler returns normalized intent only. The exemplar renderer decides
// what one unit of depth looks like without changing semantic x/y geometry.
export function sampleKpLogProductMaterialDepthPose(
  request: KpLogProductMaterialDepthSampleRequest
): KpLogProductMaterialDepthPose {
  if (request.mode !== "material") return flatPose;

  const profile = verbProfiles[request.verb];
  const progress = clampUnit(request.progress);
  const easedProgress = smoothstep(progress);
  return {
    plane: resolvePlane(profile, progress),
    normalizedDepth: interpolate(
      planeDepth[profile.from],
      planeDepth[profile.to],
      easedProgress
    ),
    activity: interpolate(
      profile.fromActivity,
      profile.toActivity,
      easedProgress
    )
  };
}
