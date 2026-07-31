/** Encode untrusted content for an HTML text node. */
export function encodeKpEditorHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Encode untrusted content for a double-quoted HTML attribute value. */
export function encodeKpEditorHtmlAttribute(value: string): string {
  return encodeKpEditorHtmlText(value).replaceAll('"', "&quot;");
}
