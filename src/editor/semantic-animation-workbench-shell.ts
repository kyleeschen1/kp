export function renderKpSemanticAnimationWorkbenchShell(input: {
  readonly query: string;
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
      <input type="search" value="${escapeHtml(input.query)}" placeholder="Try radical, tangent, quadratic, or a family…" autocomplete="off" data-kp-animation-workbench-query />
      <small>Search title, aliases, families, motifs, lifecycle, and representations.</small>
    </label>
    <div class="kp-animation-workbench__layout">
      <aside class="kp-animation-workbench__results" aria-label="Animation results">
        <div class="kp-animation-workbench__empty" data-kp-animation-workbench-results>
          <p class="eyebrow">Canonical index</p>
          <h2>Results are ready to connect</h2>
          <p>The next slice renders one row per animation from the derived index.</p>
        </div>
      </aside>
      <main class="kp-animation-workbench__detail" data-kp-animation-workbench-detail>
        <div class="kp-animation-workbench__empty">
          <p class="eyebrow">Selected animation</p>
          <h2>Choose an animation to inspect</h2>
          <p>Concrete items will reuse the existing player. Planned items will remain visibly non-playable.</p>
        </div>
      </main>
    </div>
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
