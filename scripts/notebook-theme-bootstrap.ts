import { build } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** Only the development notebook and its preview get the authoring palette.
 * Ordinary published readers retain their own startup and dependency closure. */
export function notebookThemeBootstrap() {
  let cached: Promise<string> | undefined;
  const generate = async () => {
    const result = await build({ configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, lib: {
        entry: fileURLToPath(new URL('../src/fraction-notebook/theme-startup.ts', import.meta.url)),
        name: 'kpNotebookTheme', formats: ['iife']
      } } });
    const bundle = Array.isArray(result) ? result[0] : result;
    if (!bundle || !('output' in bundle)) throw new Error('Notebook theme bootstrap did not produce a bundle.');
    const chunk = bundle.output.find(part => part.type === 'chunk');
    if (!chunk) throw new Error('Notebook theme bootstrap is missing its script.');
    // Inline the canonical tokens, not the legacy @import wrapper: relative
    // CSS imports in a style tag resolve against the preview URL, not this file.
    const palette = await readFile(new URL('../src/ui-theme/palette.css', import.meta.url), 'utf8');
    return `<style data-notebook-startup>${palette}\nhtml[data-notebook-theme],html[data-notebook-theme]>body{background:var(--fn-background,var(--color-paper))!important;color:var(--fn-text,var(--color-ink))}html[data-notebook-theme=light]{color-scheme:light}html[data-notebook-theme=dark]{color-scheme:dark}html[data-notebook-window-surface],html[data-notebook-window-surface]>body{background:transparent!important}</style><script data-notebook-startup>${chunk.code.replaceAll('</script', '<\\/script')}</script>`;
  };
  return {
    invalidate() { cached = undefined; },
    async inject(html: string) {
      cached ??= generate().catch(error => { cached = undefined; throw error; });
      return html.replace('</head>', `${await cached}</head>`);
    }
  };
}
