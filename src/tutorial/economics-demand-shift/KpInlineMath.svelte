<script lang="ts">
  import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

  let { latex }: { readonly latex: string } = $props();
  let html = $derived(renderLatexToHtml(latex, { displayMode: false }));
</script>

<span class="kp-economics-tutorial__math" data-kp-latex={latex}>
  {@html html}
</span>
