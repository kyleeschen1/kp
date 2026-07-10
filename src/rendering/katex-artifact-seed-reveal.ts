import type { EasingName } from "./equation-motion-plan.ts";
import type {
  KatexAtlasRegion,
  KatexTextureAtlas,
  KatexTokenRect
} from "./katex-transition-types.ts";

export interface KatexArtifactSeedRevealEndpoint {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
}

export interface KatexArtifactSeedRevealSourceMotion {
  readonly kind: "collapse-to-bundle";
  readonly collapseEnd: number;
  readonly fadeStart: number;
  readonly fadeEnd: number;
  readonly stagger: number;
  readonly drift: number;
}

export interface KatexArtifactSeedRevealTargetMotion {
  readonly kind: "unfold-from-bundle";
  readonly revealStart: number;
  readonly revealEnd: number;
  readonly stagger: number;
  readonly drift: number;
  readonly dissolveFraction: number;
}

export interface KatexArtifactSeedRevealGrid {
  readonly columns: number;
  readonly rows: number;
}

export interface KatexArtifactSeedRevealPlan {
  readonly id: string;
  readonly kind: "artifact-seed-reveal";
  readonly source: KatexArtifactSeedRevealEndpoint;
  readonly target: KatexArtifactSeedRevealEndpoint;
  readonly bundleRect: KatexTokenRect;
  readonly sourceGrid: KatexArtifactSeedRevealGrid;
  readonly targetGrid: KatexArtifactSeedRevealGrid;
  readonly sourceMotion: KatexArtifactSeedRevealSourceMotion;
  readonly targetMotion: KatexArtifactSeedRevealTargetMotion;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
}

export interface KatexArtifactSeedRevealRenderer {
  render(progress: number): void;
  dispose(): void;
}

export interface KatexArtifactSeedRevealPiece {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
  readonly opacity: number;
  readonly region: KatexAtlasRegion;
  readonly crop: KatexAtlasCropRect;
  readonly motion: "collapse" | "fold" | "dissolve";
}

export interface KatexAtlasCropRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface KatexArtifactSeedRevealFrame {
  readonly pieces: readonly KatexArtifactSeedRevealPiece[];
}

export function sampleKatexArtifactSeedRevealProgress(
  plan: KatexArtifactSeedRevealPlan,
  progress: number
): number {
  const clampedProgress = clamp01(progress);

  if (plan.end <= plan.start) {
    return clampedProgress >= plan.end ? 1 : 0;
  }

  const localProgress = clamp01(
    (clampedProgress - plan.start) / (plan.end - plan.start)
  );

  return roundUnitProgress(easedProgress(plan.easing, localProgress));
}

