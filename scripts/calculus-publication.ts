import { basename } from "node:path";
import katex from "katex";
import { compileChangeSource } from "../src/tutorial/change-propagation/model.ts";
import { renderChangePublication } from "../src/tutorial/change-propagation/view.ts";
import { createKpCompiledPublicationArtifact, assertKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";
import { digestEditionBytes as digest } from "./immutable-local-edition.ts";

/** The domain compiler owns meaning; the envelope records reproducible bytes.
 * Neither a serialized model nor a caller-supplied digest can replace checking. */
export function compileCalculusPublication(sourceText: string, sourcePath: string) {
  const checked = compileChangeSource(sourceText);
  if (checked.status !== "checked") throw new Error(`${checked.path}: ${checked.message}`);
  const model = checked.model;
  const html = renderChangePublication(model, sourceText, "reader");
  const payload = { source: model.source, revisionId: model.revision,
    latex: model.latex, initial: model.sample(model.source.x, model.source.h),
    checkpoints: model.source.steps.map(({ id, title }) => ({ id, title })),
    proseAuthority: "editorial" as const, reading: { html } };
  return createKpCompiledPublicationArtifact({ artifactId: "publication.calculus-change",
    source: { path: basename(sourcePath), sha256: digest(sourceText) },
    compiler: { id: "kp.calculus-change-publication", version: "1" },
    math: { engine: "katex", engineVersion: katex.version, rendering: "build-time", output: "htmlAndMathml", trust: false,
      fragmentCount: (html.match(/<math/g) ?? []).length, sourceLatex: [...new Set(Object.values(model.latex))].sort() },
    payloadSha256: digest(JSON.stringify(payload)), payload });
}

export function verifyCalculusPublication(value: unknown, sourceText: string, sourcePath: string): void {
  assertKpCompiledPublicationArtifact(value);
  if (JSON.stringify(value) !== JSON.stringify(compileCalculusPublication(sourceText, sourcePath)))
    throw new Error("Publication does not reproduce from the selected calculus source and trusted compiler.");
}
