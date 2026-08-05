<script lang="ts">
  import {
    renderKpEconomicsRetainedInlineLatex
  } from "../../rendering/economics-equilibrium-retained-math.ts";

  // Only trusted-off compiler output reaches this sink; runtime values select
  // retained fragments and never become HTML or KaTeX parser input.
  let { latex }: { readonly latex: string } = $props();
  let html = $derived(renderKpEconomicsRetainedInlineLatex(latex));
</script>

<span class="kp-economics-tutorial__math" data-kp-latex={latex}>{@html html}</span>
