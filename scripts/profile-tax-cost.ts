import type { CDPSession } from "@playwright/test";
import { createCpuSourceLabel, summarizeGradientCpuProfile } from "./profile-gradient-cost.ts";

export async function startTaxProfile(cdp: CDPSession) {
  const before = await cdp.send("Performance.getMetrics");
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.start");
  return async (output: string, phase: string, cpuSlowdown: number, repeat: number) => {
    const { profile } = await cdp.send("Profiler.stop");
    await cdp.send("Profiler.disable");
    const after = await cdp.send("Performance.getMetrics");
    const delta = (name: string) => (after.metrics.find(m => m.name === name)?.value ?? 0) -
      (before.metrics.find(m => m.name === name)?.value ?? 0);
    console.log(JSON.stringify({ kind: "tax-cpu-profile", phase, cpuSlowdown, repeat,
      scriptMs: delta("ScriptDuration") * 1000, layoutMs: delta("LayoutDuration") * 1000,
      styleMs: delta("RecalcStyleDuration") * 1000, layoutCount: delta("LayoutCount"),
      ...summarizeGradientCpuProfile(profile, createCpuSourceLabel(output)),
      caveat: "Instrumented attribution, not ordinary timing. Inclusive rows overlap; local sourcemaps only." }));
  };
}
