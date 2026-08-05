import {
  kpDimensionalContinuityGraphLanguageId
} from "./dimensional-continuity-graph-language.ts";

export { kpDimensionalContinuityGraphLanguageId } from
  "./dimensional-continuity-graph-language.ts";

export interface KpDimensionalContinuityGraphPresentationProfileV1 {
  readonly schemaVersion: "kp.dimensional-continuity-graph-presentation-profile.v1";
  readonly id: `kp.graph.dimensional-continuity.${string}.v1`;
  readonly languageId: typeof kpDimensionalContinuityGraphLanguageId;
  readonly renderer: "svg";
  readonly projection: "orthographic-xy";
  readonly mathTypography: "katex";
  readonly visualRoles: {
    readonly stable: "teal";
    readonly changing: "rust";
    readonly focal: "ink";
    readonly construction: "quiet-blue";
    readonly plane: "warm";
  };
}

export function createKpDimensionalContinuityGraphPresentationProfile(
  domain: string
): KpDimensionalContinuityGraphPresentationProfileV1 {
  if (!/^[a-z][a-z0-9-]*$/.test(domain)) {
    throw new Error(`Invalid dimensional-continuity graph domain ${domain}.`);
  }
  return Object.freeze({
    schemaVersion: "kp.dimensional-continuity-graph-presentation-profile.v1",
    id: `kp.graph.dimensional-continuity.${domain}.v1`,
    languageId: kpDimensionalContinuityGraphLanguageId,
    renderer: "svg",
    projection: "orthographic-xy",
    mathTypography: "katex",
    visualRoles: Object.freeze({
      stable: "teal",
      changing: "rust",
      focal: "ink",
      construction: "quiet-blue",
      plane: "warm"
    })
  });
}
