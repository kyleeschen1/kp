import type {
  KpSemanticAnimationWorkbenchQueryResult
} from "./semantic-animation-workbench-query.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import {
  renderKpEditorAnimationDiagnosticsLoading
} from "./animation-diagnostics.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "./animation-player-shell.ts";

export function renderKpSemanticAnimationWorkbenchShell(input: {
  readonly query: string;
  readonly results: readonly KpSemanticAnimationWorkbenchQueryResult[];
  readonly selectedAnimationId?: string;
  readonly selectedDescriptor?: KpEditorAnimationDescriptor;
}): string {
  return `<section class="kp-animation-workbench" data-kp-animation-workbench aria-labelledby="kp-animation-workbench-title">
    <header class="kp-animation-workbench__header">
      <div>
        <p class="eyebrow">Semantic Editor</p>
        <h1 id="kp-animation-workbench-title">Animation Workbench</h1>
        <p>Find one canonical animation, then inspect its playable and planned representations, lifecycle, and review evidence.</p>
      </div>
      <button class="editor-header__button" type="button" data-action="show-editor">Back to editor</button>
    </header>
    <label class="kp-animation-workbench__search">
      <span>Search animations</span>
      <input type="search" value="${escapeHtml(input.query)}" placeholder="Try radical, tangent, quadratic, or a family…" autocomplete="off" data-action="filter-animation-workbench" data-kp-animation-workbench-query />
      <small>Search title, aliases, families, motifs, lifecycle, and representations.</small>
    </label>
    <div class="kp-animation-workbench__layout">
      <aside class="kp-animation-workbench__results" aria-label="Animation results">
        ${renderResults(input.results, input.selectedAnimationId)}
      </aside>
      <main class="kp-animation-workbench__detail" data-kp-animation-workbench-detail>
        ${renderSelectedSummary(
          input.results,
          input.selectedAnimationId,
          input.selectedDescriptor
        )}
      </main>
    </div>
  </section>`;
}

function renderResults(
  results: readonly KpSemanticAnimationWorkbenchQueryResult[],
  selectedAnimationId: string | undefined
): string {
  if (results.length === 0) {
    return `<div class="kp-animation-workbench__empty" data-kp-animation-workbench-results>
      <p class="eyebrow">0 canonical animations</p>
      <h2>No matching animation</h2>
      <p>Try a title, alias, family, motif, lifecycle state, or representation.</p>
    </div>`;
  }
  return `<div data-kp-animation-workbench-results>
    <div class="kp-animation-workbench__results-header">
      <p class="eyebrow">${results.length} canonical ${results.length === 1 ? "animation" : "animations"}</p>
      <p>Representations stay nested beneath their source.</p>
    </div>
    <ol class="kp-animation-workbench__result-list">${results
      .map(({ entry, matchedValues }) => {
        const identity = entry.identity;
        const selected = identity.animationId === selectedAnimationId;
        return `<li data-kp-animation-workbench-result="${escapeHtml(identity.animationId)}">
          <button type="button" data-action="select-animation-workbench-result" data-kp-animation-id="${escapeHtml(identity.animationId)}" aria-pressed="${selected}">
            <span class="kp-animation-workbench__result-title">${escapeHtml(identity.title)}</span>
            <span class="kp-animation-workbench__result-meta">${escapeHtml(entry.lifecycle.playability)} · ${entry.representations.length} ${entry.representations.length === 1 ? "representation" : "representations"}</span>
            ${identity.aliases.length === 0 ? "" : `<span class="kp-animation-workbench__result-aliases">${identity.aliases.slice(0, 3).map(escapeHtml).join(" · ")}</span>`}
            ${matchedValues.length === 0 ? "" : `<span class="kp-animation-workbench__result-match">Matched ${matchedValues.slice(0, 2).map(escapeHtml).join(", ")}</span>`}
          </button>
        </li>`;
      })
      .join("")}</ol>
  </div>`;
}

function renderSelectedSummary(
  results: readonly KpSemanticAnimationWorkbenchQueryResult[],
  selectedAnimationId: string | undefined,
  selectedDescriptor: KpEditorAnimationDescriptor | undefined
): string {
  const selected =
    results.find(
      ({ entry }) => entry.identity.animationId === selectedAnimationId
    )?.entry ?? results[0]?.entry;
  if (selected === undefined) {
    return `<div class="kp-animation-workbench__empty">
      <p class="eyebrow">Selected animation</p>
      <h2>Nothing selected</h2>
      <p>Change the search to return to the canonical index.</p>
    </div>`;
  }
  return `<article class="kp-animation-workbench__selection" data-kp-animation-workbench-selection="${escapeHtml(selected.identity.animationId)}">
    <p class="eyebrow">Canonical animation</p>
    <h2>${escapeHtml(selected.identity.title)}</h2>
    <code>${escapeHtml(selected.identity.animationId)}</code>
    <p>${escapeHtml(selected.summary)}</p>
    <dl>
      <div><dt>Families</dt><dd>${selected.identity.familyIds.length === 0 ? "Not assigned" : selected.identity.familyIds.map(escapeHtml).join(", ")}</dd></div>
      <div><dt>Representations</dt><dd>${selected.representations.length}</dd></div>
      <div><dt>Execution</dt><dd>${escapeHtml(selected.lifecycle.execution)}</dd></div>
      <div><dt>Playability</dt><dd>${escapeHtml(selected.lifecycle.playability)}</dd></div>
    </dl>
    ${renderPreview(selected, selectedDescriptor)}
  </article>`;
}

function renderPreview(
  selected: KpSemanticAnimationWorkbenchQueryResult["entry"],
  descriptor: KpEditorAnimationDescriptor | undefined
): string {
  if (selected.lifecycle.playability !== "playable") {
    return `<section class="kp-animation-workbench__planned-preview" data-kp-animation-workbench-planned-preview>
      <p class="eyebrow">Planned animation</p>
      <h3>No playable asset yet</h3>
      <p>The canonical identity is approved for planning, but no player or representation will be fabricated before publication.</p>
    </section>`;
  }
  if (
    descriptor === undefined ||
    descriptor.animationId !== selected.identity.animationId
  ) {
    return `<section class="kp-animation-workbench__planned-preview" data-kp-animation-workbench-preview-error>
      <p class="eyebrow">Preview unavailable</p>
      <h3>Catalog descriptor could not be resolved</h3>
      <p>The Workbench will not mount a player against a mismatched identity.</p>
    </section>`;
  }
  return `<section class="kp-animation-workbench__live-preview editor-animation-library" data-kp-animation-workbench-live-preview data-kp-editor-animation-library data-kp-editor-animation-id="${escapeHtml(descriptor.animationId)}" data-kp-editor-animation-descriptor-id="${escapeHtml(descriptor.id)}">
    <div class="kp-animation-workbench__preview-heading">
      <p class="eyebrow">Existing live player</p>
      <h3>${escapeHtml(descriptor.title)}</h3>
    </div>
    ${renderKpEditorAnimationPlayerShell({ descriptor })}
    ${renderKpEditorAnimationDiagnosticsLoading(descriptor)}
  </section>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
