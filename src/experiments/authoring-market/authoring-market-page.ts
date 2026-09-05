const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Expected authoring-market root.");

// The experiment is reached only through its physical opt-in document; no
// default reader/bootstrap dependency pulls this integration into other pages.
const { mountKpAuthoringMarket } = await import("./authoring-market-host.ts");
const session = mountKpAuthoringMarket({ root });
const onPageHide = (event: PageTransitionEvent) => {
  if (!event.persisted) session.dispose();
};
window.addEventListener("pagehide", onPageHide);
if (import.meta.hot !== undefined) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", onPageHide);
    session.dispose();
  });
}
