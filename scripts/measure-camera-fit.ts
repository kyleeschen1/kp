import { createHash } from "node:crypto";
import { createKpSurfaceContourStageAuthority } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { createPositiveQuadraticField } from "../src/tutorial/kinetic-figure-surface-contour/quadratic-field.ts";

for (const [a, b] of [[1, 2], [.25, 4], [4, .25]] as const) {
  const field = createPositiveQuadraticField(a, b), samples: number[] = [];
  let expected = "";
  for (let i = 0; i < 25; i++) {
    const start = performance.now();
    const authority = createKpSurfaceContourStageAuthority(field);
    samples.push(performance.now() - start);
    const json = JSON.stringify(authority.fitPlan);
    if (i && json !== expected) throw new Error("Fitted authority changed across identical preparations");
    expected = json;
  }
  samples.sort((a, b) => a - b);
  console.log(JSON.stringify({ field: [a, b], medianMs: samples[12], p95Ms: samples[23],
    fitSha256: createHash("sha256").update(expected).digest("hex"),
    note: "25 complete stage-authority preparations; Node warm CPU diagnostic, not browser startup." }));
}
