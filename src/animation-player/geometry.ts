import { evaluateSaddleSurface, evaluateSaddleSurfaceGradient } from "../math/surface-examples.ts";
import { projectGraphPoints3DToWebGLScreen } from "../rendering/graph-webgl.ts";
import type { Graph3DObject } from "../semantic/graph.ts";

export const SURFACE_SAMPLES = 97;

/** Sample the domain owner once. The saddle family is linear in 1/d, so its
 * retained heights AND gradients can be scaled together without another evaluator. */
export function createSaddleGeometry(samples = SURFACE_SAMPLES) {
  if (!Number.isInteger(samples) || samples < 3 || samples > 129) throw new Error("Surface samples must be 3–129.");
  const vertices = new Float32Array(samples * samples * 5);
  for (let row = 0; row < samples; row += 1) {
    for (let col = 0; col < samples; col += 1) {
      const x = -3 + col * 6 / (samples - 1);
      const y = -3 + row * 6 / (samples - 1);
      const gradient = evaluateSaddleSurfaceGradient({ x, y });
      vertices.set([x, y, evaluateSaddleSurface({ x, y }), gradient.dx, gradient.dy], (row * samples + col) * 5);
    }
  }
  const indices = new Uint16Array((samples - 1) ** 2 * 6);
  let offset = 0;
  for (let row = 0; row < samples - 1; row += 1) {
    for (let col = 0; col < samples - 1; col += 1) {
      const a = row * samples + col, b = a + 1, c = a + samples, d = c + 1;
      indices.set([a, b, c, b, d, c], offset);
      offset += 6;
    }
  }
  return { vertices, indices, vertexCount: samples * samples };
}

export function createGridGeometry(): Float32Array {
  const lines: number[] = [];
  const add = (a: readonly number[], b: readonly number[], role: number) => lines.push(...a, ...b, role);
  for (let n = -3; n <= 3; n += 1) {
    if (n === 0) continue; // Axes own the origin lines; no coincident ink.
    add([-3, n, 0], [3, n, 0], 0); add([n, -3, 0], [n, 3, 0], 0);
    add([-3, 0, n], [3, 0, n], 0); add([n, 0, -3], [n, 0, 3], 0);
    add([0, -3, n], [0, 3, n], 0); add([0, n, -3], [0, n, 3], 0);
  }
  add([-3.35, 0, 0], [3.35, 0, 0], 1);
  add([0, -3.35, 0], [0, 3.35, 0], 2);
  add([0, 0, -3.35], [0, 0, 3.35], 3);
  return new Float32Array(lines);
}

/** Derive the GPU's orthographic matrix from the existing projector. Its camera
 * convention (math z maps to world up) therefore cannot drift between adapters. */
export function createSaddleProjection(graph: Graph3DObject) {
  const { width, height } = graph;
  const basis = projectGraphPoints3DToWebGLScreen(graph, [
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }
  ]);
  const clip = basis.map((point) => [2 * point.x / width - 1, 1 - 2 * point.y / height, -point.depth / 40]);
  const origin = clip[0]!;
  const matrix = new Float32Array(16);
  for (let axis = 0; axis < 3; axis += 1) {
    for (let component = 0; component < 3; component += 1) {
      matrix[axis * 4 + component] = clip[axis + 1]![component]! - origin[component]!;
    }
  }
  matrix.set([...origin, 1], 12);
  const eye = [0, 1, 2].map((axis) => -matrix[axis * 4 + 2]! * 40);
  return { graph, matrix, eye };
}
