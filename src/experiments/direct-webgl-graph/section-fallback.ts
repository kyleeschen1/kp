import { sectionFallback } from "../../animation-player/section-projection.ts";
import { createPilotGraph, type PilotView } from "./model.ts";
import { resolveSectionFrame } from "./section.ts";

export function renderSectionFallback(view: PilotView, width: number, height: number): string {
  return sectionFallback(createPilotGraph(view, width, height), view.section.y, view.denominator,
    resolveSectionFrame(view.section, view).heightOffset);
}
