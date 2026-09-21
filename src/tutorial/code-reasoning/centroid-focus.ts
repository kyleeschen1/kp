import { centroidMotionReading, centroidMotionThought } from "./centroid-motion-reading.ts";
import { mountCodeFocus } from "./code-focus.ts";

export function mountCentroidFocus(root: HTMLElement, stage: HTMLElement, host: Parameters<typeof mountCodeFocus>[2]) {
  const card = root.querySelector<HTMLElement>(".centroid-focus-card");
  const slot = root.querySelector<HTMLElement>("[data-centroid-card-slot]");
  const note = root.querySelector<HTMLElement>("[data-centroid-card-fit-note]");
  if (!card || !slot || !note) throw new Error("Missing centroid focus scaffold");
  return mountCodeFocus(root, stage, host, { card, slot, note,
    thoughts: centroidMotionReading, thought: centroidMotionThought,
    stops: [0, ...centroidMotionReading.map(thought => thought.position), 1] });
}
