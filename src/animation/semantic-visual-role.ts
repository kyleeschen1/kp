export const kpSemanticVisualRoles = Object.freeze([
  "page",
  "ink",
  "structure",
  "data-series",
  "relation",
  "warning",
  "focus"
] as const);

export type KpSemanticVisualRole = typeof kpSemanticVisualRoles[number];

export interface KpSemanticVisualRoleDefinition {
  readonly id: KpSemanticVisualRole;
  readonly intent: string;
}

export const kpSemanticVisualRoleDefinitions =
  createKpSemanticVisualRoleRegistry([
    { id: "page", intent: "Document and stage ground." },
    { id: "ink", intent: "Readable prose, notation, labels, and controls." },
    { id: "structure", intent: "Axes, grids, borders, and persistent scaffolds." },
    { id: "data-series", intent: "Quantitative series with identity color." },
    { id: "relation", intent: "Guides, correspondences, and derived links." },
    { id: "warning", intent: "Invalid, risky, or exceptional material." },
    { id: "focus", intent: "Local punctuation for the instructional subject." }
  ]);

export function createKpSemanticVisualRoleRegistry(
  definitions: readonly KpSemanticVisualRoleDefinition[]
): Readonly<Record<KpSemanticVisualRole, KpSemanticVisualRoleDefinition>> {
  const registry = new Map<KpSemanticVisualRole, KpSemanticVisualRoleDefinition>();
  for (const definition of definitions) {
    if (!kpSemanticVisualRoles.includes(definition.id)) {
      throw new Error(`Unknown semantic visual role ${String(definition.id)}.`);
    }
    if (registry.has(definition.id)) {
      throw new Error(`Duplicate semantic visual role ${definition.id}.`);
    }
    if (definition.intent.trim() === "") {
      throw new Error(`Semantic visual role ${definition.id} requires intent.`);
    }
    registry.set(definition.id, Object.freeze({ ...definition }));
  }
  const missing = kpSemanticVisualRoles.filter((role) => !registry.has(role));
  if (missing.length > 0) {
    throw new Error(`Missing semantic visual roles: ${missing.join(", ")}.`);
  }
  return Object.freeze(Object.fromEntries(registry) as
    Record<KpSemanticVisualRole, KpSemanticVisualRoleDefinition>);
}
