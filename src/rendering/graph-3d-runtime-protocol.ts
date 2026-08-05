export const KP_GRAPH_3D_RUNTIME_PROTOCOL_SCHEMA =
  "kp.graph-3d-runtime-protocol.v1";

export const KP_GRAPH_3D_VISUAL_ROLES = [
  "background",
  "axis",
  "axis-accent",
  "axis-occluded",
  "surface",
  "surface-grid",
  "surface-border",
  "shadow"
] as const;

export type KpGraph3DVisualRole = typeof KP_GRAPH_3D_VISUAL_ROLES[number];
export type KpGraph3DClockDirection = "forward" | "rewind";
export type KpGraph3DVisibility = "offscreen" | "near" | "visible";
export type KpGraph3DRendererPortKind = "static" | "interactive";

export interface KpGraph3DVisualRoleStyle {
  readonly color: string;
  readonly opacity: number;
  readonly apparentWidth: number;
}

export type KpGraph3DResolvedVisualRoles = Readonly<
  Record<KpGraph3DVisualRole, KpGraph3DVisualRoleStyle>
>;

export interface KpGraph3DRuntimeFrame<Scene> {
  readonly schemaVersion: typeof KP_GRAPH_3D_RUNTIME_PROTOCOL_SCHEMA;
  readonly identity: {
    readonly animationId: string;
    readonly frameId: string;
    readonly graphId: string;
  };
  readonly clock: {
    readonly authority: "host";
    readonly direction: KpGraph3DClockDirection;
    readonly requestedProgress: number;
    readonly visualProgress: number;
  };
  readonly stage: {
    readonly coordinateSpace: "stage-local";
    readonly width: number;
    readonly height: number;
    readonly anchors: {
      readonly plotOrigin: readonly [number, number];
      readonly cameraTarget: readonly [number, number, number];
    };
  };
  readonly camera: {
    readonly projection: "orthographic";
    readonly azimuthDegrees: number;
    readonly elevationDegrees: number;
    readonly scale: number;
  };
  readonly theme: {
    readonly id: string;
    readonly roles: KpGraph3DResolvedVisualRoles;
  };
  readonly scene: {
    readonly source: Scene;
    readonly target: Scene;
  };
  readonly accessibility: {
    readonly description: string;
  };
}

export interface KpGraph3DRuntimeFrameInput<Scene> {
  readonly identity: KpGraph3DRuntimeFrame<Scene>["identity"];
  readonly clock: Omit<KpGraph3DRuntimeFrame<Scene>["clock"], "authority">;
  readonly stage: Omit<
    KpGraph3DRuntimeFrame<Scene>["stage"],
    "coordinateSpace"
  >;
  readonly camera: KpGraph3DRuntimeFrame<Scene>["camera"];
  readonly theme: KpGraph3DRuntimeFrame<Scene>["theme"];
  readonly scene: KpGraph3DRuntimeFrame<Scene>["scene"];
  readonly accessibility: KpGraph3DRuntimeFrame<Scene>["accessibility"];
}

export interface KpGraph3DRendererSession<Scene> {
  readonly kind: KpGraph3DRendererPortKind;
  readonly status: "mounted" | "disposed";
  apply(frame: KpGraph3DRuntimeFrame<Scene>): void;
  setVisibility(visibility: KpGraph3DVisibility): void;
  dispose(): void;
}

export interface KpGraph3DRendererPort<Surface extends object, Scene> {
  readonly kind: KpGraph3DRendererPortKind;
  mount(input: {
    readonly surface: Surface;
    readonly frame: KpGraph3DRuntimeFrame<Scene>;
    readonly visibility: KpGraph3DVisibility;
  }): KpGraph3DRendererSession<Scene>;
}

export const kpGraph3DRuntimeProtocolContract = Object.freeze({
  schemaVersion: KP_GRAPH_3D_RUNTIME_PROTOCOL_SCHEMA,
  semanticAuthority: "caller-projected-frame",
  scenePayload: "opaque-to-protocol",
  clockAuthority: "host-shared-clock",
  coordinateSpace: "stage-local",
  cameraPolicy: "explicit-orthographic-state",
  themePolicy: "resolved-visual-role-values",
  rendererOwnership: "separate-static-and-interactive-ports",
  lifecycle: "mount-apply-visibility-dispose"
} as const);

