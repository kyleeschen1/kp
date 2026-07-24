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
import type {
  KpWorkbenchRoadmapQuery
} from "./semantic-animation-workbench-roadmap-query.ts";
import type {
  KpWorkbenchRoadmap,
  KpWorkbenchRoadmapRow
} from "./semantic-animation-workbench-roadmap.ts";
import type {
  KpWorkbenchRoadmapAnimationLink
} from "./semantic-animation-workbench-roadmap-links.ts";

export function renderKpSemanticAnimationWorkbenchShell(input: {
  readonly query: string;
  readonly results: readonly KpSemanticAnimationWorkbenchQueryResult[];
  readonly selectedAnimationId?: string;
  readonly selectedDescriptor?: KpEditorAnimationDescriptor;
  readonly selectedRepresentationId?: string;
  readonly selectedPlaybackRepresentationId?: string;
  readonly roadmap: KpWorkbenchRoadmap;
  readonly roadmapRows: readonly KpWorkbenchRoadmapRow[];
  readonly roadmapQuery: KpWorkbenchRoadmapQuery;
  readonly roadmapTopics: readonly string[];
  readonly roadmapAnimationLinks: readonly KpWorkbenchRoadmapAnimationLink[];
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
    ${renderRoadmap(
      input.roadmap,
      input.roadmapRows,
      input.roadmapQuery,
      input.roadmapTopics,
      input.roadmapAnimationLinks
    )}
    <div class="kp-animation-workbench__layout">
      <aside class="kp-animation-workbench__results" aria-label="Animation results">
        ${renderKpSemanticAnimationWorkbenchResults(
          input.results,
          input.selectedAnimationId
        )}
      </aside>
      <main class="kp-animation-workbench__detail" data-kp-animation-workbench-detail>
        ${renderSelectedSummary(
          input.results,
          input.selectedAnimationId,
          input.selectedDescriptor,
          input.selectedRepresentationId,
          input.selectedPlaybackRepresentationId
        )}
      </main>
    </div>
  </section>`;
}

function renderRoadmap(
  roadmap: KpWorkbenchRoadmap,
  rows: readonly KpWorkbenchRoadmapRow[],
  query: KpWorkbenchRoadmapQuery,
  topics: readonly string[],
  animationLinks: readonly KpWorkbenchRoadmapAnimationLink[]
): string {
  const selectedTopic = query.topics?.[0] ?? "";
  const selectedHorizon = query.horizons?.[0] ?? "";
  const selectedState = query.states?.[0] ?? "";
  return `<section class="kp-animation-workbench__roadmap" data-kp-animation-workbench-roadmap aria-labelledby="kp-animation-workbench-roadmap-title">
    <div class="kp-animation-workbench__roadmap-heading">
      <div>
        <p class="eyebrow">Product roadmap · revision ${roadmap.planRevision}</p>
        <h2 id="kp-animation-workbench-roadmap-title">Roadmap</h2>
        <p>${escapeHtml(roadmap.objective)}</p>
      </div>
      <p><strong>${rows.length}</strong> of ${roadmap.rows.length} rows</p>
    </div>
    <div class="kp-animation-workbench__roadmap-controls" aria-label="Roadmap sort and filters">
      ${renderRoadmapSelect(
        "Sort",
        "sort-animation-workbench-roadmap",
        query.sortBy,
        [
          ["canonical", "Roadmap order"],
          ["name", "Name"],
          ["topic", "Topic"],
          ["horizon", "Horizon"],
          ["state", "State"]
        ]
      )}
      ${renderRoadmapSelect(
        "Direction",
        "set-animation-workbench-roadmap-direction",
        query.direction,
        [
          ["ascending", "Ascending"],
          ["descending", "Descending"]
        ]
      )}
      ${renderRoadmapSelect(
        "Topic",
        "filter-animation-workbench-roadmap-topic",
        selectedTopic,
        [["", "All topics"], ...topics.map((topic) => [topic, topic] as const)]
      )}
      ${renderRoadmapSelect(
        "Horizon",
        "filter-animation-workbench-roadmap-horizon",
        selectedHorizon,
        [
          ["", "All horizons"],
          ["now", "Now"],
          ["next", "Next"],
          ["later", "Later"],
          ["someday", "Someday"]
        ]
      )}
      ${renderRoadmapSelect(
        "State",
        "filter-animation-workbench-roadmap-state",
        selectedState,
        [
          ["", "All states"],
          ["active", "Active"],
          ["planned", "Planned"],
          ["complete", "Complete"],
          ["deferred", "Deferred"]
        ]
      )}
    </div>
    <div class="kp-animation-workbench__roadmap-table-wrap" tabindex="0">
      <table>
        <caption>${escapeHtml(roadmap.planTitle)} — derived from ${escapeHtml(roadmap.planId)}</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Topic</th>
            <th scope="col">Horizon</th>
            <th scope="col">State</th>
            <th scope="col">Architecture benefit</th>
            <th scope="col">Why this order</th>
          </tr>
        </thead>
        <tbody>${rows
          .map((row) =>
            renderRoadmapRow(
              row,
              animationLinks.find(({ phaseId }) => phaseId === row.id)
            )
          )
          .join("")}</tbody>
      </table>
    </div>
  </section>`;
}

function renderRoadmapRow(
  row: KpWorkbenchRoadmapRow,
  animationLink: KpWorkbenchRoadmapAnimationLink | undefined
): string {
  return `<tr data-kp-animation-workbench-roadmap-row="${escapeHtml(row.id)}">
    <td>${row.order}</td>
    <th scope="row">${animationLink === undefined
      ? escapeHtml(row.title)
      : `<button type="button" data-action="select-animation-workbench-roadmap-link" data-kp-animation-id="${escapeHtml(animationLink.animationId)}" data-kp-representation-id="${escapeHtml(animationLink.representationId)}">${escapeHtml(row.title)}<span class="visually-hidden"> — open animation</span></button>`}</th>
    <td>${escapeHtml(row.topic ?? "Unspecified")}</td>
    <td>${escapeHtml(row.horizon)}</td>
    <td><span data-state="${escapeHtml(row.state)}">${escapeHtml(row.state)}</span></td>
    <td>${escapeHtml(row.architectureBenefit ?? "Not specified")}</td>
    <td>${escapeHtml(row.rationale ?? "Not specified")}</td>
  </tr>`;
}

function renderRoadmapSelect(
  label: string,
  action: string,
  selectedValue: string,
  options: readonly (readonly [string, string])[]
): string {
  return `<label><span>${escapeHtml(label)}</span><select data-action="${action}">${options
    .map(
      ([value, text]) =>
        `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(text)}</option>`
    )
    .join("")}</select></label>`;
}

export function renderKpSemanticAnimationWorkbenchResults(
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
  selectedRepresentationId: string | undefined,
  selectedPlaybackRepresentationId: string | undefined
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
  const playbackRepresentation = selected.representations.find(
    (representation) =>
      representation.representationId ===
      selectedPlaybackRepresentationId
  );
  const canonicalRepresentation = selected.representations.find(
    ({ presentationRole }) => presentationRole === "canonical"
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
      playbackRepresentation,
      canonicalRepresentation,
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
      ${renderPromotionLineage(selected)}
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

function renderPromotionLineage(
  selected: KpSemanticAnimationWorkbenchQueryResult["entry"]
): string {
  return `<section class="kp-animation-workbench__promotion-lineage" data-kp-animation-workbench-promotion-lineage="${escapeHtml(selected.identity.animationId)}" aria-labelledby="kp-animation-workbench-promotion-title">
    <div class="kp-animation-workbench__section-heading">
      <p class="eyebrow">Canonical evidence</p>
      <h3 id="kp-animation-workbench-promotion-title">Promotion lineage</h3>
    </div>
    <p><strong>${escapeHtml(selected.promotion.facet.maturity)}</strong> is derived for the canonical animation, independent of the selected lesson or card.</p>
    <ul>${selected.promotion.evidenceSourceIds
      .map((sourceId) => `<li><code>${escapeHtml(sourceId)}</code></li>`)
      .join("")}</ul>
  </section>`;
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
  const fixtures = representations.filter(
    ({ presentationRole }) => presentationRole === "superseded-fixture"
  );
  const ordered = representations
    .filter(
      ({ presentationRole }) => presentationRole !== "superseded-fixture"
    )
    .sort((left, right) => {
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
    ${
      fixtures.length === 0
        ? ""
        : `<p data-kp-animation-workbench-superseded-fixtures>${fixtures.length} legacy ${fixtures.length === 1 ? "route remains" : "routes remain"} resolvable as ${fixtures.length === 1 ? "a fixture" : "fixtures"}.</p>`
    }
  </section>`;
}

function renderRepresentationControl(
  representation: KpAnimationRepresentationRelationship,
  selectedRepresentationId: string | undefined
): string {
  const content = `<span>${escapeHtml(representation.label)}</span>
    <small>${escapeHtml(representation.kind)} · ${escapeHtml(representation.presentationRole)} · ${representation.playable ? "playable" : "static"}</small>`;
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
  playbackRepresentation: KpAnimationRepresentationRelationship | undefined,
  canonicalRepresentation: KpAnimationRepresentationRelationship | undefined,
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
  return `<section class="kp-animation-workbench__live-preview editor-animation-library" data-kp-animation-workbench-live-preview data-kp-editor-animation-library data-kp-editor-animation-id="${escapeHtml(descriptor.animationId)}" data-kp-editor-animation-descriptor-id="${escapeHtml(descriptor.id)}"${playbackRepresentation === undefined ? "" : ` data-kp-animation-workbench-representation="${escapeHtml(playbackRepresentation.representationId)}"`}${canonicalRepresentation === undefined ? "" : ` data-kp-animation-workbench-canonical-representation="${escapeHtml(canonicalRepresentation.representationId)}"`}>
    <div class="kp-animation-workbench__preview-heading">
      <p class="eyebrow">${playbackRepresentation === undefined ? "Live animation" : `${escapeHtml(playbackRepresentation.kind)} projection`}</p>
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
