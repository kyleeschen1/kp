/**
 * Escapes untrusted text for an HTML text node in a generated tutorial or
 * export document. Attribute and script-data contexts have stricter helpers.
 */
export function escapeKpTutorialHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Generated tutorial documents consistently use double-quoted attributes, so
 * apostrophes remain text while quotes receive the additional encoding.
 */
export function escapeKpTutorialHtmlAttribute(value: string): string {
  return escapeKpTutorialHtmlText(value).replaceAll("\"", "&quot;");
}

/**
 * JSON in a script element is already JSON-encoded. This second boundary
 * prevents an HTML parser from closing the element and preserves JS separators.
 */
export function escapeKpTutorialScriptJson(value: string): string {
  return value
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
