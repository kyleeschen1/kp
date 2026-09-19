import type { KpTypeScriptSourceToken } from "../semantic/typescript-source-tokens.ts";
import { encodeKpHtmlText } from "./html-output-encoding.ts";

/** Native endpoint typography and syntax roles match the shared token painter. */
export function renderCentroidNativeCode(state: { readonly source: string; readonly tokens: readonly (KpTypeScriptSourceToken & { readonly entityId?: string })[] }): string {
  let offset = 0;
  const html = state.tokens.map(token => {
    const whitespace = encodeKpHtmlText(state.source.slice(offset, token.startOffset));
    offset = token.endOffset;
    const identity = token.entityId === undefined ? "" : ` data-kp-typescript-token-entity-id="${encodeKpHtmlText(token.entityId)}"`;
    return `${whitespace}<span data-kp-typescript-syntax-kind="${token.kind}"${identity}>${encodeKpHtmlText(token.text)}</span>`;
  }).join("");
  return html + encodeKpHtmlText(state.source.slice(offset));
}
