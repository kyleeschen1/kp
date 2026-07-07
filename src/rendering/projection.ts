import type { Graph3DObject, GraphPoint3D } from "../semantic/graph.ts";
import {
  projectedLineAverageDepth,
  type ProjectedGeometryPoint,
  type ProjectedLineSegment
} from "./geometry.ts";

export type ProjectedGraphPoint3D = ProjectedGeometryPoint;

export interface GraphLine3D {
  from: GraphPoint3D;
  to: GraphPoint3D;
}

export interface ProjectedGraphLine3D extends ProjectedLineSegment {
  averageDepth: number;
}

export function projectGraphPoint3D(
  graph: Graph3DObject,
  point: GraphPoint3D
): ProjectedGraphPoint3D {
  const azimuth = degreesToRadians(graph.camera.azimuthDegrees);
  const elevation = degreesToRadians(graph.camera.elevationDegrees);
  const rotatedX = point.x * Math.cos(azimuth) - point.y * Math.sin(azimuth);
  const rotatedY = point.x * Math.sin(azimuth) + point.y * Math.cos(azimuth);
  const [originX, originY] = graph.camera.origin;

  return {
    x: originX + rotatedX * graph.camera.scale,
    y:
      originY +
      (rotatedY * Math.sin(elevation) - point.z * Math.cos(elevation)) *
        graph.camera.scale,
    depth: rotatedY * Math.cos(elevation) + point.z * Math.sin(elevation)
  };
}

export function projectGraphLine3D(
  graph: Graph3DObject,
  line: GraphLine3D
): ProjectedGraphLine3D {
  const projectedLine = {
    from: projectGraphPoint3D(graph, line.from),
    to: projectGraphPoint3D(graph, line.to)
  };

  return {
    ...projectedLine,
    averageDepth: projectedLineAverageDepth(projectedLine)
  };
}

export function graphCameraDirection(graph: Graph3DObject): GraphPoint3D {
  const azimuth = degreesToRadians(graph.camera.azimuthDegrees);
  const elevation = degreesToRadians(graph.camera.elevationDegrees);

  return normalizePoint3D({
    x: Math.sin(azimuth) * Math.cos(elevation),
    y: Math.cos(azimuth) * Math.cos(elevation),
    z: Math.sin(elevation)
  });
}

function normalizePoint3D(point: GraphPoint3D): GraphPoint3D {
  const length = Math.hypot(point.x, point.y, point.z);

  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length
  };
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}
