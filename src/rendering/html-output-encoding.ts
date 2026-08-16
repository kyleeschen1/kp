/** Encode untrusted content for an HTML text node. */
export function encodeKpHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Encode untrusted content for a double-quoted HTML attribute value. */
export function encodeKpHtmlAttribute(value: string): string {
  return encodeKpHtmlText(value).replaceAll('"', "&quot;");
}
