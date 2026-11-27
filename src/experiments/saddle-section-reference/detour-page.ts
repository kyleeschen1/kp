import { mountSaddleSection, prepareSaddleSection, describeSaddleSection, type SaddleSectionPlayer } from "../../animation-player/public-api.ts";
import { parseSectionContext, readSectionDetour, sectionReturnHref, type SectionDetour } from "./detour-state.ts";
import { sectionReferenceColors } from "./theme.ts";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!, url = new URL(location.href);
let theme: "light" | "dark" = url.searchParams.get("theme") === "dark" ? "dark" : "light";
document.documentElement.dataset["kpTheme"] = theme;
history.scrollRestoration = "auto";
const initial = url.searchParams.getAll("context").length === 1 ? parseSectionContext(url.searchParams.get("context")) : parseSectionContext(null);
let current: SectionDetour | undefined, player: SaddleSectionPlayer | undefined, left = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
function save() {
  clearTimeout(saveTimer); if (!current || left) return;
  const url = new URL(location.href); url.searchParams.set("context", JSON.stringify(current)); url.searchParams.set("theme", theme);
  history.replaceState(null, "", url);
}
function update(next: SectionDetour) {
  const admitted = readSectionDetour(next); if (admitted.status !== "ready") throw new Error(admitted.message);
  current = admitted.value; save(); refresh();
}
function refresh() {
  if (!current) return;
  const source = current.origin[current.returnTo.slot]!.source, revealed = current.prediction.status === "revealed";
  app.querySelector<HTMLElement>("[data-answer]")!.hidden = !revealed;
  app.querySelector<HTMLElement>("[data-comparison]")!.hidden = !revealed;
  app.querySelector<HTMLButtonElement>("[data-reveal]")!.hidden = revealed;
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-choice]")) {
    button.disabled = revealed; button.setAttribute("aria-pressed", String(button.dataset["choice"] === current.prediction.choice));
  }
  app.querySelector("[data-prediction]")!.textContent = current.prediction.choice === null ? "No prediction recorded." : `Your prediction: ${current.prediction.choice === "same" ? "the same curve" : current.prediction.choice === "different" ? "a different curve" : "unsure"}.`;
  app.querySelectorAll<HTMLAnchorElement>("[data-back]").forEach(link => { link.href = sectionReturnHref(current!, theme); });
  app.querySelector("[data-answer]")!.textContent = `The x/z curve is the same. Fixing y substitutes one number for y, so every point obeys z = (x² − c²) / d. Replacing c by −c leaves its square unchanged: (−c)² = c². Thus every x gives the same z. ${source.y === 0 ? "Here c = 0, so the two planes also coincide." : `The planes y = ${source.y} and y = ${-source.y} are different places in 3D. Equal x/z coordinates do not make their points identical in space.`}`;
  app.querySelector<HTMLButtonElement>("[data-compare]")!.textContent = current.comparison === "original" ? `Compare y = ${-source.y}` : `Compare y = ${source.y}`;
}
if (initial.status !== "ready") {
  const error = document.createElement("p"); error.setAttribute("role", "alert"); error.textContent = initial.message;
  const home = document.createElement("a"); home.href = "/experiments/saddle-section-reference/"; home.textContent = "Open the section reference";
  app.append(error, home);
} else {
  current = initial.value;
  const source = current.origin[current.returnTo.slot]!.source;
  app.innerHTML = `<nav><a data-back>Return to Section ${current.returnTo.slot + 1}</a><button data-theme>${theme === "dark" ? "Light" : "Dark"} theme</button></nav>
    <p class="hint">A question about your selected curve. Your two source copies and their views are saved for return.</p>
    <h1>What changes on the opposite side?</h1><p data-prompt></p>
    <p>Compare the curves in their own x/z coordinates. Keep the denominator fixed.</p>
    <div class="controls" aria-label="Make a prediction"><button data-choice="same">Same curve</button><button data-choice="different">Different curve</button><button data-choice="unsure">Unsure</button></div>
    <p data-prediction class="hint"></p><button data-reveal>Reveal the reasoning</button>
    <p data-answer hidden></p><section data-comparison hidden aria-label="Compare the section planes">
      <p data-equation></p><div class="stage"></div><div class="controls"><button data-compare></button><button data-spatial>See in 3D</button><button data-planar>Inspect in 2D</button><button data-pause>Pause</button></div>
      <p class="hint">Head-on, the curves coincide. In 3D, inspect the plane label to distinguish where the section lies.</p></section>
    <p><a data-back>Return to your saved view</a></p>`;
  app.querySelector("[data-prompt]")!.textContent = `Your plane is y = ${source.y}, with d = ${source.denominator}. If it moves to y = ${-source.y}, will its parabola have the same x/z curve or a different one?`;
  function ensurePlayer() {
    if (!current || current.prediction.status !== "revealed" || player) return;
    const source = current.origin[current.returnTo.slot]!.source;
    player = mountSaddleSection(app.querySelector<HTMLElement>(".stage")!, {
      section: prepareSaddleSection({ ...source, y: current.comparison === "opposite" ? -source.y : source.y }), view: current.view,
      colors: sectionReferenceColors(), onChange(snapshot) {
        if (!current || left) return;
        current = { ...current, view: snapshot.view };
        app.querySelector("[data-equation]")!.textContent = describeSaddleSection(snapshot.source);
        clearTimeout(saveTimer); saveTimer = setTimeout(save, 180);
      }
    });
  }
  app.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach(button => button.addEventListener("click", () => {
    const choice = button.dataset["choice"];
    if (current && current.prediction.status === "pending" && (choice === "same" || choice === "different" || choice === "unsure"))
      update({ ...current, prediction: { status: "pending", choice } });
  }));
  app.querySelector("[data-reveal]")!.addEventListener("click", () => { if (!current) return;
    update({ ...current, prediction: { status: "revealed", choice: current.prediction.choice } }); ensurePlayer(); });
  app.querySelector("[data-compare]")!.addEventListener("click", () => { if (!current || !player) return;
    update({ ...current, comparison: current.comparison === "original" ? "opposite" : "original" });
    player.updateSource(prepareSaddleSection({ ...source, y: current.comparison === "opposite" ? -source.y : source.y })); });
  app.querySelector("[data-spatial]")!.addEventListener("click", () => player?.play("rewind"));
  app.querySelector("[data-planar]")!.addEventListener("click", () => player?.play("forward"));
  app.querySelector("[data-pause]")!.addEventListener("click", () => player?.pause());
  app.querySelector("[data-theme]")!.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset["kpTheme"] = theme; app.querySelector("[data-theme]")!.textContent = `${theme === "dark" ? "Light" : "Dark"} theme`;
    player?.setColors(sectionReferenceColors()); save(); refresh(); });
  refresh(); ensurePlayer();
}
const pagehide = () => { if (left) return; save(); left = true; player?.dispose(); };
const pageshow = (event: PageTransitionEvent) => { if (event.persisted && left) location.reload(); };
window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow);
import.meta.hot?.dispose(() => { pagehide(); window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow); });
