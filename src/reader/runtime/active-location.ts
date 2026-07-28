export interface KpReaderActiveLocationService {
  sync(activeId: string): void;
}

export function createKpReaderActiveLocationService(input: {
  readonly toc: HTMLElement;
  readonly beats: readonly HTMLElement[];
}): KpReaderActiveLocationService {
  const links = [...input.toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const beatsById = new Map(input.beats.map((beat) => [requiredBeatId(beat), beat]));
  const linkCounts = new Map<string, number>();
  for (const link of links) {
    const href = link.getAttribute("href") ?? "";
    const linkId = href.startsWith("#") ? decodeURIComponent(href.slice(1)) : "";
    linkCounts.set(linkId, (linkCounts.get(linkId) ?? 0) + 1);
  }
  let currentActiveId: string | undefined;

  return {
    sync(activeId: string): void {
      if (
        !beatsById.has(activeId) ||
        linkCounts.get(activeId) !== 1
      ) {
        throw new Error(`Reader expected one beat and TOC link for active location ${activeId}.`);
      }
      if (currentActiveId === activeId) return;
      let activeLinkCount = 0;
      for (const link of links) {
        const href = link.getAttribute("href") ?? "";
        const linkId = href.startsWith("#") ? decodeURIComponent(href.slice(1)) : "";
        const active = linkId === activeId;
        link.dataset["kpTocActive"] = String(active);
        if (active) {
          link.setAttribute("aria-current", "location");
          activeLinkCount += 1;
        } else {
          link.removeAttribute("aria-current");
        }
      }

      const activeBeat = beatsById.get(activeId);
      if (activeBeat === undefined || activeLinkCount !== 1) {
        throw new Error(`Reader expected one beat and TOC link for active location ${activeId}.`);
      }
      for (const beat of input.beats) {
        const active = beat === activeBeat;
        beat.dataset["kpBeatActive"] = String(active);
        if (active) beat.setAttribute("aria-current", "step");
        else beat.removeAttribute("aria-current");
      }
      input.toc.dataset["kpTocActiveId"] = activeId;
      currentActiveId = activeId;
    }
  };
}

function requiredBeatId(beat: HTMLElement): string {
  const id = beat.dataset["kpBeat"];
  if (id === undefined || id.length === 0) throw new Error("Reader beat is missing data-kp-beat.");
  return id;
}
