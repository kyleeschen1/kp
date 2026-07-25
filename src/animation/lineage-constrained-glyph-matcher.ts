import type {
  KpCanonicalLineageProjection,
  KpReconciliationLineageGroup
} from "./canonical-operation-lineage-adapter.ts";

export interface KpGlyphObservation {
  readonly id: string;
  readonly entityId: string;
  readonly glyphKey: string;
  readonly ordinal: number;
}

export interface KpGlyphMatch {
  readonly id: string;
  readonly lineageGroupId: string;
  readonly sourceGlyphId: string;
  readonly targetGlyphId: string;
  readonly glyphKey: string;
}

export interface KpGlyphMatchAmbiguity {
  readonly lineageGroupId: string;
  readonly glyphKey: string;
  readonly sourceGlyphIds: readonly string[];
  readonly targetGlyphIds: readonly string[];
}

export interface KpLineageConstrainedGlyphMatchResult {
  readonly matches: readonly KpGlyphMatch[];
  readonly unmatchedSourceGlyphIds: readonly string[];
  readonly unmatchedTargetGlyphIds: readonly string[];
  readonly ambiguities: readonly KpGlyphMatchAmbiguity[];
  readonly operationCount: number;
}

/**
 * Visual equality only ranks candidates already admitted by semantic lineage;
 * it never creates lineage between otherwise unrelated glyphs.
 */
export function matchKpGlyphsWithinSemanticLineage(input: {
  readonly lineage: KpCanonicalLineageProjection;
  readonly sourceGlyphs: readonly KpGlyphObservation[];
  readonly targetGlyphs: readonly KpGlyphObservation[];
}): KpLineageConstrainedGlyphMatchResult {
  validateGlyphObservations(input.sourceGlyphs, input.lineage.sourceEntityIds, "source");
  validateGlyphObservations(input.targetGlyphs, input.lineage.targetEntityIds, "target");

  const matches: KpGlyphMatch[] = [];
  const ambiguities: KpGlyphMatchAmbiguity[] = [];
  const matchedSource = new Set<string>();
  const matchedTarget = new Set<string>();
  let operationCount = 0;

  input.lineage.groups.forEach((group) => {
    const sources = glyphsForEntities(input.sourceGlyphs, group.sourceEntityIds);
    const targets = glyphsForEntities(input.targetGlyphs, group.targetEntityIds);
    const keys = new Set([...sources, ...targets].map((glyph) => glyph.glyphKey));
    keys.forEach((glyphKey) => {
      operationCount += sources.length + targets.length;
      const sourceCandidates = sources.filter((glyph) => glyph.glyphKey === glyphKey);
      const targetCandidates = targets.filter((glyph) => glyph.glyphKey === glyphKey);
      if (sourceCandidates.length === 1 && targetCandidates.length === 1) {
        const source = sourceCandidates[0]!;
        const target = targetCandidates[0]!;
        matches.push(match(group, source, target));
        matchedSource.add(source.id);
        matchedTarget.add(target.id);
      } else if (sourceCandidates.length > 0 && targetCandidates.length > 0) {
        ambiguities.push(Object.freeze({
          lineageGroupId: group.id,
          glyphKey,
          sourceGlyphIds: Object.freeze(sourceCandidates.map(({ id }) => id)),
          targetGlyphIds: Object.freeze(targetCandidates.map(({ id }) => id))
        }));
      }
    });
  });

  return Object.freeze({
    matches: Object.freeze(matches),
    unmatchedSourceGlyphIds: Object.freeze(
      input.sourceGlyphs.filter(({ id }) => !matchedSource.has(id)).map(({ id }) => id)
    ),
    unmatchedTargetGlyphIds: Object.freeze(
      input.targetGlyphs.filter(({ id }) => !matchedTarget.has(id)).map(({ id }) => id)
    ),
    ambiguities: Object.freeze(ambiguities),
    operationCount
  });
}

function match(
  group: KpReconciliationLineageGroup,
  source: KpGlyphObservation,
  target: KpGlyphObservation
): KpGlyphMatch {
  return Object.freeze({
    id: `glyph-match.${group.id}.${source.id}.${target.id}`,
    lineageGroupId: group.id,
    sourceGlyphId: source.id,
    targetGlyphId: target.id,
    glyphKey: source.glyphKey
  });
}

function glyphsForEntities(
  glyphs: readonly KpGlyphObservation[],
  entityIds: readonly string[]
): readonly KpGlyphObservation[] {
  const allowed = new Set(entityIds);
  return glyphs.filter(({ entityId }) => allowed.has(entityId));
}

function validateGlyphObservations(
  glyphs: readonly KpGlyphObservation[],
  entityIds: readonly string[],
  side: "source" | "target"
): void {
  const allowed = new Set(entityIds);
  const ids = new Set<string>();
  glyphs.forEach((glyph) => {
    if (!allowed.has(glyph.entityId)) {
      throw new Error(`${side} glyph ${glyph.id} references entity outside canonical lineage.`);
    }
    if (ids.has(glyph.id)) throw new Error(`${side} glyph id ${glyph.id} is duplicated.`);
    if (glyph.glyphKey.length === 0 || !Number.isInteger(glyph.ordinal) || glyph.ordinal < 0) {
      throw new Error(`${side} glyph ${glyph.id} has invalid visual identity.`);
    }
    ids.add(glyph.id);
  });
}
