import type { KpCentroidExtractionState } from "../semantic/centroid-extraction-model.ts";
import { encodeKpHtmlText } from "./html-output-encoding.ts";

/** Native endpoint typography and syntax roles match the shared token painter. */
export function renderCentroidNativeCode(state: KpCentroidExtractionState): string {
  let offset = 0;
  const html = state.tokens.map(token => {
    const whitespace = encodeKpHtmlText(state.source.slice(offset, token.startOffset));
    offset = token.endOffset;
    return `${whitespace}<span data-kp-typescript-syntax-kind="${token.kind}">${encodeKpHtmlText(token.text)}</span>`;
  }).join("");
  return html + encodeKpHtmlText(state.source.slice(offset));
}
