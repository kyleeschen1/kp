import katex from "katex";

import type { KpLinearEquationTrace } from "../../domains/public-api.ts";
import { formatConceptRoomRoute } from "../kernel/public-api.ts";
import {
  projectLinearEquationBalanceExemplar,
  projectLinearEquationTrace,
  type KpBalanceSceneIr
} from "../projections/public-api.ts";

import type { KpConceptRoomArtifactLike } from "./concept-room-artifact.ts";
import {
  conceptReviewInspectionSchema,
  type KpConceptReviewInspection
} from "./concept-review-inspection.ts";
import { structuralConceptRoomTheme } from "./concept-room-theme.ts";

export interface KpLinearEquationConceptReviewPublication {
  readonly canonicalPath: string;
  readonly html: string;
  readonly inspection: KpConceptReviewInspection;
}

export function publishLinearEquationConceptReview(input: {
  readonly artifact: KpConceptRoomArtifactLike;
  readonly trace: KpLinearEquationTrace;
  readonly diagramSemanticId: string;
}): KpLinearEquationConceptReviewPublication {
  requireReviewInputs(input.artifact, input.trace, input.diagramSemanticId);
  const checkpoints = input.artifact.manifest.checkpoints.map((checkpoint) => {
    const symbolic = projectLinearEquationTrace(input.trace, checkpoint.progressPermille);
    if (!checkpoint.semanticRefs.includes(symbolic.equationSemanticId)) {
      throw new Error(
        `Review checkpoint ${checkpoint.id} does not reference projected equation ${symbolic.equationSemanticId}.`
      );
    }
    const balance = projectLinearEquationBalanceExemplar(input.trace, checkpoint.progressPermille, {
      diagramSemanticId: input.diagramSemanticId
    });
    const exploreUrl = exploreRoute(input.artifact, checkpoint);
    return { checkpoint, symbolic, balance, exploreUrl };
  });
  const inspection = conceptReviewInspectionSchema.parse({
    schemaVersion: "kp.concept-review-inspection.v1",
    conceptId: input.artifact.manifest.conceptId,
    conceptVersion: input.artifact.manifest.version,
    artifactIntegrity: input.artifact.integrity,
    canonicalPath: input.artifact.manifest.route.canonicalPath,
    sourcePath: input.artifact.manifest.provenance.sourcePath,
    checkpoints: checkpoints.map(({ checkpoint, symbolic, exploreUrl }) => ({
      id: checkpoint.id,
      anchor: `checkpoint-${checkpoint.id}`,
      progressPermille: checkpoint.progressPermille,
      frameId: symbolic.frameId,
      equationSemanticId: symbolic.equationSemanticId,
      semanticRefs: checkpoint.semanticRefs,
      exploreUrl
    }))
  });
  const html = renderReviewDocument(input.artifact, checkpoints, inspection);
  return Object.freeze({
    canonicalPath: input.artifact.manifest.route.canonicalPath,
    html,
    inspection
  });
}

function renderReviewDocument(
  artifact: KpConceptRoomArtifactLike,
  checkpoints: readonly ReviewCheckpoint[],
  inspection: KpConceptReviewInspection
): string {
  const review = artifact.manifest.review;
  return `<!doctype html>
<html lang="en" data-kp-concept-review="true">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="kp-concept-id" content="${escapeAttribute(artifact.manifest.conceptId)}">
  <meta name="kp-artifact-integrity" content="${escapeAttribute(artifact.integrity)}">
  <title>${escapeHtml(review.title)}</title>
  <style>
    @media print {
      [data-kp-review-explore-link] { display: none; }
      [data-kp-review-checkpoint] { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main data-kp-review-main>
    <header>
      <p>See concepts move</p>
      <h1>${escapeHtml(review.title)}</h1>
      <p>${escapeHtml(review.summary)}</p>
    </header>
    ${renderTableOfContents(checkpoints)}
    <article>
      ${checkpoints.map(renderCheckpoint).join("\n")}
    </article>
    <script type="application/json" data-kp-review-inspection>${safeJson(inspection)}</script>
  </main>
</body>
</html>`;
}

function renderTableOfContents(checkpoints: readonly ReviewCheckpoint[]): string {
  return `<nav aria-label="Concept checkpoints" data-kp-review-toc>
      <h2>On this page</h2>
      <ol>
        ${checkpoints.map(({ checkpoint }) =>
          `<li><a href="#checkpoint-${escapeAttribute(checkpoint.id)}">${escapeHtml(checkpoint.title)}</a></li>`
        ).join("\n        ")}
      </ol>
    </nav>`;
}

function renderCheckpoint(item: ReviewCheckpoint): string {
  const { checkpoint, symbolic, balance, exploreUrl } = item;
  const equationLatex = symbolic.tokens.map((token) => token.latex).join(" ");
  const equationMath = katex.renderToString(equationLatex, {
    displayMode: true,
    output: "htmlAndMathml",
    throwOnError: true,
    trust: false
  });
  return `<section id="checkpoint-${escapeAttribute(checkpoint.id)}" data-kp-review-checkpoint="${escapeAttribute(checkpoint.id)}" data-kp-frame-id="${escapeAttribute(symbolic.frameId)}">
        <h2>${escapeHtml(checkpoint.title)}</h2>
        <p>${escapeHtml(checkpoint.explanation)}</p>
        <div role="math" aria-label="${escapeAttribute(symbolic.accessibleText)}" data-kp-review-equation data-kp-equation-semantic-id="${escapeAttribute(symbolic.equationSemanticId)}" class="${roleClass("equation.expression")}">
          ${equationMath}
        </div>
        ${renderStaticBalanceSvg(balance, checkpoint.semanticRefs)}
        <p><a data-kp-review-explore-link href="${escapeAttribute(exploreUrl)}">Explore this state</a></p>
      </section>`;
}

