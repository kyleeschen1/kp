import type { ColumnExample } from "./model.ts";
import type { ComparisonSource } from "./comparison-source.ts";

// Local editorial composition, not a replacement for Article or a proof schema.
// An inspection contains the actual checked source, never a renderer selector or
// an equation string that could silently select unrelated choreography.
export type Inspection = Readonly<{ id: string; label: string } & (
  | { kind: "columns"; scene: ColumnExample }
  | { kind: "comparison"; source: ComparisonSource }
)>;
export type ArgumentBlock =
  | Readonly<{ kind: "text"; text: string }>
  | Readonly<{ kind: "math"; latex: string }>
  | Readonly<{ kind: "inspect"; inspection: Inspection }>
  | Readonly<{ kind: "question"; prompt: string; answer: string }>;
export type MatrixArgument = Readonly<{
  id: string; title: string; introduction: string;
  sections: readonly Readonly<{ id: string; title: string; blocks: readonly ArgumentBlock[] }>[];
}>;
export class ArgumentGap extends Error {
  readonly code = "matrix.argument.repair";
  readonly path: string;
  constructor(path: string, message: string) { super(`${path}: ${message}`); this.name = "ArgumentGap"; this.path = path; }
}
export const text = (text: string): ArgumentBlock => ({ kind: "text", text });
export const math = (latex: string): ArgumentBlock => ({ kind: "math", latex });
export const inspect = (inspection: Inspection): ArgumentBlock => ({ kind: "inspect", inspection });
export const question = (prompt: string, answer: string): ArgumentBlock => ({ kind: "question", prompt, answer });

export function defineArgument(source: MatrixArgument): MatrixArgument {
  const ids = new Set<string>();
  const nonempty = (value: string, path: string) => { if (!value.trim()) throw new ArgumentGap(path, "Supply nonempty reading text."); };
  const id = (value: string, path: string) => {
    if (!/^[a-z][a-z0-9-]*$/.test(value) || ids.has(value)) throw new ArgumentGap(path, "Supply a unique URL-safe identity.");
    ids.add(value);
  };
  id(source.id, "id"); nonempty(source.title, "title"); nonempty(source.introduction, "introduction");
  if (!source.sections.length) throw new ArgumentGap("sections", "Supply a complete reading.");
  const sections = source.sections.map((section, i) => {
    const path = `sections[${i}]`; id(section.id, `${path}.id`); nonempty(section.title, `${path}.title`);
    if (!section.blocks.length) throw new ArgumentGap(`${path}.blocks`, "Supply the connecting explanation.");
    const blocks = section.blocks.map((block, j): ArgumentBlock => {
      const at = `${path}.blocks[${j}]`;
      switch (block.kind) {
        case "text": nonempty(block.text, at); break;
        case "math": nonempty(block.latex, at); break;
        case "question": nonempty(block.prompt, at); nonempty(block.answer, at); break;
        case "inspect": {
          const item = block.inspection; id(item.id, at); nonempty(item.label, at);
          if (item.kind !== "columns" && item.kind !== "comparison") throw new ArgumentGap(at, "Use an existing column or comparison source.");
          return Object.freeze({ ...block, inspection: Object.freeze({ ...item }) });
        }
        default: throw new ArgumentGap(at, "Unsupported reading block.");
      }
      return Object.freeze({ ...block });
    });
    return Object.freeze({ ...section, blocks: Object.freeze(blocks) });
  });
  return Object.freeze({ ...source, sections: Object.freeze(sections) });
}

export const inspections = (source: MatrixArgument): readonly Inspection[] =>
  source.sections.flatMap(section => section.blocks.flatMap(block => block.kind === "inspect" ? [block.inspection] : []));
