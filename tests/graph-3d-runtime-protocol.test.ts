import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpGraph3DRuntimeFrame,
  KP_GRAPH_3D_RUNTIME_PROTOCOL_SCHEMA,
  KP_GRAPH_3D_VISUAL_ROLES,
  kpGraph3DRuntimeProtocolContract,
  type KpGraph3DRendererPort,
  type KpGraph3DRendererSession,
  type KpGraph3DRuntimeFrame,
  type KpGraph3DVisibility
} from "../src/rendering/graph-3d-runtime-protocol.ts";

interface TestScene {
  readonly endpoint: "mesh" | "donut";
}

const roles = Object.freeze({
  background: { color: "surface.background", opacity: 1, apparentWidth: 0 },
  axis: { color: "line.axis", opacity: 1, apparentWidth: 1 },
  "axis-occluded": {
    color: "line.axis-occluded",
    opacity: 0.45,
    apparentWidth: 1
  },
  surface: { color: "surface.fill", opacity: 1, apparentWidth: 0 },
  "surface-grid": { color: "surface.grid", opacity: 1, apparentWidth: 1 },
  "surface-border": {
    color: "surface.border",
    opacity: 1,
    apparentWidth: 1
  },
  shadow: { color: "surface.shadow", opacity: 0.2, apparentWidth: 0 }
});

function frame(input: {
  readonly direction: "forward" | "rewind";
  readonly requestedProgress: number;
  readonly visualProgress: number;
}): KpGraph3DRuntimeFrame<TestScene> {
  return createKpGraph3DRuntimeFrame({
    identity: {
      animationId: "animation.graph.surface-mode.mesh-to-donut",
      frameId: `frame-${input.direction}-${input.requestedProgress}`,
      graphId: "saddle-orbit-graph"
    },
    clock: input,
    stage: {
      width: 640,
      height: 480,
      anchors: {
        plotOrigin: [320, 240],
        cameraTarget: [0, 0, 0]
      }
    },
    camera: {
      projection: "orthographic",
      azimuthDegrees: 35,
      elevationDegrees: 24,
      scale: 42
    },
    theme: { id: "kp.graph.midnight.v1", roles },
    scene: {
      source: { endpoint: "mesh" },
      target: { endpoint: "donut" }
    },
    accessibility: {
      description: "Saddle surface: mesh to donut, 37 percent complete."
    }
  });
}

test("Graph3D protocol freezes the minimal renderer-neutral authority boundary", () => {
  assert.deepEqual(kpGraph3DRuntimeProtocolContract, {
    schemaVersion: KP_GRAPH_3D_RUNTIME_PROTOCOL_SCHEMA,
    semanticAuthority: "caller-projected-frame",
    scenePayload: "opaque-to-protocol",
    clockAuthority: "host-shared-clock",
    coordinateSpace: "stage-local",
    cameraPolicy: "explicit-orthographic-state",
    themePolicy: "resolved-visual-role-values",
    rendererOwnership: "separate-static-and-interactive-ports",
    lifecycle: "mount-apply-visibility-dispose"
  });
  assert.deepEqual(KP_GRAPH_3D_VISUAL_ROLES, [
    "background",
    "axis",
    "axis-occluded",
    "surface",
    "surface-grid",
    "surface-border",
    "shadow"
  ]);
});

test("direct seek and rewind share one host clock without protocol timing", () => {
  const forward = frame({
    direction: "forward",
    requestedProgress: 0.37,
    visualProgress: 0.37
  });
  const rewind = frame({
    direction: "rewind",
    requestedProgress: 0.63,
    visualProgress: 0.37
  });

  assert.equal(forward.clock.authority, "host");
  assert.equal(rewind.clock.authority, "host");
  assert.equal(forward.clock.visualProgress, rewind.clock.visualProgress);
  assert.equal(forward.scene.source.endpoint, "mesh");
  assert.equal(forward.scene.target.endpoint, "donut");
  assert.equal(forward.stage.coordinateSpace, "stage-local");
  assert.equal(Object.isFrozen(forward), true);
  assert.equal(Object.isFrozen(forward.theme.roles["surface-grid"]), true);
});

