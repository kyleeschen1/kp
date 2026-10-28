import { createFractionalRisingScroll } from "./fractional-rising-scroll.ts";
import { sampleKpReaderScrollProgress, type KpReaderPiecewiseScrollGeometry } from "../runtime/continuous-scroll-clock.ts";

/** One local layout experiment around the existing reader clock and renderer. */
export function mountFractionalRisingPassages(input: {
  readonly story: HTMLElement;
  readonly beats: readonly HTMLElement[];
}) {
  const document = input.story.ownerDocument;
  const window = document.defaultView!;
  const article = input.story.closest<HTMLElement>(".kp-lesson")!;
  const intro = document.createElement("div");
  intro.className = "kp-rising-intro kp-rising-passage";
  article.prepend(intro);
  for (const child of [...article.children]) {
    if (child !== intro && child !== input.story && !child.contains(input.story)) intro.append(child);
  }
  const passages = [intro, ...input.beats.map((beat) => {
    const passage = document.createElement("div");
    passage.className = "kp-rising-passage";
    passage.dataset["kpRisingBeat"] = beat.dataset["kpBeat"];
    passage.append(...beat.childNodes);
    beat.append(passage);
    return passage;
  })];
  const toc = document.querySelector<HTMLElement>(".kp-lesson-toc")!;
  const tocHome = document.createComment("rising passage navigation home");
  toc.before(tocHome);
  const navigation = document.createElement("details");
  navigation.className = "kp-rising-navigation";
  const summary = document.createElement("summary");
  summary.textContent = "Steps";
  navigation.append(summary, toc);
  document.querySelector(".kp-reader-masthead")!.append(navigation);
  const closeNavigation = (event: Event) => {
    if (event.target instanceof Element && event.target.closest("a")) navigation.open = false;
  };
  navigation.addEventListener("click", closeNavigation);
  document.body.dataset["kpReaderLayout"] = "rising-passages";
  const masthead = document.querySelector<HTMLElement>(".kp-reader-masthead")!;
  let headerHeight = masthead.getBoundingClientRect().height;
  document.body.style.setProperty("--kp-rising-header-height", `${headerHeight}px`);
  let positions: readonly number[] = [];
  let geometry: KpReaderPiecewiseScrollGeometry | undefined;
  const anchor = () => headerHeight + (window.innerHeight - headerHeight) / 2;
  return {
    scrollGeometry(narrative: KpReaderPiecewiseScrollGeometry) {
      geometry = createFractionalRisingScroll(narrative, window.innerHeight - headerHeight);
      return geometry;
    },
    activeBeat() {
      const position = window.scrollY + anchor();
      return input.beats.reduce<HTMLElement | undefined>((closest, beat, index) => {
        const candidate = positions[index + 1];
        const previous = closest === undefined ? undefined : positions[input.beats.indexOf(closest) + 1];
        return candidate !== undefined && (previous === undefined || Math.abs(candidate - position) < Math.abs(previous - position)) ? beat : closest;
      }, undefined);
    },
    arrival(beat: HTMLElement) {
      const index = input.beats.indexOf(beat);
      const position = positions[index + 1];
      if (index < 0 || position === undefined) return undefined;
      return { position, progress: Number(input.beats[Math.max(0, index - 1)]!.dataset["kpCheckpoint"]) };
    },
    encodeHref(href: URL) {
      if (geometry === undefined) return href;
      const start = geometry.stops[0]!.positionPx;
      const end = geometry.stops.at(-1)!.positionPx;
      // Holds share mathematical progress. Preserve their distinct reading
      // positions as a derived fraction, without adding another playback clock.
      const position = Math.min(1, Math.max(0, (window.scrollY + anchor() - start) / (end - start)));
      href.searchParams.set("kpReading", position.toFixed(6));
      return href;
    },
    restoreReadingPosition(href: string, progress: number) {
      const value = new URL(href).searchParams.get("kpReading");
      if (value === null || value.trim() === "" || geometry === undefined) return;
      const fraction = Number(value);
      if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) return;
      const start = geometry.stops[0]!.positionPx;
      const position = start + fraction * (geometry.stops.at(-1)!.positionPx - start);
      // Stale or hand-edited pairs must not override the semantic URL authority.
      if (Math.abs(sampleKpReaderScrollProgress(position, geometry) * 1000 - progress) > 1) return;
      window.scrollTo(0, position - anchor());
    },
    viewportAnchorFraction() {
      return (headerHeight + (window.innerHeight - headerHeight) / 2) / window.innerHeight;
    },
    measure() {
      headerHeight = masthead.getBoundingClientRect().height;
      document.body.style.setProperty("--kp-rising-header-height", `${headerHeight}px`);
      // Cache document coordinates with the reader's existing geometry reads.
      // Scroll sampling only projects opacity; it does not remeasure paragraphs.
      positions = passages.map((passage) => {
        const rect = passage.getBoundingClientRect();
        return window.scrollY + rect.top;
      });
    },
    render() {
      for (const [index, passage] of passages.entries()) {
        const position = positions[index];
        if (position === undefined) continue;
        const y = (position - window.scrollY - headerHeight) / Math.max(1, window.innerHeight - headerHeight);
        // Maximum emphasis at the boundary, then retreat before the equation's
        // center. These local optical values remain a human-review candidate.
        const t = Math.min(1, Math.max(0, y < 0.5 ? (y - 0.45) / 0.05 : (0.95 - y) / 0.45));
        const opacity = y < 0.5 ? t * t * (3 - 2 * t) : 0.35 + 0.65 * t * t * (3 - 2 * t);
        passage.style.opacity = String(opacity);
      }
    },
    dispose() {
      navigation.removeEventListener("click", closeNavigation);
      tocHome.replaceWith(toc);
      navigation.remove();
      for (const passage of passages) passage.replaceWith(...passage.childNodes);
      delete document.body.dataset["kpReaderLayout"];
      document.body.style.removeProperty("--kp-rising-header-height");
    }
  };
}
