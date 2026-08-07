# Motion Passage Vocabulary

Status: canonical
Accepted: 2026-08-07
Revised: 2026-08-07

## Purpose

Use one stable vocabulary for lesson content, visual presentation, semantic
motion, and scroll coordination. These terms keep authoring structure separate
from a particular desktop layout and keep both separate from animation runtime
objects.

## Canonical Terms

| Term | Meaning |
| --- | --- |
| **Lesson document** | A complete article, tutorial, or essay. |
| **Motion passage** | An embeddable compound unit containing a stage and its related narrative. A lesson document may contain any number of motion passages. |
| **Stage** | The visual display area for a graph, equation, code view, diagram, or 3D scene. |
| **Narrative track** | The ordered textual material associated with a stage. This term is orientation-neutral. |
| **Narrative column** | A narrative track when it is placed beside the stage. |
| **Passage** | One authored textual unit. It may contain paragraphs, headings, or lists and need not look like a card. |
| **Prose passage** | Ordinary, usually longer, explanatory reading. |
| **Cue passage** | Short text that tells the reader what to inspect, anticipate, or retain. |
| **Motion cue** | A cue passage that owns a bounded semantic animation interval. |
| **Motion block** | The framework-neutral animation timeline already used by the runtime. It never names a page-layout container. |
| **Motion beat** | A meaningful checkpoint or phase within a motion block. |
| **Progress rail** | A read-only indication of motion progress. |
| **Scrubber** | An interactive control that lets a person set motion progress. |
| **Scroll corridor** | The document-distance interval mapped to semantic progress. |
| **Stacked projection** | A vertical presentation of stage and narrative. |
| **Split projection** | A side-by-side presentation of stage and narrative. |
| **Station lifecycle** | Interaction behavior in which a stage temporarily pins while passages approach, scrub, settle, and release. It can be used by either projection. |

## Boundary

The central separation is:

```text
motion passage = content structure
station lifecycle = interaction behavior
stacked/split = presentation projection
```

Semantic playback state is also distinct from all three. A motion block and
its motion beats can be presented in multiple motion passages and projections.
A motion passage may contain only a focus change and no animated motion block.

## Usage

- Use these terms in new source, documentation, tests, review notes, and run
  contracts.
- Preserve **motion block** as the runtime term. Do not reuse it for the stage,
  station, or compound page unit.
- Treat `card`, `row`, `column`, `scene`, and `scroll block` as historical or
  implementation-local terms unless they literally describe visual styling or
  DOM geometry.
- Do not perform a repository-wide rename only for vocabulary. When a bounded
  implementation slice touches an ambiguous public name, migrate it toward the
  canonical term with compatibility and focused verification.
- A passage may render without card chrome. Its authored boundary and stable ID
  remain meaningful even when it appears as ordinary document prose.

## Related Standards

- `inline-sticky-lesson-layout.md` records earlier economics-local discovery
  geometry. Where its exploratory vocabulary conflicts, this document owns the
  canonical project term; its historical visual decisions remain evidence.
- `../../kinetic_press_visual_salience_handoff.md` owns semantic attention
  treatment rather than lesson layout.
