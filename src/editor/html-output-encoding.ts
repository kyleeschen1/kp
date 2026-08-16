// Preserve the editor-facing names while the parser-context contract lives
// with the lowest framework-neutral rendering boundary that owns HTML output.
export {
  encodeKpHtmlAttribute as encodeKpEditorHtmlAttribute,
  encodeKpHtmlText as encodeKpEditorHtmlText
} from "../rendering/html-output-encoding.ts";
