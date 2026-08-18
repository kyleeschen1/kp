<script lang="ts">
  import type {
    KpAnimationTransformationCoverageViewModel
  } from "../animation-transformation-coverage-view-model.ts";
  import type {
    KpAnimationDevelopmentTheme
  } from "../animation-development-url-state.ts";

  let { view, theme }: {
    view: KpAnimationTransformationCoverageViewModel;
    theme: KpAnimationDevelopmentTheme;
  } = $props();
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
