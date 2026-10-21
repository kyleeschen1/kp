import { performance } from "node:perf_hooks";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { createBayesDraft } from "../src/experiments/bayesian-reasoning/example.ts";
import { renderBayesCardRevision } from "../src/experiments/bayesian-reasoning/page.ts";
import { check as checkAlgebra } from "../src/authoring/algebra/compile.ts";
import { createKpComposedAlgebraExampleV2 } from "../src/authoring/composed-algebra-example-v2.ts";
import { renderAlgebraIntuitionCard } from "../src/experiments/composed-algebra-intuition/page.ts";

// Complete source/check/static preparation, without pretending to measure DOM
// mounting or browser latency. Repeated results are consumed and compared.
function measure(name: string, source: unknown, check: (text: string) => { revision: string; html: string }) {
  const text = JSON.stringify(source), samples: number[] = [];
  const initial = check(text);
  for (let index = 0; index < 25; index++) {
    const started = performance.now(), result = check(text);
    samples.push(performance.now() - started);
    if (result.revision !== initial.revision || result.html !== initial.html) throw new Error(name + ": unstable preparation");
  }
  samples.sort((a, b) => a - b);
  return { name, repeats: samples.length, sourceBytes: Buffer.byteLength(text), htmlBytes: Buffer.byteLength(initial.html),
    revision: initial.revision, medianMs: samples[12], p95Ms: samples[23] };
}

console.log(JSON.stringify({
  note: "Warm Node diagnostic; source verification plus static HTML only. No browser mounting, layout or field latency claim.",
  consumers: [
    measure("bayes", createBayesDraft(), text => {
      const result = checkBayesDraft(text);
      if (result.status !== "compiled") throw new Error(result.diagnostic.expected);
      return { revision: result.draft.revisionId, html: renderBayesCardRevision(result.draft) };
    }),
    measure("algebra", createKpComposedAlgebraExampleV2(), text => {
      const result = checkAlgebra(text);
      if (result.status !== "compiled") throw new Error(result.diagnostic.expected);
      return { revision: result.draft.revisionId, html: renderAlgebraIntuitionCard(result.draft) };
    })
  ]
}, null, 2));
