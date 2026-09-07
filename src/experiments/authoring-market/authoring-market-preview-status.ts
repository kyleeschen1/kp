import type { KpAuthoringMarketBuildRevision } from "./authoring-market-preview-protocol.ts";

/** Build success is not display success: preparation and mount must finish first. */
export function projectKpAuthoringMarketPreviewStatus(
  draft: KpAuthoringMarketBuildRevision,
  displayedRevision?: string
) {
  const short = (revision: string) => revision.slice(0, 12);
  const displayed = displayedRevision === undefined
    ? "No valid preview is available yet."
    : `Displayed revision: ${short(displayedRevision)}. ${draft.status === "invalid" ? "Last valid preview retained." : ""}`.trim();
  const diagnostic = draft.diagnostic;
  const location = diagnostic?.file === undefined ? "" : `${diagnostic.file}${
    diagnostic.line === undefined ? "" : `:${diagnostic.line}${diagnostic.column === undefined ? "" : `:${diagnostic.column}`}`}`;
  const detail = [location, diagnostic?.sourceCode, diagnostic?.path,
    diagnostic?.message ?? "Preview could not compile."].filter(Boolean).join(" · ");
  const phase = draft.status === "valid" && displayedRevision !== draft.sourceRevision
    ? "preparing" : draft.status;
  const text = phase === "invalid"
    ? `Invalid draft ${short(draft.sourceRevision)}: ${detail} ${displayed}`
    : `Draft ${short(draft.sourceRevision)}: ${phase === "valid" ? "ready" : phase}. ${displayed}`;
  return Object.freeze({ phase, text, draftRevision: draft.sourceRevision, displayedRevision });
}
