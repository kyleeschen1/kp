<script lang="ts">
  import { onMount, untrack } from "svelte";

  import type {
    KpAnimationTransformationCoverageViewModel
  } from "../animation-transformation-coverage-view-model.ts";
  import type {
    KpAnimationDevelopmentTheme
  } from "../animation-development-url-state.ts";
  import {
    readKpAnimationDevelopmentUrlState
  } from "../animation-development-url-state.ts";

  let { view, theme: initialTheme }: {
    view: KpAnimationTransformationCoverageViewModel;
    theme: KpAnimationDevelopmentTheme;
  } = $props();
  let theme = $state(untrack(() => initialTheme));
  let operationQuery = $state("");
  let visibleOperations = $derived.by(() => {
    const terms = operationQuery.trim().toLocaleLowerCase("en-US")
      .split(/\s+/u).filter(Boolean);
    if (terms.length === 0) return [];
    return view.operationDiscovery.entries.filter((entry) => {
      const haystack = [
        entry.operationId,
        entry.friendlyName,
        entry.meaning,
        ...entry.aliases
      ].join(" ").toLocaleLowerCase("en-US");
      return terms.every((term) => haystack.includes(term));
    }).slice(0, 8);
  });

  onMount(() => {
    const syncTheme = (): void => {
      theme = readKpAnimationDevelopmentUrlState(window.location.href).theme;
    };
    window.addEventListener("kp-development-theme-change", syncTheme);
    return () => window.removeEventListener(
      "kp-development-theme-change",
      syncTheme
    );
  });
</script>

<svelte:head>
  <title>Transformation coverage · Kinetic Press</title>
</svelte:head>

<main
  class="kp-transformation-coverage"
  data-kp-transformation-coverage
  data-kp-animation-coverage-theme={theme}
  aria-labelledby="kp-transformation-coverage-title"
>
  <header class="kp-transformation-coverage__header">
    <p class="kp-transformation-coverage__eyebrow">Internal capability map</p>
    <h3 id="kp-transformation-coverage-title">Transformation coverage</h3>
    <p class="kp-transformation-coverage__intro">
      Direct means deterministic authoring is available. Registered means the
      typed operation exists. Exemplar means one artifact works without general
      generation. Missing names unfinished infrastructure.
    </p>
    <dl
      class="kp-transformation-coverage__summary"
      aria-label={`${view.total} planned transformation capabilities`}
    >
      {#each view.statusCounts as item (item.status)}
        <div data-kp-transformation-coverage-count={item.status}>
          <dt>{item.status}</dt>
          <dd>{item.count}</dd>
        </div>
      {/each}
    </dl>
  </header>

  <section
    class="kp-transformation-coverage__operation-discovery"
    aria-labelledby="kp-operation-discovery-title"
  >
    <h3 id="kp-operation-discovery-title">Find an authoring operation</h3>
    <p>
      Search {view.operationDiscovery.total} generated descriptors. Results
      explain when to use an operation and which evidence KP still requires.
    </p>
    <label>
      <span>Operation name, alias, or meaning</span>
      <input
        type="search"
        bind:value={operationQuery}
        placeholder="remove additive zero"
        autocomplete="off"
      />
    </label>
    {#if operationQuery.trim().length > 0}
      <p class="kp-transformation-coverage__operation-count" aria-live="polite">
        {visibleOperations.length} matching operation{visibleOperations.length === 1 ? "" : "s"}
      </p>
      <div class="kp-transformation-coverage__operation-results">
        {#each visibleOperations as operation (operation.operationId)}
          <details data-kp-equation-operation={operation.operationId}>
            <summary>
              <span>{operation.friendlyName}</span>
              <code>{operation.operationId}</code>
            </summary>
            <p>{operation.meaning}</p>
            <dl>
              <div><dt>Example</dt><dd>{operation.positiveExample}</dd></div>
              <div><dt>Not this</dt><dd>{operation.counterexample}</dd></div>
              <div>
                <dt>Required evidence</dt>
                <dd>{operation.requiredEvidenceIds.join(", ")}</dd>
              </div>
            </dl>
            <pre><code>{operation.inspectExample}</code></pre>
          </details>
        {/each}
      </div>
    {/if}
  </section>

  <ol class="kp-transformation-coverage__rows">
    {#each view.rows as row (row.capabilityId)}
      <li
        class="kp-transformation-coverage__row"
        data-kp-transformation-coverage-row={row.capabilityId}
        data-kp-transformation-coverage-status={row.status}
      >
        <span class="kp-transformation-coverage__order" aria-hidden="true">
          {String(row.order).padStart(2, "0")}
        </span>
        <div class="kp-transformation-coverage__identity">
          <h4>{row.title}</h4>
          <p>{row.domain}</p>
        </div>
        <strong class="kp-transformation-coverage__status">{row.status}</strong>
        <div class="kp-transformation-coverage__work">
          {#if row.remaining.length === 0}
            <p>Required evidence is present.</p>
          {:else}
            <p>{row.remaining.length} remaining</p>
            <ul>
              {#each row.remaining as requirement (requirement.id)}
                <li>{requirement.summary}</li>
              {/each}
            </ul>
          {/if}
          {#if row.frontendAuthorities.length > 0}
            <p class="kp-transformation-coverage__frontend">
              Domain frontend required: {row.frontendAuthorities.join(", ")}
            </p>
          {/if}
        </div>
        {#if row.exemplarLinks.length > 0}
          <nav aria-label={`${row.title} exemplars`}>
            {#each row.exemplarLinks as exemplar (exemplar.assetId)}
              {#if exemplar.href === undefined}
                <span>{exemplar.title}</span>
              {:else}
                <a href={exemplar.href}>{exemplar.title}</a>
              {/if}
            {/each}
          </nav>
        {/if}
      </li>
    {/each}
  </ol>
</main>
