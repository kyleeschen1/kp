export interface KatexTokenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface KatexMotionToken {
  id: string;
  text: string;
  signature: string;
  rect: KatexTokenRect;
  localRect: KatexTokenRect;
  row: number;
  element?: Element | undefined;
}

export interface KatexMatchedToken {
  source: KatexMotionToken;
  target: KatexMotionToken;
}

export interface KatexSourceOnlyToken {
  source: KatexMotionToken;
}

export interface KatexTargetOnlyToken {
  target: KatexMotionToken;
}

export interface KatexTransitionPlanDiagnostics {
  sourceTokenCount: number;
  targetTokenCount: number;
  matchedCount: number;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  ambiguousGroupCount: number;
  overrideMatchCount?: number | undefined;
  invalidOverrideCount?: number | undefined;
}

export interface KatexTransitionPlan {
  matched: readonly KatexMatchedToken[];
  sourceOnly: readonly KatexSourceOnlyToken[];
  targetOnly: readonly KatexTargetOnlyToken[];
  diagnostics: KatexTransitionPlanDiagnostics;
}

export interface KatexAtlasRegion {
  tokenId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface KatexTextureAtlas {
  width: number;
  height: number;
  pixelRatio: number;
  pages: readonly HTMLCanvasElement[];
  regions: ReadonlyMap<string, KatexAtlasRegion>;
}

export type KatexTransitionRendererKind = "webgl" | "css-fallback" | "instant";

export interface KatexTransitionResult {
  renderer: KatexTransitionRendererKind;
  sourceTokenCount: number;
  targetTokenCount: number;
  matchedCount: number;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  textureCount: number;
  durationMs: number;
  fallbackReason?: string | undefined;
}
