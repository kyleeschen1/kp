import type { KpTutorialCardExportArtifact } from "./export-artifact.ts";
import {
  escapeKpTutorialHtmlAttribute as escapeAttr,
  escapeKpTutorialHtmlText as escapeHtml,
  escapeKpTutorialScriptJson as escapeScriptJson
} from "./generated-html-escaping.ts";

export interface KpTutorialCardIframeDocumentInput {
  readonly artifact: KpTutorialCardExportArtifact;
  readonly title: string;
  readonly bodyHtml: string;
}

export function renderKpTutorialCardIframeDocument(
  input: KpTutorialCardIframeDocumentInput
): string {
  const { artifact, title, bodyHtml } = input;

  if (artifact.artifactKind !== "iframe-document") {
    throw new Error(
      `Export artifact ${artifact.id} is not an iframe document artifact.`
    );
  }

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
    `  <script type="application/json" data-kp-export-artifact-json>${escapeScriptJson(
      JSON.stringify(artifact)
    )}</script>`,
    "</head>",
    `<body data-kp-export-payload="${escapeAttr(artifact.payloadKind)}">`,
    bodyHtml,
    "</body>",
    "</html>"
  ].join("\n");
}
