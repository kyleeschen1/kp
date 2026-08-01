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
  const domain = domainLabel(entry);

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
      <section aria-labelledby="kp-animation-catalogue-details-title">
        <h3 id="kp-animation-catalogue-details-title">Details</h3>
        <p>${escapeHtml(entry.summary)}</p>
        <dl>
          <div><dt>Domain</dt><dd>${escapeHtml(domain)}</dd></div>
          <div><dt>Health</dt><dd>${healthLabel(health.status)}</dd></div>
          <div><dt>Asset</dt><dd><code>${escapeHtml(entry.animationId)}</code></dd></div>
        </dl>
      </section>
    </aside>
  </main>`;
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
