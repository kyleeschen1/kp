import assert from "node:assert/strict";
import test from "node:test";
import { sampleKpNativeKatexContributorFusionPaint, kpNativeKatexContributorFusionOpticalProfile,
  type KpContributorFusionPaintInput } from "../src/rendering/native-katex-contributor-fusion-sampling.ts";
import { applyKpNativeKatexContributorFusion } from "../src/rendering/native-katex-operation-evaluation-contributor-fusion.ts";
import { kpContributorFusionEvaluationFamilyProfile } from "../src/animation/operation-evaluation-family-profile.ts";

function descriptor(x: number, y: number, role: string): KpContributorFusionPaintInput {
  return { rect: { left: x, top: y, width: 12, height: 20 }, pivot: { x: x + 7, y: y + 9 }, role };
}
const source = [descriptor(0, 0, "successor-source:material-input"),
  descriptor(20, 0, "successor-source:catalyst"), descriptor(40, 0, "successor-source:material-input")];
const target = [descriptor(30, 0, "successor-target:result")];

test("the shared ink-knot sampler preserves opaque handoff and native-only endpoints", () => {
  for (const p of [0, .01, .18, .37, .48, .519999, .52, .58, .7, .99, 1]) {
    const frame = sampleKpNativeKatexContributorFusionPaint({ source, target, progress: p });
    assert.equal(frame.source.every(pose => pose.present), p > 0 && p < .52);
    assert.equal(frame.target.every(pose => pose.present), p >= .52 && p < 1);
    assert.ok([...frame.source, ...frame.target].every(pose =>
      [pose.translateX, pose.translateY, pose.scale, pose.clipInset].every(Number.isFinite)));
    assert.deepEqual(sampleKpNativeKatexContributorFusionPaint({ source, target, progress: p }), frame);
  }
  const settled = sampleKpNativeKatexContributorFusionPaint({ source, target, progress: .7 }).target[0]!;
  assert.equal(settled.scale, 1); assert.equal(settled.translateX, 0); assert.equal(settled.clipInset, 0);
  assert.throws(() => sampleKpNativeKatexContributorFusionPaint({ source, target, progress: NaN }), /finite/);
  assert.throws(() => sampleKpNativeKatexContributorFusionPaint({ source: [], target, progress: .5 }), /both native sides/);
});

test("legacy DOM application consumes the same optical poses in both native reading axes", () => {
  for (const stacked of [false, true]) {
    const sources = source.map(item => stacked ? { ...item,
      rect: { ...item.rect, left: item.rect.top, top: item.rect.left },
      pivot: { x: item.pivot.y, y: item.pivot.x } } : item);
    const owner = (item: KpContributorFusionPaintInput) => ({
      dataset: { kpEquationMaterialPaintAlignment: "measured-ink", kpEquationMaterialFragmentRole: item.role },
      style: { left: `${item.rect.left}px`, top: `${item.rect.top}px`, width: `${item.rect.width}px`, height: `${item.rect.height}px`,
        transformOrigin: `${item.pivot.x - item.rect.left}px ${item.pivot.y - item.rect.top}px`, transform: "", opacity: "", visibility: "" },
      firstElementChild: { style: { clipPath: "" } }
    });
    const sourceOwners = sources.map(owner), targetOwners = target.map(owner);
    const stage = { dataset: {}, querySelectorAll: (selector: string) => selector.includes("successor-source") ? sourceOwners : targetOwners } as unknown as HTMLElement;
    for (const p of [.01, .37, .5, .52, .6, .99, 1, .6, .37, 0]) {
      applyKpNativeKatexContributorFusion({ stage, progress: p, familyProfile: kpContributorFusionEvaluationFamilyProfile,
        opticalProfile: kpNativeKatexContributorFusionOpticalProfile });
      const sampled = sampleKpNativeKatexContributorFusionPaint({ source: sources, target, progress: p });
      sourceOwners.forEach((value, i) => {
        assert.equal(value.style.transform, sampled.source[i]!.transform);
        assert.equal(value.style.opacity, sampled.source[i]!.present ? "1" : "0");
      });
      targetOwners.forEach((value, i) => {
        const pose = sampled.target[i]!;
        assert.equal(value.style.transform, pose.transform);
        assert.equal(value.style.opacity, pose.present ? "1" : "0");
        assert.equal(value.firstElementChild.style.clipPath, `inset(${pose.clipInset}% ${pose.clipInset}%)`);
      });
    }
  }
});
