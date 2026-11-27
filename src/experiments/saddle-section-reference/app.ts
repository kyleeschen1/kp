import { mountSaddleSection, prepareSaddleSection, readSaddleSectionSource, describeSaddleSection,
  type SaddleSectionPlayer } from "../../animation-player/public-api.ts";
import { readReferenceState, type ReferenceOccurrence } from "./state.ts";
import { sectionReferenceColors as colors } from "./theme.ts";
import { installSectionDetours } from "./navigation.ts";
import "./style.css";

document.documentElement.dataset["kpTheme"] = new URL(location.href).searchParams.get("theme") === "dark" ? "dark" : "light";
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = `<nav><a href="/experiments/direct-webgl-graph/?example=section">Original experiment</a><button id="theme">Dark theme</button></nav>
  <h1>What remains when we fix one coordinate?</h1>
  <p>On the saddle z = (x² − y²) / d, fixing y = c selects a parabola. Turn toward its plane: the surrounding surface retreats, while the same red curve remains.</p>
  <p class="hint">Two independent copies of the same starting saddle. Edit either copy, inspect its section, then return to its saved camera. This URL retains both copies and their views.</p>
  <p id="error" role="alert"></p><div class="references"></div>`;
export const players: SaddleSectionPlayer[] = [];
const restored = readReferenceState(new URL(location.href).searchParams.get("sections"));
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
const removeDetours = players.length === 2 ? installSectionDetours(app, players) : () => {};
document.querySelector("#theme")!.textContent = document.documentElement.dataset["kpTheme"] === "dark" ? "Light theme" : "Dark theme";
document.querySelector("#theme")!.addEventListener("click", () => {
  const dark = document.documentElement.dataset["kpTheme"] !== "dark";
  document.documentElement.dataset["kpTheme"] = dark ? "dark" : "light";
  document.querySelector("#theme")!.textContent = dark ? "Light theme" : "Dark theme";
  const palette = colors(); for (const player of players) player.setColors(palette);
});
let left = false;
const pagehide = () => { if (left) return; clearTimeout(saveTimer); save(); left = true; removeDetours(); for (const player of players) player.dispose(); };
// A frozen history document must not retain GPU leases while its question is open.
// Its URL is the complete restore authority, including when the browser uses BFCache.
const pageshow = (event: PageTransitionEvent) => { if (event.persisted && left) location.reload(); };
const dispose = () => { pagehide(); window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow); };
window.addEventListener("pagehide", pagehide);
window.addEventListener("pageshow", pageshow);
import.meta.hot?.dispose(dispose);
