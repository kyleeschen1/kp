import {
  resolveKpSemanticSalience,
  resolveKpSemanticVisualTreatment,
  type KpResolvedSemanticSalience,
  type KpSalienceIdentityFamily,
  type KpSalienceLevel,
  type KpSemanticVisualRole,
  type KpVisualThemeId
} from "../../animation/semantic-visual-salience.ts";
import {
  projectKpEigenvectorEndpoint,
  type KpEigenvectorAttentionalOwner,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";

export interface KpEigenvectorAttentionObject {
  readonly id: string;
  readonly surface: KpEigenvectorAttentionalOwner | "scaffold";
  readonly semanticObjectId?: string;
  readonly role: KpSemanticVisualRole;
  readonly salience: KpResolvedSemanticSalience;
}

export interface KpEigenvectorAttentionProjection {
  readonly beatId: KpEigenvectorBeatId;
  readonly owner: KpEigenvectorAttentionalOwner;
  readonly objects: Readonly<Record<string, KpEigenvectorAttentionObject>>;
}

interface AttentionDefinition {
  readonly id: string;
  readonly surface: KpEigenvectorAttentionObject["surface"];
  readonly semanticObjectId?: string;
  readonly role: KpSemanticVisualRole;
  readonly identityFamily: KpSalienceIdentityFamily;
  readonly baseLevel: KpSalienceLevel;
}

const definitions = [
  object("surface.passage", "passage", "ink", "neutral", "normal"),
  object("surface.diagram", "diagram", "page", "neutral", "normal"),
  object("surface.equation", "equation", "ink", "neutral", "normal"),
  object("surface.learner", "learner", "focus", "amber", "normal"),
  object("surface.manipulation", "manipulation", "focus", "green", "normal"),
  object("surface.recall", "recall", "focus", "cyan", "normal"),
  object("diagram.grid", "scaffold", "structure", "neutral", "dim"),
  object("diagram.axes", "scaffold", "structure", "neutral", "normal"),
  object("diagram.fan", "diagram", "data-series", "blue", "normal", "eigenvector-demo/vector/fan"),
  object("diagram.v", "diagram", "data-series", "cyan", "normal", "eigenvector-demo/vector/v"),
  object("diagram.eigenspace", "diagram", "relation", "green", "normal", "eigenvector-demo/eigenspace/lambda-3"),
  object("equation.lambda", "equation", "ink", "violet", "normal", "eigenvector-demo/eigenvalue/lambda-3"),
  object("equation.relation", "equation", "ink", "neutral", "normal", "eigenvector-demo/relation/Av-lambda-v")
] as const satisfies readonly AttentionDefinition[];

export function projectKpEigenvectorAttention(
  beatId: KpEigenvectorBeatId
): KpEigenvectorAttentionProjection {
  const endpoint = projectKpEigenvectorEndpoint(beatId);
  const primary = new Set(endpoint.primaryObjectIds);
  const contextual = new Set(endpoint.contextualObjectIds);
  const objects = Object.fromEntries(definitions.map((definition) => {
    const ownsAttention = definition.id ===
      `surface.${endpoint.attentionalOwner}`;
    const isPrimary = definition.semanticObjectId !== undefined &&
      primary.has(definition.semanticObjectId);
    const isContextual = definition.semanticObjectId !== undefined &&
      contextual.has(definition.semanticObjectId);
    return [definition.id, Object.freeze({
      id: definition.id,
      surface: definition.surface,
      ...(definition.semanticObjectId === undefined
        ? {}
        : { semanticObjectId: definition.semanticObjectId }),
      role: definition.role,
      salience: resolveKpSemanticSalience({
        baseLevel: definition.baseLevel,
        identityFamily: definition.identityFamily,
        presence: objectPresence(definition.id, beatId),
        signals: ownsAttention || isPrimary
          ? ["focused"]
          : isContextual
            ? ["contextual"]
            : []
      })
    })];
  })) as Record<string, KpEigenvectorAttentionObject>;
  return Object.freeze({
    beatId,
    owner: endpoint.attentionalOwner,
    objects: Object.freeze(objects)
  });
}

export function projectKpEigenvectorAttentionCss(input: {
  readonly beatId: KpEigenvectorBeatId;
  readonly theme: KpVisualThemeId;
}): Readonly<Record<string, string>> {
  const projection = projectKpEigenvectorAttention(input.beatId);
  return Object.freeze(Object.fromEntries(Object.values(projection.objects)
    .flatMap((object) => {
      const treatment = resolveKpSemanticVisualTreatment({
        theme: input.theme,
        role: object.role,
        state: object.salience.state
      });
      const prefix = `--kp-eigen-${object.id.replaceAll(".", "-")}`;
      return [
        [`${prefix}-color`, treatment.color],
        [`${prefix}-opacity`, format(treatment.opacity)],
        [`${prefix}-stroke-scale`, format(treatment.strokeScale)]
      ];
    })));
}

function object(
  id: string,
  surface: KpEigenvectorAttentionObject["surface"],
  role: KpSemanticVisualRole,
  identityFamily: KpSalienceIdentityFamily,
  baseLevel: KpSalienceLevel,
  semanticObjectId?: string
): AttentionDefinition {
  return {
    id,
    surface,
    role,
    identityFamily,
    baseLevel,
    ...(semanticObjectId === undefined ? {} : { semanticObjectId })
  };
}

function objectPresence(id: string, beatId: KpEigenvectorBeatId): number {
  if (id === "diagram.eigenspace") {
    return beatId === "reveal-the-eigenspace" ||
      beatId === "compressed-recall" ? 1 : 0;
  }
  if (id === "equation.lambda") {
    return [
      "name-the-scale-factor",
      "predict-a-multiple",
      "reveal-the-eigenspace",
      "compressed-recall"
    ].includes(beatId) ? 1 : 0;
  }
  return 1;
}

function format(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}
