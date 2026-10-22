import { comparisonCardHtml, mountComparisonPlayer } from "./comparison-player.ts";
import { loadComparison, readComparisonCase, type ComparisonSource } from "./comparison-source.ts";
import { comparisonStatic } from "./comparison-view.ts";
import { prepareColumnFonts } from "./fonts.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

export function mountMatrixComparison(root: HTMLElement) {
  let disposed = false, release = () => {};
  const dispose = () => { if (disposed) return; disposed = true; release(); window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
  window.addEventListener("pagehide", pagehide); root.setAttribute("aria-busy", "true");
  // Unlike the numeric column reader, this scene introduces italic u, v and A.
  // Request that actual face before measuring: fonts.ready before insertion
  // cannot wait for a face the document has not requested yet.
  const source = Promise.resolve().then(() => loadComparison(readComparisonCase(new URL(location.href).searchParams)));
  void Promise.all([source, prepareColumnFonts(), document.fonts.load("italic 20px KaTeX_Math")]).then(([source]) => { if (!disposed) release = install(root, source); }).catch(error => {
    if (disposed) return;
    dispose(); root.textContent = String(error); root.setAttribute("aria-busy", "false"); root.dataset["gap"] = "true";
  });
  return dispose;
}

function install(root: HTMLElement, source: ComparisonSource) {
  document.querySelector("h1")!.textContent = source.title; document.title = source.title;
  document.querySelector("#matrix-story > p")!.textContent = source.introduction;
  root.innerHTML = `<nav aria-label="Input comparisons"><a href="?compare=1">A difference disappears</a> · <a href="?compare=1&case=distinguished">A difference survives</a></nav>
    ${comparisonCardHtml(source)}
    <p>For a linear map, applying the map to a difference gives the difference of the outputs:</p>
    <div class="comparison-static">${renderLatexToHtml("A(v-u)=Av-Au", { output: "htmlAndMathml" })}</div>
    <p>${escape(source.conclusion)}</p>
    <p>${escape(source.question)}</p><details><summary>Check your reasoning</summary><p>${escape(source.answer)}</p></details>
    <details><summary>Read the complete comparison</summary><div class="comparison-static">${comparisonStatic(source.relation)}</div></details>`;
  root.dataset["comparison"] = source.relation.kind;
  const last = source.beats.length - 1;
  let restoring = false, disposed = false;
  const read = () => {
    const id = location.hash.slice(1), index = id ? source.beats.findIndex(beat => beat.id === id) : 0;
    if (index < 0) throw new Error("Choose a named comparison step.");
    return index / last;
  };
  const player = mountComparisonPlayer(root, source, read(), progress => {
    if (restoring || !Number.isInteger(progress * last)) return;
    const url = new URL(location.href); url.hash = source.beats[progress * last]!.id;
    if (url.href !== location.href) history.replaceState(null, "", url);
  });
  const restore = () => {
    restoring = true;
    try { player.seek(read()); root.querySelector("[data-location-error]")?.remove(); }
    catch (error) {
      player.pause();
      let alert = root.querySelector<HTMLElement>("[data-location-error]");
      if (!alert) { alert = document.createElement("p"); alert.dataset["locationError"] = "true"; alert.setAttribute("role", "alert"); root.append(alert); }
      alert.textContent = String(error);
    } finally { restoring = false; }
  };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted) { restore(); player.prepare(); } };
  const pagehide = () => player.pause();
  window.addEventListener("hashchange", restore); window.addEventListener("popstate", restore);
  window.addEventListener("pageshow", pageshow); window.addEventListener("pagehide", pagehide);
  root.dataset["ready"] = "true"; root.setAttribute("aria-busy", "false");
  return () => {
    if (disposed) return; disposed = true;
    window.removeEventListener("hashchange", restore); window.removeEventListener("popstate", restore);
    window.removeEventListener("pageshow", pageshow); window.removeEventListener("pagehide", pagehide);
    player.dispose(); delete root.dataset["ready"];
  };
}
