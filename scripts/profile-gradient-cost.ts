import { readFileSync } from "node:fs";
import { SourceMap } from "node:module";
import { resolve } from "node:path";
import type { CDPSession, Page } from "@playwright/test";

interface CpuProfile {
  readonly nodes: readonly { readonly id: number; readonly children?: readonly number[];
    readonly callFrame: { readonly functionName: string; readonly url: string; readonly lineNumber: number; readonly columnNumber: number } }[];
  readonly samples?: readonly number[];
  readonly timeDeltas?: readonly number[];
}

export function summarizeGradientCpuProfile(profile: CpuProfile, sourceLabel: (frame: CpuProfile["nodes"][number]["callFrame"]) => string) {
  const nodes = new Map(profile.nodes.map(node => [node.id, node]));
  const parents = new Map<number, number>();
  for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child, node.id);
  const self = new Map<string, number>(), inclusive = new Map<string, number>();
  const add = (map: Map<string, number>, key: string, ms: number) => map.set(key, (map.get(key) ?? 0) + ms);
  for (const [index, id] of (profile.samples ?? []).entries()) {
    const ms = (profile.timeDeltas?.[index] ?? 0) / 1000;
    const node = nodes.get(id); if (!node) throw new Error("CPU profile sample has no node.");
    add(self, sourceLabel(node.callFrame), ms);
    const stack = new Set<string>(); let cursor: number | undefined = id;
    while (cursor !== undefined) { const current = nodes.get(cursor); if (!current) break; stack.add(sourceLabel(current.callFrame)); cursor = parents.get(cursor); }
    for (const label of stack) add(inclusive, label, ms);
  }
  const top = (map: Map<string, number>) => [...map].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([location, ms]) => ({ location, ms: Math.round(ms * 100) / 100 }));
  return { samples: profile.samples?.length ?? 0, sampledMs: (profile.timeDeltas ?? []).reduce((n, x) => n + x, 0) / 1000,
    self: top(self), inclusive: top(inclusive) };
}

/** Profiles are separate from the ordinary timing cohort. Local source maps
 * explain generated frames; they are not sent to the browser or shipped policy. */
export async function profileGradientCost(page: Page, cdp: CDPSession, output: string, cpuSlowdown: number, repeat: number) {
  const maps = new Map<string, SourceMap>(), labels = new Map<string, string>();
  const label = (frame: CpuProfile["nodes"][number]["callFrame"]) => {
    if (!frame.url.startsWith("http://localhost:8000/assets/")) return frame.functionName || "(native)";
    const key = `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`;
    const cached = labels.get(key); if (cached) return cached;
    const pathname = new URL(frame.url).pathname.slice(1);
    if (!/^assets\/[A-Za-z0-9._-]+\.js$/.test(pathname)) throw new Error("Unexpected profiled asset path.");
    let map = maps.get(pathname);
    if (!map) {
      map = new SourceMap(JSON.parse(readFileSync(resolve(output, `${pathname}.map`), "utf8")));
      maps.set(pathname, map);
    }
    const origin = map.findOrigin(frame.lineNumber + 1, frame.columnNumber + 1);
    const result = "fileName" in origin ? `${origin.fileName}:${origin.lineNumber} ${origin.name ?? frame.functionName}` : key;
    labels.set(key, result); return result;
  };
  const comparisonStart = await page.locator("[data-kp-focus-deck-beat]").evaluateAll(elements => elements.findIndex(element => element.getAttribute("data-kp-focus-deck-beat") === "components"));
  if (comparisonStart < 0) throw new Error("Canonical comparison beat missing.");
  for (const phase of [{ name: "idle", start: 0, move: false }, { name: "first-transition", start: 0, move: true }, { name: "comparison", start: comparisonStart, move: true }]) {
    await page.locator("[data-kp-focus-deck-scrubber]").evaluate((element, start) => {
      (element as HTMLInputElement).value = String(start); element.dispatchEvent(new Event("input", { bubbles: true }));
    }, phase.start);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await cdp.send("Profiler.enable"); await cdp.send("Profiler.start");
    const before = await cdp.send("Performance.getMetrics");
    const gaps = await page.evaluate(async move => {
      let last = await new Promise<number>(resolve => requestAnimationFrame(resolve)); const start = last, gaps: number[] = [];
      if (move) document.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!.click();
      while (last - start < 2000) { const now = await new Promise<number>(resolve => requestAnimationFrame(resolve)); gaps.push(now - last); last = now; }
      return gaps.sort((a, b) => a - b);
    }, phase.move);
    const after = await cdp.send("Performance.getMetrics");
    const { profile } = await cdp.send("Profiler.stop"); await cdp.send("Profiler.disable");
    const delta = (name: string) => ((after.metrics as {name: string; value: number}[]).find(m => m.name === name)?.value ?? 0) - ((before.metrics as {name: string; value: number}[]).find(m => m.name === name)?.value ?? 0);
    console.log(JSON.stringify({ kind: "cpu-profile", phase: phase.name, cpuSlowdown, repeat,
      scriptMs: delta("ScriptDuration") * 1000, layoutMs: delta("LayoutDuration") * 1000,
      styleMs: delta("RecalcStyleDuration") * 1000, layoutCount: delta("LayoutCount"), styleCount: delta("RecalcStyleCount"),
      frames: { count: gaps.length, p50Ms: gaps[Math.floor(gaps.length * .5)], p95Ms: gaps[Math.floor(gaps.length * .95)] },
      ...summarizeGradientCpuProfile(profile, label), caveat: "Sampling attribution; inclusive rows overlap. Instrumented frames are not the ordinary timing cohort." }));
  }
}
