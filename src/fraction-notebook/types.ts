import type { Metadata, UUID } from '../notebook/model.ts';
export type Mark = 'strong' | 'em' | 'code';
export interface Identified { readonly id: UUID; readonly metadata: Metadata }
export interface Annotation extends Identified {}
export interface TextInline { readonly type: 'text'; readonly text: string; readonly marks: readonly Mark[]; readonly annotations: readonly Annotation[] }
export interface InlineObject extends Identified { readonly type: 'link' | 'math'; readonly source: string }
export type Inline = TextInline | InlineObject;
export interface ProseCell extends Identified { readonly type: 'paragraph' | 'title'; readonly content: readonly Inline[] }
export interface AuthorCredit extends Identified { readonly type: 'authorCredit'; readonly name: string; readonly role: 'author' | 'editor' | 'translator' }
export interface ArticleHeader extends Identified { readonly type: 'articleHeader'; readonly title: ProseCell & { readonly type: 'title' }; readonly authors: readonly AuthorCredit[] }
export interface Caption extends Identified { readonly type: 'caption'; readonly text: string }
export interface Story extends Identified { readonly type: 'story'; readonly source: string; readonly caption: Caption }
export type ChildLayout = 'flow' | 'bullets' | 'numbered' | 'outline';
export interface ContentBlock extends Identified {
  readonly type: 'block'; readonly kind: 'paragraph' | 'note';
  readonly title: (ProseCell & { readonly type: 'title' }) | null;
  readonly content: readonly Inline[]; readonly children: readonly ContentBlock[];
  readonly layout: ChildLayout; readonly folded: boolean;
}
export type Cell = ArticleHeader | ContentBlock | Story;
export interface FractionNotebook { readonly schemaVersion: 3; readonly id: UUID; readonly revision: number; readonly cells: readonly Cell[] }
export interface Step { readonly title: string; readonly content: string; readonly focusRefs: readonly string[] }
export interface Definition { readonly id: string; readonly asset: { readonly id: string; readonly version: string }; readonly presentation: string;
  readonly beats: readonly (Step & { readonly id: string; readonly progressPermille: number })[] }
export const proseText = (text: string): TextInline => ({ type: 'text', text, marks: [], annotations: [] });
