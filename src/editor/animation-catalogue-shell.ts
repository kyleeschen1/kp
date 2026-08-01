import type {
  KpAnimationCatalogueHealth
} from "./animation-catalogue-health.ts";
import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import {
  searchKpAnimationCatalogueEntries
} from "./animation-catalogue-search.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "./animation-player-shell.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";

export function renderKpAnimationCatalogueShell(input: {
  readonly entry: KpAnimationCatalogueEntry;
  readonly health: KpAnimationCatalogueHealth;
  readonly entries: readonly KpAnimationCatalogueEntry[];
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly player: KpEditorAnimationPlayerState;
}): string {
  if (input.entry.animationId !== input.health.animationId) {
    throw new Error(
      `Catalogue shell entry ${input.entry.animationId} does not match ` +
      `health ${input.health.animationId}.`
    );
  }
  if (
    input.descriptor.id !== input.entry.primaryDescriptorId ||
    input.player.descriptorId !== input.descriptor.id ||
    input.player.animationId !== input.entry.animationId
  ) {
    throw new Error(
      `Catalogue shell player does not match entry ${input.entry.animationId}.`
    );
  }
  const { entry, health } = input;

  return `<main class="kp-animation-catalogue-shell" data-kp-animation-catalogue data-kp-animation-catalogue-state="selected" data-kp-animation-catalogue-selection="${escapeHtml(entry.animationId)}" data-kp-animation-catalogue-selected-health="${health.status}" aria-labelledby="kp-animation-catalogue-title">
    <h1 id="kp-animation-catalogue-title" class="kp-animation-catalogue-shell__visually-hidden">Animation catalogue</h1>
    <aside class="kp-animation-catalogue-shell__rail" data-kp-animation-catalogue-region="rail" aria-label="Artifact catalogue">
      <div class="kp-animation-catalogue-shell__rail-results">
        <p class="kp-animation-catalogue-shell__label">Artifacts</p>
        <input class="kp-animation-catalogue-shell__search" type="search" placeholder="Search artifacts" aria-label="Search artifacts" autocomplete="off" data-action="filter-animation-catalogue">
        ${renderKpAnimationCatalogueResults({
          entries: input.entries,
          selectedAnimationId: entry.animationId,
          selectedHealth: health
        })}
      </div>
      <div class="kp-animation-catalogue-shell__review-slot" data-kp-animation-catalogue-review-dock aria-hidden="true"></div>
    </aside>
    <section class="kp-animation-catalogue-shell__stage" data-kp-animation-catalogue-region="stage" aria-label="Selected animation stage">
      <div class="kp-animation-catalogue-shell__stage-host" data-kp-animation-catalogue-stage data-kp-animation-catalogue-stage-persistent="true">
        ${renderKpEditorAnimationPlayerShell({
          descriptor: input.descriptor,
          player: input.player,
          chrome: "catalogue"
        })}
      </div>
    </section>
    <aside class="kp-animation-catalogue-shell__inspector" data-kp-animation-catalogue-region="inspector" aria-label="Artifact inspector">
      ${renderKpAnimationCatalogueDetails({ entry, health })}
    </aside>
  </main>`;
}

