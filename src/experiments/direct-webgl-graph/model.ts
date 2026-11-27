import { createSaddleProjection, SURFACE_SAMPLES } from "../../animation-player/geometry.ts";
import {
  createAxis3DObject, createGraph3DObject, createSaddleSurface3D,
  type GraphPoint3D, type GraphSceneObject
} from "../../semantic/graph.ts";
import { projectGraphPoints3DToWebGLScreen } from "../../rendering/graph-webgl.ts";
import { INITIAL_SECTION, resolveSectionFrame, validateSection, type SectionState } from "./section.ts";

export type GraphExample = "grid" | "saddle" | "section";
export interface PilotView {
  readonly example: GraphExample;
  readonly denominator: number;
  readonly azimuth: number;
  readonly elevation: number;
  readonly lit: boolean;
  readonly mesh: boolean;
  readonly planes: boolean;
  readonly section: SectionState;
}
export const INITIAL_VIEW: PilotView = Object.freeze({
  example: "saddle", denominator: 4, azimuth: 48, elevation: 28,
  lit: true, mesh: true, planes: false, section: INITIAL_SECTION
});
export { SURFACE_SAMPLES } from "../../animation-player/geometry.ts";
export const GRAPH_ID = "direct-webgl-graph-pilot";

export function validateView(view: PilotView): void {
  validateSection(view.section);
  if ((view.example !== "grid" && view.example !== "saddle" && view.example !== "section") ||
    !Number.isFinite(view.denominator) || view.denominator < 4 || view.denominator > 8 ||
    !Number.isFinite(view.azimuth) || !Number.isFinite(view.elevation) ||
    Math.abs(view.elevation) > 75 || typeof view.lit !== "boolean" || typeof view.mesh !== "boolean" || typeof view.planes !== "boolean") {
    throw new Error("The grid/saddle pilot requires finite camera values, elevation ±75° and denominator 4–8.");
  }
}

export function createPilotGraph(view: PilotView, width: number, height: number) {
  validateView(view);
  if (![width, height].every((value) => Number.isFinite(value) && value > 0 && value <= 8192)) {
    throw new Error("Graph viewport dimensions must be positive and at most 8192px.");
  }
  const camera = view.example === "section" ? resolveSectionFrame(view.section, view).camera : view;
  return createGraph3DObject({
    id: GRAPH_ID, label: "Coordinate grid and saddle", xAxisId: `${GRAPH_ID}:x`,
    yAxisId: `${GRAPH_ID}:y`, zAxisId: `${GRAPH_ID}:z`,
    xDomain: [-3, 3], yDomain: [-3, 3], zDomain: [-3, 3],
    width, height, surfaceMode: "mesh", surfaceQuality: "balanced",
    camera: {
      azimuthDegrees: camera.azimuth, elevationDegrees: camera.elevation,
      origin: [width / 2, height / 2], scale: Math.min(width, height) / 9.3
    }
  });
}

export function createPilotObjects(view: PilotView, width: number, height: number): readonly GraphSceneObject[] {
  const graph = createPilotGraph(view, width, height);
  const axes = (["x", "y", "z"] as const).map((orientation) => createAxis3DObject({
    id: `${GRAPH_ID}:${orientation}`, graphId: GRAPH_ID, label: orientation,
    orientation, domain: [-3, 3], tickStep: 1
  }));
  return [graph, ...axes, ...(view.example === "grid" ? [] : [createSaddleSurface3D({
    id: `${GRAPH_ID}:saddle`, graphId: GRAPH_ID, denominator: view.denominator,
    xDomain: [-3, 3], yDomain: [-3, 3], xSampleCount: SURFACE_SAMPLES, ySampleCount: SURFACE_SAMPLES
  })])];
}

export { createGridGeometry, createSaddleGeometry } from "../../animation-player/geometry.ts";

export function createPilotProjection(view: PilotView, width: number, height: number) {
  return createSaddleProjection(createPilotGraph(view, width, height));
}

export function projectPilotLabels(view: PilotView, width: number, height: number) {
  const points: readonly GraphPoint3D[] = view.example === "section"
    ? [{ x: 3.55, y: view.section.y, z: 0 }, { x: -2.6, y: view.section.y, z: 3.45 }, { x: 0, y: view.section.y, z: 3.55 }]
    : [{ x: 3.65, y: 0, z: 0 }, { x: 0, y: 3.65, z: 0 }, { x: 0, y: 0, z: 3.65 }];
  return projectGraphPoints3DToWebGLScreen(createPilotGraph(view, width, height), points);
}
