import {
  economicsEquilibriumAnimationId
} from "../../animation/economics-equilibrium-adapter.ts";
import type {
  KpAnimationCatalogueEntry
} from "../../editor/animation-catalogue-projection.ts";
import {
  createKpEditorAnimationDescriptor,
  type KpEditorAnimationDescriptor
} from "../../editor/animation-descriptor.ts";

const descriptorId = `editor-animation.${economicsEquilibriumAnimationId}`;
const title = "Supply and demand equilibrium shift";
const summary =
  "Shifts demand on an exact supply-demand graph and follows the resulting " +
  "market equilibrium.";
const tags = Object.freeze([
  "animation",
  "graph",
  "economics",
  "supply",
  "demand",
  "equilibrium"
]);

export interface KpEconomicsDemandShiftAnimationCapability {
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly entry: KpAnimationCatalogueEntry;
}

export function createKpEconomicsDemandShiftAnimationCapability():
KpEconomicsDemandShiftAnimationCapability {
  // A publication route owns one selected capability, not an editor-wide
  // catalogue. The parity test keeps this compact record aligned with the
  // generated catalogue metadata without loading that metadata in readers.
  const descriptor = createKpEditorAnimationDescriptor({
    id: descriptorId,
    animationId: economicsEquilibriumAnimationId,
    title,
    summary,
    renderTargetKinds: ["graph"],
    controlKinds: ["playback", "step", "scrubber", "rewind"],
    durationMs: 2400,
    beatCount: 48,
    tags,
    promotion: {
      maturity: "reviewable",
      novelty: "composition",
      humanReviewRequired: false,
      goldCohort: false
    }
  });
  const entry = Object.freeze({
    schemaVersion: "kp.animation-catalogue-entry.v1" as const,
    kind: "animation-catalogue-entry" as const,
    animationId: economicsEquilibriumAnimationId,
    primaryDescriptorId: descriptor.id,
    packId: "economics" as const,
    title,
    summary,
    humanDisposition: "unreviewed" as const,
    domains: Object.freeze([]),
    familyIds: Object.freeze([]),
    sampleIds: Object.freeze([]),
    renderTargetKinds: descriptor.renderTargetKinds,
    controlKinds: descriptor.controlKinds,
    durationMs: descriptor.durationMs,
    beatCount: descriptor.beatCount,
    tags,
    searchTerms: Object.freeze([
      economicsEquilibriumAnimationId,
      title,
      summary,
      "unreviewed",
      ...tags,
      descriptor.id,
      "editor",
      "library.tutorial.economics-demand-shift",
      "Demand shift tutorial",
      "reader"
    ]),
    relatedContexts: Object.freeze([
      Object.freeze({
        id: descriptor.id,
        label: title,
        kind: "editor" as const,
        href: `/?animation=${descriptor.id}&view=editor`,
        role: "canonical-host" as const
      }),
      Object.freeze({
        id: "library.tutorial.economics-demand-shift",
        label: "Demand shift tutorial",
        kind: "reader" as const,
        href: "/tutorials/economics/demand-shift/",
        role: "projection" as const
      })
    ])
  });

  return Object.freeze({
    descriptor,
    descriptors: Object.freeze([descriptor]),
    entry
  });
}