function renderStaticBalanceSvg(
  balance: KpBalanceSceneIr,
  focusSemanticIds: readonly string[]
): string {
  const focus = new Set(focusSemanticIds);
  const diagramClasses = roleClasses(
    "diagram.balance",
    focus.has(balance.diagramSemanticId)
  );
  const sideMarkup = balance.sides.map((side) => {
    const center = side.side === "left" ? 190 : 450;
    const firstLabelX = center - ((side.terms.length - 1) * 90) / 2 - 45;
    const terms = side.terms.map((term, index) => {
      const math = katex.renderToString(term.latex, {
        displayMode: false,
        output: "htmlAndMathml",
        throwOnError: true,
        trust: false
      });
      return `<foreignObject x="${firstLabelX + index * 90}" y="205" width="90" height="44" data-kp-balance-term="${escapeAttribute(term.id)}" data-kp-semantic-id="${escapeAttribute(term.semanticId)}" class="${roleClasses("equation.expression", focus.has(term.semanticId))}"><span xmlns="http://www.w3.org/1999/xhtml" aria-hidden="true">${math}</span></foreignObject>`;
    }).join("");
    return `<g data-kp-balance-side="${side.side}">${terms}</g>`;
  }).join("");
  const operations = balance.operationApplications.map((application) =>
    `<text x="${application.side === "left" ? 190 : 450}" y="72" text-anchor="middle" data-kp-balance-operation-application="${escapeAttribute(application.id)}" data-kp-operation-semantic-id="${escapeAttribute(application.operationSemanticId)}" class="${roleClasses("equation.operation", focus.has(application.operationSemanticId))}">${escapeHtml(application.spoken)}</text>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" role="img" aria-label="${escapeAttribute(balance.accessibleText)}" data-kp-review-balance-svg data-kp-frame-id="${escapeAttribute(balance.frameId)}" data-kp-diagram-semantic-id="${escapeAttribute(balance.diagramSemanticId)}" class="${diagramClasses}">
          <title>${escapeHtml(balance.accessibleText)}</title>
          <g data-kp-balance-structure>
            <line x1="80" x2="560" y1="200" y2="200" stroke="currentColor" />
            <path d="M 320 200 L 278 280 L 362 280 Z" fill="none" stroke="currentColor" />
            <path d="M 190 200 L 80 250 L 300 250 Z" fill="none" stroke="currentColor" />
            <path d="M 450 200 L 340 250 L 560 250 Z" fill="none" stroke="currentColor" />
          </g>
          ${sideMarkup}${operations}
        </svg>`;
}

function exploreRoute(
  artifact: KpConceptRoomArtifactLike,
  checkpoint: KpConceptRoomArtifactLike["manifest"]["checkpoints"][number]
): string {
  const provider = artifact.manifest.providers[0];
  return formatConceptRoomRoute({
    schemaVersion: "kp.room-route.v1",
    conceptId: artifact.manifest.conceptId,
    conceptVersion: artifact.manifest.version,
    checkpoint: checkpoint.id,
    timePermille: checkpoint.progressPermille,
    mode: "touch",
    projection: "balance",
    parameters: {},
    focus: checkpoint.semanticRefs,
    ...(provider === undefined ? {} : {
      provider: {
        id: provider.id,
        protocol: provider.protocol,
        version: provider.version,
        provenance: `${artifact.manifest.provenance.sourcePath}#${artifact.integrity}`
      }
    })
  });
}

function requireReviewInputs(
  artifact: KpConceptRoomArtifactLike,
  trace: KpLinearEquationTrace,
  diagramSemanticId: string
): void {
  if (artifact.manifest.checkpoints.length === 0) throw new Error("Review publication requires checkpoints.");
  if (!artifact.manifest.review.checkpointAnchors) throw new Error("Review publication requires checkpoint anchors.");
  if (!artifact.manifest.semanticRefs.some((ref) => ref.id === diagramSemanticId)) {
    throw new Error(`Review diagram semantic reference ${diagramSemanticId} is not published.`);
  }
  if (artifact.manifest.providers[0]?.id !== trace.provenance.providerId) {
    throw new Error("Review trace provider does not match the published artifact.");
  }
  const provider = artifact.manifest.providers[0];
  if (provider?.version !== trace.provenance.providerVersion ||
      provider?.protocol !== trace.provenance.protocolVersion) {
    throw new Error("Review trace provider version does not match the published artifact.");
  }
}

function roleClass(role: keyof typeof structuralConceptRoomTheme.roles): string {
  return structuralConceptRoomTheme.roles[role].className;
}

function roleClasses(
  role: keyof typeof structuralConceptRoomTheme.roles,
  focused: boolean
): string {
  return [roleClass(role), focused ? roleClass("focus.primary") : undefined]
    .filter((value): value is string => value !== undefined)
    .join(" ");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

type ReviewCheckpoint = {
  readonly checkpoint: KpConceptRoomArtifactLike["manifest"]["checkpoints"][number];
  readonly symbolic: ReturnType<typeof projectLinearEquationTrace>;
  readonly balance: KpBalanceSceneIr;
  readonly exploreUrl: string;
};