export function createKpGraph3DRuntimeFrame<Scene>(
  input: KpGraph3DRuntimeFrameInput<Scene>
): KpGraph3DRuntimeFrame<Scene> {
  requireId(input.identity.animationId, "identity.animationId");
  requireId(input.identity.frameId, "identity.frameId");
  requireId(input.identity.graphId, "identity.graphId");
  requireUnitInterval(input.clock.requestedProgress, "clock.requestedProgress");
  requireUnitInterval(input.clock.visualProgress, "clock.visualProgress");
  requirePositive(input.stage.width, "stage.width");
  requirePositive(input.stage.height, "stage.height");
  requireTuple(input.stage.anchors.plotOrigin, 2, "stage.anchors.plotOrigin");
  requireTuple(input.stage.anchors.cameraTarget, 3, "stage.anchors.cameraTarget");
  requireFinite(input.camera.azimuthDegrees, "camera.azimuthDegrees");
  requireFinite(input.camera.elevationDegrees, "camera.elevationDegrees");
  requirePositive(input.camera.scale, "camera.scale");
  requireId(input.theme.id, "theme.id");
  requireId(input.accessibility.description, "accessibility.description");

  const roles = Object.freeze({
    background: copyRole(input.theme.roles.background, "background"),
    axis: copyRole(input.theme.roles.axis, "axis"),
    "axis-accent": copyRole(
      input.theme.roles["axis-accent"],
      "axis-accent"
    ),
    "axis-occluded": copyRole(
      input.theme.roles["axis-occluded"],
      "axis-occluded"
    ),
    surface: copyRole(input.theme.roles.surface, "surface"),
    "surface-grid": copyRole(
      input.theme.roles["surface-grid"],
      "surface-grid"
    ),
    "surface-border": copyRole(
      input.theme.roles["surface-border"],
      "surface-border"
    ),
    shadow: copyRole(input.theme.roles.shadow, "shadow")
  });

  // Scene payloads stay opaque and retain caller identity; only protocol-owned
  // metadata is copied so renderer choice cannot become semantic authority.
  return Object.freeze({
    schemaVersion: KP_GRAPH_3D_RUNTIME_PROTOCOL_SCHEMA,
    identity: Object.freeze({ ...input.identity }),
    clock: Object.freeze({ authority: "host" as const, ...input.clock }),
    stage: Object.freeze({
      coordinateSpace: "stage-local" as const,
      width: input.stage.width,
      height: input.stage.height,
      anchors: Object.freeze({
        plotOrigin: Object.freeze([...input.stage.anchors.plotOrigin]) as
          unknown as readonly [number, number],
        cameraTarget: Object.freeze([...input.stage.anchors.cameraTarget]) as
          unknown as readonly [number, number, number]
      })
    }),
    camera: Object.freeze({ ...input.camera }),
    theme: Object.freeze({ id: input.theme.id, roles }),
    scene: Object.freeze({ ...input.scene }),
    accessibility: Object.freeze({ ...input.accessibility })
  });
}

function copyRole(
  role: KpGraph3DVisualRoleStyle,
  name: KpGraph3DVisualRole
): KpGraph3DVisualRoleStyle {
  requireId(role.color, `theme.roles.${name}.color`);
  requireUnitInterval(role.opacity, `theme.roles.${name}.opacity`);
  requireNonnegative(
    role.apparentWidth,
    `theme.roles.${name}.apparentWidth`
  );
  return Object.freeze({ ...role });
}

function requireId(value: string, path: string): void {
  if (value.trim() === "") throw new Error(`${path} must be nonempty.`);
}

function requireUnitInterval(value: number, path: string): void {
  requireFinite(value, path);
  if (value < 0 || value > 1) {
    throw new Error(`${path} must be in the closed unit interval.`);
  }
}

function requirePositive(value: number, path: string): void {
  requireFinite(value, path);
  if (value <= 0) throw new Error(`${path} must be positive.`);
}

function requireNonnegative(value: number, path: string): void {
  requireFinite(value, path);
  if (value < 0) throw new Error(`${path} must be nonnegative.`);
}

function requireFinite(value: number, path: string): void {
  if (!Number.isFinite(value)) throw new Error(`${path} must be finite.`);
}

function requireTuple(
  value: readonly number[],
  length: number,
  path: string
): void {
  if (value.length !== length || value.some((item) => !Number.isFinite(item))) {
    throw new Error(`${path} must contain ${length} finite coordinates.`);
  }
}
