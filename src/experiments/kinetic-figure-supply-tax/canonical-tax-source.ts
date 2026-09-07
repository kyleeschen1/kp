import artifact from "./canonical-tax-source.generated.json" with { type: "json" };
import { prepareKpAuthoredMarketSource } from "../authoring-market/authoring-market-prepare.ts";
import { createKpAuthoringMarketFrameSession } from "../authoring-market/authoring-market-frame.ts";
import type { KpAuthoringMarketPreviewData } from "../authoring-market/authoring-market-preview-protocol.ts";

/** One revision and one query session supply the reader; no default sampler. */
export function createKpCanonicalTaxReaderSource() {
  if (artifact.schemaVersion !== "kp.canonical-tax-source.v1") throw new Error("Unsupported canonical tax source schema.");
  const prepared = prepareKpAuthoredMarketSource(artifact.data as KpAuthoringMarketPreviewData);
  const frames = createKpAuthoringMarketFrameSession(prepared.authored, { cacheCapacity: 2 });
  return Object.freeze({
    sourceRevision: artifact.sourceRevision,
    prepared, frames,
    source: Object.freeze({
      authority: prepared.authored.source.canonical,
      instruction: prepared.companion,
      // Canonical labels retain their existing native formatting, independently
      // of the exact economics used by the sampler and the preview's label policy.
      exactLabels: false,
      sampleFrame: (progress: number) => frames.sample(progress).frame
    }),
    dispose: frames.dispose
  });
}
