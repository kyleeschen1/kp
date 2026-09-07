import { renderKpFocusDeckControlIcon } from "./focus-deck-control-icons.ts";

/** Pointer scrubbing stays continuous; keyboard navigation selects semantic
 * steps instead of the range input's fractional paint-sampling increment.
 * This resolves intent only: each card retains its own navigation and clock.
 */
export function readKpFocusDeckScrubberKeyTarget(
  event: Pick<KeyboardEvent, "key" | "defaultPrevented" | "altKey" | "ctrlKey" | "metaKey">,
  position: number,
  beatCount: number
): number | undefined {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  let target: number;
  switch (event.key) {
    case "ArrowLeft": case "ArrowDown": target = position - 1; break;
    case "ArrowRight": case "ArrowUp": target = position + 1; break;
    case "Home": target = 0; break;
    case "End": target = beatCount - 1; break;
    default: return;
  }
  return Math.max(0, Math.min(beatCount - 1, Math.round(target)));
}

export interface KpFocusDeckScaffoldBeat {
  readonly slug: string;
  readonly title: string;
  readonly html: string;
  readonly domId?: string | undefined;
  readonly attributes?: Readonly<Record<string, string | boolean>> | undefined;
}

export interface KpFocusDeckScaffoldClassAliases {
  readonly root?: string | undefined;
  readonly header?: string | undefined;
  readonly body?: string | undefined;
  readonly main?: string | undefined;
  readonly card?: string | undefined;
  readonly narrative?: string | undefined;
  readonly passagePage?: string | undefined;
  readonly navigation?: string | undefined;
  readonly navigationRail?: string | undefined;
  readonly scrubber?: string | undefined;
  readonly ticks?: string | undefined;
  readonly visuallyHidden?: string | undefined;
}

export interface KpFocusDeckScaffoldInput {
  readonly id: string;
  readonly ariaLabel: string;
  readonly activeBeatSlug: string;
  readonly stageHtml: string;
  readonly beats: readonly KpFocusDeckScaffoldBeat[];
  readonly headerTrailingHtml?: string | undefined;
  readonly rootAttributes?: Readonly<Record<string, string | boolean>> | undefined;
  readonly viewportAttributes?: Readonly<Record<string, string | boolean>> | undefined;
  readonly scrubberAttributes?: Readonly<Record<string, string | boolean>> | undefined;
  readonly replayAttributes?: Readonly<Record<string, string | boolean>> | undefined;
  readonly replayHidden?: boolean | undefined;
  readonly classAliases?: KpFocusDeckScaffoldClassAliases | undefined;
}

/**
 * The scaffold owns projection chrome only. Semantic beats, stage paint, and
 * clocks stay with the caller so a shared card treatment cannot flatten
 * equation, graph, code, and 3D authority into one runtime model.
 */
