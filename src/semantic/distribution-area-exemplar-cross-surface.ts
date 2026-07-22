import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetBundle
} from "./asset.ts";
import { kpDistributionAreaExemplarContract } from "./distribution-area-exemplar-contract.ts";
import {
  createKpDistributionAreaExemplarSemanticTrace,
  type KpDistributionAreaExemplarSemanticTrace
} from "./distribution-area-exemplar-trace.ts";

export type KpDistributionAreaExemplarConceptId =
  | "factor.3"
  | "term.x"
  | "term.2"
  | "product.3x"
  | "product.6";

export interface KpDistributionAreaExemplarCrossSurfaceLink {
  readonly id: string;
  readonly conceptId: KpDistributionAreaExemplarConceptId;
  readonly algebraSelectorIds: readonly string[];
  readonly geometrySelectorIds: readonly string[];
  readonly summary: string;
}

export interface KpDistributionAreaExemplarCrossSurfaceModel {
  readonly id: string;
  readonly trace: KpDistributionAreaExemplarSemanticTrace;
  readonly geometryBundle: KpAssetBundle;
  readonly links: readonly KpDistributionAreaExemplarCrossSurfaceLink[];
}

const baseId = kpDistributionAreaExemplarContract.id;
const geometryObjectId = `${baseId}.geometry.partitioned-rectangle`;

/** Exact semantic links only; SVG geometry and layout remain renderer-owned. */
export function createKpDistributionAreaExemplarCrossSurfaceModel():
  KpDistributionAreaExemplarCrossSurfaceModel {
  const trace = createKpDistributionAreaExemplarSemanticTrace();
  const geometryBundle = createKpAssetBundle({
    id: `${baseId}.geometry.bundle`,
    title: "Three times x plus two area semantics",
    objects: [
      createKpSemanticAssetObject({
        id: geometryObjectId,
        objectType: "partitioned-rectangle",
        title: "A height-three rectangle partitioned into widths x and two",
        value: kpDistributionAreaExemplarContract.geometry,
        selectors: [
          geometrySelector("height.factor.3", "dimension", "3"),
          geometrySelector("width.term.x", "dimension", "x"),
          geometrySelector("width.term.2", "dimension", "2"),
          geometrySelector("region.product.3x", "area-region", "3x"),
          geometrySelector("region.product.6", "area-region", "6")
        ]
      })
    ]
  });
  const state = trace.stateObjectIds;

  return {
    id: `${baseId}.cross-surface-model`,
    trace,
    geometryBundle,
    links: [
      link(
        "factor.3",
        [
          algebra(state.factored, "factor.3"),
          algebra(state.distributed, "left.factor.3"),
          algebra(state.distributed, "right.factor.3"),
          algebra(state.expanded, "left.factor.3")
        ],
        [geometry("height.factor.3")],
        "Every visible three names the rectangle's shared height."
      ),
      link(
        "term.x",
        [
          algebra(state.factored, "term.x"),
          algebra(state.distributed, "left.term.x"),
          algebra(state.expanded, "left.term.x")
        ],
        [geometry("width.term.x")],
        "The x term names the variable-width partition."
      ),
      link(
        "term.2",
        [
          algebra(state.factored, "term.2"),
          algebra(state.distributed, "right.term.2")
        ],
        [geometry("width.term.2")],
        "The two names the fixed-width partition."
      ),
      link(
        "product.3x",
        [
          algebra(state.distributed, "left.factor.3"),
          algebra(state.distributed, "left.term.x"),
          algebra(state.expanded, "left.factor.3"),
          algebra(state.expanded, "left.term.x")
        ],
        [geometry("region.product.3x")],
        "The left product and the variable region both represent area 3x."
      ),
      link(
        "product.6",
        [
          algebra(state.distributed, "right.factor.3"),
          algebra(state.distributed, "right.term.2"),
          algebra(state.expanded, "right.product.6")
        ],
        [geometry("region.product.6")],
        "The right factor pair and its product both represent area six."
      )
    ]
  };
}

function geometrySelector(suffix: string, kind: string, label: string) {
  return { id: geometry(suffix), kind, label };
}

function geometry(suffix: string): string {
  return `${geometryObjectId}.${suffix}`;
}

function algebra(objectId: string, suffix: string): string {
  return `${objectId}.${suffix}`;
}

function link(
  conceptId: KpDistributionAreaExemplarConceptId,
  algebraSelectorIds: readonly string[],
  geometrySelectorIds: readonly string[],
  summary: string
): KpDistributionAreaExemplarCrossSurfaceLink {
  return {
    id: `${baseId}.cross-surface.${conceptId}`,
    conceptId,
    algebraSelectorIds,
    geometrySelectorIds,
    summary
  };
}
