import { createFractionalRisingScroll, fractionalCaptionFrame } from "./fractional-rising-scroll.ts";
import { sampleKpReaderScrollProgress, type KpReaderPiecewiseScrollGeometry } from "../runtime/continuous-scroll-clock.ts";
import { mountFractionalPassageSliders } from './fractional-passage-sliders.ts';

/** One local layout experiment around the existing reader clock and renderer. */
export function mountFractionalRisingPassages(input: {
  readonly story: HTMLElement;
  readonly beats: readonly HTMLElement[];
  readonly onFind: () => void;
  readonly onSeek: (progress: number, position: number) => void;
}) {
  const document = input.story.ownerDocument;
  const window = document.defaultView!;
  const article = input.story.closest<HTMLElement>(".kp-lesson")!;
  // The compiler owns structural markup so slow imports never expose the old
  // article layout. Enhancement binds the original nodes instead of moving them.
  const required = (root: ParentNode, selector: string): HTMLElement => {
    const node = root.querySelector<HTMLElement>(selector);
    if (node === null) throw new Error(`Missing compiled caption shell: ${selector}`);
    return node;
  };
  const pin = required(article, '.kp-caption-pin');
  const passages = input.beats.map((beat) => required(beat, '.kp-rising-passage'));
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
  const slots = input.beats.map((beat) => required(article, `[data-kp-caption-slot="${beat.dataset['kpBeat']}"]`));
  const frame = required(document, '.kp-caption-frame');
  // A clipped preview must not become a second searchable match, or prevent
  // native find from revealing the full, original instruction via beforematch.
  const preview = document.createElement("div");
  preview.className = "kp-rising-passage kp-caption-preview";
  preview.inert = true;
  preview.setAttribute("aria-hidden", "true");
  pin.append(preview);
  let previewIndex: number | undefined;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let documentReturnIndex = 0;
  let renderedProgress = 0;
  const sliders = mountFractionalPassageSliders({ beats: input.beats, passages, geometry: () => geometry, seek: input.onSeek });
  const ease = (t: number) => t * t * (3 - 2 * t);
  const render = (progress = renderedProgress) => {
    renderedProgress = progress;
    sliders.render(progress);
    document.body.dataset["kpCaptionMode"] = readAll ? "document" : "captions";
    const sample = fractionalCaptionFrame(positions, window.scrollY + anchor(), window.innerHeight - headerHeight);
    const exchange = sample?.exchange ?? 0;
    const approaching = ease(sample?.preview ?? 0);
    const travel = .12 * approaching + .88 * ease(exchange);
    // Both captions ride the same translation from the preview's first arrival.
    // Their spacing is layout-owned; departure is clipping, never an opacity fade.
    const offset = readAll || reducedMotion.matches ? "0px"
      : `calc((var(--kp-caption-card-height) - var(--kp-caption-text-height) - 44px) * ${-travel})`;
    // Passage travel happens only during a held equation, so the approaching
    // explanation can be legible without competing with mathematical motion.
    const arriving = ease(Math.max(0, (travel - .92) / .08));
    frame.hidden = readAll;
    if (previewIndex !== sample?.nextIndex) {
      previewIndex = sample?.nextIndex;
      preview.replaceChildren();
      if (previewIndex !== undefined) {
        preview.append(passages[previewIndex]!.firstElementChild!.cloneNode(true));
        for (const element of preview.querySelectorAll("[id]")) element.removeAttribute("id");
        for (const range of preview.querySelectorAll<HTMLInputElement>('input[type="range"]')) {
          range.disabled = true;
          range.value = '0';
          range.style.setProperty('--kp-operation-progress', '0%');
        }
      }
    }
    const previewVisible = !readAll && !reducedMotion.matches && approaching > 0 && previewIndex !== undefined;
    preview.hidden = !previewVisible;
    preview.dataset["kpCaptionActive"] = String(previewVisible);
    preview.style.setProperty("--kp-caption-opacity", String(.5 + .5 * arriving));
    preview.style.setProperty("--kp-caption-offset", offset);
    passages.forEach((passage, index) => {
      let opacity = index === sample?.index ? 1 : 0;
      if (reducedMotion.matches) opacity = index === (exchange < .5 ? sample?.index : sample?.nextIndex) ? 1 : 0;
      const visible = readAll || opacity > 0;
      const activeValue = String(!readAll && visible);
      if (passage.dataset["kpCaptionActive"] !== activeValue) passage.dataset["kpCaptionActive"] = activeValue;
      passage.style.setProperty("--kp-caption-opacity", String(readAll ? 1 : opacity));
      passage.style.setProperty("--kp-caption-offset", offset);
      if (visible && passage.hasAttribute("hidden")) passage.removeAttribute("hidden");
      else if (!visible && passage.getAttribute("hidden") !== "until-found") passage.setAttribute("hidden", "until-found");
    });
  };
  const toggleReading = () => {
    if (!readAll) documentReturnIndex = fractionalCaptionFrame(positions, window.scrollY + anchor(), window.innerHeight - headerHeight)?.index ?? 0;
    readAll = !readAll;
    readingMode.setAttribute("aria-pressed", String(readAll));
    render();
    if (readAll) passages[documentReturnIndex]!.scrollIntoView({ block: 'center' });
    else window.scrollTo(0, positions[documentReturnIndex]! - anchor());
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
    readingDocument: () => readAll,
    scrollGeometry(narrative: KpReaderPiecewiseScrollGeometry) {
      geometry = createFractionalRisingScroll(narrative, window.innerHeight - headerHeight);
      return geometry;
    },
    activeBeat() {
      if (readAll) return input.beats[documentReturnIndex];
      const position = window.scrollY + anchor();
      let index = 0;
      while (index + 1 < input.beats.length && (positions[index + 1] ?? Infinity) <= position) index += 1;
      return input.beats[index];
    },
    arrival(beat: HTMLElement) {
      const index = input.beats.indexOf(beat);
      if (readAll && index >= 0) documentReturnIndex = index;
      const position = readAll && index >= 0
        ? window.scrollY + passages[index]!.getBoundingClientRect().top : positions[index];
      if (index < 0 || position === undefined) return undefined;
      return { position, progress: Number(input.beats[Math.max(0, index - 1)]!.dataset["kpCheckpoint"]) };
    },
    encodeHref(href: URL) {
      if (geometry === undefined || readAll) return href;
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
    anchorTop(beat: HTMLElement) {
      const index = input.beats.indexOf(beat);
      if (index < 0) throw new Error('Caption clock requires its authored beat.');
      return readAll && positions[index] !== undefined
        ? positions[index]! - window.scrollY : slots[index]!.getBoundingClientRect().top;
    },
    measure() {
      headerHeight = masthead.getBoundingClientRect().height;
      document.body.style.setProperty("--kp-rising-header-height", `${headerHeight}px`);
      // Cache document coordinates with the reader's existing geometry reads.
      // Slots remain in flow when captions are pinned or hidden. Measuring
      // caption paint would make resize and find change the animation clock.
      if (readAll && positions.length > 0) return;
      positions = slots.map((slot) => {
        const rect = slot.getBoundingClientRect();
        return window.scrollY + rect.top;
      });
    },
    render,
    dispose() {
      sliders.dispose();
      frame.remove();
      preview.remove();
      readingMode.removeEventListener("click", toggleReading);
      readingMode.remove();
      for (const passage of passages) passage.removeEventListener("beforematch", revealMatch);
      navigation.removeEventListener("click", closeNavigation);
      tocHome.replaceWith(toc);
      navigation.remove();
      for (const passage of passages) passage.replaceWith(...passage.firstElementChild!.childNodes);
      delete document.body.dataset["kpReaderLayout"];
      delete document.body.dataset["kpCaptionMode"];
      document.body.style.removeProperty("--kp-rising-header-height");
    }
  };
}
