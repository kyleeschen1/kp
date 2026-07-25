import type { KpGlyphObservation } from "./lineage-constrained-glyph-matcher.ts";
import type {
  KpMeasuredGlyph,
  KpNativeNotationMeasurementBackend,
  KpNotationRect,
  KpProtectedNotationRegion
} from "./native-notation-measurement.ts";

export interface KpHeadlessGlyphMetric {
  readonly glyphId: string;
  readonly bounds: KpNotationRect;
  readonly styleFingerprint?: string | undefined;
}

export function createKpHeadlessNotationMeasurementBackend(input: {
  readonly id: string;
  readonly viewport: KpNotationRect;
  readonly metrics: readonly KpHeadlessGlyphMetric[];
  readonly protectedRegions?: readonly KpProtectedNotationRegion[] | undefined;
  readonly defaultStyleFingerprint?: string | undefined;
  readonly settlementEpoch?: string | undefined;
}): KpNativeNotationMeasurementBackend {
  const metrics = new Map(input.metrics.map((metric) => [metric.glyphId, metric]));
  if (metrics.size !== input.metrics.length) {
    throw new Error("Headless notation metrics require unique glyph ids.");
  }
  const defaultStyle = input.defaultStyleFingerprint ?? "kp-headless-math|400|16px";
  return Object.freeze({
    id: input.id,
    async settle() {
      return input.settlementEpoch ?? "headless-layout-stable";
    },
    viewport() {
      return Object.freeze({ ...input.viewport });
    },
    measureGlyph(glyph: KpGlyphObservation): KpMeasuredGlyph | undefined {
      const metric = metrics.get(glyph.id);
      return metric === undefined ? undefined : Object.freeze({
        ...glyph,
        bounds: Object.freeze({ ...metric.bounds }),
        styleFingerprint: metric.styleFingerprint ?? defaultStyle
      });
    },
    protectedRegions() {
      return Object.freeze((input.protectedRegions ?? []).map((region) => Object.freeze({
        ...region,
        bounds: Object.freeze({ ...region.bounds })
      })));
    }
  });
}
