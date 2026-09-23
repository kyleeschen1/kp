import { encodeKpHtmlText } from "../../rendering/html-output-encoding.ts";

/** Closed details remain hidden in WebKit's print tree. Publish a print-only
 * projection from the identical trusted body so no-JS printing loses no evidence.
 * Bodies must have no document IDs or interactive controls. */
export function renderCodePrintableDisclosure(title: string, body: string) {
  if (/<[^>]+\sid\s*=|<(?:input|button|select|textarea|details)\b/i.test(body)) throw new Error("Printable code disclosure requires static content without document IDs");
  return `<details class="code-screen-disclosure"><summary>${encodeKpHtmlText(title)}</summary>${body}</details><section class="code-print-disclosure"><h3>${encodeKpHtmlText(title)}</h3>${body}</section>`;
}
