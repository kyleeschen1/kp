/**
 * Build output does not need source indentation. Removing whitespace that is
 * exclusively between tags preserves text nodes and embedded payload bytes.
 */
export function compactKpCompiledReaderHtml(html: string): string {
  return html
    .replace(/>\s+</g, "><")
    // Vite emits these on same-origin asset URLs, where they do not alter the
    // fetch mode but do add repeated route payload.
    .replace(/ crossorigin(?=[ >])/g, "")
    // `module` is a valid unquoted HTML attribute value and Vite repeats it on
    // every injected dependency script.
    .replace(/ type="module"/g, " type=module")
    // A declaration-list's final semicolon is optional. KaTeX emits thousands
    // of single-declaration style attributes, so remove only that terminal byte.
    .replace(/(style="[^"]*);"/g, '$1"')
    .trim();
}
