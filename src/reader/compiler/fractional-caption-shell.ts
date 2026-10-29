import type { FractionalPassageOperationBinding } from './fractional-passage-operations.ts';

/** Prepare only the known flat fractional-reader markup, before first paint.
 * This is not an arbitrary HTML parser: fail closed if its compiler shape
 * changes (e.g. nested attention lists), rather than hydrating half a layout.
 */
export function compileFractionalCaptionShell(html: string, beatCount: number,
  operations: ReadonlyMap<string, FractionalPassageOperationBinding> = new Map()): string {
  const article = html.indexOf('<article class="kp-lesson"');
  const introStart = html.indexOf('>', article) + 1;
  const storyStart = html.indexOf('<section ', introStart);
  const storyEnd = html.indexOf('</section>', storyStart) + '</section>'.length;
  const articleEnd = html.indexOf('</article>', storyEnd);
  if (article < 0 || introStart <= article || storyStart < introStart || storyEnd <= storyStart || articleEnd < storyEnd) {
    throw new Error('Fractional caption shell requires its compiled article and story.');
  }
  const intro = html.slice(introStart, storyStart)
    .replace('</h1>', '</h1><p class="kp-document-byline">By Codex</p>');
  let wrapped = 0;
  const story = html.slice(storyStart, storyEnd).replace(/(<li\b[^>]*data-kp-beat="([^"]+)"[^>]*>)(<div class="kp-beat-copy">[\s\S]*?<\/div>)(<\/li>)/g,
    (_match, opening: string, id: string, copy: string, closing: string) => {
      wrapped += 1;
      const operation = operations.get(id);
      const attributes = operation === undefined ? ''
        : ` data-kp-operation-id="${operation.transformationId.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" data-kp-operation-start="${operation.start}" data-kp-operation-end="${operation.end}"`;
      return `${opening.slice(0, -1)}${attributes}><div class="kp-rising-passage" id="caption.${id}" data-kp-rising-beat="${id}"><div class="kp-caption-copy">${copy.replace(/<h2\b/g, '<h2 hidden')}</div></div>${closing}`;
    });
  if (wrapped !== beatCount || wrapped === 0 || story.includes('data-kp-attention-phase=') || story.slice(1).includes('<section ')) {
    throw new Error('Fractional caption shell requires the complete flat beat sequence.');
  }
  const staticStart = story.indexOf('<div class="kp-animation-static"');
  const listStart = story.indexOf('<ol class="kp-animation-beats"');
  if (staticStart < 0 || listStart <= staticStart) {
    throw new Error('Document passages require the compiled equation surface followed by its prose list.');
  }
  // Actual paragraphs remain in flow beside one sticky equation surface.
  // Beat containers own stable geometry; sticky paragraph paint never does.
  const flowStory = story.slice(0, staticStart)
    + '<div class="kp-caption-pin"><div class="kp-caption-frame"></div>'
    + story.slice(staticStart, listStart) + '</div>' + story.slice(listStart);
  const result = html.slice(0, introStart)
    + `<div class="kp-caption-document-intro">${intro}</div>`
    + `<div class="kp-caption-sequence">${flowStory}</div>`
    + `<div class="kp-caption-document-after">${html.slice(storyEnd, articleEnd)}</div>`
    + html.slice(articleEnd);
  // Keep chrome compact before hydration. The local reader moves its existing
  // bound controls into these slots; it does not create second control owners.
  const withOptions = result.replace(/(<header class="kp-reader-masthead">\s*<a class="kp-reader-wordmark"[^>]*>[\s\S]*?<\/a>)([\s\S]*?)(<\/header>)/,
    '$1<details class="kp-rising-navigation"><summary>Options</summary><div class="kp-reader-options">$2<div data-kp-reader-options-reading></div><div data-kp-reader-options-development></div></div></details>$3');
  return withOptions.replace('<body', '<body data-kp-reader-layout="rising-passages" data-kp-caption-mode="captions"')
    .replace('</head>', `<noscript><style data-kp-static-document>${staticDocumentStyles}</style></noscript></head>`);
}

// Keep this inline inside noscript: bundlers extract linked stylesheets into
// unconditional CSS, which would apply the static fallback with JS enabled.
const staticDocumentStyles = `
body[data-kp-reader-layout] .kp-rising-passage {
  position: static !important; transform: none !important; display: block !important;
  content-visibility: visible !important; opacity: 1 !important;
  width: 100% !important; height: auto !important; overflow: visible !important; padding: 0 24px !important;
}
body[data-kp-reader-layout] .kp-caption-copy { transform: none; max-height: none; width: auto; margin: 0; padding: 0; }
body[data-kp-reader-layout] .kp-caption-frame { display: none; }
body[data-kp-reader-layout] .kp-reader-layout > .kp-lesson-toc { display: block; position: static; }
html body[data-kp-reader-layout] .kp-animation-beats { padding: 0; }
html body[data-kp-reader-layout] .kp-animation-beats > li { min-height: 0; padding-block: 1rem; margin: 0; }
html body[data-kp-reader-layout] .kp-animation-beats > li::after { display: none; }
body[data-kp-reader-layout] :is(.kp-caption-sequence, .kp-caption-pin) { display: block; position: static; height: auto; }
body[data-kp-reader-layout] .kp-lesson { padding: 2rem 0; }
html body[data-kp-reader-layout] .kp-animation-static { position: static; transform: none; width: 100%; height: auto; }
`;
