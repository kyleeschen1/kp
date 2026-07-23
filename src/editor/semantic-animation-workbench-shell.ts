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
import {
  deriveKpAnimationAcceptanceBrief,
  renderKpAnimationAcceptanceBrief
} from "./semantic-animation-workbench-acceptance.ts";
import {
  renderKpAnimationWorkbenchReviewPanel
} from "./semantic-animation-workbench-review.ts";
import type {
  KpAnimationRepresentationRelationship
} from "./semantic-animation-workbench-representation.ts";

export function renderKpSemanticAnimationWorkbenchShell(input: {
  readonly query: string;
  readonly results: readonly KpSemanticAnimationWorkbenchQueryResult[];
  readonly selectedAnimationId?: string;
  readonly selectedDescriptor?: KpEditorAnimationDescriptor;
  readonly selectedRepresentationId?: string;
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
      <input type="search" value="${escapeHtml(input.query)}" placeholder="Try radical, tangent, quadratic, or a family…" autocomplete="off" aria-controls="kp-animation-workbench-results" aria-keyshortcuts="Control+K Meta+K /" data-action="filter-animation-workbench" data-kp-animation-workbench-query />
      <small>Search title, aliases, families, motifs, lifecycle, and representations. Press <kbd>⌘/Ctrl K</kbd> or <kbd>/</kbd> to focus; use <kbd>↓</kbd> to enter results.</small>
    </label>
    <div class="kp-animation-workbench__layout">
      <aside class="kp-animation-workbench__results" aria-label="Animation results">
        ${renderResults(input.results, input.selectedAnimationId)}
      </aside>
      <main class="kp-animation-workbench__detail" data-kp-animation-workbench-detail>
        ${renderSelectedSummary(
          input.results,
          input.selectedAnimationId,
          input.selectedDescriptor,
          input.selectedRepresentationId
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
    return `<div id="kp-animation-workbench-results" class="kp-animation-workbench__empty" data-kp-animation-workbench-results>
      <p class="eyebrow">0 canonical animations</p>
      <h2>No matching animation</h2>
      <p>Try a title, alias, family, motif, lifecycle state, or representation.</p>
    </div>`;
  }
  return `<div id="kp-animation-workbench-results" data-kp-animation-workbench-results>
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
  selectedDescriptor: KpEditorAnimationDescriptor | undefined,
  selectedRepresentationId: string | undefined
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
  const selectedRepresentation = selected.representations.find(
    (representation) =>
      representation.representationId === selectedRepresentationId
  );
  const acceptance = renderKpAnimationAcceptanceBrief(
    deriveKpAnimationAcceptanceBrief({
      entry: selected,
      lawEvidence:
        selected.lifecycle.playability === "playable"
          ? "loading"
          : "unavailable"
    })
  );
  return `<article class="kp-animation-workbench__selection" data-kp-animation-workbench-selection="${escapeHtml(selected.identity.animationId)}">
    <p class="eyebrow">Canonical animation</p>
    <h2>${escapeHtml(selected.identity.title)}</h2>
    ${renderPreview(
      selected,
      selectedDescriptor,
      selectedRepresentation,
      acceptance
    )}
    <section class="kp-animation-workbench__metadata" data-kp-animation-workbench-metadata aria-labelledby="kp-animation-workbench-metadata-title">
      <div class="kp-animation-workbench__section-heading">
        <p class="eyebrow">Catalog and workflow</p>
        <h3 id="kp-animation-workbench-metadata-title">Animation details</h3>
      </div>
      <p>${escapeHtml(selected.summary)}</p>
      <code>${escapeHtml(selected.identity.animationId)}</code>
      ${renderTags(selected.tags)}
      <dl class="kp-animation-workbench__identity-facts">
        <div><dt>Families</dt><dd>${selected.identity.familyIds.length === 0 ? "Not assigned" : selected.identity.familyIds.map(escapeHtml).join(", ")}</dd></div>
        <div><dt>Representations</dt><dd>${selected.representations.length}</dd></div>
      </dl>
      ${renderLifecycleFacets(selected.lifecycle)}
      ${renderRepresentationSwitcher(
        selected.representations,
        selectedRepresentationId
      )}
      ${renderKpAnimationWorkbenchReviewPanel({
        animationId: selected.identity.animationId,
        state: "loading"
      })}
    </section>
  </article>`;
}

function renderTags(tags: readonly string[]): string {
  return `<section class="kp-animation-workbench__tags" aria-labelledby="kp-animation-workbench-tags-title">
    <h4 id="kp-animation-workbench-tags-title">Tags</h4>
    ${
      tags.length === 0
        ? "<p>None assigned</p>"
        : `<ul>${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>`
    }
  </section>`;
}

function renderRepresentationSwitcher(
  representations: readonly KpAnimationRepresentationRelationship[],
  selectedRepresentationId: string | undefined
): string {
  const ordered = [...representations].sort((left, right) => {
    const selectedRank =
      Number(right.representationId === selectedRepresentationId) -
      Number(left.representationId === selectedRepresentationId);
    return selectedRank || left.label.localeCompare(right.label);
  });
  return `<section class="kp-animation-workbench__representations" aria-labelledby="kp-animation-workbench-representations-title">
    <div class="kp-animation-workbench__section-heading">
      <p class="eyebrow">Representations</p>
      <h3 id="kp-animation-workbench-representations-title">View the same animation</h3>
    </div>
    ${
      ordered.length === 0
        ? `<p data-kp-animation-workbench-no-representations>No representation has been published.</p>`
        : `<div class="kp-animation-workbench__representation-list" role="group" aria-label="Animation representations">
            ${ordered
              .map((representation) =>
                renderRepresentationControl(
                  representation,
                  selectedRepresentationId
                )
              )
              .join("")}
          </div>`
    }
  </section>`;
}

function renderRepresentationControl(
  representation: KpAnimationRepresentationRelationship,
  selectedRepresentationId: string | undefined
): string {
  const content = `<span>${escapeHtml(representation.label)}</span>
    <small>${escapeHtml(representation.kind)} · ${representation.playable ? "playable" : "static"}</small>`;
  if (
    representation.href !== undefined &&
    (representation.kind === "lesson" ||
      representation.kind === "concept-room" ||
      representation.kind === "export")
  ) {
    return `<a href="${escapeHtml(representation.href)}" data-kp-representation-id="${escapeHtml(representation.representationId)}">${content}</a>`;
  }
  return `<button type="button" data-action="select-animation-workbench-representation" data-kp-representation-id="${escapeHtml(representation.representationId)}" aria-pressed="${representation.representationId === selectedRepresentationId}">
    ${content}
  </button>`;
}

function renderLifecycleFacets(
  lifecycle: KpSemanticAnimationWorkbenchQueryResult["entry"]["lifecycle"]
): string {
  const facets = [
    ["roadmap", "Roadmap", lifecycle.roadmap],
    ["execution", "Execution", lifecycle.execution],
    ["maturity", "Maturity", lifecycle.maturity],
    ["approval", "Approval", lifecycle.approval],
    ["review", "Review", lifecycle.review],
    ["verification", "Verification", lifecycle.verification],
    ["playability", "Playability", lifecycle.playability]
  ] as const;
  return `<section class="kp-animation-workbench__lifecycle" aria-labelledby="kp-animation-workbench-lifecycle-title">
    <div class="kp-animation-workbench__section-heading">
      <p class="eyebrow">Independent lifecycle facets</p>
      <h3 id="kp-animation-workbench-lifecycle-title">Current state</h3>
    </div>
    <dl>${facets
      .map(
        ([facet, label, value]) =>
          `<div class="kp-animation-workbench__lifecycle-badge" data-kp-animation-workbench-lifecycle-facet="${facet}" data-state="${escapeHtml(value)}" aria-label="${label}: ${escapeHtml(value)}"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`
      )
      .join("")}</dl>
  </section>`;
}

function renderPreview(
  selected: KpSemanticAnimationWorkbenchQueryResult["entry"],
  descriptor: KpEditorAnimationDescriptor | undefined,
  representation: KpAnimationRepresentationRelationship | undefined,
  acceptance: string
): string {
  if (selected.lifecycle.playability !== "playable") {
    return `<section class="kp-animation-workbench__planned-preview" data-kp-animation-workbench-planned-preview>
      <p class="eyebrow">Planned animation</p>
      <h3>No playable asset yet</h3>
      <p>The canonical identity is approved for planning, but no player or representation will be fabricated before publication.</p>
    </section>${acceptance}`;
  }
  if (
    descriptor === undefined ||
    descriptor.animationId !== selected.identity.animationId
  ) {
    return `<section class="kp-animation-workbench__planned-preview" data-kp-animation-workbench-preview-error>
      <p class="eyebrow">Preview unavailable</p>
      <h3>Catalog descriptor could not be resolved</h3>
      <p>The Workbench will not mount a player against a mismatched identity.</p>
    </section>${acceptance}`;
  }
  return `<section class="kp-animation-workbench__live-preview editor-animation-library" data-kp-animation-workbench-live-preview data-kp-editor-animation-library data-kp-editor-animation-id="${escapeHtml(descriptor.animationId)}" data-kp-editor-animation-descriptor-id="${escapeHtml(descriptor.id)}"${representation === undefined ? "" : ` data-kp-animation-workbench-representation="${escapeHtml(representation.representationId)}"`}>
    <div class="kp-animation-workbench__preview-heading">
      <p class="eyebrow">${representation === undefined ? "Live animation" : `${escapeHtml(representation.kind)} representation`}</p>
    </div>
    ${renderKpEditorAnimationPlayerShell({ descriptor })}
    <p class="kp-animation-workbench__static-hint" data-kp-animation-workbench-static-hint>For a non-animated view, choose <strong>static checkpoints</strong> in the player’s Presentation control.</p>
    ${acceptance}
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
