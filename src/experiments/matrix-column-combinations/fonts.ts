/** Request the actual faces before measuring connected native endpoints.
 * fonts.ready alone can resolve before a fresh page has requested these faces. */
export async function prepareColumnFonts() {
  await Promise.all(["KaTeX_Main", "KaTeX_Size3"].map(face => document.fonts.load(`20px ${face}`)));
  await document.fonts.ready;
}
