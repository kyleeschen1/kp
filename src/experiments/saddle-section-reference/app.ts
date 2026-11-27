import { mountSaddleSection, prepareSaddleSection, readSaddleSectionSource, describeSaddleSection,
  type SaddleSectionPlayer, type SaddleColors } from "../../animation-player/public-api.ts";
import { readReferenceState, type ReferenceOccurrence } from "./state.ts";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `<nav><a href="/experiments/direct-webgl-graph/?example=section">Original experiment</a><button id="theme">Dark theme</button></nav>
  <h1>What remains when we fix one coordinate?</h1>
  <p>On the saddle z = (x² − y²) / d, fixing y = c selects a parabola. Turn toward its plane: the surrounding surface retreats, while the same red curve remains.</p>
  <p class="hint">Two independent copies of the same starting saddle. Edit either copy, inspect its section, then return to its saved camera. This URL retains both copies and their views.</p>
  <p id="error" role="alert"></p><div class="references"></div>`;
export const players: SaddleSectionPlayer[] = [];
const restored = readReferenceState(new URL(location.href).searchParams.get("sections"));
function colors(): SaddleColors {
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
let saveTimer: ReturnType<typeof setTimeout> | undefined;
function save() {
  if (players.length !== 2) return;
  const url = new URL(location.href);
  url.searchParams.set("sections", JSON.stringify(players.map(player => { const { source, view } = player.snapshot(); return { source, view }; })));
  history.replaceState(null, "", url);
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 180); }
function addOccurrence(occurrence: ReferenceOccurrence, index: number) {
  const card = document.createElement("section"); card.dataset["occurrence"] = String(index);
  card.innerHTML = `<h2>Section ${index + 1}</h2>
    <div class="controls"><label>Denominator d <input data-denominator type="number" min="4" max="8" step="any"></label>
      <label>Plane c <input data-y type="number" min="-3" max="3" step="any"></label></div>
    <p data-equation></p><div class="stage" tabindex="0" aria-label="Section view; arrow keys rotate the saved camera"></div>
    <div class="controls"><button data-inspect>Inspect in 2D</button><button data-return>Return to 3D</button><button data-pause>Pause</button></div>
    <label class="scrub">Spatial to planar <input data-scrub type="range" min="0" max="1" step="0.001"></label>
    <p data-status class="hint"></p><p data-error role="alert"></p>
    <details><summary>Source and view</summary><pre data-source></pre><button data-remount>Remount this view</button></details>`;
  app.querySelector(".references")!.append(card);
  const get = <T extends HTMLElement>(selector: string) => card.querySelector<T>(selector)!;
  const d = get<HTMLInputElement>("[data-denominator]"), y = get<HTMLInputElement>("[data-y]"), scrub = get<HTMLInputElement>("[data-scrub]"), stage = get(".stage");
  d.value = String(occurrence.source.denominator); y.value = String(occurrence.source.y);
  const mount = (state: ReferenceOccurrence) => mountSaddleSection(stage, { section: prepareSaddleSection(state.source), view: state.view, colors: colors(),
    onChange(snapshot) {
      scrub.value = String(snapshot.view.inspection);
      get("[data-equation]").textContent = describeSaddleSection(snapshot.source);
      get("[data-status]").textContent = snapshot.view.inspection === 1 ? "The section in its own x/z coordinates." : snapshot.status === "playing" ? "Following the same section." : "Arrow keys on the graph rotate the saved 3D camera.";
      // Persist only after a quiet interval; neither history nor source serialization is a frame-loop owner.
      scheduleSave();
    } });
  let player = mount(occurrence); players[index] = player;
  const showSource = () => { const { source, view } = player.snapshot(); get("[data-source]").textContent = JSON.stringify({ source, view }, null, 2); };
  card.querySelector("details")!.addEventListener("toggle", showSource);
  const edit = () => {
    const admitted = readSaddleSectionSource({ ...player.snapshot().source, denominator: d.valueAsNumber, y: y.valueAsNumber });
    get("[data-error]").textContent = admitted.status === "ready" ? "" : admitted.message;
    if (admitted.status === "ready") { player.updateSource(prepareSaddleSection(admitted.value)); showSource(); }
  };
  d.addEventListener("input", edit); y.addEventListener("input", edit);
  get("[data-inspect]").addEventListener("click", () => player.play("forward"));
  get("[data-return]").addEventListener("click", () => player.play("rewind"));
  get("[data-pause]").addEventListener("click", () => player.pause());
  scrub.addEventListener("input", () => player.seek(scrub.valueAsNumber));
  stage.addEventListener("keydown", event => {
    const shifts: Record<string, readonly [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] };
    const shift = shifts[event.key]; if (!shift) return; event.preventDefault();
    const view = player.snapshot().view; player.setCamera(view.azimuth + shift[0], Math.max(-75, Math.min(75, view.elevation + shift[1])));
  });
  get("[data-remount]").addEventListener("click", () => { const { source, view } = player.snapshot(); player.dispose(); player = mount({ source, view }); players[index] = player; });
}
if (restored.status === "ready") restored.occurrences.forEach(addOccurrence);
else {
  document.querySelector("#error")!.textContent = `${restored.message} No substituted source was loaded. Remove the sections parameter to open the starting example.`;
}
document.querySelector("#theme")!.addEventListener("click", () => {
  const dark = document.documentElement.dataset["kpTheme"] !== "dark";
  document.documentElement.dataset["kpTheme"] = dark ? "dark" : "light";
  document.querySelector("#theme")!.textContent = dark ? "Light theme" : "Dark theme";
  const palette = colors(); for (const player of players) player.setColors(palette);
});
const pagehide = () => { clearTimeout(saveTimer); save(); for (const player of players) player.pause(); clearTimeout(saveTimer); };
const dispose = () => { clearTimeout(saveTimer); save(); window.removeEventListener("pagehide", pagehide); for (const player of players) player.dispose(); };
window.addEventListener("pagehide", pagehide);
import.meta.hot?.dispose(dispose);