test("invalid progress, anchors, camera, and resolved roles fail closed", () => {
  const valid = frame({
    direction: "forward",
    requestedProgress: 0.5,
    visualProgress: 0.5
  });
  const base = {
    identity: valid.identity,
    clock: {
      direction: valid.clock.direction,
      requestedProgress: valid.clock.requestedProgress,
      visualProgress: valid.clock.visualProgress
    },
    stage: {
      width: valid.stage.width,
      height: valid.stage.height,
      anchors: valid.stage.anchors
    },
    camera: valid.camera,
    theme: valid.theme,
    scene: valid.scene,
    accessibility: valid.accessibility
  };

  assert.throws(
    () => createKpGraph3DRuntimeFrame({
      ...base,
      clock: { ...base.clock, visualProgress: 1.01 }
    }),
    /closed unit interval/
  );
  assert.throws(
    () => createKpGraph3DRuntimeFrame({
      ...base,
      stage: { ...base.stage, width: 0 }
    }),
    /stage.width must be positive/
  );
  assert.throws(
    () => createKpGraph3DRuntimeFrame({
      ...base,
      camera: { ...base.camera, scale: Number.NaN }
    }),
    /camera.scale must be finite/
  );
  assert.throws(
    () => createKpGraph3DRuntimeFrame({
      ...base,
      theme: {
        ...base.theme,
        roles: {
          ...base.theme.roles,
          shadow: { ...base.theme.roles.shadow, opacity: -0.1 }
        }
      }
    }),
    /theme.roles.shadow.opacity must be in the closed unit interval/
  );
});

test("static and interactive ports share frames but retain separate lifecycles", () => {
  const mountedKinds: string[] = [];
  const visibility: KpGraph3DVisibility[] = [];
  const applied: KpGraph3DRuntimeFrame<TestScene>[] = [];
  const makePort = (
    kind: "static" | "interactive"
  ): KpGraph3DRendererPort<object, TestScene> => ({
    kind,
    mount(input) {
      let disposed = false;
      mountedKinds.push(kind);
      visibility.push(input.visibility);
      const session: KpGraph3DRendererSession<TestScene> = {
        kind,
        get status() {
          return disposed ? "disposed" as const : "mounted" as const;
        },
        apply(next) {
          applied.push(next);
        },
        setVisibility(next) {
          visibility.push(next);
        },
        dispose() {
          disposed = true;
        }
      };
      return session;
    }
  });
  const current = frame({
    direction: "forward",
    requestedProgress: 0.37,
    visualProgress: 0.37
  });
  const staticSession = makePort("static").mount({
    surface: {},
    frame: current,
    visibility: "near"
  });
  const interactiveSession = makePort("interactive").mount({
    surface: {},
    frame: current,
    visibility: "visible"
  });

  interactiveSession.apply(current);
  interactiveSession.setVisibility("offscreen");
  staticSession.dispose();
  assert.deepEqual(mountedKinds, ["static", "interactive"]);
  assert.deepEqual(visibility, ["near", "visible", "offscreen"]);
  assert.equal(applied[0], current);
  assert.equal(staticSession.status, "disposed");
  assert.equal(interactiveSession.status, "mounted");
});

test("protocol source has no backend, DOM, framework, domain, or Graph2D dependency", () => {
  const source = readFileSync(
    new URL("../src/rendering/graph-3d-runtime-protocol.ts", import.meta.url),
    "utf8"
  );

  assert.equal(source.match(/^import /gm), null);
  assert.doesNotMatch(
    source,
    /(?:three|webgl|svg|HTMLElement|canvas|svelte|\.\.\/animation|\.\.\/editor|graph-2d)/i
  );
});
