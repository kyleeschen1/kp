import type {
  EasingName,
  EquationMotionTrack,
  MotionPose
} from "./equation-motion-plan.ts";

export type RoleAwareMotionPrimitiveId =
  | "inline-to-fraction"
  | "inline-to-script"
  | "wrap"
  | "unwrap";

export type RoleAwareMotionRole =
  | "expression"
  | "fraction-slot"
  | "inline"
  | "superscript"
  | "wrapped-expression";

export interface RoleAwareMotionPrimitiveDescriptor {
  readonly id: RoleAwareMotionPrimitiveId;
  readonly sourceRole: RoleAwareMotionRole;
  readonly targetRole: RoleAwareMotionRole;
  readonly tokenLifecycle: EquationMotionTrack["lifecycle"];
  readonly visualLifecycle: EquationMotionTrack["visualLifecycle"];
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
  readonly from: MotionPose;
  readonly to: MotionPose;
  readonly summary: string;
}

export const roleAwareMotionPrimitiveDescriptors: readonly RoleAwareMotionPrimitiveDescriptor[] = [
  {
    id: "inline-to-fraction",
    sourceRole: "inline",
    targetRole: "fraction-slot",
    tokenLifecycle: "move",
    visualLifecycle: "shift",
    start: 0,
    end: 1,
    easing: "ease-in-out",
    from: identityPose(),
    to: { opacity: 1, x: 0, y: -10, scale: 0.86 },
    summary:
      "An inline token moves into fraction geometry with a measured baseline shift and local scale change."
  },
  {
    id: "inline-to-script",
    sourceRole: "inline",
    targetRole: "superscript",
    tokenLifecycle: "move",
    visualLifecycle: "shift",
    start: 0,
    end: 1,
    easing: "ease-in-out",
    from: identityPose(),
    to: { opacity: 1, x: 0, y: -14, scale: 0.72 },
    summary:
      "An inline token moves into superscript geometry with script-scale and upward baseline shift."
  },
  {
    id: "wrap",
    sourceRole: "expression",
    targetRole: "wrapped-expression",
    tokenLifecycle: "group-wrap",
    visualLifecycle: "wrap",
    start: 0,
    end: 1,
    easing: "ease-in-out",
    from: identityPose(),
    to: identityPose(),
    summary:
      "A child expression persists while wrapper artifacts enter around it."
  },
  {
    id: "unwrap",
    sourceRole: "wrapped-expression",
    targetRole: "expression",
    tokenLifecycle: "group-unwrap",
    visualLifecycle: "unwrap",
    start: 0,
    end: 1,
    easing: "ease-in-out",
    from: identityPose(),
    to: identityPose(),
    summary:
      "A wrapped child expression persists while wrapper artifacts exit around it."
  }
];

export function findRoleAwareMotionPrimitiveDescriptor(
  id: RoleAwareMotionPrimitiveId
): RoleAwareMotionPrimitiveDescriptor {
  const descriptor = roleAwareMotionPrimitiveDescriptors.find(
    (candidate) => candidate.id === id
  );

  if (descriptor === undefined) {
    throw new Error(`Unknown role-aware motion primitive: ${id}`);
  }

  return descriptor;
}

export function createRoleAwareMotionTrack(
  tokenId: string,
  primitiveId: RoleAwareMotionPrimitiveId
): EquationMotionTrack {
  const descriptor = findRoleAwareMotionPrimitiveDescriptor(primitiveId);

  return {
    tokenId,
    lifecycle: descriptor.tokenLifecycle,
    visualLifecycle: descriptor.visualLifecycle,
    start: descriptor.start,
    end: descriptor.end,
    easing: descriptor.easing,
    from: clonePose(descriptor.from),
    to: clonePose(descriptor.to)
  };
}

function identityPose(): MotionPose {
  return { opacity: 1, x: 0, y: 0, scale: 1 };
}

function clonePose(pose: MotionPose): MotionPose {
  return { ...pose };
}
