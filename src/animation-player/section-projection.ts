import { createGraph3DObject } from "../semantic/graph.ts";
import { projectGraphPoints3DToWebGLScreen } from "../rendering/graph-webgl.ts";
import { createSectionGeometry, SECTION_IDS, SECTION_ROLE } from "./section-model.ts";
import type { SectionPlaybackSnapshot } from "./section-playback.ts";
import type { SaddleColors } from "./gpu.ts";

export function sectionGraph(state: SectionPlaybackSnapshot, width: number, height: number) {
  if (![width, height].every(n => Number.isFinite(n) && n > 0 && n <= 8192)) throw new Error("Section viewport must be positive and at most 8192 pixels.");
  return createGraph3DObject({ id: state.source.id, label: "Saddle section", xAxisId: "saddle-section:x",
    yAxisId: "saddle-section:y", zAxisId: "saddle-section:z", xDomain: [-3, 3], yDomain: [-3, 3], zDomain: [-3, 3],
    width, height, surfaceMode: "mesh", surfaceQuality: "balanced", camera: {
      azimuthDegrees: state.frame.camera.azimuth, elevationDegrees: state.frame.camera.elevation,
      origin: [width / 2, height / 2], scale: Math.min(width, height) / 9.3 } });
}
const geometry = createSectionGeometry();
/** Only used when GPU paint is unavailable. Both representations share retained samples and projection. */
export function sectionFallback(graph: ReturnType<typeof createGraph3DObject>, y: number, denominator: number,
  heightOffset: number, colors?: SaddleColors): string {
  const rgb = (value: readonly number[]) => `rgb(${value.map(n => Math.round(n * 255)).join(",")})`;
  const lines: string[] = [];
  for (let i = 0; i < geometry.length; i += 7) {
    const role = geometry[i + 6]!, isCurve = role === SECTION_ROLE.curve;
    const points = [0, 3].map(offset => ({ x: geometry[i + offset]!, y,
      z: isCurve ? (geometry[i + offset + 2]! + heightOffset) * 4 / denominator : geometry[i + offset + 2]! }));
    const [a, b] = projectGraphPoints3DToWebGLScreen(graph, points);
    const key = isCurve ? "section" : role === SECTION_ROLE.x ? "x" : role === SECTION_ROLE.z ? "z" : "grid";
    const color = colors ? rgb(colors[key]) : `var(--graph-${key})`;
    lines.push(`<path d="M${a!.x},${a!.y}L${b!.x},${b!.y}" stroke="${color}" stroke-width="${isCurve ? 3 : 1}" opacity="${role === SECTION_ROLE.grid ? .28 : 1}"/>`);
  }
  return `<svg width="100%" height="100%" viewBox="0 0 ${graph.width} ${graph.height}" role="img" aria-label="Static saddle section in its x and z coordinates" data-entity-id="${SECTION_IDS.curve}"><g fill="none" stroke-linecap="round">${lines.join("")}</g></svg>`;
}
