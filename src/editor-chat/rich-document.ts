import { Schema, type Node as ProseNode } from 'prosemirror-model';
import { schema as commonmark, MarkdownParser, MarkdownSerializer, defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { chatMarkdown } from './markdown-math.ts';
import type { ChatMessage } from './protocol.ts';

export function safeLink(value: unknown): string | null {
  if (typeof value !== 'string' || /[\u0000-\u0020\u007f]/.test(value)) return null;
  return /^(https?:\/\/|mailto:|#)/i.test(value) || /^\/(?!\/)/.test(value) ? value : null;
}
// Display untrusted Markdown as schema nodes. Images remain explicit links, so
// reading a reply cannot initiate arbitrary remote image requests.
export const richSchema = new Schema({
  nodes: commonmark.spec.nodes.update('heading', { ...commonmark.spec.nodes.get('heading'), content: 'inline*' }).update('image', { ...commonmark.spec.nodes.get('image'),
    toDOM: node => ['a', { href: safeLink(node.attrs['src']), target: '_blank', rel: 'noopener noreferrer', class: 'kp-rich-image' }, String(node.attrs['alt'] || 'Image link')] }
  ).append({
    math_inline: { inline: true, group: 'inline', atom: true, attrs: { source: {} },
      leafText: node => `\\(${String(node.attrs['source'])}\\)`,
      parseDOM: [{ tag: 'span[data-chat-math]', getAttrs: element => ({ source: element.getAttribute('data-chat-math') ?? '' }) }],
      toDOM: node => ['span', { class: 'kp-chat-math', 'data-chat-math': node.attrs['source'] }, String(node.attrs['source'])] },
    math_block: { group: 'block', atom: true, attrs: { source: {} },
      leafText: node => `\\[${String(node.attrs['source'])}\\]`,
      parseDOM: [{ tag: 'div[data-chat-math][data-display=true]', getAttrs: element => ({ source: element.getAttribute('data-chat-math') ?? '' }) }],
      toDOM: node => ['div', { class: 'kp-chat-math', 'data-chat-math': node.attrs['source'], 'data-display': 'true' }, String(node.attrs['source'])] },
    chat_message: { content: 'block+', group: 'block', defining: true, isolating: true,
    attrs: { id: {}, role: {}, speaker: {}, complete: { default: true }, clipped: { default: false } },
    toDOM: node => ['article', { class: 'kp-chat-message', 'data-message-id': node.attrs['id'], 'data-role': node.attrs['role'], 'aria-label': node.attrs['speaker'] },
      ['div', { class: 'kp-chat-speaker', contenteditable: 'false' }, node.attrs['speaker']],
      ...(node.attrs['clipped'] ? [['div', { class: 'kp-chat-speaker', contenteditable: 'false' }, 'Display shortened']] : []),
      ['div', { class: 'kp-chat-text' }, 0]]
  } }),
  marks: commonmark.spec.marks.update('link', { ...commonmark.spec.marks.get('link'),
    parseDOM: [{ tag: 'a[href]', getAttrs: element => {
      const href = safeLink(element.getAttribute('href')); return href ? { href, title: element.getAttribute('title') } : false;
    } }],
    toDOM: mark => ['a', { href: safeLink(mark.attrs['href']), title: mark.attrs['title'], target: '_blank', rel: 'noopener noreferrer' }, 0]
  })
});
const parser = new MarkdownParser(richSchema, chatMarkdown(), { ...defaultMarkdownParser.tokens,
  kp_math_inline: { node: 'math_inline', getAttrs: token => ({ source: token.content }) },
  kp_math_block: { node: 'math_block', getAttrs: token => ({ source: token.content }) }
});
const serializer = new MarkdownSerializer({ ...defaultMarkdownSerializer.nodes,
  math_inline: (state, node) => { state.write(`\\(${String(node.attrs['source'])}\\)`); },
  math_block: (state, node) => { state.write(`\\[\n${String(node.attrs['source'])}\n\\]`); state.closeBlock(node); }
}, defaultMarkdownSerializer.marks);
export const parseMarkdown = (source: string): ProseNode => parser.parse(source);
export const serializeMarkdown = (doc: ProseNode): string => serializer.serialize(doc);
/** Tool bytes stay literal, including Markdown-looking output and HTML. */
export const messageDocument = (message: ChatMessage): ProseNode => message.role === 'tool'
  ? richSchema.node('doc', null, [richSchema.node('code_block', null, message.text ? richSchema.text(message.text) : undefined)])
  : parseMarkdown(message.text);

/** A plain-text index retains corresponding ProseMirror coordinates. It is
 * independent of Markdown delimiters and handles nested blocks and split marks. */
export function textIndex(doc: ProseNode) {
  let text = '', seenBlock = false;
  const positions: number[] = [];
  const append = (value: string, position: number, advancing = false) => {
    text += value;
    for (let i = 0; i < value.length; i++) positions.push(position + (advancing ? i : 0));
  };
  doc.descendants((node, pos) => {
    if (node.isTextblock || node.type.name === 'math_block') { if (seenBlock) append('\n', pos); seenBlock = true; }
    if (node.isText) append(node.text ?? '', pos, true);
    else if (node.type.name === 'hard_break') append('\n', pos);
    else if (node.type.name === 'image') append(String(node.attrs['alt'] || 'Image link'), pos);
    else if (node.type.name === 'math_inline' || node.type.name === 'math_block') append(String(node.attrs['source']), pos);
  });
  return { text, positions };
}
