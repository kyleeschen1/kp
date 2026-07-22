import { linearEquationExemplarTheme } from "../app-adapters/concept-room-theme.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import {
  createKpDistributionAreaExemplarCrossSurfaceModel,
  type KpDistributionAreaExemplarConceptId
} from "../semantic/distribution-area-exemplar-cross-surface.ts";

export interface KpDistributionAreaSvgRegion {
  readonly semanticId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly stroke: string;
}

export interface KpDistributionAreaKatexLabel {
  readonly semanticId: string;
  readonly role: "height" | "width" | "area";
  readonly latex: string;
  readonly html: string;
  readonly x: number;
  readonly y: number;
  readonly fontFamily: "KaTeX_Main";
}

export interface KpDistributionAreaExemplarSvgScene {
  readonly id: string;
  readonly themeId: string;
  readonly viewBox: "0 0 600 320";
  readonly accessibleText: string;
  readonly regions: readonly KpDistributionAreaSvgRegion[];
  readonly labels: readonly KpDistributionAreaKatexLabel[];
  readonly outline: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly dividerX: number;
}

/** Exact reviewed scene geometry; it is not a generalized area-model API. */
export function createKpDistributionAreaExemplarSvgScene():
  KpDistributionAreaExemplarSvgScene {
  const model = createKpDistributionAreaExemplarCrossSurfaceModel();
  const semanticId = (conceptId: KpDistributionAreaExemplarConceptId) => {
    const link = model.links.find((candidate) => candidate.conceptId === conceptId);
    if (link === undefined || link.geometrySelectorIds.length !== 1) {
      throw new Error(`Missing exact area selector for ${conceptId}.`);
    }
    return link.geometrySelectorIds[0]!;
  };
  const outline = { x: 80, y: 60, width: 440, height: 200 } as const;
  const dividerX = 390;

  return {
    id: `${model.id}.svg-scene`,
    themeId: linearEquationExemplarTheme.id,
    viewBox: "0 0 600 320",
    accessibleText:
      "A rectangle of height 3 split into widths x and 2, with areas 3x and 6.",
    outline,
    dividerX,
    regions: [
      {
        semanticId: semanticId("product.3x"),
        x: outline.x,
        y: outline.y,
        width: dividerX - outline.x,
        height: outline.height,
        fill: "color-mix(in srgb, var(--kp-concept-variable) 14%, var(--kp-concept-surface))",
        stroke: "var(--kp-concept-line)"
      },
      {
        semanticId: semanticId("product.6"),
        x: dividerX,
        y: outline.y,
        width: outline.x + outline.width - dividerX,
        height: outline.height,
        fill: "color-mix(in srgb, var(--kp-concept-accent) 16%, var(--kp-concept-surface))",
        stroke: "var(--kp-concept-line)"
      }
    ],
    labels: [
      label(semanticId("factor.3"), "height", "3", 48, 160),
      label(semanticId("term.x"), "width", "x", 235, 34),
      label(semanticId("term.2"), "width", "2", 455, 34),
      label(semanticId("product.3x"), "area", "3x", 235, 160),
      label(semanticId("product.6"), "area", "6", 455, 160)
    ]
  };
}

function label(
  semanticId: string,
  role: KpDistributionAreaKatexLabel["role"],
  latex: string,
  x: number,
  y: number
): KpDistributionAreaKatexLabel {
  return {
    semanticId,
    role,
    latex,
    html: renderLatexToHtml(latex, { displayMode: false }),
    x,
    y,
    fontFamily: "KaTeX_Main"
  };
}
