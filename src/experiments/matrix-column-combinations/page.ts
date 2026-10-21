import { example, columnExampleFromProduct } from "./model.ts";
import { MatrixColumnGap } from "../matrix-column-product/environment.ts";
import { columnPageHtml } from "./view.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";
import { matrixSources, loadMatrixSource } from "../../../content/authoring/convergence/matrix-sources.ts";

// Resolve and render text before replacing the live player. A failed source load
// must not tear down the currently usable explanation.
export async function loadColumnPage(url: URL) {
  const query = url.searchParams;
  const column = Number(query.get("column") ?? "0");
  const basisMode = query.get('basis') ?? 'adapted';
  if (query.get('example') === 'composition' && basisMode !== 'adapted' && basisMode !== 'standard') {
    const { BasisCompositionGap } = await import('./basis-composition.ts');
    throw new BasisCompositionGap('Choose the adapted or standard intermediate basis.');
  }
  const composition = query.get("example") === "composition"
    ? (await import('./basis-composition.ts')).basisComposition(query.get('basis') === 'standard' ? 'standard' : 'adapted', column)
    : undefined;
  const input = query.get("input");
  if (input && query.has("example")) throw new MatrixColumnGap("Choose either a source input or a named interpretation.");
  const authored = input ? await loadMatrixSource(input) : undefined;
  const scene = authored ? columnExampleFromProduct(authored.product, column, authored.reading) : composition?.scene ?? example(query.get("example") ?? "columns", column);
  const introduction = scene.reading?.introduction ?? (composition ? "The same two maps have different matrices in different bases. Their composition is unchanged when the coordinates at the join agree." : scene.evidence ? "Each entry of QᵀQ is a dot product between two columns of Q. Diagonal entries measure squared length; off-diagonal entries measure orthogonality." : "Each column of the right matrix tells us how to combine the columns of the left matrix.");
  const links = ["columns", "identity", "orthonormality"].map((kind, i) => `<a href="?example=${kind}&column=0#weights">${["Column combinations", "Identity", "Orthonormality"][i]}</a>`).join(" · ");
  const contextHtml = composition ? (await import('./basis-composition-view.ts')).basisCompositionHtml(composition) : '';
  const basisQuery = composition ? `&basis=${composition.mode}` : '';
  const navigation = `<nav aria-label="Matrix examples">${links}</nav>
    <nav aria-label="Matrix source inputs">Inputs: <a href="?column=${column}">Original</a> · ${matrixSources.map(({ id, title }) => `<a href="?input=${encodeURIComponent(id)}&column=${column}">${escape(title)}</a>`).join(" · ")}</nav>`;
  const html = columnPageHtml(scene, { navigation, context: contextHtml, comparison: true,
    selection: input ? `input=${encodeURIComponent(input)}` : `example=${scene.kind}${basisQuery}` });
  return { scene, introduction, html };
}
