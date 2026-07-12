import {
  validateKpAssetBundle,
  type KpAssetBundle
} from "./asset.ts";
import { createKpInterpreter, type KpInterpreter } from "./asset-interpreter.ts";

export interface KpDashboardPreviewField {
  readonly label: string;
  readonly value: string;
}

export interface KpDashboardAssetPreview {
  readonly assetId: string;
  readonly title: string;
  readonly summary: string;
  readonly fields: readonly KpDashboardPreviewField[];
  readonly searchFields: readonly string[];
}

export function createKpDashboardAssetPreviewInterpreter(): KpInterpreter<
  KpAssetBundle,
  KpDashboardAssetPreview
> {
  return createKpInterpreter({
    id: "interpreter.dashboard.asset-preview",
    target: "dashboard",
    inputKind: "asset-bundle",
    preservation: "strict",
    interpret: (bundle) => {
      const issues = validateKpAssetBundle(bundle);

      return {
        output: createKpDashboardAssetPreview(bundle),
        preservation: issues.length === 0 ? "strict" : "lossy",
        diagnostics: issues.map((issue) => ({
          severity: "error" as const,
          code: "asset-validation",
          message: issue.message,
          lossKind: "identity" as const,
          path: issue.path
        }))
      };
    }
  });
}

function createKpDashboardAssetPreview(
  bundle: KpAssetBundle
): KpDashboardAssetPreview {
  const objectCount = bundle.objects.length;
  const selectorCount = bundle.objects.reduce(
    (count, object) => count + object.selectors.length,
    0
  );
  const objectTypes = uniquePreservingOrder(
    bundle.objects.map((object) => object.objectType)
  );

  return {
    assetId: bundle.id,
    title: bundle.title,
    summary: `${objectCount} objects, ${selectorCount} selectors`,
    fields: [
      { label: "Asset id", value: bundle.id },
      { label: "Version", value: String(bundle.version) },
      { label: "Objects", value: String(objectCount) },
      { label: "Selectors", value: String(selectorCount) },
      {
        label: "Object types",
        value: objectTypes.join(", ") || "None"
      }
    ],
    searchFields: [
      bundle.id,
      bundle.title,
      ...bundle.objects.flatMap((object) => [
        object.id,
        object.title,
        object.objectType,
        ...object.selectors.map((selector) => selector.id)
      ])
    ]
  };
}

function uniquePreservingOrder(values: readonly string[]): readonly string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}