export function renderKpAnimationCatalogueDetails(input: {
  readonly entry: KpAnimationCatalogueEntry;
  readonly health: KpAnimationCatalogueHealth;
}): string {
  const { entry, health } = input;
  if (entry.animationId !== health.animationId) {
    throw new Error(
      `Catalogue details entry ${entry.animationId} does not match ` +
      `health ${health.animationId}.`
    );
  }
  const semanticRows = [
    detailValues("Families", entry.familyIds, true),
    detailValues("Samples", entry.sampleIds, true)
  ].filter(Boolean).join("");
  const playbackRows = [
    entry.durationMs === undefined
      ? ""
      : detailValue("Duration", formatDuration(entry.durationMs)),
    entry.beatCount === undefined
      ? ""
      : detailValue("Beats", String(entry.beatCount))
  ].join("");
  const capabilityRows = [
    detailValues("Render targets", entry.renderTargetKinds.map(titleCase)),
    detailValues("Controls", entry.controlKinds.map(titleCase)),
    detailValues("Tags", entry.tags, true)
  ].filter(Boolean).join("");
  const healthReasons = health.reasons.length === 0
    ? ""
    : `<ul class="kp-animation-catalogue-shell__plain-list">${health.reasons
        .map(({ message }) => `<li>${escapeHtml(message)}</li>`)
        .join("")}</ul>`;
  const relatedContexts = entry.relatedContexts.length === 0
    ? ""
    : `<section data-kp-animation-catalogue-details-section="related-contexts">
        <h3>Related contexts</h3>
        <ul class="kp-animation-catalogue-shell__context-list">${entry.relatedContexts
          .map((context) => `<li>
            <a href="${escapeHtml(context.href)}">${escapeHtml(context.label)}</a>
            <span>${escapeHtml(titleCase(context.kind))} · ${escapeHtml(titleCase(context.role))}</span>
          </li>`)
          .join("")}</ul>
      </section>`;

  return `<div data-kp-animation-catalogue-inspector="details">
    <section aria-labelledby="kp-animation-catalogue-details-title" data-kp-animation-catalogue-details-section="identity">
      <h3 id="kp-animation-catalogue-details-title">Details</h3>
      <p>${escapeHtml(entry.summary)}</p>
      <dl>
        ${detailValue("Domain", domainLabel(entry))}
        ${detailValue("Asset", entry.animationId, true)}
        ${detailValue("Pack", titleCase(entry.packId))}
      </dl>
    </section>
    ${detailSection("Semantics", "semantics", semanticRows)}
    ${detailSection("Playback", "playback", playbackRows)}
    ${detailSection("Capabilities", "capabilities", capabilityRows)}
    <section data-kp-animation-catalogue-details-section="health">
      <h3>Health</h3>
      <p class="kp-animation-catalogue-shell__health-summary" data-kp-animation-catalogue-health="${health.status}">${healthLabel(health.status)}</p>
      ${healthReasons}
    </section>
    ${relatedContexts}
  </div>`;
}

export function renderKpAnimationCatalogueResults(input: {
  readonly entries: readonly KpAnimationCatalogueEntry[];
  readonly selectedAnimationId: string;
  readonly selectedHealth: KpAnimationCatalogueHealth;
  readonly query?: string | undefined;
}): string {
  const results = searchKpAnimationCatalogueEntries({
    entries: input.entries,
    query: input.query ?? "",
    selectedAnimationId: input.selectedAnimationId
  });
  const rows = results.map((entry) => {
    const selected = entry.animationId === input.selectedAnimationId;
    const status = selected ? input.selectedHealth.status : "review";
    return `<li class="kp-animation-catalogue-shell__result" data-kp-animation-catalogue-row="${escapeHtml(entry.animationId)}"${selected ? ' aria-current="true"' : ""}>
      <span class="kp-animation-catalogue-shell__result-title">${escapeHtml(entry.title)}</span>
      <span class="kp-animation-catalogue-shell__result-meta">
        <span>${escapeHtml(domainLabel(entry))}</span>
        <span class="kp-animation-catalogue-shell__health" data-kp-animation-catalogue-health="${status}" data-kp-animation-catalogue-health-evidence="${selected ? "selected-host" : "pending"}">${healthLabel(status)}</span>
      </span>
    </li>`;
  }).join("");

  return `<ol class="kp-animation-catalogue-shell__result-list" data-kp-animation-catalogue-results data-kp-animation-catalogue-result-count="${results.length}">${rows}</ol>`;
}

function domainLabel(entry: KpAnimationCatalogueEntry): string {
  const source = entry.domains[0] ?? entry.packId;
  return source
    .split("-")
    .map((part) => part.length === 0
      ? part
      : `${part[0]?.toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function detailSection(
  title: string,
  id: string,
  rows: string
): string {
  if (rows.length === 0) return "";
  return `<section data-kp-animation-catalogue-details-section="${id}">
    <h3>${escapeHtml(title)}</h3>
    <dl>${rows}</dl>
  </section>`;
}

function detailValue(label: string, value: string, code = false): string {
  const escaped = escapeHtml(value);
  return `<div><dt>${escapeHtml(label)}</dt><dd>${code ? `<code>${escaped}</code>` : escaped}</dd></div>`;
}

function detailValues(
  label: string,
  values: readonly string[],
  code = false
): string {
  if (values.length === 0) return "";
  return `<div><dt>${escapeHtml(label)}</dt><dd><ul class="kp-animation-catalogue-shell__value-list">${values
    .map((value) => `<li>${code ? `<code>${escapeHtml(value)}</code>` : escapeHtml(value)}</li>`)
    .join("")}</ul></dd></div>`;
}

function formatDuration(durationMs: number): string {
  const seconds = durationMs / 1_000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} s`;
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => part.length === 0
      ? part
      : `${part[0]?.toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function healthLabel(status: KpAnimationCatalogueHealth["status"]): string {
  return `${status[0]?.toUpperCase()}${status.slice(1)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
