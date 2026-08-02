import type {
  KpAnimationCatalogueHealth
} from "./animation-catalogue-health.ts";
import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import {
  searchKpAnimationCatalogueEntries
} from "./animation-catalogue-search.ts";
import {
  writeKpAnimationCatalogueRoute
} from "./animation-catalogue-route.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "./animation-player-shell.ts";
import {
  kpOrganicSubtleStyleRef,
  kpRestrainedEditorialStyleRef
} from "../animation/gestalt-base-styles.ts";
import {
  kpEconomicsDemandInterceptParameter,
  type KpEconomicsEquilibriumParameterState
} from "./economics-equilibrium-parameters.ts";
import {
  economicsEquilibriumAnimationId
} from "../animation/economics-equilibrium-adapter.ts";
import {
  constantForceWorkEnergyAnimationId
} from "../animation/constant-force-work-energy-adapter.ts";
import {
  kpConstantForceWorkEnergyForceParameter,
  type KpConstantForceWorkEnergyParameterState
} from "./constant-force-work-energy-parameters.ts";
import type {
  KpAnimationCatalogueReaderCompanion
} from "./animation-catalogue-reader-companion.ts";
import {
  KP_ANIMATION_CATALOGUE_STAGE_RESERVATION
} from "./animation-catalogue-stage-reservation.ts";
import {
  assertKpAnimationCatalogueSelectedHostContent,
  type KpAnimationCatalogueSelectedHostViewModel
} from "./animation-catalogue-host-view-model.ts";

export function renderKpAnimationCatalogueShell(
  input: KpAnimationCatalogueSelectedHostViewModel
): string {
  assertKpAnimationCatalogueSelectedHostContent(input);
  const { entry, health } = input;

  const economicsParameterData = input.economicsParameters === undefined
    ? ""
    : ` data-kp-economics-demand-intercept="${input.economicsParameters.demandInterceptAfter}"`;
  const physicsParameterData = input.physicsParameters === undefined
    ? ""
    : ` data-kp-physics-net-force-newtons="${input.physicsParameters.netForceNewtons}"`;

  const overlayData = input.chrome.overlay === undefined
    ? ""
    : ` data-kp-animation-catalogue-overlay="${input.chrome.overlay}"`;

  return `<main class="kp-animation-catalogue-shell" data-kp-animation-catalogue data-kp-animation-catalogue-state="selected" data-kp-animation-catalogue-selection="${escapeHtml(entry.animationId)}" data-kp-animation-catalogue-selected-health="${health.status}" data-kp-animation-catalogue-human-disposition="${entry.humanDisposition}"${economicsParameterData}${physicsParameterData}${overlayData} aria-labelledby="kp-animation-catalogue-title">
    <h1 id="kp-animation-catalogue-title" class="kp-animation-catalogue-shell__visually-hidden">Animation catalogue</h1>
    <aside id="kp-animation-catalogue-rail" class="kp-animation-catalogue-shell__rail" data-kp-animation-catalogue-region="rail" aria-label="Artifact catalogue">
      <div class="kp-animation-catalogue-shell__rail-results">
        <p class="kp-animation-catalogue-shell__label">Artifacts</p>
        <input class="kp-animation-catalogue-shell__search" type="search" value="${escapeHtml(input.chrome.query)}" placeholder="Search artifacts" aria-label="Search artifacts" autocomplete="off" data-action="filter-animation-catalogue">
        ${renderKpAnimationCatalogueResults({
          entries: input.entries,
          selectedAnimationId: entry.animationId,
          selectedHealth: health,
          query: input.chrome.query
        })}
      </div>
      <div class="kp-animation-catalogue-shell__review-slot" data-kp-animation-catalogue-review-dock aria-hidden="true"></div>
    </aside>
    <section class="kp-animation-catalogue-shell__stage" data-kp-animation-catalogue-region="stage" data-kp-animation-catalogue-stage-reservation="${KP_ANIMATION_CATALOGUE_STAGE_RESERVATION}" aria-label="Selected animation stage">
      <div class="kp-animation-catalogue-shell__narrow-nav" aria-label="Catalogue panels">
        <button type="button" data-action="toggle-animation-catalogue-overlay" data-kp-animation-catalogue-overlay-target="rail" aria-controls="kp-animation-catalogue-rail" aria-expanded="${input.chrome.overlay === "rail"}">Artifacts</button>
        <button type="button" data-action="toggle-animation-catalogue-overlay" data-kp-animation-catalogue-overlay-target="inspector" aria-controls="kp-animation-catalogue-inspector" aria-expanded="${input.chrome.overlay === "inspector"}">Info</button>
      </div>
      <div class="kp-animation-catalogue-shell__stage-host" data-kp-animation-catalogue-stage data-kp-animation-catalogue-stage-persistent="true">
        ${renderKpEditorAnimationPlayerShell({
          descriptor: input.descriptor,
          player: input.player,
          chrome: "catalogue"
        })}
      </div>
    </section>
    <aside id="kp-animation-catalogue-inspector" class="kp-animation-catalogue-shell__inspector" data-kp-animation-catalogue-region="inspector" aria-label="Artifact inspector">
      ${renderKpAnimationCatalogueInspector({
        entry,
        health,
        economicsParameters: input.economicsParameters,
        physicsParameters: input.physicsParameters,
        readerCompanion: input.readerCompanion,
        view: input.chrome.inspectorView
      })}
    </aside>
  </main>`;
}

