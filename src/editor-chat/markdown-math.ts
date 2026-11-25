import MarkdownIt from 'markdown-it';

/** Recognize explicit TeX delimiters; unmatched streaming input stays text.
 * Code spans/fences keep their ordinary CommonMark ownership. */
export function chatMarkdown() {
  const markdown = new MarkdownIt('commonmark', { html: false });
  markdown.inline.ruler.before('escape', 'kp_math_inline', (state, silent) => {
    const start = state.pos, dollar = state.src[start] === '$' && state.src[start + 1] !== '$';
    const bracket = state.src.slice(start, start + 2) === '\\(';
    if (!dollar && !bracket) return false;
    const open = dollar ? 1 : 2, close = dollar ? '$' : '\\)';
    if (dollar && /\s/.test(state.src[start + open] ?? '')) return false;
    let end = state.src.indexOf(close, start + open);
    while (end >= 0) {
      let escapes = 0; for (let i = end - 1; i >= start + open && state.src[i] === '\\'; i--) escapes++;
      if (escapes % 2 === 0) break;
      end = state.src.indexOf(close, end + close.length);
    }
    if (end < 0 || end === start + open || state.src.slice(start, end).includes('\n')
      || (dollar && (/\s/.test(state.src[end - 1] ?? '') || /\d/.test(state.src[end + 1] ?? '')))) return false;
    if (!silent) { const token = state.push('kp_math_inline', '', 0); token.content = state.src.slice(start + open, end); }
    state.pos = end + close.length; return true;
  });
  markdown.block.ruler.before('fence', 'kp_math_block', (state, start, end, silent) => {
    if ((state.sCount[start] ?? 0) - state.blkIndent >= 4) return false;
    const position = (state.bMarks[start] ?? 0) + (state.tShift[start] ?? 0), first = state.src.slice(position, state.eMarks[start]);
    const open = first.startsWith('$$') ? '$$' : first.startsWith('\\[') ? '\\[' : null;
    if (!open) return false;
    const close = open === '$$' ? '$$' : '\\]';
    let line = start, body = first.slice(open.length), closing = body.indexOf(close);
    while (closing < 0 && line + 1 < end) {
      line++; body += '\n' + state.src.slice(state.bMarks[line], state.eMarks[line]); closing = body.indexOf(close);
    }
    if (closing < 0 || body.slice(closing + close.length).trim() || !body.slice(0, closing).trim()) return false;
    if (silent) return true;
    const token = state.push('kp_math_block', '', 0); token.block = true; token.map = [start, line + 1]; token.content = body.slice(0, closing).trim();
    state.line = line + 1; return true;
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  return markdown;
}
