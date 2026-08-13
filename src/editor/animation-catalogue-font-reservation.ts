const kpCatalogueChromeFont = "Kinetic Press New Computer Modern Mono";
let pending: Promise<void> | undefined;

/** Reserve the regular and emphasized chrome metrics before the loading shell
 * is replaced by results, controls, and inspector sections. */
export function prepareKpAnimationCatalogueChromeFonts(): Promise<void> {
  if (typeof document === "undefined" || document.fonts === undefined) {
    return Promise.resolve();
  }
  return pending ??= Promise.all([
    document.fonts.load(`400 1em "${kpCatalogueChromeFont}"`, "Preparing"),
    document.fonts.load(`500 1em "${kpCatalogueChromeFont}"`, "Details"),
    document.fonts.load(`700 1em "${kpCatalogueChromeFont}"`, "Artifacts")
  ]).then(() => undefined);
}