export function createKatexArtifactSeedRevealFrame(
  plan: KatexArtifactSeedRevealPlan,
  regions: ReadonlyMap<string, KatexAtlasRegion>,
  progress: number
): KatexArtifactSeedRevealFrame {
  const localProgress = sampleKatexArtifactSeedRevealProgress(plan, progress);
  const pieces: KatexArtifactSeedRevealPiece[] = [];
  const sourceRegion = regions.get(plan.source.tokenId);
  const targetRegion = regions.get(plan.target.tokenId);

  if (sourceRegion !== undefined) {
    const sourceTiles = createTextureTiles(
      plan.source.tokenId,
      plan.source.rect,
      sourceRegion,
      plan.sourceGrid
    );

    for (const tile of sourceTiles) {
      const delay = sourceCollapseOrder(tile) * plan.sourceMotion.stagger;
      const collapseProgress = phaseProgress(
        delay,
        plan.sourceMotion.collapseEnd + delay,
        localProgress
      );
      const sourceFadeStart = Math.max(
        plan.sourceMotion.fadeStart,
        plan.sourceMotion.collapseEnd + delay
      );
      const sourceOpacity =
        collapseProgress < 1
          ? 1
          : 1 - phaseProgress(sourceFadeStart, 1, localProgress);

      if (sourceOpacity <= 0.001) {
        continue;
      }

      pieces.push({
        tokenId: plan.source.tokenId,
        rect: driftRect(
          interpolateRect(
            tile.rect,
            bundlePieceRect(plan.bundleRect, tile.index, sourceTiles.length),
            collapseProgress
          ),
          plan.sourceMotion.drift,
          tile.seed,
          collapseProgress
        ),
        opacity: sourceOpacity,
        region: sourceRegion,
        crop: tile.crop,
        motion: "collapse"
      });
    }
  }

  if (targetRegion !== undefined) {
    const targetTiles = createTextureTiles(
      plan.target.tokenId,
      plan.target.rect,
      targetRegion,
      plan.targetGrid
    );

    for (const tile of targetTiles) {
      const shouldDissolve =
        deterministicUnit(tile.index + 97) < plan.targetMotion.dissolveFraction;
      const delay =
        targetFoldOrder(tile, plan.bundleRect) * plan.targetMotion.stagger;
      const revealProgress = phaseProgress(
        plan.targetMotion.revealStart + delay,
        plan.targetMotion.revealEnd,
        localProgress
      );
      const opacity = shouldDissolve ? localProgress : revealProgress;

      if (opacity <= 0.001) {
        continue;
      }

      pieces.push({
        tokenId: plan.target.tokenId,
        rect: shouldDissolve
          ? tile.rect
          : driftRect(
              interpolateRect(
                bundlePieceRect(plan.bundleRect, tile.index, targetTiles.length),
                tile.rect,
                revealProgress
              ),
              plan.targetMotion.drift,
              tile.seed,
              1 - revealProgress
            ),
        opacity,
        region: targetRegion,
        crop: tile.crop,
        motion: shouldDissolve ? "dissolve" : "fold"
      });
    }
  }

  return { pieces };
}

