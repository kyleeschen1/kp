import { renderLatexToHtml } from "./katex-adapter.ts";
import {
  createKpDistributionAreaExemplarSvgScene,
  type KpDistributionAreaExemplarSvgScene
} from "./distribution-area-exemplar-svg.ts";
import {
  createKpDistributionAreaExemplarSemanticTrace
} from "../semantic/distribution-area-exemplar-trace.ts";

export type KpDistributionAreaEndpointId = "factored" | "expanded";

export interface KpDistributionAreaEndpointLabel {
  readonly latex: string;
  readonly html: string;
  readonly semanticIds: readonly string[];
  readonly x: number;
  readonly y: number;
}

export interface KpDistributionAreaExemplarEndpoint {
  readonly id: KpDistributionAreaEndpointId;
  readonly owner: "native";
  readonly algebra: {
    readonly objectId: string;
    readonly latex: string;
    readonly html: string;
  };
  readonly area: {
    readonly scene: KpDistributionAreaExemplarSvgScene;
    readonly topology: "unified" | "partitioned";
    readonly dividerOpacity: 0 | 1;
    readonly labels: readonly KpDistributionAreaEndpointLabel[];
  };
  readonly searchableText: readonly string[];
}

export function createKpDistributionAreaExemplarEndpoint(
  id: KpDistributionAreaEndpointId
): KpDistributionAreaExemplarEndpoint {
  const trace = createKpDistributionAreaExemplarSemanticTrace();
  const scene = createKpDistributionAreaExemplarSvgScene();
  const objectId = trace.stateObjectIds[id];
  const object = trace.bundle.objects.find((candidate) => candidate.id === objectId);
  if (object === undefined) throw new Error(`Missing distribution area endpoint ${id}.`);
  const latex = (object.value as { readonly latex: string }).latex;
  const expanded = id === "expanded";
  const labels = expanded
    ? scene.labels.map((label) => ({
        latex: label.latex,
        html: label.html,
        semanticIds: [label.semanticId],
        x: label.x,
        y: label.y
      }))
    : factoredLabels(scene);

  return {
    id,
    owner: "native",
    algebra: {
      objectId,
      latex,
      html: renderLatexToHtml(latex, { displayMode: true })
    },
    area: {
      scene,
      topology: expanded ? "partitioned" : "unified",
      dividerOpacity: expanded ? 1 : 0,
      labels
    },
    searchableText: [latex, ...labels.map((label) => label.latex)]
  };
}

function factoredLabels(
  scene: KpDistributionAreaExemplarSvgScene
): readonly KpDistributionAreaEndpointLabel[] {
  const height = scene.labels.find((label) => label.role === "height")!;
  const widths = scene.labels.filter((label) => label.role === "width");
  const regions = scene.labels.filter((label) => label.role === "area");
  return [
    {
      latex: "3",
      html: height.html,
      semanticIds: [height.semanticId],
      x: height.x,
      y: height.y
    },
    {
      latex: "x+2",
      html: renderLatexToHtml("x+2", { displayMode: false }),
      semanticIds: widths.map((label) => label.semanticId),
      x: 300,
      y: 34
    },
    {
      latex: "3(x+2)",
      html: renderLatexToHtml("3(x+2)", { displayMode: false }),
      semanticIds: regions.map((label) => label.semanticId),
      x: 300,
      y: 160
    }
  ];
}