export function renderKpFocusDeckScaffold(
  input: KpFocusDeckScaffoldInput
): string {
  if (input.beats.length === 0) {
    throw new Error("Focus Deck scaffold requires at least one beat.");
  }
  const activeIndex = input.beats.findIndex(
    ({ slug }) => slug === input.activeBeatSlug
  );
  if (activeIndex < 0) {
    throw new Error(`Focus Deck ${input.id} has no beat ${input.activeBeatSlug}.`);
  }
  const first = input.beats[activeIndex]!;
  const aliases = input.classAliases ?? {};
  const count = input.beats.length;
  return `<section class="${classes("kp-focus-deck", aliases.root)}" data-kp-focus-deck data-kp-focus-deck-id="${escapeAttribute(input.id)}" data-kp-focus-deck-active-beat="${escapeAttribute(first.slug)}" ${attributes(input.rootAttributes)} aria-label="${escapeAttribute(input.ariaLabel)}">
    <header class="${classes("kp-focus-deck__header", aliases.header)}">
      <span>Kinetic Figure</span>
      ${input.headerTrailingHtml ?? ""}
    </header>
    <div class="${classes("kp-focus-deck__body", aliases.body)}">
      <div class="${classes("kp-focus-deck__main", aliases.main)}">
        <div class="${classes("kp-focus-deck__card", aliases.card)}">
          ${input.stageHtml}
          <section class="${classes("kp-focus-deck__narrative", aliases.narrative)}" data-kp-focus-deck-viewport ${attributes(input.viewportAttributes)} aria-label="Explanation" tabindex="0">
            ${input.beats.map((beat, index) => renderBeat({
              beat,
              active: index === activeIndex,
              passagePageAlias: aliases.passagePage
            })).join("")}
          </section>
        </div>
        <footer class="${classes("kp-focus-deck__navigation", aliases.navigation)}" aria-label="Figure navigation">
          <button type="button" data-kp-focus-deck-previous aria-label="Previous step" title="Previous step"${activeIndex === 0 ? " disabled" : ""}>${renderKpFocusDeckControlIcon("previous")}</button>
          <div class="${classes("kp-focus-deck__navigation-rail", aliases.navigationRail)}">
            <output class="${classes("kp-focus-deck__visually-hidden", aliases.visuallyHidden)}" id="${escapeAttribute(input.id)}-navigation-status" data-kp-focus-deck-position aria-live="polite">${escapeHtml(statusText(first, activeIndex, count))}</output>
            <div class="${classes("kp-focus-deck__scrubber", aliases.scrubber)}">
              <input data-kp-focus-deck-scrubber ${attributes(input.scrubberAttributes)} type="range" min="0" max="${count - 1}" step="0.01" value="${activeIndex}" aria-label="Figure state" aria-valuetext="${escapeAttribute(statusText(first, activeIndex, count))}">
              <div class="${classes("kp-focus-deck__ticks", aliases.ticks)}" aria-hidden="true">
                ${input.beats.map((_, index) => `<span style="left:${(index / Math.max(1, count - 1) * 100).toFixed(4)}%"></span>`).join("")}
              </div>
            </div>
            <button type="button" data-kp-focus-deck-replay ${attributes(input.replayAttributes)} aria-label="Replay transformation" title="Replay transformation"${input.replayHidden !== false ? " hidden" : ""}>${renderKpFocusDeckControlIcon("replay")}</button>
          </div>
          <button type="button" data-kp-focus-deck-next aria-label="Next step" title="Next step"${activeIndex === count - 1 ? " disabled" : ""}>${renderKpFocusDeckControlIcon("next")}</button>
        </footer>
      </div>
    </div>
  </section>`;
}

function renderBeat(input: {
  readonly beat: KpFocusDeckScaffoldBeat;
  readonly active: boolean;
  readonly passagePageAlias?: string | undefined;
}): string {
  const { beat, active } = input;
  return `<section${beat.domId === undefined ? "" : ` id="${escapeAttribute(beat.domId)}"`} data-kp-focus-deck-beat="${escapeAttribute(beat.slug)}" data-kp-focus-deck-beat-active="${String(active)}" ${attributes(beat.attributes)}${active ? ' aria-current="page"' : ""}>
    <div class="${classes("kp-focus-deck__passage-page", input.passagePageAlias)}">
      ${beat.html}
    </div>
  </section>`;
}

function statusText(
  beat: KpFocusDeckScaffoldBeat,
  index: number,
  count: number
): string {
  return `Step ${index + 1} of ${count}: ${beat.title}`;
}

function classes(canonical: string, alias: string | undefined): string {
  if (alias === undefined || alias.trim() === "") return canonical;
  return `${canonical} ${alias}`;
}

function attributes(
  values: Readonly<Record<string, string | boolean>> | undefined
): string {
  if (values === undefined) return "";
  return Object.entries(values).map(([name, value]) => {
    if (!/^(?:aria|data)-[a-z0-9_.:-]+$/u.test(name)) {
      throw new Error(`Focus Deck scaffold rejects attribute ${name}.`);
    }
    return value === true
      ? name
      : `${name}="${escapeAttribute(String(value))}"`;
  }).join(" ");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
