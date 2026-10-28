/** Prepare only the known flat fractional-reader markup, before first paint.
 * This is not an arbitrary HTML parser: fail closed if its compiler shape
 * changes (e.g. nested attention lists), rather than hydrating half a layout.
 */
export function compileFractionalCaptionShell(html: string, beatCount: number): string {
  const article = html.indexOf('<article class="kp-lesson"');
  const introStart = html.indexOf('>', article) + 1;
  const storyStart = html.indexOf('<section ', introStart);
  const storyEnd = html.indexOf('</section>', storyStart) + '</section>'.length;
  const articleEnd = html.indexOf('</article>', storyEnd);
  if (article < 0 || introStart <= article || storyStart < introStart || storyEnd <= storyStart || articleEnd < storyEnd) {
    throw new Error('Fractional caption shell requires its compiled article and story.');
  }
  const intro = html.slice(introStart, storyStart).replace(/<h1\b/g, '<h1 hidden');
  const slots: string[] = [];
  let wrapped = 0;
  const story = html.slice(storyStart, storyEnd).replace(/(<li\b[^>]*data-kp-beat="([^"]+)"[^>]*>)(<div class="kp-beat-copy">[\s\S]*?<\/div>)(<\/li>)/g,
    (_match, opening: string, id: string, copy: string, closing: string) => {
      wrapped += 1;
      slots.push(`<div class="kp-caption-scroll-slot" data-kp-caption-slot="${id}"></div>`);
      const presence = wrapped === 1 ? 'data-kp-caption-active="true"' : 'hidden="until-found"';
      return `${opening}<div class="kp-rising-passage" id="caption.${id}" data-kp-rising-beat="${id}" ${presence}><div class="kp-caption-copy">${copy.replace(/<h2\b/g, '<h2 hidden')}</div></div>${closing}`;
    });
  if (wrapped !== beatCount || wrapped === 0 || story.includes('data-kp-attention-phase=') || story.slice(1).includes('<section ')) {
    throw new Error('Fractional caption shell requires the complete flat beat sequence.');
  }
  // The native sticky surface and the measured scroll slots are siblings.
  // Caption movement cannot move its own clock anchors or create a second transcript.
  const result = html.slice(0, introStart)
    + `<div class="kp-caption-document-intro">${intro}</div>`
    + `<div class="kp-caption-sequence"><div class="kp-caption-pin"><div class="kp-caption-frame"></div>${story}</div>`
    + `<div class="kp-caption-scroll-slots" aria-hidden="true">${slots.join('')}</div></div>`
    + `<div class="kp-caption-document-after">${html.slice(storyEnd, articleEnd)}</div>`
    + html.slice(articleEnd);
  return result.replace('<body', '<body data-kp-reader-layout="rising-passages" data-kp-caption-mode="captions"')
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
html body[data-kp-reader-layout] .kp-animation-beats > li { min-height: 0; padding-block: 1rem; }
body[data-kp-reader-layout] :is(.kp-caption-sequence, .kp-caption-pin) { display: block; position: static; height: auto; }
body[data-kp-reader-layout] .kp-caption-scroll-slots { display: none; }
body[data-kp-reader-layout] .kp-lesson { padding: 2rem 0; }
html body[data-kp-reader-layout] .kp-animation-static { position: static; transform: none; width: 100%; height: auto; }
`;
