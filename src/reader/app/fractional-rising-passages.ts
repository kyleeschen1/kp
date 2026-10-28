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
  let centers: readonly number[] = [];
  return {
    measure() {
      // Cache document coordinates with the reader's existing geometry reads.
      // Scroll sampling only projects opacity; it does not remeasure paragraphs.
      centers = passages.map((passage) => {
        const rect = passage.getBoundingClientRect();
        return window.scrollY + rect.top + rect.height / 2;
      });
    },
    render() {
      for (const [index, passage] of passages.entries()) {
        const center = centers[index];
        if (center === undefined) continue;
        const y = (center - window.scrollY) / window.innerHeight;
        // Maximum emphasis at the boundary, then retreat before the equation's
        // center. These local optical values remain a human-review candidate.
        const t = Math.min(1, Math.max(0, y < 0.5 ? (y - 0.30) / 0.20 : (0.95 - y) / 0.45));
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
    }
  };
}