export function createKatexArtifactSeedRevealRenderer(
  canvas: HTMLCanvasElement,
  plan: KatexArtifactSeedRevealPlan,
  atlas: KatexTextureAtlas
): KatexArtifactSeedRevealRenderer {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (context === null) {
    throw new Error("2D canvas is unavailable for KaTeX artifact seed reveal.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  let disposed = false;

  return {
    render(progress) {
      if (disposed) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const piece of createKatexArtifactSeedRevealFrame(
        plan,
        atlas.regions,
        progress
      ).pieces) {
        const page = atlas.pages[piece.region.page];

        if (page === undefined) {
          continue;
        }

        drawPiece(context, page, piece, atlas.pixelRatio);
      }
    },
    dispose() {
      disposed = true;
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}

interface TextureTile {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
  readonly crop: KatexAtlasCropRect;
  readonly index: number;
  readonly column: number;
  readonly row: number;
  readonly columns: number;
  readonly rows: number;
  readonly seed: number;
}

function createTextureTiles(
  tokenId: string,
  rect: KatexTokenRect,
  region: KatexAtlasRegion,
  grid: KatexArtifactSeedRevealGrid
): readonly TextureTile[] {
  const columns = Math.max(1, Math.floor(grid.columns));
  const rows = Math.max(1, Math.floor(grid.rows));
  const tiles: TextureTile[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;

      tiles.push({
        tokenId,
        rect: {
          left: rect.left + (rect.width * column) / columns,
          top: rect.top + (rect.height * row) / rows,
          width: rect.width / columns,
          height: rect.height / rows
        },
        crop: {
          x: region.x + (region.width * column) / columns,
          y: region.y + (region.height * row) / rows,
          width: region.width / columns,
          height: region.height / rows
        },
        index,
        column,
        row,
        columns,
        rows,
        seed: deterministicUnit(index)
      });
    }
  }

  return tiles;
}

function bundlePieceRect(
  bundleRect: KatexTokenRect,
  index: number,
  count: number
): KatexTokenRect {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const column = index % columns;
  const row = Math.floor(index / columns);
  const cellWidth = bundleRect.width / columns;
  const cellHeight = bundleRect.height / rows;
  const width = Math.max(0.8, cellWidth * 0.74);
  const height = Math.max(0.8, cellHeight * 0.74);

  return {
    left: bundleRect.left + column * cellWidth + (cellWidth - width) / 2,
    top: bundleRect.top + row * cellHeight + (cellHeight - height) / 2,
    width,
    height
  };
}

function sourceCollapseOrder(tile: TextureTile): number {
  const xOrder = tile.columns <= 1 ? 0 : tile.column / (tile.columns - 1);

  // The exponent's right side carries the "2" in 1/2, so it leads the
  // collapse toward the shared reconciliation point instead of drifting as dust.
  return clamp01(1 - xOrder);
}

function targetFoldOrder(
  tile: TextureTile,
  creaseRect: KatexTokenRect
): number {
  const tileCenter = rectCenter(tile.rect);
  const creaseCenter = rectCenter(creaseRect);
  const groupRect = textureTileGroupRect(tile);
  const maxDistance = Math.max(
    ...[
      { left: groupRect.left, top: groupRect.top },
      { left: groupRect.left + groupRect.width, top: groupRect.top },
      { left: groupRect.left, top: groupRect.top + groupRect.height },
      {
        left: groupRect.left + groupRect.width,
        top: groupRect.top + groupRect.height
      }
    ].map((corner) =>
      Math.hypot(corner.left - creaseCenter.x, corner.top - creaseCenter.y)
    )
  );

  if (maxDistance <= 0) {
    return 0;
  }

  return clamp01(
    Math.hypot(tileCenter.x - creaseCenter.x, tileCenter.y - creaseCenter.y) /
      maxDistance
  );
}

function textureTileGroupRect(tile: TextureTile): KatexTokenRect {
  return {
    left: tile.rect.left - tile.column * tile.rect.width,
    top: tile.rect.top - tile.row * tile.rect.height,
    width: tile.rect.width * tile.columns,
    height: tile.rect.height * tile.rows
  };
}

function rectCenter(
  rect: KatexTokenRect
): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function driftRect(
  rect: KatexTokenRect,
  drift: number,
  seed: number,
  progress: number
): KatexTokenRect {
  const driftProgress = Math.sin(clamp01(progress) * Math.PI);
  const angle = seed * Math.PI * 2;

  return {
    left: rect.left + Math.cos(angle) * drift * driftProgress,
    top: rect.top + Math.sin(angle) * drift * driftProgress,
    width: rect.width,
    height: rect.height
  };
}

function drawPiece(
  context: CanvasRenderingContext2D,
  page: HTMLCanvasElement,
  piece: KatexArtifactSeedRevealPiece,
  pixelRatio: number
): void {
  context.save();
  context.globalAlpha = piece.opacity;
  context.drawImage(
    page,
    piece.crop.x,
    piece.crop.y,
    piece.crop.width,
    piece.crop.height,
    piece.rect.left * pixelRatio,
    piece.rect.top * pixelRatio,
    piece.rect.width * pixelRatio,
    piece.rect.height * pixelRatio
  );
  context.restore();
}

function phaseProgress(start: number, end: number, progress: number): number {
  if (end <= start) {
    return progress >= end ? 1 : 0;
  }

  return easedProgress("ease-in-out", clamp01((progress - start) / (end - start)));
}

function interpolateRect(
  source: KatexTokenRect,
  target: KatexTokenRect,
  progress: number
): KatexTokenRect {
  return {
    left: interpolate(source.left, target.left, progress),
    top: interpolate(source.top, target.top, progress),
    width: interpolate(source.width, target.width, progress),
    height: interpolate(source.height, target.height, progress)
  };
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function deterministicUnit(index: number): number {
  const value = Math.sin((index + 1) * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}

function easedProgress(easing: EasingName, progress: number): number {
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-out":
      return 1 - (1 - progress) * (1 - progress);
    case "ease-in-out":
      return (1 - Math.cos(Math.PI * progress)) / 2;
    default:
      return assertNever(easing);
  }
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function roundUnitProgress(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled artifact seed reveal easing: ${value}`);
}
