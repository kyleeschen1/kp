import type {
  KpTutorialFrameSequenceArtifact,
  KpTutorialFrameSequenceFrame
} from "./frame-sequence-artifact.ts";
import {
  escapeKpTutorialHtmlAttribute as escapeAttr,
  escapeKpTutorialHtmlText as escapeHtml,
  escapeKpTutorialScriptJson as escapeScriptJson
} from "./generated-html-escaping.ts";

export interface RenderKpTutorialFrameSequencePreviewInput {
  readonly sequence: KpTutorialFrameSequenceArtifact;
  readonly title: string;
}

export function renderKpTutorialFrameSequencePreviewHtml(
  input: RenderKpTutorialFrameSequencePreviewInput
): string {
  const { sequence, title } = input;
  const artifact = sequence.artifact;

  return [
    "<!doctype html>",
    `<html lang="en" data-kp-export-artifact="${escapeAttr(
      artifact.id
    )}" data-kp-export-manifest="${escapeAttr(
      artifact.manifestId
    )}" data-kp-export-profile="${escapeAttr(
      artifact.profileId
    )}" data-kp-export-kind="${escapeAttr(
      artifact.exportKind
    )}" data-kp-export-target="${escapeAttr(
      artifact.target
    )}" data-kp-export-status="${escapeAttr(artifact.status)}">`,
    "<head>",
    `  <meta charset="utf-8" />`,
    `  <meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `  <title>${escapeHtml(title)}</title>`,
    `  <script type="application/json" data-kp-frame-sequence-json>${escapeScriptJson(
      JSON.stringify(sequence)
    )}</script>`,
    "</head>",
    `<body data-kp-export-payload="${escapeAttr(
      artifact.payloadKind
    )}" data-kp-frame-sequence="${escapeAttr(sequence.id)}">`,
    `  <ol data-kp-frame-sequence-frames="${escapeAttr(sequence.id)}">`,
    ...sequence.frames.map(renderFrameRow),
    "  </ol>",
    "</body>",
    "</html>"
  ].join("\n");
}

function renderFrameRow(frame: KpTutorialFrameSequenceFrame): string {
  return `    <li data-kp-frame-sequence-frame="${escapeAttr(
    frame.id
  )}" data-kp-frame-index="${frame.index}" data-kp-frame-progress="${escapeAttr(
    String(frame.progress)
  )}" data-kp-frame-beat="${escapeAttr(
    String(frame.beat)
  )}" data-kp-frame-domains="${escapeAttr(frameDomains(frame).join(" "))}">${escapeHtml(
    frameSummary(frame)
  )}</li>`;
}

function frameSummary(frame: KpTutorialFrameSequenceFrame): string {
  return [
    `Frame ${frame.index}`,
    `Progress ${frame.progress}`,
    equationSummary(frame),
    graphSummary(frame),
    programmingSummary(frame)
  ]
    .filter((summary): summary is string => summary !== undefined)
    .join(" · ");
}

function equationSummary(
  frame: KpTutorialFrameSequenceFrame
): string | undefined {
  const transitionIndex = frame.equation?.equationFrame.transitionIndex;

  return transitionIndex === undefined
    ? undefined
    : `Equation transition ${transitionIndex}`;
}

function graphSummary(frame: KpTutorialFrameSequenceFrame): string | undefined {
  const graphProgress = frame.graph?.graphFrame.graphProgress;

  return graphProgress === undefined
    ? undefined
    : `Graph progress ${graphProgress}`;
}

function programmingSummary(
  frame: KpTutorialFrameSequenceFrame
): string | undefined {
  return frame.programming?.programmingFrame.traceFrame.stepId;
}

function frameDomains(
  frame: KpTutorialFrameSequenceFrame
): readonly string[] {
  return [
    frame.equation === undefined ? undefined : "equation",
    frame.graph === undefined ? undefined : "graph",
    frame.programming === undefined ? undefined : "programming"
  ].filter((domain): domain is string => domain !== undefined);
}
