export type KpRuntimeAuthorityKind =
  | "semantic-sampler"
  | "playback-clock"
  | "frame-scheduler"
  | "capability-loader"
  | "adapter-registry"
  | "operation-registry"
  | "presentation-cache"
  | "session-lifecycle";

export type KpRuntimeAuthorityStatus =
  | "canonical"
  | "host-scoped"
  | "compatibility-managed";

export interface KpRuntimeAuthorityInventoryEntry {
  readonly id: string;
  readonly kind: KpRuntimeAuthorityKind;
  readonly ownerPath: `src/${string}.ts`;
  readonly status: KpRuntimeAuthorityStatus;
  readonly scope: string;
  readonly invariant: string;
  readonly replacementCondition?: string | undefined;
}

/**
 * This inventory distinguishes clocks from frame delivery, caches, registries,
 * and host sessions. Counting requestAnimationFrame calls cannot reveal a
 * second semantic clock because most callbacks only deliver an already sampled
 * state to one host.
 */
export const kpRuntimeAuthorityInventory = Object.freeze([
  authority({
    id: "runtime.animation-sampler",
    kind: "semantic-sampler",
    ownerPath: "src/animation/runtime-sampler.ts",
    status: "canonical",
    scope: "renderer-neutral animation asset",
    invariant:
      "Pure normalized progress produces one deterministic sampled frame; direct seek and rewind never require replay."
  }),
  authority({
    id: "runtime.reader-clock-arbitration",
    kind: "playback-clock",
    ownerPath: "src/reader/runtime/clock-authority.ts",
    status: "canonical",
    scope: "one mounted reader session",
    invariant:
      "Initial, scroll, controls, and programmatic input arbitrate one playhead rather than advancing independent timelines."
  }),
  authority({
    id: "runtime.reader-frame-scheduler",
    kind: "frame-scheduler",
    ownerPath: "src/reader/runtime/frame-scheduler.ts",
    status: "canonical",
    scope: "one mounted reader renderer",
    invariant:
      "One requestAnimationFrame delivery coalesces input and preserves read, plan, and write order without becoming time authority."
  }),
  authority({
    id: "runtime.editor-playback-session",
    kind: "playback-clock",
    ownerPath: "src/editor/animation-playback-session.ts",
    status: "host-scoped",
    scope: "one editor or catalogue player",
    invariant:
      "The host reduces play, seek, tick, and rewind into one asset playhead and passes sampled state to adapters."
  }),
  authority({
    id: "runtime.catalog-pack-loader",
    kind: "capability-loader",
    ownerPath: "src/animation/catalog-loader.ts",
    status: "canonical",
    scope: "one immutable lazy animation pack per pack id",
    invariant:
      "Literal dynamic imports cache one promise per pack and return serializable assets plus immutable runtime capabilities."
  }),
  authority({
    id: "runtime.selected-surface-capability-host",
    kind: "capability-loader",
    ownerPath: "src/editor/selected-surface-capability-host.ts",
    status: "compatibility-managed",
    scope: "first-party editor surface capabilities",
    invariant:
      "One loader owns optional renderer imports and deduplicates registration without loading semantic assets.",
    replacementCondition:
      "The editor receives an explicit immutable adapter capability set at host construction."
  }),
  authority({
    id: "runtime.editor-surface-adapter-registry",
    kind: "adapter-registry",
    ownerPath: "src/editor/animation-surface-adapter-registry.ts",
    status: "compatibility-managed",
    scope: "first-party editor host",
    invariant:
      "The one legacy mutable registry dispatches paint adapters only; it cannot own semantic state or time.",
    replacementCondition:
      "All first-party hosts receive an explicit immutable adapter capability set."
  }),
  authority({
    id: "runtime.canonical-operation-registry",
    kind: "operation-registry",
    ownerPath: "src/semantic/canonical-operation-registry.ts",
    status: "compatibility-managed",
    scope: "canonical operation definitions and pack pins",
    invariant:
      "The module default is immutable after construction and new capability resolution accepts injected registries.",
    replacementCondition:
      "Every production compiler receives exact operation packs explicitly."
  }),
  authority({
    id: "runtime.operation-presentation-plan-cache",
    kind: "presentation-cache",
    ownerPath: "src/animation/operation-presentation-plan-types.ts",
    status: "compatibility-managed",
    scope: "verified transformation object identity",
    invariant:
      "A private WeakMap caches one verified plan or explicit absence; it cannot mint plans, serialize authority, or register at import time.",
    replacementCondition:
      "All transformation callers carry verified presentation-plan capabilities explicitly."
  }),
  authority({
    id: "runtime.reader-adapter-registry",
    kind: "adapter-registry",
    ownerPath: "src/reader/renderers/adapter-registry.ts",
    status: "canonical",
    scope: "one explicitly constructed reader session",
    invariant:
      "Reader adapters are registered on a factory-created registry and disposed with their host; no module singleton owns paint."
  }),
  authority({
    id: "runtime.canonical-equation-session",
    kind: "session-lifecycle",
    ownerPath: "src/reader/app/chrome-free-canonical-equation-session.ts",
    status: "canonical",
    scope: "one mounted canonical equation stage",
    invariant:
      "One session owns measurement, compositor lifecycle, seek, invalidation, and disposal while the sampled clock remains external."
  }),
  authority({
    id: "runtime.graph-svg-viewport",
    kind: "session-lifecycle",
    ownerPath: "src/editor/graph-svg-viewport-lifecycle.ts",
    status: "host-scoped",
    scope: "one editor graph slot",
    invariant:
      "The SVG viewport owns graph DOM lifetime while domain presenters consume the editor player's sampled state."
  })
] as const satisfies readonly KpRuntimeAuthorityInventoryEntry[]);

function authority(
  entry: KpRuntimeAuthorityInventoryEntry
): KpRuntimeAuthorityInventoryEntry {
  return Object.freeze(entry);
}
