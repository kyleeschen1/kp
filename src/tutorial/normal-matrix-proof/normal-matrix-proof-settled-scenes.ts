import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  kpNormalMatrixProofCheckpoints,
  type KpNormalMatrixProofCheckpointId
} from "../../semantic/normal-matrix-proof-checkpoints.ts";

export interface KpNormalMatrixProofSettledScene {
  readonly checkpointId: KpNormalMatrixProofCheckpointId;
  readonly label: string;
  readonly accessibleDescription: string;
  readonly matrixLatex: string;
  readonly evidenceLatex: string;
  readonly combinedLatex: string;
}

const matrixWithR = String.raw`M=\begin{bmatrix}\lambda&r\\0&B\end{bmatrix}`;
const matrixWithZero =
  String.raw`M=\begin{bmatrix}\lambda&0\\0&B\end{bmatrix}=\lambda\oplus B`;

const sceneMath: Readonly<Record<KpNormalMatrixProofCheckpointId, Readonly<{
  matrixLatex: string;
  evidenceLatex: string;
}>>> = Object.freeze({
  statement: Object.freeze({
    matrixLatex: matrixWithR,
    evidenceLatex: String.raw`MM^{\dagger}=M^{\dagger}M\quad\Longrightarrow\quad U^{\dagger}MU=D`
  }),
  "row-column-norms": Object.freeze({
    matrixLatex: matrixWithR,
    evidenceLatex: String.raw`(MM^{\dagger})_{11}=|\lambda|^2+\lVert r\rVert^2\qquad(M^{\dagger}M)_{11}=|\lambda|^2`
  }),
  eigenbasis: Object.freeze({
    matrixLatex: matrixWithR,
    evidenceLatex: String.raw`Mv=\lambda v\quad\Longrightarrow\quad\operatorname{col}_1(M)=(\lambda,0,\ldots,0)^T`
  }),
  "norm-equation": Object.freeze({
    matrixLatex: matrixWithR,
    evidenceLatex: String.raw`|\lambda|^2+\lVert r\rVert^2=|\lambda|^2`
  }),
  "remainder-zero": Object.freeze({
    matrixLatex: matrixWithZero,
    evidenceLatex: String.raw`\lVert r\rVert^2=0\quad\Longrightarrow\quad r=0`
  }),
  recursion: Object.freeze({
    matrixLatex: matrixWithZero,
    evidenceLatex: String.raw`BB^{\dagger}=B^{\dagger}B\quad\Longrightarrow\quad B\text{ is normal}`
  })
});

export const kpNormalMatrixProofSettledScenes:
  readonly KpNormalMatrixProofSettledScene[] = Object.freeze(
    kpNormalMatrixProofCheckpoints.map((checkpoint) => {
      const math = sceneMath[checkpoint.id];
      return Object.freeze({
        checkpointId: checkpoint.id,
        label: checkpoint.label,
        accessibleDescription: checkpoint.accessibleDescription,
        ...math,
        combinedLatex: String.raw`\begin{gathered}${math.matrixLatex}\\[1em]${math.evidenceLatex}\end{gathered}`
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
    `<div class="kp-normal-proof-stage__viewport" data-kp-normal-proof-stage-viewport>`,
    kpNormalMatrixProofSettledScenes.map((scene, index) => [
      `<div class="kp-normal-proof-stage__scene"`,
      ` data-kp-normal-proof-settled-scene="${scene.checkpointId}"`,
      ` role="group" aria-label="${escapeAttribute(scene.accessibleDescription)}"`,
      index === 0 ? "" : ` hidden`,
      `>`,
      `<div class="kp-normal-proof-stage__matrix" data-kp-normal-proof-matrix-footprint>`,
      renderNativeMath(scene.matrixLatex),
      `</div>`,
      `<div class="kp-normal-proof-stage__evidence" data-kp-normal-proof-evidence>`,
      renderNativeMath(scene.evidenceLatex),
      `</div>`,
      `</div>`
    ].join("")).join(""),
    `</div>`,
    `</section>`
  ].join("");
}

function renderNativeMath(latex: string): string {
  return renderLatexToHtml(latex, {
    displayMode: true,
    output: "htmlAndMathml"
  });
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
