import { renderSelectorAnnotatedLatexToHtml } from
  "../../rendering/katex-adapter.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../../rendering/selector-annotated-latex.ts";
import {
  escapeKpTutorialHtmlAttribute,
  escapeKpTutorialHtmlText
} from "../generated-html-escaping.ts";
import { projectKpEigenvectorDiagramEndpoint } from "./eigenvector-diagram.ts";
import { projectKpEigenvectorEquation } from "./eigenvector-equations.ts";
import {
  projectKpEigenvectorEndpoint,
  type KpEigenvectorBeatId,
  type KpEigenvectorEquationForm
} from "./eigenvector-endpoints.ts";
import { findKpEigenvectorPassage } from "./eigenvector-transcript.ts";

const WIDTH = 520;
const HEIGHT = 400;
const ORIGIN = [260, 210] as const;
const UNIT = 26;

export function renderKpEigenvectorSettledEndpointHtml(
  beatId: KpEigenvectorBeatId
): string {
  const endpoint = projectKpEigenvectorEndpoint(beatId);
  const passage = findKpEigenvectorPassage(beatId);
  return [
    `<section class="kp-eigenvector-stage" data-kp-eigenvector-endpoint="${beatId}"`,
    ` data-kp-attentional-owner="${endpoint.attentionalOwner}"`,
    ` aria-label="${escapeKpTutorialHtmlAttribute(passage.spokenText)}">`,
    renderDiagram(beatId),
    renderEquation(endpoint.equation),
    `</section>`
  ].join("");
}

function renderDiagram(beatId: KpEigenvectorBeatId): string {
  const diagram = projectKpEigenvectorDiagramEndpoint(beatId);
  const passage = findKpEigenvectorPassage(beatId);
  const markerId = `kp-eigenvector-arrow-${beatId}`;
  const grid = Array.from({ length: 13 }, (_, index) => index - 6)
    .filter((value) => value !== 0)
    .flatMap((value) => {
      const x = ORIGIN[0] + value * UNIT;
      const y = ORIGIN[1] - value * UNIT;
      return [
        `<line class="kp-eigenvector-stage__grid" x1="${x}" y1="54" x2="${x}" y2="366" />`,
        `<line class="kp-eigenvector-stage__grid" x1="104" y1="${y}" x2="416" y2="${y}" />`
      ];
    }).join("");
  const line = diagram.invariantLine.visible
    ? renderLine(
        "kp-eigenvector-stage__invariant-line",
        diagram.invariantLine.from,
        diagram.invariantLine.to,
        diagram.invariantLine.semanticObjectId
      )
    : "";
  const vectors = diagram.vectors.map((vector) =>
    renderLine(
      `kp-eigenvector-stage__vector kp-eigenvector-stage__vector--${vector.role}`,
      [0, 0],
      vector.displayed,
      vector.semanticObjectId,
      markerId,
      vector.id
    )
  ).join("");
  return `<svg class="kp-eigenvector-stage__diagram" data-kp-eigenvector-diagram viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="kp-eigenvector-desc-${beatId}">
    <title>${escapeKpTutorialHtmlText(passage.heading)}</title>
    <desc id="kp-eigenvector-desc-${beatId}">${escapeKpTutorialHtmlText(passage.text)}</desc>
    <defs><marker id="${markerId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
    <g class="kp-eigenvector-stage__grid-layer" aria-hidden="true">${grid}</g>
    <g class="kp-eigenvector-stage__axes" data-kp-object="transformation-A" data-kp-semantic-object="${diagram.transformationId}">
      <line x1="92" y1="${ORIGIN[1]}" x2="428" y2="${ORIGIN[1]}" />
      <line x1="${ORIGIN[0]}" y1="378" x2="${ORIGIN[0]}" y2="42" />
    </g>
    ${line}
    <g class="kp-eigenvector-stage__vectors">${vectors}</g>
  </svg>`;
}

function renderEquation(form: KpEigenvectorEquationForm): string {
  if (form === "none") {
    return `<div class="kp-eigenvector-stage__equation" data-kp-eigenvector-equation hidden></div>`;
  }
  const equation = projectKpEigenvectorEquation(form);
  const tokens = new Map(equation.tokens.map((token) => [token.id, token]));
  const layout = equationLayout(form);
  const annotated = createKpSelectorAnnotatedLatex({
    id: `eigenvector.${form.replaceAll(/[^a-zA-Z0-9]/g, "-")}`,
    expectedSelectorIds: equation.tokens.map(({ id }) => id),
    segments: layout.map((part): KpSelectorAnnotatedLatexSegment => {
      if (typeof part === "string") {
        return { kind: "latex", latex: part };
      }
      const token = tokens.get(part.tokenId);
      if (token === undefined) {
        throw new Error(`Equation ${form} lacks token ${part.tokenId}.`);
      }
      return { kind: "selector", selectorId: token.id, latex: token.latex };
    })
  });
  let html = renderSelectorAnnotatedLatexToHtml(annotated, {
    displayMode: true
  });
  for (const annotation of annotated.annotations) {
    const token = tokens.get(annotation.selectorId)!;
    html = html.replace(
      `data-kp-motion-id="${annotation.motionId}"`,
      `data-kp-motion-id="${annotation.motionId}" data-kp-equation-token="${escapeKpTutorialHtmlAttribute(token.id)}" data-kp-semantic-object="${escapeKpTutorialHtmlAttribute(token.semanticObjectId)}"`
    );
  }
  return `<div class="kp-eigenvector-stage__equation" data-kp-eigenvector-equation data-kp-equation-form="${escapeKpTutorialHtmlAttribute(form)}">${html}</div>`;
}

function equationLayout(
  form: Exclude<KpEigenvectorEquationForm, "none">
): readonly (string | { readonly tokenId: string })[] {
  const t = (tokenId: string) => ({ tokenId });
  if (form === "Av=3v") {
    return [t("equation.Av3v.A"), t("equation.Av3v.v-input"), t("equation.Av3v.equals"), t("equation.Av3v.3"), t("equation.Av3v.v-output")];
  }
  if (form === "Av=lambda-v") {
    return [t("equation.Avlambdav.A"), t("equation.Avlambdav.v-input"), t("equation.Avlambdav.equals"), t("equation.Avlambdav.lambda"), t("equation.Avlambdav.v-output")];
  }
  if (form === "A(2v)=6v") {
    return [t("equation.A2v6v.A"), "(", t("equation.A2v6v.2"), t("equation.A2v6v.v-input"), ")", t("equation.A2v6v.equals"), t("equation.A2v6v.6"), t("equation.A2v6v.v-output")];
  }
  return [t("equation.E3spanv.E3"), t("equation.E3spanv.equals"), t("equation.E3spanv.span"), "(", t("equation.E3spanv.v"), ")"];
}

function renderLine(
  className: string,
  from: readonly [number, number],
  to: readonly [number, number],
  semanticObjectId: string,
  markerId?: string,
  representationId?: string
): string {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  return `<line class="${className}" data-kp-semantic-object="${escapeKpTutorialHtmlAttribute(semanticObjectId)}"${representationId === undefined ? "" : ` data-kp-representation="${escapeKpTutorialHtmlAttribute(representationId)}"`} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${markerId === undefined ? "" : ` marker-end="url(#${markerId})"`} />`;
}

function point(coordinates: readonly [number, number]): readonly [number, number] {
  return [
    ORIGIN[0] + coordinates[0] * UNIT,
    ORIGIN[1] - coordinates[1] * UNIT
  ];
}