export function applyKpAnimationCatalogueObservedHealth(input: {
  readonly shell: HTMLElement;
  readonly entry: KpAnimationCatalogueEntry;
  readonly health: KpAnimationCatalogueHealth;
}): void {
  const selectedAnimationId =
    input.shell.dataset["kpAnimationCatalogueSelection"];
  if (
    selectedAnimationId !== input.entry.animationId ||
    input.health.animationId !== input.entry.animationId
  ) {
    throw new Error(
      `Cannot apply observed health for ${input.entry.animationId} to ` +
      `${selectedAnimationId ?? "an unselected shell"}.`
    );
  }
  input.shell.dataset["kpAnimationCatalogueSelectedHealth"] =
    input.health.status;
  const selectedRow = input.shell.querySelector<HTMLElement>(
    `[data-kp-animation-catalogue-row="${cssEscape(input.entry.animationId)}"]`
  );
  const badge = selectedRow?.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-health]"
  );
  if (badge !== undefined && badge !== null) {
    badge.dataset["kpAnimationCatalogueHealth"] = input.health.status;
    badge.dataset["kpAnimationCatalogueHealthEvidence"] = "observed-host";
    badge.textContent = healthLabel(input.health.status);
  }
  const details = input.shell.querySelector<HTMLElement>(
    '[data-kp-animation-catalogue-inspector-panel="details"]'
  );
  if (details !== null) {
    details.innerHTML = renderKpAnimationCatalogueDetails({
      entry: input.entry,
      health: input.health
    });
  }
}

export function renderKpAnimationCatalogueInspector(input: {
  readonly entry: KpAnimationCatalogueEntry;
  readonly health: KpAnimationCatalogueHealth;
  readonly economicsParameters?:
    | KpEconomicsEquilibriumParameterState
    | undefined;
  readonly physicsParameters?:
    | KpConstantForceWorkEnergyParameterState
    | undefined;
  readonly readerCompanion?:
    | KpAnimationCatalogueReaderCompanion
    | undefined;
  readonly view?:
    | KpAnimationCatalogueSelectedHostViewModel["chrome"]["inspectorView"]
    | undefined;
}): string {
  const view = input.view ?? "details";
  const readerOption = input.readerCompanion === undefined
    ? ""
    : `<option value="explanation"${selectedOption(view, "explanation")}>${escapeHtml(input.readerCompanion.label)}</option>`;
  const readerPanel = input.readerCompanion === undefined
    ? ""
    : `<section data-kp-animation-catalogue-inspector-panel="explanation"${hiddenPanel(view, "explanation")}>${input.readerCompanion.html}</section>`;
  return `<div class="kp-animation-catalogue-shell__inspector-view" data-kp-animation-catalogue-inspector-view="${view}">
    <label class="kp-animation-catalogue-shell__inspector-switcher">Show
      <select data-action="select-animation-catalogue-inspector" aria-label="Inspector view">
        <option value="details"${selectedOption(view, "details")}>Details</option>
        <option value="parameters"${selectedOption(view, "parameters")}>Parameters</option>
        <option value="tuning"${selectedOption(view, "tuning")}>Tuning</option>
        ${readerOption}
      </select>
    </label>
    <div data-kp-animation-catalogue-inspector-panel="details"${hiddenPanel(view, "details")}>
      ${renderKpAnimationCatalogueDetails(input)}
    </div>
    <section data-kp-animation-catalogue-inspector-panel="parameters"${hiddenPanel(view, "parameters")}>
      ${renderKpAnimationCatalogueParameters(input)}
    </section>
    <section data-kp-animation-catalogue-inspector-panel="tuning"${hiddenPanel(view, "tuning")}>
      <h3>Tuning</h3>
      <p>Temporary presentation choices for review. They do not change the authored artifact.</p>
      <div class="kp-animation-catalogue-shell__tuning-controls">
        <label>Style
          <select data-action="tune-animation-catalogue" data-kp-animation-catalogue-tuning="gestalt-style">
            <option value="${styleRefKey(kpOrganicSubtleStyleRef)}" selected>Organic subtle</option>
            <option value="${styleRefKey(kpRestrainedEditorialStyleRef)}">Restrained editorial</option>
          </select>
        </label>
        <label>Focus
          <select data-action="tune-animation-catalogue" data-kp-animation-catalogue-tuning="focus-experiment">
            <option value="flat" selected>Flat</option>
            <option value="elevated">Elevated 2.5D</option>
            <option value="no-depth">No depth</option>
          </select>
        </label>
      </div>
    </section>
    ${readerPanel}
  </div>`;
}

