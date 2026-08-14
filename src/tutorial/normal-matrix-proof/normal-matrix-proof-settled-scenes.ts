import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../../rendering/selector-annotated-latex.ts";
import {
  kpNormalMatrixProofCheckpoints,
  type KpNormalMatrixProofCheckpointId
} from "../../semantic/normal-matrix-proof-checkpoints.ts";
import type { KpNormalMatrixProofObjectPath } from
  "../../semantic/normal-matrix-proof-semantics.ts";

export interface KpNormalMatrixProofFragmentBinding {
  readonly id: string;
  readonly selectorId: string;
  readonly semanticEntityId: `normal-proof/${KpNormalMatrixProofObjectPath}`;
  readonly motionId: string;
  readonly glyphKey: string;
}

export interface KpNormalMatrixProofBoundLatex {
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly bindings: readonly KpNormalMatrixProofFragmentBinding[];
}

export interface KpNormalMatrixProofSettledScene {
  readonly checkpointId: KpNormalMatrixProofCheckpointId;
  readonly label: string;
  readonly accessibleDescription: string;
  readonly matrixLatex: string;
  readonly evidenceLatex: string;
  readonly combinedLatex: string;
  readonly matrix: KpNormalMatrixProofBoundLatex;
  readonly evidence: KpNormalMatrixProofBoundLatex;
}

interface FragmentSegment {
  readonly selectorId: string;
  readonly latex: string;
  readonly path: KpNormalMatrixProofObjectPath;
  readonly glyphKey: string;
}

type BoundSegment = KpSelectorAnnotatedLatexSegment | FragmentSegment;

const sceneMath: Readonly<Record<KpNormalMatrixProofCheckpointId, Readonly<{
  matrix: KpNormalMatrixProofBoundLatex;
  evidence: KpNormalMatrixProofBoundLatex;
}>>> = Object.freeze({
  statement: Object.freeze({
    matrix: blockMatrix("statement", false),
    evidence: boundMath("statement.evidence", [
      latex(String.raw`U^{\dagger}MU=D`)
    ])
  }),
  "row-column-norms": Object.freeze({
    matrix: blockMatrix("row-column-norms", false),
    evidence: boundMath("row-column-norms.evidence", [
      fragment("left-product", String.raw`(MM^{\dagger})_{11}`, "product-left", "left-product"),
      latex("="),
      fragment("left-first-entry", String.raw`|\lambda|^2+\lVert r\rVert^2`, "product-left/first-entry", "left-first-entry"),
      latex(String.raw`\qquad`),
      fragment("right-product", String.raw`(M^{\dagger}M)_{11}`, "product-right", "right-product"),
      latex("="),
      fragment("right-first-entry", String.raw`|\lambda|^2`, "product-right/first-entry", "right-first-entry")
    ])
  }),
  eigenbasis: Object.freeze({
    matrix: blockMatrix("eigenbasis", false),
    evidence: boundMath("eigenbasis.evidence", [
      fragment("chosen-basis", String.raw`Mv=\lambda v`, "eigenbasis", "eigenbasis"),
      latex(String.raw`\quad\Longrightarrow\quad`),
      fragment("sparse-column", String.raw`\operatorname{col}_1(M)=(\lambda,0,\ldots,0)^T`, "matrix/zero-column", "zero-column")
    ])
  }),
  "norm-equation": Object.freeze({
    matrix: blockMatrix("norm-equation", false),
    evidence: boundMath("norm-equation.evidence", [
      fragment("matched-left", String.raw`|\lambda|^2`, "matrix/eigenvalue", "lambda-squared"),
      latex("+"),
      fragment("unmatched-row", String.raw`\lVert r\rVert^2`, "matrix/row-remainder", "row-norm-squared"),
      latex("="),
      fragment("matched-right", String.raw`|\lambda|^2`, "matrix/eigenvalue", "lambda-squared")
    ])
  }),
  "remainder-zero": Object.freeze({
    matrix: blockMatrix("remainder-zero", true),
    evidence: boundMath("remainder-zero.evidence", [
      fragment("zero-norm", String.raw`\lVert r\rVert^2=0`, "inference/norm-equality", "row-norm-zero"),
      latex(String.raw`\quad\Longrightarrow\quad`),
      fragment("remainder-conclusion", String.raw`r=0`, "inference/remainder-zero", "remainder-zero")
    ])
  }),
  recursion: Object.freeze({
    matrix: blockMatrix("recursion", true),
    evidence: boundMath("recursion.evidence", [
      fragment("lower-normality", String.raw`BB^{\dagger}=B^{\dagger}B`, "proof/recursive-subproblem", "lower-block-normality"),
      latex(String.raw`\quad\Longrightarrow\quad B\text{ is normal}`)
    ])
  })
});

const governingContext = boundMath("governing-context", [
  fragment(
    "normality",
    String.raw`MM^{\dagger}=M^{\dagger}M`,
    "normality",
    "normality"
  )
]);

export const kpNormalMatrixProofSettledScenes:
  readonly KpNormalMatrixProofSettledScene[] = Object.freeze(
    kpNormalMatrixProofCheckpoints.map((checkpoint) => {
      const math = sceneMath[checkpoint.id];
      return Object.freeze({
        checkpointId: checkpoint.id,
        label: checkpoint.label,
        accessibleDescription: checkpoint.accessibleDescription,
        ...math,
        matrixLatex: math.matrix.annotated.rawLatex,
        evidenceLatex: math.evidence.annotated.rawLatex,
        combinedLatex: String.raw`\begin{gathered}${math.matrix.annotated.rawLatex}\\[1em]${math.evidence.annotated.rawLatex}\end{gathered}`
      });
    })
  );

