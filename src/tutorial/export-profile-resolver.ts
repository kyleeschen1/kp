import {
  createKpTutorialCardManifest,
  type KpTutorialCardManifest,
  type KpTutorialExportProfile,
  type KpTutorialExportSettingValue,
  type KpTutorialFallbackSpec
} from "./card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  type KpTutorialDependencyPhase
} from "./dependency-planner.ts";

export interface KpTutorialCardIframeExportProfileMetadata {
  readonly manifestId: string;
  readonly profileId: string;
  readonly kind: "iframe";
  readonly target: "browser";
  readonly responsive: boolean;
  readonly requiresControls: boolean;
  readonly fallbackStrategy: KpTutorialFallbackSpec["strategy"];
  readonly dependencyPhases: readonly KpTutorialDependencyPhase[];
  readonly settings: Readonly<Record<string, KpTutorialExportSettingValue>>;
}

export interface KpTutorialCardStepExportProfileMetadata {
  readonly manifestId: string;
  readonly profileId: string;
  readonly kind: "step-sequence";
  readonly target: "static";
  readonly includeCheckpoints: boolean;
  readonly fallbackStrategy: KpTutorialFallbackSpec["strategy"];
  readonly sampleableTimelineIds: readonly string[];
  readonly reversibleTimelineIds: readonly string[];
  readonly dependencyPhases: readonly KpTutorialDependencyPhase[];
  readonly settings: Readonly<Record<string, KpTutorialExportSettingValue>>;
}

export function resolveKpTutorialCardIframeExportProfile(
  input: KpTutorialCardManifest
): KpTutorialCardIframeExportProfileMetadata {
  const manifest = createKpTutorialCardManifest(input);
  const iframeProfile = findExportProfile(manifest, "iframe");
  const dependencyPlan = createKpTutorialCardDependencyPlan(manifest);

  return {
    manifestId: manifest.id,
    profileId: iframeProfile.id,
    kind: "iframe",
    target: "browser",
    responsive: settingBoolean(iframeProfile.settings?.["responsive"], false),
    requiresControls: manifest.exportProfiles.some(
      (profile) =>
        profile.kind === "interactive-card" &&
        settingBoolean(profile.settings?.["controls"], false)
    ),
    fallbackStrategy: manifest.fallback.strategy,
    dependencyPhases: dependencyPlan.phases
      .filter(
        (phase) => phase.phase === "critical" || phase.phase === "interactive"
      )
      .map((phase) => phase.phase),
    settings: cloneSettings(iframeProfile.settings)
  };
}

export function resolveKpTutorialCardStepExportProfile(
  input: KpTutorialCardManifest
): KpTutorialCardStepExportProfileMetadata {
  const manifest = createKpTutorialCardManifest(input);
  const stepProfile = findExportProfile(manifest, "step-sequence");
  const dependencyPlan = createKpTutorialCardDependencyPlan(manifest);

  return {
    manifestId: manifest.id,
    profileId: stepProfile.id,
    kind: "step-sequence",
    target: "static",
    includeCheckpoints: settingBoolean(
      stepProfile.settings?.["includeCheckpoints"],
      false
    ),
    fallbackStrategy: manifest.fallback.strategy,
    sampleableTimelineIds: manifest.timelineRefs
      .filter((timeline) => timeline.sampleable === true)
      .map((timeline) => timeline.id),
    reversibleTimelineIds: manifest.timelineRefs
      .filter((timeline) => timeline.reversible === true)
      .map((timeline) => timeline.id),
    dependencyPhases: dependencyPlan.phases
      .filter((phase) => phase.phase === "critical" || phase.phase === "optional")
      .map((phase) => phase.phase),
    settings: cloneSettings(stepProfile.settings)
  };
}

function findExportProfile(
  manifest: KpTutorialCardManifest,
  kind: KpTutorialExportProfile["kind"]
): KpTutorialExportProfile {
  const profile = manifest.exportProfiles.find(
    (candidate) => candidate.kind === kind
  );

  if (profile === undefined) {
    throw new Error(
      `Tutorial card ${manifest.id} does not define ${exportProfileArticle(
        kind
      )} ${kind} export profile.`
    );
  }

  return profile;
}

function exportProfileArticle(kind: KpTutorialExportProfile["kind"]): "a" | "an" {
  return kind === "iframe" || kind === "interactive-card" ? "an" : "a";
}

function settingBoolean(
  value: KpTutorialExportSettingValue | undefined,
  fallback: boolean
): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function cloneSettings(
  settings: Readonly<Record<string, KpTutorialExportSettingValue>> | undefined
): Readonly<Record<string, KpTutorialExportSettingValue>> {
  if (settings === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}
