import type { KpGlyphObservation } from "./lineage-constrained-glyph-matcher.ts";

export interface KpNotationRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface KpMeasuredGlyph extends KpGlyphObservation {
  readonly bounds: KpNotationRect;
  readonly styleFingerprint: string;
}

export interface KpProtectedNotationRegion {
  readonly id: string;
  readonly ownerEntityId: string;
  readonly kind: "ink" | "annotation" | "interactive-target";
  readonly bounds: KpNotationRect;
}

export interface KpNativeNotationMeasurementSnapshot {
  readonly kind: "native-notation-measurement";
  readonly backendId: string;
  readonly settlementEpoch: string;
  readonly viewport: KpNotationRect;
  readonly glyphs: readonly KpMeasuredGlyph[];
  readonly protectedRegions: readonly KpProtectedNotationRegion[];
}

export interface KpNativeNotationMeasurementBackend {
  readonly id: string;
  settle(): Promise<string>;
  viewport(): KpNotationRect;
  measureGlyph(glyph: KpGlyphObservation): KpMeasuredGlyph | undefined;
  protectedRegions(): readonly KpProtectedNotationRegion[];
}

/**
 * Settlement precedes every read so transient font weight, KaTeX grouping,
 * and layout changes cannot leak into the first animation frame.
 */
export async function measureKpNativeNotation(input: {
  readonly backend: KpNativeNotationMeasurementBackend;
  readonly glyphs: readonly KpGlyphObservation[];
}): Promise<KpNativeNotationMeasurementSnapshot> {
  const settlementEpoch = await input.backend.settle();
  if (settlementEpoch.trim().length === 0) {
    throw new Error("Native notation measurement requires a settlement epoch.");
  }
  const measured = input.glyphs.map((glyph) => {
    const result = input.backend.measureGlyph(glyph);
    if (result === undefined) throw new Error(`Backend could not measure glyph ${glyph.id}.`);
    if (
      result.id !== glyph.id ||
      result.entityId !== glyph.entityId ||
      result.glyphKey !== glyph.glyphKey
    ) {
      throw new Error(`Backend changed semantic identity while measuring glyph ${glyph.id}.`);
    }
    validateRect(result.bounds, `glyph ${glyph.id}`);
    if (result.styleFingerprint.trim().length === 0) {
      throw new Error(`Glyph ${glyph.id} lacks a settled style fingerprint.`);
    }
    return freezeMeasuredGlyph(result);
  });
  const protectedRegions = input.backend.protectedRegions().map((region) => {
    validateRect(region.bounds, `protected region ${region.id}`);
    return Object.freeze({ ...region, bounds: Object.freeze({ ...region.bounds }) });
  });
  const viewport = input.backend.viewport();
  validateRect(viewport, "viewport");

  return Object.freeze({
    kind: "native-notation-measurement",
    backendId: input.backend.id,
    settlementEpoch,
    viewport: Object.freeze({ ...viewport }),
    glyphs: Object.freeze(measured),
    protectedRegions: Object.freeze(protectedRegions)
  });
}

function freezeMeasuredGlyph(glyph: KpMeasuredGlyph): KpMeasuredGlyph {
  return Object.freeze({ ...glyph, bounds: Object.freeze({ ...glyph.bounds }) });
}

function validateRect(rect: KpNotationRect, label: string): void {
  if (
    ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
    rect.width < 0 ||
    rect.height < 0
  ) {
    throw new Error(`Invalid native notation bounds for ${label}.`);
  }
}
