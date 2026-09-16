import { checkMomentumEnergy, momentumEnergyExamples, physicalTime, sampleMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { compileMomentumEnergyAsset } from "../../authoring/momentum-energy-authoring.ts";
import { createKpVignetteRelease, resolveKpArticleImports, serializeKpVignetteReleasePayload, type KpArticleImportLock } from "../../article/kp-article-import-lock.ts";
import { compileKpArticleDocument } from "../../article/kp-article-document.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { compileKpArticleStaticHtml } from "../../article/kp-article-static-html.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { describeMomentumEnergyFrame, renderMomentumEnergySvg } from "./momentum-energy-figure.ts";
import { compileMomentumDependencies, momentumDependencyIntegrity } from "./momentum-dependency-publication.ts";

export const momentumEnergySourcePath = "examples/physics/momentum-energy.article.md";

/** Build-only: imports bind to governed assets before any publication is emitted.
 * The browser receives physics inputs and compiled prose, not this compiler. */
export function compileMomentumEnergyPublication(text: string, lock?: KpArticleImportLock, dependencyLock?: string) {
  if (dependencyLock !== undefined && dependencyLock !== momentumDependencyIntegrity)
    throw new Error("physics.dependency.integrity-mismatch: restore the pinned source or explicitly upgrade the edition");
  const dependencies = compileMomentumDependencies(text);
  for (const view of ["definition", "velocity", "division"] as const) {
    if (!dependencies.occurrences.some(item => item.passageId === "momentum-definition" && item.reference.view === view))
      throw new Error("physics.dependency.missing-origin: the recall requires the pinned definition and derivation, not copied prose");
  }
  const assets = new Map<string, string>();
  const capabilities = momentumEnergyExamples.map(source => {
    const checked = checkMomentumEnergy(source);
    if (checked.status !== "checked") throw new Error(`Unsupported physics source: ${JSON.stringify(checked)}`);
    const compiled = compileMomentumEnergyAsset(checked.model);
    const checkpoints = (["initial", "settled"] as const).map((id, i) => {
      const time = physicalTime(i === 0 ? 0 : checked.model.durationSeconds);
      const assetPath = `./kp-static/momentum-energy-${source.episode}-${id}.svg`;
      assets.set(assetPath, renderMomentumEnergySvg(checked.model, time));
      const summary = describeMomentumEnergyFrame(sampleMomentumEnergy(checked.model, time));
      return { id, label: id === "initial" ? "Starting state" : "After the interval", alt: summary,
        caption: `${summary} Blue arrow: momentum. Brown arrow: net force (a separate scale). Bottom bar: kinetic energy, on a 0–8 J scale.`, assetPath };
    });
    const draft = createKpVignetteRelease({ schemaVersion: "kp.vignette-release.v1",
      id: `vignette.physics.momentum-energy-${source.episode}`, version: "1.0.0", integrity: `sha256:${"0".repeat(64)}`,
      moduleSpecifier: "../../tutorial/mechanics-relations/momentum-energy-figure.ts", animationId: compiled.animation.id,
      objectPaths: ["particle", "momentum", "force", "energy"], transitionPaths: ["advance"], checkpointPaths: ["initial", "settled"],
      staticProjection: { checkpoints, transitions: [{ id: "advance", from: "initial", to: "settled" }] },
      accessibility: { accessibleName: `${source.episode} particle motion`, semanticSummary: source.episode === "straight"
        ? "A force along motion increases both momentum magnitude and kinetic energy."
        : "An inward force turns momentum without changing kinetic energy.", reducedMotion: "direct-checkpoint-seek" } });
    const release = createKpVignetteRelease({ ...draft, integrity: `sha256:${sha256(serializeKpVignetteReleasePayload(draft))}` });
    return Object.freeze({ compiled, release });
  });
  const source = createKpArticleSource(momentumEnergySourcePath, dependencies.markdown), registry = capabilities.map(c => c.release);
  const resolved = resolveKpArticleImports(source, registry, lock);
  const article = compileKpArticleDocument({ source, registry, lock: resolved.lock });
  const staticHtml = compileKpArticleStaticHtml(article.document);
  for (const asset of staticHtml.assets) if (!assets.has(asset.assetPath)) throw new Error(`Unresolved static physics asset: ${asset.assetPath}`);
  return Object.freeze({ article, capabilities, staticHtml, assets, dependencies: dependencies.occurrences,
    dependencyLock: momentumDependencyIntegrity });
}
