import { createFractionalRisingScroll, fractionalCaptionFrame } from "./fractional-rising-scroll.ts";
import { sampleKpReaderScrollProgress, type KpReaderPiecewiseScrollGeometry } from "../runtime/continuous-scroll-clock.ts";

/** One local layout experiment around the existing reader clock and renderer. */
export function mountFractionalRisingPassages(input: {
  readonly story: HTMLElement;
  readonly beats: readonly HTMLElement[];
  readonly onFind: () => void;
}) {
  const document = input.story.ownerDocument;
  const window = document.defaultView!;
  const article = input.story.closest<HTMLElement>(".kp-lesson")!;
  const intro = document.createElement("div");
  intro.className = "kp-rising-intro kp-rising-passage";
  const introSlot = document.createElement("div");
  introSlot.className = "kp-caption-intro-slot";
  introSlot.append(intro);
  article.prepend(introSlot);
  for (const child of [...article.children]) {
    if (child !== introSlot && child !== input.story && !child.contains(input.story)) intro.append(child);
  }
  const passages: HTMLElement[] = [intro, ...input.beats.map((beat) => {
    const passage = document.createElement("div");
    passage.className = "kp-rising-passage";
    passage.dataset["kpRisingBeat"] = beat.dataset["kpBeat"];
    passage.id = `caption.${beat.dataset["kpBeat"]}`;
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
  const supportsFind = "onbeforematch" in document.documentElement;
  let readAll = !supportsFind;
  const readingMode = document.createElement("button");
  readingMode.type = "button";
  readingMode.className = "kp-caption-reading-mode";
  readingMode.textContent = "Read all";
  readingMode.setAttribute("aria-pressed", String(readAll));
  readingMode.disabled = !supportsFind;
  masthead.insertBefore(readingMode, navigation);
  const slots = [introSlot, ...input.beats];
  const frame = document.createElement("div");
  frame.className = "kp-caption-frame";
  const rule = document.createElement("div");
  rule.className = "kp-caption-rule";
  rule.setAttribute("aria-hidden", "true");
  const rail = document.createElement("div");
  rail.className = "kp-caption-rail";
  rail.setAttribute("role", "progressbar");
  rail.setAttribute("aria-valuemin", "0");
  rail.setAttribute("aria-valuemax", "100");
  const marker = document.createElement("span");
  marker.className = "kp-caption-marker";
  rail.append(marker);
  const railLabel = document.createElement("span");
  railLabel.className = "kp-caption-rail-label";
  railLabel.setAttribute("aria-hidden", "true");
  frame.append(rule, rail, railLabel);
  document.body.append(frame);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ease = (t: number) => t * t * (3 - 2 * t);
  const render = () => {
    document.body.dataset["kpCaptionMode"] = readAll ? "document" : "captions";
    const sample = fractionalCaptionFrame(positions, window.scrollY + anchor(), window.innerHeight - headerHeight);
    const exchange = sample?.exchange ?? 0;
    const departing = ease(Math.min(1, exchange * 2));
    const arriving = ease(Math.max(0, exchange * 2 - 1));
    frame.hidden = readAll;
    rail.style.setProperty("--kp-caption-progress", String(sample?.rail ?? 0));
    rail.setAttribute("aria-valuenow", String(Math.round((sample?.rail ?? 0) * 100)));
    const final = sample?.nextIndex === undefined;
    rail.setAttribute("aria-label", final ? "Scroll to finish this explanation" : "Scroll to the next caption");
    railLabel.textContent = final ? ((sample?.rail ?? 0) === 1 ? "Done" : "Finish") : "Next";
    passages.forEach((passage, index) => {
      let opacity = index === sample?.index ? 1 - departing : index === sample?.nextIndex ? arriving : 0;
      if (reducedMotion.matches) opacity = index === (exchange < .5 ? sample?.index : sample?.nextIndex) ? 1 : 0;
      const visible = readAll || opacity > 0;
      const activeValue = String(!readAll && visible);
      if (passage.dataset["kpCaptionActive"] !== activeValue) passage.dataset["kpCaptionActive"] = activeValue;
      passage.style.setProperty("--kp-caption-opacity", String(readAll ? 1 : opacity));
      const offset = readAll || reducedMotion.matches ? 0 : index === sample?.index ? -24 * departing : 20 * (1 - arriving);
      passage.style.setProperty("--kp-caption-offset", `${offset}px`);
      if (visible && passage.hasAttribute("hidden")) passage.removeAttribute("hidden");
      else if (!visible && passage.getAttribute("hidden") !== "until-found") passage.setAttribute("hidden", "until-found");
    });
  };
  const toggleReading = () => {
    readAll = !readAll;
    readingMode.setAttribute("aria-pressed", String(readAll));
    render();
  };
  readingMode.addEventListener("click", toggleReading);
  const revealMatch = (event: Event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const index = passages.indexOf(event.target);
    const position = positions[index];
    if (index < 0 || position === undefined) return;
    // Native find reveals the actual authored node. Align its stable slot
    // before the browser scrolls to the now-visible caption; no duplicate text.
    input.onFind();
    window.scrollTo(0, position - anchor() + 1);
    render();
  };
  for (const passage of passages) passage.addEventListener("beforematch", revealMatch);
  return {
    scrollGeometry(narrative: KpReaderPiecewiseScrollGeometry) {
      geometry = createFractionalRisingScroll(narrative, window.innerHeight - headerHeight);
      return geometry;
    },
    activeBeat() {
      const position = window.scrollY + anchor();
      let index = 0;
      while (index + 1 < input.beats.length && (positions[index + 2] ?? Infinity) <= position) index += 1;
      return input.beats[index];
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
      // Slots remain in flow when captions are pinned or hidden. Measuring
      // caption paint would make resize and find change the animation clock.
      positions = slots.map((slot) => {
        const rect = slot.getBoundingClientRect();
        return window.scrollY + rect.top;
      });
    },
    render,
    dispose() {
      frame.remove();
      readingMode.removeEventListener("click", toggleReading);
      readingMode.remove();
      for (const passage of passages) passage.removeEventListener("beforematch", revealMatch);
      navigation.removeEventListener("click", closeNavigation);
      tocHome.replaceWith(toc);
      navigation.remove();
      for (const passage of passages) passage.replaceWith(...passage.childNodes);
      introSlot.replaceWith(...introSlot.childNodes);
      delete document.body.dataset["kpReaderLayout"];
      delete document.body.dataset["kpCaptionMode"];
      document.body.style.removeProperty("--kp-rising-header-height");
    }
  };
}