export function findKpNormalMatrixProofSettledScene(
  checkpointId: KpNormalMatrixProofCheckpointId
): KpNormalMatrixProofSettledScene {
  const scene = kpNormalMatrixProofSettledScenes.find(
    (candidate) => candidate.checkpointId === checkpointId
  );
  if (scene === undefined) {
    throw new Error(`Normal-proof checkpoint ${checkpointId} lacks settled paint.`);
  }
  return scene;
}

export function renderKpNormalMatrixProofSettledStageHtml(): string {
  return [
    `<section class="kp-normal-proof-stage"`,
    ` data-kp-normal-proof-stage`,
    ` data-kp-normal-proof-stage-fallback`,
    ` data-kp-normal-proof-active-checkpoint="statement"`,
    ` aria-label="Normal matrix proof checkpoints">`,
    `<div class="kp-normal-proof-stage__context" data-kp-normal-proof-context>`,
    renderBoundNativeMath(governingContext),
    `</div>`,
    `<div class="kp-normal-proof-stage__viewport" data-kp-normal-proof-stage-viewport>`,
    kpNormalMatrixProofSettledScenes.map((scene, index) => [
      `<div class="kp-normal-proof-stage__scene"`,
      ` data-kp-normal-proof-settled-scene="${scene.checkpointId}"`,
      ` role="group" aria-label="${escapeAttribute(scene.accessibleDescription)}"`,
      index === 0 ? "" : ` hidden`,
      `>`,
      `<div class="kp-normal-proof-stage__matrix" data-kp-normal-proof-matrix-footprint`,
      ` data-kp-normal-proof-path="normal-proof/matrix${scene.checkpointId === "remainder-zero" || scene.checkpointId === "recursion" ? " normal-proof/matrix/block-diagonal" : ""}">`,
      renderBoundNativeMath(scene.matrix),
      `</div>`,
      `<div class="kp-normal-proof-stage__evidence" data-kp-normal-proof-evidence`,
      ` data-kp-normal-proof-path="normal-proof/${kpNormalMatrixProofCheckpoints[index]!.primaryPath}">`,
      renderBoundNativeMath(scene.evidence),
      `</div>`,
      `</div>`
    ].join("")).join(""),
    `</div>`,
    `</section>`
  ].join("");
}

function renderBoundNativeMath(bound: KpNormalMatrixProofBoundLatex): string {
  let html = renderLatexToHtml(bound.annotated.annotatedLatex, {
    displayMode: true,
    output: "htmlAndMathml",
    trust: true
  });
  for (const binding of bound.bindings) {
    html = html.replace(
      `data-kp-motion-id="${binding.motionId}"`,
      `data-kp-motion-id="${binding.motionId}" data-kp-normal-proof-path="${binding.semanticEntityId}" data-kp-normal-proof-glyph-key="${binding.glyphKey}"`
    );
  }
  return html;
}

function blockMatrix(
  checkpointId: KpNormalMatrixProofCheckpointId,
  remainderIsZero: boolean
): KpNormalMatrixProofBoundLatex {
  return boundMath(`${checkpointId}.matrix`, [
    fragment("matrix-symbol", "M", "matrix", "matrix"),
    latex(String.raw`=\begin{bmatrix}`),
    fragment("eigenvalue", String.raw`\lambda`, "matrix/eigenvalue", "lambda"),
    latex("&"),
    fragment("row-remainder", remainderIsZero ? "0" : "r", "matrix/row-remainder", "row-remainder"),
    latex(String.raw`\\`),
    fragment("zero-column", "0", "matrix/zero-column", "zero-column"),
    latex("&"),
    fragment("lower-block", "B", "matrix/lower-block", "lower-block"),
    latex(String.raw`\end{bmatrix}${remainderIsZero ? "=\\lambda\\oplus B" : ""}`)
  ]);
}

function boundMath(
  id: string,
  segments: readonly BoundSegment[]
): KpNormalMatrixProofBoundLatex {
  const fragments = segments.filter(
    (segment): segment is FragmentSegment => "path" in segment
  );
  const annotated = createKpSelectorAnnotatedLatex({
    id: `normal-proof.${id}`,
    expectedSelectorIds: fragments.map(({ selectorId }) => selectorId),
    segments: segments.map((segment) => "path" in segment
      ? { kind: "selector" as const, selectorId: segment.selectorId, latex: segment.latex }
      : segment)
  });
  const annotationBySelector = new Map(
    annotated.annotations.map((annotation) => [annotation.selectorId, annotation])
  );
  return Object.freeze({
    annotated: Object.freeze({
      ...annotated,
      annotations: Object.freeze(
        annotated.annotations.map((annotation) => Object.freeze(annotation))
      )
    }),
    bindings: Object.freeze(fragments.map((segment) => {
      const annotation = annotationBySelector.get(segment.selectorId)!;
      return Object.freeze({
        id: `binding.${annotation.motionId}`,
        selectorId: segment.selectorId,
        semanticEntityId: `normal-proof/${segment.path}` as const,
        motionId: annotation.motionId,
        glyphKey: segment.glyphKey
      });
    }))
  });
}

function fragment(
  selectorId: string,
  latexValue: string,
  path: KpNormalMatrixProofObjectPath,
  glyphKey: string
): FragmentSegment {
  return { selectorId, latex: latexValue, path, glyphKey };
}

function latex(latexValue: string): KpSelectorAnnotatedLatexSegment {
  return { kind: "latex", latex: latexValue };
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