function selectedOption(
  current: KpAnimationCatalogueSelectedHostViewModel["chrome"]["inspectorView"],
  candidate: KpAnimationCatalogueSelectedHostViewModel["chrome"]["inspectorView"]
): string {
  return current === candidate ? " selected" : "";
}

function hiddenPanel(
  current: KpAnimationCatalogueSelectedHostViewModel["chrome"]["inspectorView"],
  candidate: KpAnimationCatalogueSelectedHostViewModel["chrome"]["inspectorView"]
): string {
  return current === candidate ? "" : " hidden";
}

export function renderKpAnimationCatalogueParameters(input: {
  readonly entry: KpAnimationCatalogueEntry;
  readonly economicsParameters?:
    | KpEconomicsEquilibriumParameterState
    | undefined;
  readonly physicsParameters?:
    | KpConstantForceWorkEnergyParameterState
    | undefined;
}): string {
  if (input.entry.animationId === constantForceWorkEnergyAnimationId) {
    const state = input.physicsParameters ?? {
      schemaVersion: "kp.constant-force-work-energy-parameters.v1" as const,
      netForceNewtons: kpConstantForceWorkEnergyForceParameter.defaultValue
    };
    return `<h3>Parameters</h3>
      <p>Change the constant horizontal net force; displacement and initial kinetic energy remain fixed.</p>
      <div class="kp-animation-catalogue-shell__parameter-controls" data-kp-physics-work-energy-parameters>
        <label>Net force
          <input type="range" min="${kpConstantForceWorkEnergyForceParameter.minimum}" max="${kpConstantForceWorkEnergyForceParameter.maximum}" step="${kpConstantForceWorkEnergyForceParameter.step}" value="${state.netForceNewtons}" data-action="set-physics-net-force" aria-label="Set horizontal net force in newtons" />
          <output data-kp-physics-net-force-output>${state.netForceNewtons} N</output>
        </label>
      </div>`;
  }
  if (input.entry.animationId !== economicsEquilibriumAnimationId) {
    return `<h3>Parameters</h3>
      <p>This asset has no exposed semantic parameters. Its semantics remain authored artifact state.</p>`;
  }
  const state = input.economicsParameters ?? {
    schemaVersion: "kp.economics-equilibrium-parameters.v1" as const,
    demandInterceptAfter: kpEconomicsDemandInterceptParameter.defaultValue
  };
  return `<h3>Parameters</h3>
    <p>Change the new demand intercept; supply and the initial demand state remain fixed.</p>
    <div class="kp-animation-catalogue-shell__parameter-controls" data-kp-economics-parameters>
      <label>New demand intercept
        <input type="range" min="${kpEconomicsDemandInterceptParameter.minimum}" max="${kpEconomicsDemandInterceptParameter.maximum}" step="${kpEconomicsDemandInterceptParameter.step}" value="${state.demandInterceptAfter}" data-action="set-economics-demand-intercept" aria-label="Set new demand price intercept" />
        <output data-kp-economics-demand-intercept-output>${state.demandInterceptAfter}</output>
      </label>
    </div>`;
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
        ${detailValue("Human disposition", titleCase(entry.humanDisposition))}
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
    const href = writeKpAnimationCatalogueRoute("", {
      artifactId: entry.animationId
    });
    return `<li class="kp-animation-catalogue-shell__result" data-kp-animation-catalogue-row="${escapeHtml(entry.animationId)}"${selected ? ' data-kp-animation-catalogue-row-selected="true"' : ""}>
      <a class="kp-animation-catalogue-shell__result-link" href="/${escapeHtml(href)}"${selected ? ' aria-current="page"' : ""}>
        <span class="kp-animation-catalogue-shell__result-title">${escapeHtml(entry.title)}</span>
        <span class="kp-animation-catalogue-shell__result-meta">
          <span>${escapeHtml(domainLabel(entry))}</span>
          <span class="kp-animation-catalogue-shell__health" data-kp-animation-catalogue-health="${status}" data-kp-animation-catalogue-health-evidence="${selected ? "selected-host" : "pending"}">${healthLabel(status)}</span>
        </span>
      </a>
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

function styleRefKey(ref: {
  readonly id: string;
  readonly version: string;
}): string {
  return `${ref.id}@${ref.version}`;
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

function cssEscape(value: string): string {
  return typeof CSS === "undefined"
    ? value.replaceAll('"', '\\"')
    : CSS.escape(value);
}
