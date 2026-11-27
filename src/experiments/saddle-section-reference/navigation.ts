import type { SaddleSectionPlayer } from "../../animation-player/public-api.ts";
import { createSectionDetour, readSectionReturnPoint, sectionReturnHref } from "./detour-state.ts";

/** One bounded question borrows a snapshot; it never writes back into its origin. */
export function installSectionDetours(app: HTMLElement, players: readonly SaddleSectionPlayer[]) {
  let disposed = false;
  const removers: (() => void)[] = [];
  players.forEach((_player, slot) => {
    if (slot !== 0 && slot !== 1) throw new Error("The reference has exactly two source copies.");
    const card = app.querySelector<HTMLElement>(`[data-occurrence="${slot}"]`)!, stage = card.querySelector<HTMLElement>(".stage")!;
    card.id = `section-${slot + 1}`;
    const button = document.createElement("button"); button.dataset["detour"] = "opposite-plane";
    button.textContent = "What if the plane moves to the other side?";
    card.querySelector("[data-status]")!.after(button);
    const open = () => {
      if ([...app.querySelectorAll("[data-error]")].some(node => node.textContent)) {
        app.querySelector("#error")!.textContent = "Fix invalid parameter values before opening a question; your current source views are unchanged.";
        return;
      }
      players.forEach(p => p.pause());
      const origin = players.map(p => { const { source, view } = p.snapshot(); return { source, view }; });
      const expanded = (index: number) => app.querySelector<HTMLDetailsElement>(`[data-occurrence="${index}"] details`)!.open;
      const context = createSectionDetour(origin, { slot, sourceId: origin[slot]!.source.id, object: "section-curve", offset: stage.getBoundingClientRect().top,
        expanded: [expanded(0), expanded(1)] });
      const theme = document.documentElement.dataset["kpTheme"] === "dark" ? "dark" : "light";
      // Pin the history entry as well as the explicit return link, so browser Back has the same meaning.
      history.replaceState(null, "", sectionReturnHref(context, theme));
      location.assign(`/experiments/saddle-section-reference/why/?${new URLSearchParams({ context: JSON.stringify(context), theme })}`);
    };
    button.addEventListener("click", open); removers.push(() => button.removeEventListener("click", open));
  });
  const url = new URL(location.href), raw = url.searchParams.get("returnPoint");
  if (raw !== null) {
    const restore = async () => {
      try {
        if (raw.length > 1000) throw new Error("Oversized return point.");
        const origin = players.map(p => { const { source, view } = p.snapshot(); return { source, view }; });
        const point = readSectionReturnPoint(JSON.parse(raw), origin);
        if (point.status !== "ready") throw new Error(point.message);
        // Disclosure height is part of return geometry; without it native scrolling may clamp early.
        point.value.expanded.forEach((expanded, index) => { app.querySelector<HTMLDetailsElement>(`[data-occurrence="${index}"] details`)!.open = expanded; });
        history.scrollRestoration = "manual";
        let interrupted = false;
        const release = () => {
          interrupted = true; history.scrollRestoration = "auto";
          const settled = new URL(location.href); settled.searchParams.delete("returnPoint"); settled.hash = "";
          history.replaceState(null, "", settled);
        };
        for (const event of ["pointerdown", "keydown", "wheel", "touchstart"]) {
          window.addEventListener(event, release, { once: true, passive: true });
          removers.push(() => window.removeEventListener(event, release));
        }
        await document.fonts.ready;
        if (document.readyState !== "complete") await new Promise<void>(resolve => window.addEventListener("load", () => resolve(), { once: true }));
        if (disposed || interrupted) return;
        const card = app.querySelector<HTMLElement>(`[data-occurrence="${point.value.slot}"]`)!, stage = card.querySelector<HTMLElement>(".stage")!;
        const button = card.querySelector<HTMLButtonElement>("[data-detour]")!;
        window.scrollTo({ top: window.scrollY + stage.getBoundingClientRect().top - point.value.offset, behavior: "instant" });
        button.focus({ preventScroll: true });
        // Keep the pin for reload/Back/Forward until an intentional interaction resumes ordinary browsing.
      } catch (error) { app.querySelector("#error")!.textContent = error instanceof Error ? error.message : "Invalid return point."; }
    };
    void restore();
  } else history.scrollRestoration = "auto";
  return () => { disposed = true; removers.forEach(remove => remove()); };
}
