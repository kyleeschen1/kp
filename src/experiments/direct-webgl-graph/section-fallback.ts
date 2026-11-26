import { projectGraphPoints3DToWebGLScreen } from "../../rendering/graph-webgl.ts";
import { createPilotGraph, type PilotView } from "./model.ts";
import { createSectionGeometry, resolveSectionFrame, SECTION_IDS, SECTION_ROLE } from "./section.ts";

const geometry = createSectionGeometry();
/** Static section uses the same projection and retained basis as the GPU. It
 * deliberately omits surface shading; no disconnected or invented 2D sample. */
export function renderSectionFallback(view: PilotView, width: number, height: number): string {
  const graph = createPilotGraph(view, width, height), section = resolveSectionFrame(view.section, view);
  const lines: string[] = [];
  for (let i = 0; i < geometry.length; i += 7) {
    const role = geometry[i + 6]!, isCurve = role === SECTION_ROLE.curve;
    const points = [0, 3].map((offset) => ({ x: geometry[i + offset]!, y: view.section.y,
      z: isCurve ? (geometry[i + offset + 2]! + section.heightOffset) * 4 / view.denominator : geometry[i + offset + 2]! }));
    const [a, b] = projectGraphPoints3DToWebGLScreen(graph, points);
    const color = isCurve ? "var(--graph-section)" : role === SECTION_ROLE.x ? "var(--graph-x)" : role === SECTION_ROLE.z ? "var(--graph-z)" : "var(--graph-grid)";
    lines.push(`<path d="M${a!.x},${a!.y}L${b!.x},${b!.y}" stroke="${color}" stroke-width="${isCurve ? 3 : 1}" opacity="${role === SECTION_ROLE.grid ? .28 : 1}"/>`);
  }
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Static saddle section in its x and z coordinates" data-entity-id="${SECTION_IDS.curve}"><g fill="none" stroke-linecap="round">${lines.join("")}</g></svg>`;
}
