import type { SaddleColors } from "../../animation-player/public-api.ts";
export function sectionReferenceColors(): SaddleColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): readonly [number, number, number] => {
    const raw = style.getPropertyValue(name).trim();
    if (!/^#[0-9a-f]{6}$/i.test(raw)) throw new Error(`Expected palette color ${name}.`);
    return [parseInt(raw.slice(1, 3), 16) / 255, parseInt(raw.slice(3, 5), 16) / 255, parseInt(raw.slice(5, 7), 16) / 255];
  };
  const background = read("--color-paper"), accent = read("--color-green-light");
  return { background, surface: [accent[0] * .68 + background[0] * .32, accent[1] * .68 + background[1] * .32, accent[2] * .68 + background[2] * .32],
    ink: read("--color-ink"), grid: read("--color-muted"), x: read("--color-red-light"), y: read("--color-blue-light"),
    z: read("--color-yellow-light"), section: read("--color-red-light"), plane: read("--color-blue-light") };
}
