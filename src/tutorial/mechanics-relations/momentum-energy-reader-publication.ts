import { compileKpArticleMarkdownFragmentHtml } from "../../article/kp-article-static-html.ts";
import { defineKpLessonDocument, kpLesson, type KpLessonBlock } from "../../reader/document/public-api.ts";
import { renderKpFocusDeckAnnotation } from "../focus-deck-annotation.ts";
import { physicalTime, sampleMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { describeMomentumEnergyFrame, displayNumber, renderMomentumEnergySvg } from "./momentum-energy-figure.ts";
import { momentumEnergyAttention } from "./momentum-energy-attention.ts";
import type { MomentumEnergyRuntimeSource } from "./momentum-energy-runtime-source.ts";
import type { compileMomentumEnergyPublication } from "./momentum-energy-publication.ts";
import { renderEnergyDerivationPassage, renderForceEnergyPassage } from "./momentum-energy-derivation-publication.ts";
import { sha256 } from "../../kernel/sha256.ts";

type Publication = ReturnType<typeof compileMomentumEnergyPublication>;
const html = compileKpArticleMarkdownFragmentHtml;
const attribute = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const annotation = (id: string, text: string) => renderKpFocusDeckAnnotation({ entityId: id, text, role: "support" });

/** A bounded Article-to-reader projection, not a second source language.
 * Article owns the displayed Markdown; the existing lesson contract owns the
 * addressable motion/attention structure used by reader extensions. */
export function renderMomentumEnergyReader(publication: Publication) {
  const origin = publication.article.document.blocks.find(block => block.kind === "passage" && block.id === "momentum-definition");
  if (!origin || origin.kind !== "passage") throw new Error("Missing momentum definition for the recalled result");
  const revision = sha256(JSON.stringify(publication.article.document));
  const blocks: KpLessonBlock[] = [];
  const stages = new Map(publication.article.document.blocks.filter(block => block.kind === "stage").map(block => [block.id, block]));
  const derivations = new Map([
    ["energy-from-momentum", renderEnergyDerivationPassage], ["force-to-energy", renderForceEnergyPassage]
  ]);
  const body = publication.article.document.blocks.map(block => {
    if (block.kind === "stage") return "";
    if (block.kind === "markdown" || block.kind === "passage") {
      const id = block.kind === "markdown" ? block.key : block.fullId;
      blocks.push(kpLesson.paragraph({ id, content: [block.markdown] }));
      // Passage addresses must survive projection so source-owned inspection
      // links work in both editions without a second navigation table.
      return block.kind === "passage"
        ? `<section id="${attribute(block.id)}">${derivations.get(block.id)?.(block.markdown, revision) ?? html(block.markdown)}</section>`
        : html(block.markdown);
    }
    if (block.kind !== "motion" || block.transition.kind !== "run" || !block.transition.path.endsWith("/advance"))
      throw new Error("This candidate reader requires an explicit supported physics motion; no generic projection fallback.");
    const stage = stages.get(block.stageId);
    const capability = publication.capabilities.find(c => c.release.id === stage?.vignette.id);
    if (!capability) throw new Error("Physics motion is not bound to a governed vignette");
    const { model, revisionId } = capability.compiled;
    const id = block.fullId, initial = sampleMomentumEnergy(model, physicalTime(0));
    const manifest: MomentumEnergyRuntimeSource = { schemaVersion: "kp.physics.momentum-energy.runtime.v1", source: model.source,
      revisionId, representationId: "representation.physics.momentum-energy.native-2d.v1" };
    blocks.push(kpLesson.animationStory({ id, asset: { id: capability.compiled.animation.id, version: revisionId }, presentation: "step",
      attention: momentumEnergyAttention(id), beats: [
        kpLesson.beat({ id: `${id}.start`, title: "Before", content: [block.beforeMarkdown], checkpoint: { id: `${id}.initial`, progressPermille: 0 }, focusRefs: ["physics.particle"] }),
        kpLesson.beat({ id: `${id}.end`, title: "After", content: [block.afterMarkdown ?? ""], checkpoint: { id: `${id}.settled`, progressPermille: 1000 }, focusRefs: ["physics.momentum", "physics.energy"] })
      ] }));
    return `<section class="physics-motion kp-focus-deck" id="${attribute(id)}" data-physics-motion data-episode="${model.source.episode}">
      <div class="physics-cue">${html(block.beforeMarkdown)}</div>
      <figure class="physics-figure">
        <div class="physics-quantities">${annotation("physics.momentum", `Momentum (${displayNumber(initial.momentum.x)}, ${displayNumber(initial.momentum.y)}) kg m/s`)}${annotation("physics.energy", `Kinetic energy ${displayNumber(initial.kineticEnergy)} J`)}</div>
        ${renderMomentumEnergySvg(model, physicalTime(0))}
        <div class="physics-legend">${annotation("physics.legend", "Blue arrow: momentum · Brown arrow: net force")}${annotation("physics.scale", "Arrow lengths use separate scales. Energy bar: 0–8 J.")}</div>
        <div class="physics-controls" data-physics-controls hidden>
          <span class="physics-playback-note">Playback at 0.4× speed · drag to inspect</span>
          <button type="button" data-physics-play>Play</button><button type="button" data-physics-reset>Reset</button>
          <label for="${attribute(id)}.time">Time <output>0 / ${displayNumber(model.durationSeconds)} s</output></label>
          <input id="${attribute(id)}.time" type="range" min="0" max="${model.durationSeconds}" step="any" value="0" aria-label="${model.source.episode} motion time">
        </div>
        <figcaption data-physics-description>${describeMomentumEnergyFrame(initial)}</figcaption>
      </figure>
      <div class="physics-after">${html(block.afterMarkdown ?? "")}</div>
      <script type="application/json" data-physics-source>${JSON.stringify(manifest).replaceAll("<", "\\u003c")}</script>
    </section>`;
  }).join("\n");
  const titleBlock = publication.article.document.blocks.find(block => block.kind === "markdown");
  const title = titleBlock?.kind === "markdown" ? /^# (.+)$/m.exec(titleBlock.markdown)?.[1] : undefined;
  if (!title) throw new Error("Physics Article requires a source-owned title");
  const document = defineKpLessonDocument({ id: publication.article.document.id, version: "1.0.0", title, blocks });
  return { document, html: `<article data-kp-article="${attribute(document.id)}">${body}</article>` };
}
