import assert from "node:assert/strict";
import test from "node:test";
import { Vector3 } from "three";
import { createGraph3DWebGLSceneModel, projectGraphPoint3DToWebGLScreen } from "../src/rendering/graph-webgl.ts";
import { createGraph3DWebGLCamera, createGraph3DWebGLThreeScene } from "../src/rendering/graph-webgl-three.ts";
import { createKpSurfaceContourStageAuthority } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";

test("WebGL scene and SVG overlays use the same sampled origin throughout a fitted camera transition", () => {
  const authority = createKpSurfaceContourStageAuthority();
  for (const progress of [0, .2, .5, .8, 1]) {
    const model = createGraph3DWebGLSceneModel(authority.sceneTopDown, authority.graphTopDown,
      { previousObjects: authority.scene3d, transitionProgress: progress });
    const rendered = createGraph3DWebGLThreeScene(model), camera = createGraph3DWebGLCamera(model.graph, model.camera);
    rendered.scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    for (const point of [{ x: 0, y: 0, z: 0 }, { x: 1, y: .5, z: 1.5 * (1 - progress) }]) {
      const actual = new Vector3(point.x, point.z, point.y).applyMatrix4(rendered.root.matrixWorld).project(camera);
      const expected = projectGraphPoint3DToWebGLScreen(model.graph, point, model.camera);
      assert.ok(Math.abs((actual.x + 1) * model.graph.width / 2 - expected.x) < 1e-8, `x at ${progress}`);
      assert.ok(Math.abs((1 - actual.y) * model.graph.height / 2 - expected.y) < 1e-8, `y at ${progress}`);
    }
    for (const mesh of [...rendered.surfaceMeshes, ...rendered.surfaceMeshLines]) {
      mesh.geometry.dispose(); for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
    }
  }
});
